/* Page logic: theme, language, navigation, live citation data, GitHub repos,
 * contact form. No framework, no build step. */
(function () {
  "use strict";
  const html = document.documentElement;
  html.classList.add("js");

  const CONFIG = {
    scholarId: "GQugll8AAAAJ",
    openalexAuthor: "A5051798399",
    githubUser: "israel-c-ribeiro",
    dataUrl: "data/scholar.json",
    staleDays: 45,
    pubsVisible: 5,
  };

  const LOCALES = { en: "en-GB", pt: "pt-BR", fr: "fr-FR" };
  const state = { lang: "en", scholar: null, repos: null, pubsExpanded: false };

  // ------------------------------------------------------------------ i18n
  function t(key, vars) {
    const dict = window.I18N[state.lang] || window.I18N.en;
    let s = dict[key] != null ? dict[key] : (window.I18N.en[key] != null ? window.I18N.en[key] : key);
    if (vars) for (const k in vars) s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
    return s;
  }

  function detectLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && window.I18N[q]) return q;
    try { const s = localStorage.getItem("lang"); if (s && window.I18N[s]) return s; } catch (e) {}
    return "en"; // English is the primary version regardless of browser locale
  }

  function applyLang(lang) {
    state.lang = window.I18N[lang] ? lang : "en";
    html.lang = LOCALES[state.lang].split("-")[0] === "pt" ? "pt-BR" : state.lang;
    try { localStorage.setItem("lang", state.lang); } catch (e) {}

    document.title = t("meta.title");
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = t("meta.description");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key.endsWith("_html")) el.innerHTML = t(key); else el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => { el.title = t(el.getAttribute("data-i18n-title")); el.setAttribute("aria-label", el.title); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.getAttribute("data-i18n-placeholder")); });
    document.querySelectorAll(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));

    renderScholar();
    renderRepos();
    const y = document.getElementById("footer-year");
    if (y) y.textContent = t("footer.rights", { year: new Date().getFullYear() });
  }

  document.querySelectorAll(".lang-switch button").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

  // ----------------------------------------------------------------- theme
  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    if (saved === "light" || saved === "dark") html.dataset.theme = saved;
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const systemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      const current = html.dataset.theme || (systemLight ? "light" : "dark");
      const next = current === "light" ? "dark" : "light";
      html.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  })();

  // ------------------------------------------------------------------- nav
  (function initNav() {
    const nav = document.querySelector(".nav");
    const burger = document.getElementById("nav-burger");
    if (burger) {
      burger.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        burger.setAttribute("aria-expanded", String(open));
      });
      nav.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }));
    }
    const links = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
    const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    if ("IntersectionObserver" in window && sections.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
          }
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      sections.forEach((s) => io.observe(s));
    }
  })();

  // ---------------------------------------------------------------- reveal
  (function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    // Safety net: never leave content dimmed if the observer misfires.
    setTimeout(() => els.forEach((e) => e.classList.add("in")), 2500);
  })();

  // --------------------------------------------------------------- helpers
  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(LOCALES[state.lang], { year: "numeric", month: "short", day: "numeric" });
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const el = (id) => document.getElementById(id);

  // ------------------------------------------------------- citation data
  // Static seed shipped with the page: used only if data/scholar.json and
  // OpenAlex are both unreachable (e.g. opening index.html from disk offline).
  const SEED = {
    source: "static",
    updated: "2026-09-11T00:00:00Z",
    recent_since: 2021,
    metrics: { citations: 72, citations_recent: 68, h_index: 4, h_index_recent: 4, i10_index: 3, i10_index_recent: 3 },
    cites_per_year: { 2019: 1, 2020: 3, 2021: 8, 2022: 5, 2023: 4, 2024: 11, 2025: 21, 2026: 17 },
    publications: [
      { title: "Combining DFT Calculations and Clustering Techniques to Screen Organic Monovalent Cations for Applications in Halide Perovskite Solar Cells", year: 2026, venue: "ACS Omega", doi: "10.1021/acsomega.6c03327", citations: 0 },
      { title: "Enhancing Surface Termination and Stability of Hybrid Halide Perovskites via Phosphonic Acid Passivation", year: 2026, venue: "ACS Omega", doi: "10.1021/acsomega.5c12245", citations: 0 },
      { title: "Impact of Thin Film Thickness on the Structural, Energetic and Optoelectronic Properties of Two-Dimensional FPEA2(MAn−1)PbnI3n+1 Perovskites", year: 2025, venue: "ACS Applied Energy Materials", doi: "10.1021/acsaem.4c02800", citations: 9 },
      { title: "Theoretical and Experimental Insights into Transition Metal Single-Atom Adsorption Effects on Perovskite Surfaces", year: 2025, venue: "The Journal of Physical Chemistry C", doi: "10.1021/acs.jpcc.5c04429", citations: 3 },
      { title: "Metal Defects in MAPbI3 Perovskites: Uncovering the Roles of Ni, Cu, Ag, and Au", year: 2025, venue: "ACS Omega", doi: "10.1021/acsomega.5c09558", citations: 0 },
      { title: "Unveiling the impact of organic cation passivation on structural and optoelectronic properties of two-dimensional perovskites thin films", year: 2024, venue: "Applied Surface Science", doi: "10.1016/j.apsusc.2024.161098", citations: 12 },
      { title: "Role of the Adsorption of Alkali Cations on Ultrathin n-Layers of Two-Dimensional Perovskites", year: 2023, venue: "The Journal of Physical Chemistry C", doi: "10.1021/acs.jpcc.3c01894", citations: 13 },
      { title: "CaTiO3:Er3+:Yb3+ upconversion from 980 nm to 1550 nm excitation and its potential as cells luminescent probes", year: 2019, venue: "Materials Chemistry and Physics", doi: "10.1016/j.matchemphys.2018.11.018", citations: 35 },
    ],
  };

  async function fetchJson(url, opts) {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error(r.status + " " + url);
    return r.json();
  }

  async function fetchOpenAlex() {
    const base = "https://api.openalex.org";
    const author = await fetchJson(`${base}/authors/${CONFIG.openalexAuthor}`);
    const works = await fetchJson(`${base}/works?filter=authorships.author.id:${CONFIG.openalexAuthor},type:article&per-page=100&sort=publication_year:desc&select=doi,title,publication_year,cited_by_count,primary_location`);
    const per = {};
    (author.counts_by_year || []).forEach((r) => { per[r.year] = r.cited_by_count; });
    const pubs = (works.results || [])
      .filter((w) => w.primary_location && w.primary_location.source)
      .map((w) => ({
        title: w.title,
        year: w.publication_year,
        venue: w.primary_location.source.display_name,
        doi: (w.doi || "").replace("https://doi.org/", "") || null,
        citations: w.cited_by_count || 0,
      }));
    return {
      source: "openalex",
      updated: new Date().toISOString(),
      recent_since: new Date().getFullYear() - 5,
      metrics: { citations: author.cited_by_count, h_index: author.summary_stats.h_index, i10_index: author.summary_stats.i10_index },
      cites_per_year: per,
      publications: pubs,
    };
  }

  async function loadScholar() {
    let data = null;
    try { data = await fetchJson(CONFIG.dataUrl, { cache: "no-cache" }); } catch (e) { /* file missing or file:// */ }
    const ageDays = data && data.updated ? (Date.now() - new Date(data.updated)) / 864e5 : Infinity;
    if (!data || ageDays > CONFIG.staleDays) {
      // The weekly snapshot is missing or stale: go live to OpenAlex.
      try {
        const live = await fetchOpenAlex();
        if (!data || live.metrics.citations >= (data.metrics && data.metrics.citations || 0)) data = live;
      } catch (e) { /* offline */ }
    }
    state.scholar = data || SEED;
    renderScholar();
  }

  function renderScholar() {
    const d = state.scholar;
    if (!d) return;
    const m = d.metrics || {};
    const since = d.recent_since || (new Date().getFullYear() - 5);
    const setMetric = (id, all, recent) => {
      const node = el(id);
      if (!node) return;
      node.querySelector(".v").textContent = all != null ? all : "—";
      const s = node.querySelector(".s");
      if (recent != null) s.innerHTML = `<strong>${esc(recent)}</strong> ${esc(t("pub.m.since", { year: since }))}`;
      else s.textContent = "";
    };
    setMetric("m-citations", m.citations, m.citations_recent);
    setMetric("m-h", m.h_index, m.h_index_recent);
    setMetric("m-i10", m.i10_index, m.i10_index_recent);

    const srcKey = d.source === "google-scholar" ? "pub.source.scholar" : d.source === "openalex" ? "pub.source.openalex" : "pub.source.static";
    const srcUrl = d.source === "openalex" ? `https://openalex.org/authors/${CONFIG.openalexAuthor}` : `https://scholar.google.com/citations?user=${CONFIG.scholarId}`;
    const src = el("chart-src");
    if (src) src.innerHTML = t("pub.updated", { date: esc(fmtDate(d.metrics_updated || d.updated)), source: `<a href="${srcUrl}" target="_blank" rel="noopener">${esc(t(srcKey))}</a>` });

    renderChart(el("chart"), d.cites_per_year || {});
    renderPubs(d.publications || []);
  }

  // ----------------------------------------------------------------- chart
  function renderChart(container, perYear) {
    if (!container) return;
    const years = Object.keys(perYear).map(Number).filter((y) => !isNaN(y)).sort((a, b) => a - b);
    if (!years.length) { container.innerHTML = `<p class="chart-empty">${esc(t("pub.empty"))}</p>`; return; }
    const y0 = years[0], y1 = Math.max(years[years.length - 1], new Date().getFullYear());
    const data = [];
    for (let y = y0; y <= y1; y++) data.push({ year: y, n: Number(perYear[y] || 0) });
    const max = Math.max(1, ...data.map((d) => d.n));
    // nice tick step
    const rawStep = max / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = [1, 2, 5, 10].map((k) => k * mag).find((s) => s >= rawStep) || mag * 10;
    const top = Math.ceil(max / step) * step;

    const W = Math.max(260, container.clientWidth || 600), H = 220;
    const padL = 34, padR = 8, padT = 18, padB = 28;
    const iw = W - padL - padR, ih = H - padT - padB;
    const slot = iw / data.length;
    const bw = Math.min(46, Math.max(10, slot - Math.max(2, slot * 0.28)));
    const yScale = (v) => padT + ih - (v / top) * ih;
    const maxIdx = data.reduce((mi, d, i) => (d.n > data[mi].n ? i : mi), 0);

    let g = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(t("pub.chart.title"))}">`;
    g += `<g class="grid">`;
    for (let v = 0; v <= top; v += step) g += `<line x1="${padL}" x2="${W - padR}" y1="${yScale(v)}" y2="${yScale(v)}"/>`;
    g += `</g><g class="axis">`;
    for (let v = 0; v <= top; v += step) g += `<text x="${padL - 8}" y="${yScale(v) + 4}" text-anchor="end">${v}</text>`;
    g += `</g><g class="bars">`;
    data.forEach((d, i) => {
      const x = padL + slot * i + (slot - bw) / 2;
      const y = yScale(d.n), h = Math.max(0, padT + ih - y);
      const r = Math.min(4, bw / 2, h);
      const path = h > 0
        ? `M${x},${y + h} V${y + r} a${r},${r} 0 0 1 ${r},-${r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${y + h} Z`
        : "";
      if (path) g += `<path class="bar" d="${path}" data-i="${i}"/>`;
      if (i === maxIdx || i === data.length - 1) g += `<text class="lbl" x="${x + bw / 2}" y="${y - 6}">${d.n}</text>`;
      g += `<rect class="bar-hit" x="${padL + slot * i}" y="${padT}" width="${slot}" height="${ih}" data-i="${i}"/>`;
    });
    g += `</g><g class="axis">`;
    const every = slot < 34 ? 2 : 1;
    data.forEach((d, i) => { if ((data.length - 1 - i) % every === 0) g += `<text x="${padL + slot * i + slot / 2}" y="${H - 8}" text-anchor="middle">${d.year}</text>`; });
    g += `</g></svg><div class="chart-tip" id="chart-tip"></div>`;
    container.innerHTML = g;

    const tip = container.querySelector("#chart-tip");
    const bars = container.querySelectorAll(".bar");
    container.querySelectorAll(".bar-hit").forEach((hit) => {
      hit.addEventListener("pointerenter", () => {
        const i = +hit.dataset.i, d = data[i];
        bars.forEach((b) => b.classList.toggle("dim", +b.dataset.i !== i));
        tip.textContent = t("pub.chart.tip", { n: d.n, year: d.year });
        const x = padL + slot * i + slot / 2;
        tip.style.left = (x / W * 100) + "%";
        tip.style.top = (yScale(d.n) / H * 100) + "%";
        tip.classList.add("on");
      });
      hit.addEventListener("pointerleave", () => { bars.forEach((b) => b.classList.remove("dim")); tip.classList.remove("on"); });
    });
  }
  let rto;
  window.addEventListener("resize", () => { clearTimeout(rto); rto = setTimeout(() => { if (state.scholar) renderChart(el("chart"), state.scholar.cites_per_year || {}); }, 150); });

  // ---------------------------------------------------------- publications
  function renderPubs(pubs) {
    const list = el("pub-list");
    if (!list) return;
    const sorted = pubs.slice().sort((a, b) => (b.year || 0) - (a.year || 0) || (b.citations || 0) - (a.citations || 0));
    list.innerHTML = sorted.map((p, i) => {
      const url = p.url || (p.doi ? `https://doi.org/${p.doi}` : `https://scholar.google.com/citations?user=${CONFIG.scholarId}`);
      const n = p.citations || 0;
      const cites = n === 0 ? t("pub.cites0") : n === 1 ? t("pub.cites1") : t("pub.cites", { n });
      return `<article class="pub${i >= CONFIG.pubsVisible && !state.pubsExpanded ? " hidden" : ""}">
        <div class="year">${esc(p.year || "")}</div>
        <div><h4><a href="${esc(url)}" target="_blank" rel="noopener">${esc(p.title)}</a></h4>
        <div class="venue"><em>${esc(p.venue || "")}</em>${p.doi ? ` · <span class="mono">doi:${esc(p.doi)}</span>` : ""}</div></div>
        <div class="cites${n === 0 ? " zero" : ""}">${esc(cites)}</div>
      </article>`;
    }).join("");
    const btn = el("pub-toggle");
    if (btn) {
      btn.hidden = sorted.length <= CONFIG.pubsVisible;
      btn.textContent = state.pubsExpanded ? t("pub.showLess") : t("pub.showAll", { n: sorted.length });
      btn.onclick = () => { state.pubsExpanded = !state.pubsExpanded; renderPubs(pubs); if (!state.pubsExpanded) el("publications").scrollIntoView({ block: "start" }); };
    }
  }

  // --------------------------------------------------------------- GitHub
  const REPO_SEED = [
    { name: "VASP_tools", html_url: "https://github.com/israel-c-ribeiro/VASP_tools", language: "Jupyter Notebook", stargazers_count: 1, updated_at: "2026-08-05T00:00:00Z" },
    { name: "mace_gui_cmn", html_url: "https://github.com/israel-c-ribeiro/mace_gui_cmn", language: "Python", stargazers_count: 1, updated_at: "2026-05-08T00:00:00Z", description: "Interactive GUI for MACE-based atomistic simulations." },
    { name: "israel-c-ribeiro.github.io", html_url: "https://github.com/israel-c-ribeiro/israel-c-ribeiro.github.io", language: "JavaScript", stargazers_count: 1, updated_at: "2026-09-11T00:00:00Z" },
  ];
  async function loadRepos() {
    try {
      const repos = await fetchJson(`https://api.github.com/users/${CONFIG.githubUser}/repos?per_page=100&sort=updated`);
      state.repos = repos.filter((r) => !r.fork && !r.archived && r.name !== CONFIG.githubUser);
    } catch (e) {
      state.repos = REPO_SEED;
    }
    renderRepos();
  }
  function renderRepos() {
    const grid = el("repo-grid");
    if (!grid || !state.repos) return;
    const order = ["mace_gui_cmn", "VASP_tools"];
    const repos = state.repos.slice().sort((a, b) => {
      const ia = order.indexOf(a.name), ib = order.indexOf(b.name);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
    const icon = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>`;
    grid.innerHTML = repos.map((r) => {
      const key = "code.repo." + r.name;
      const dict = window.I18N[state.lang] || {};
      const desc = dict[key] || window.I18N.en[key] || r.description || "";
      return `<a class="repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
        <div class="repo-name">${icon}${esc(r.name)}</div>
        <p>${esc(desc)}</p>
        <div class="repo-meta">${r.language ? `<span><i></i>${esc(r.language)}</span>` : ""}<span>★ ${r.stargazers_count || 0}</span><span>${esc(t("code.updated", { date: fmtDate(r.updated_at) }))}</span></div>
      </a>`;
    }).join("");
  }

  // --------------------------------------------------------- contact form
  (function initForm() {
    const form = el("contact-form");
    if (!form) return;
    const status = el("form-status");
    const btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = t("contact.form.sending");
      btn.disabled = true;
      try {
        const r = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(r.status);
        status.classList.add("ok");
        status.textContent = t("contact.form.ok");
        form.reset();
      } catch (err) {
        status.classList.add("bad");
        status.textContent = t("contact.form.bad");
      } finally {
        btn.disabled = false;
      }
    });
  })();

  // ------------------------------------------------------------------ boot
  applyLang(detectLang());
  loadScholar();
  loadRepos();
})();
