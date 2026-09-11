# israel-c-ribeiro.github.io

Personal portfolio of **Israel C. Ribeiro, Ph.D.** — computational materials chemist
(DFT, machine-learning interatomic potentials, materials informatics).

Live site: <https://israel-c-ribeiro.github.io>

## Stack

Plain HTML, CSS and JavaScript. No build step, no framework.

```
index.html                  single page (EN primary, PT-BR and FR via the switcher)
assets/css/style.css        tokens, light/dark themes, layout
assets/js/i18n.js           translations (en / pt / fr)
assets/js/lattice.js        hero: animated ABX3 perovskite supercell on <canvas>
assets/js/main.js           theme, language, live citation data, GitHub repos, contact form
data/scholar.json           citation metrics + publication list (auto-refreshed)
scripts/update_scholar.py   refresh script (Google Scholar → OpenAlex fallback)
.github/workflows/          weekly GitHub Action that runs the script and commits
cv/                         downloadable CV (PDF)
```

## How the citation data stays fresh

1. Every Monday (and on manual dispatch) the workflow **Refresh citation data** runs
   `scripts/update_scholar.py`.
2. The script asks Google Scholar (via `scholarly`) for citations, h-index, i10-index,
   citations per year and the publication list, then fills DOIs from OpenAlex.
   If Scholar blocks the runner, OpenAlex is used instead. If both fail, the previous
   file is kept.
3. If `data/scholar.json` changed, the workflow commits it. GitHub Pages redeploys.
4. In the browser, `main.js` loads that file. If it is missing or older than 45 days,
   it queries OpenAlex live so the numbers never go stale.

To refresh by hand:

```bash
pip install "scholarly>=1.7" "bibtexparser<2"
python scripts/update_scholar.py
```

Requirement for the Action to be able to push: **Settings → Actions → General →
Workflow permissions → "Read and write permissions"**.

## Editing content

- Text: edit the three dictionaries in `assets/js/i18n.js` (keys match `data-i18n`
  attributes in `index.html`).
- Repos: pulled live from the GitHub API. Curated descriptions live under
  `code.repo.<name>` in `i18n.js`; unknown repos fall back to their GitHub description.
- CV: replace `cv/Israel_C_Ribeiro_CV.pdf`.
- Contact form: Formspree endpoint set on the `<form action>` in `index.html`.

## License

Content © Israel C. Ribeiro. Code under the MIT License.
