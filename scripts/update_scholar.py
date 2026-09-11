#!/usr/bin/env python3
"""
Refresh data/scholar.json with citation metrics and the publication list.

Primary source : Google Scholar (via the `scholarly` package).
Fallback source: OpenAlex (open API, no key required).

Behaviour
- If Google Scholar answers, its metrics / per-year citations / publications are
  written and DOIs are filled in from OpenAlex by title matching.
- If Google Scholar is blocked (common on CI runners), OpenAlex data is written
  instead, and the file says so in `source`.
- If both fail, the previous file is left untouched and the script exits 0, so the
  site keeps showing the last good snapshot.

Run locally:  python scripts/update_scholar.py
"""

from __future__ import annotations

import datetime as dt
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

SCHOLAR_ID = "GQugll8AAAAJ"
OPENALEX_AUTHOR = "A5051798399"
ORCID = "0000-0002-5272-8752"
OUT = Path(__file__).resolve().parent.parent / "data" / "scholar.json"
UA = "israel-c-ribeiro.github.io scholar refresh (mailto:israelribeiroc7@gmail.com)"


# --------------------------------------------------------------------------- utils
def log(msg: str) -> None:
    print(f"[update_scholar] {msg}", flush=True)


def get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def norm_title(t: str | None) -> str:
    t = (t or "").lower()
    t = re.sub(r"[^a-z0-9]+", "", t)  # drop spaces too: "MAPbI 3" == "MAPbI3"
    return t


# ------------------------------------------------------------------------ OpenAlex
def fetch_openalex() -> dict | None:
    try:
        author = get_json(f"https://api.openalex.org/authors/{OPENALEX_AUTHOR}")
        q = urllib.parse.quote(
            f"authorships.author.id:{OPENALEX_AUTHOR},type:article", safe=",:"
        )
        works = get_json(
            "https://api.openalex.org/works?filter="
            f"{q}&per-page=100&sort=publication_year:desc"
            "&select=id,doi,title,publication_year,cited_by_count,primary_location,authorships"
        )
    except Exception as exc:  # noqa: BLE001
        log(f"OpenAlex failed: {exc}")
        return None

    pubs = []
    for w in works.get("results", []):
        src = ((w.get("primary_location") or {}).get("source") or {}).get("display_name")
        if not src:
            continue  # skips workshop abstracts / ResearchGate uploads without a venue
        pubs.append(
            {
                "title": w.get("title"),
                "year": w.get("publication_year"),
                "venue": src,
                "doi": (w.get("doi") or "").replace("https://doi.org/", "") or None,
                "url": w.get("doi"),
                "citations": w.get("cited_by_count", 0),
                "authors": [a["author"]["display_name"] for a in w.get("authorships", [])],
            }
        )

    per_year = {
        str(row["year"]): row.get("cited_by_count", 0)
        for row in author.get("counts_by_year", [])
    }
    stats = author.get("summary_stats", {})
    return {
        "source": "openalex",
        "profile_url": f"https://openalex.org/{OPENALEX_AUTHOR}",
        "metrics": {
            "citations": author.get("cited_by_count", 0),
            "h_index": stats.get("h_index", 0),
            "i10_index": stats.get("i10_index", 0),
        },
        "cites_per_year": dict(sorted(per_year.items())),
        "publications": pubs,
    }


# ------------------------------------------------------------------- Google Scholar
def fetch_scholar() -> dict | None:
    try:
        from scholarly import scholarly  # type: ignore
    except Exception as exc:  # noqa: BLE001
        log(f"scholarly not importable: {exc}")
        return None
    try:
        author = scholarly.search_author_id(SCHOLAR_ID)
        author = scholarly.fill(author, sections=["basics", "indices", "counts", "publications"])
    except Exception as exc:  # noqa: BLE001
        log(f"Google Scholar failed: {exc}")
        return None

    pubs = []
    for p in author.get("publications", []):
        bib = p.get("bib", {})
        year = bib.get("pub_year")
        if not year:
            continue  # theses / entries without a year
        pubs.append(
            {
                "title": bib.get("title"),
                "year": int(year),
                "venue": re.sub(r"\s+\d.*$", "", bib.get("citation", "")).strip() or None,
                "doi": None,
                "url": None,
                "citations": p.get("num_citations", 0),
                "authors": [],
            }
        )
    pubs.sort(key=lambda x: (-(x["year"] or 0), -(x["citations"] or 0)))

    per_year = {str(k): int(v) for k, v in (author.get("cites_per_year") or {}).items()}
    return {
        "source": "google-scholar",
        "profile_url": f"https://scholar.google.com/citations?user={SCHOLAR_ID}",
        "metrics": {
            "citations": author.get("citedby", 0),
            "citations_recent": author.get("citedby5y", 0),
            "h_index": author.get("hindex", 0),
            "h_index_recent": author.get("hindex5y", 0),
            "i10_index": author.get("i10index", 0),
            "i10_index_recent": author.get("i10index5y", 0),
        },
        "cites_per_year": dict(sorted(per_year.items())),
        "publications": pubs,
    }


def enrich_with_openalex(scholar: dict, openalex: dict | None) -> None:
    """Fill DOI / URL / authors / clean venue names from OpenAlex by title."""
    if not openalex:
        return
    by_title = {norm_title(p["title"]): p for p in openalex["publications"]}
    for p in scholar["publications"]:
        key = norm_title(p["title"])
        match = by_title.get(key)
        if not match:
            # tolerant match: same first 60 normalized characters
            for k, v in by_title.items():
                if k[:60] == key[:60]:
                    match = v
                    break
        if match:
            p["doi"] = match["doi"]
            p["url"] = match["url"]
            p["authors"] = match["authors"]
            if match["venue"]:
                p["venue"] = match["venue"]


# ------------------------------------------------------------------------- main
def main() -> int:
    old = None
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            old = None

    openalex = fetch_openalex()
    data = fetch_scholar()
    if data:
        enrich_with_openalex(data, openalex)
        log("using Google Scholar data (DOIs enriched from OpenAlex)")
    elif openalex:
        data = openalex
        log("Google Scholar unavailable; using OpenAlex data")
    else:
        log("no source reachable; keeping previous data/scholar.json")
        return 0

    now = dt.datetime.now(dt.timezone.utc)
    data["updated"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    data["recent_since"] = now.year - 5
    data["scholar_id"] = SCHOLAR_ID
    data["orcid"] = ORCID
    data["openalex_id"] = OPENALEX_AUTHOR

    # Never downgrade a Google Scholar snapshot with an OpenAlex one for metrics
    # when OpenAlex reports fewer citations (Scholar indexes more sources).
    if (
        data["source"] == "openalex"
        and old
        and old.get("source") == "google-scholar"
        and old.get("metrics", {}).get("citations", 0) > data["metrics"]["citations"]
    ):
        log("OpenAlex has fewer citations than the last Scholar snapshot; keeping Scholar metrics, refreshing publications only")
        data["metrics"] = old["metrics"]
        data["cites_per_year"] = old.get("cites_per_year", data["cites_per_year"])
        data["source"] = "google-scholar"
        data["profile_url"] = old.get("profile_url", data["profile_url"])
        data["metrics_updated"] = old.get("metrics_updated") or old.get("updated")
    else:
        data["metrics_updated"] = data["updated"]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    log(f"wrote {OUT} ({data['source']}, {data['metrics']['citations']} citations, {len(data['publications'])} publications)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
