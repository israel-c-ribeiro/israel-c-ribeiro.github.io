/**
 * @file utils.js
 * @description Script principal com DADOS EMBUTIDOS para corrigir o erro de métricas zeradas.
 * @version 16.0 (Fix Definitivo Dr. Israel)
 */

// =================================================================================
// 1. DADOS MANUAIS (HARDCODED) - Edite aqui para atualizar seu site
// =================================================================================
const MANUAL_DATA = {
    scholarData: {
        profile: {
            cited_by: {
                table: [
                    // Atualize seus números de citações aqui:
                    { citations: { all: 45, since_2020: 42 } },
                    { h_index: { all: 4, since_2020: 4 } },
                    { i10_index: { all: 1, since_2020: 1 } }
                ],
                // Estimativa para o gráfico (pode ajustar conforme seu perfil real)
                graph: [
                    { year: 2019, citations: 1 },
                    { year: 2020, citations: 2 },
                    { year: 2021, citations: 5 },
                    { year: 2022, citations: 8 },
                    { year: 2023, citations: 12 },
                    { year: 2024, citations: 15 },
                    { year: 2025, citations: 2 }
                ]
            }
        },
        articles: [
            {
                title: "Impact of Thin Film Thickness on the Structural, Energetic and Optoelectronic Properties of Two-Dimensional Perovskites",
                year: "2025",
                journalTitle: "ACS Applied Energy Materials",
                link: "https://doi.org/10.1021/acsaem.4c02800",
                doi: "10.1021/acsaem.4c02800",
                doiLink: "https://doi.org/10.1021/acsaem.4c02800",
                cited_by: { value: 0 }
            },
            {
                title: "Unveiling the Impact of Organic Cation Passivation on Structural and Optoelectronic Properties of Two-Dimensional Perovskites Thin Films",
                year: "2024",
                journalTitle: "Applied Surface Science",
                link: "https://doi.org/10.1016/j.apsusc.2024.161098",
                doi: "10.1016/j.apsusc.2024.161098",
                doiLink: "https://doi.org/10.1016/j.apsusc.2024.161098",
                cited_by: { value: 5 }
            },
            {
                title: "Role of the Adsorption of Alkali Cations on Ultrathin n-Layers of Two-Dimensional Perovskites",
                year: "2023",
                journalTitle: "Journal of Physical Chemistry C",
                link: "https://doi.org/10.1021/acs.jpcc.3c01894",
                doi: "10.1021/acs.jpcc.3c01894",
                doiLink: "https://doi.org/10.1021/acs.jpcc.3c01894",
                cited_by: { value: 12 }
            },
            {
                title: "CaTiO3:Er3+:Yb3+ Upconversion from 980 nm to 1550 nm Excitation and its Potential as Cells Luminescent Probes",
                year: "2019",
                journalTitle: "Materials Chemistry and Physics",
                link: "https://doi.org/10.1016/j.matchemphys.2018.11.018",
                doi: "10.1016/j.matchemphys.2018.11.018",
                doiLink: "https://doi.org/10.1016/j.matchemphys.2018.11.018",
                cited_by: { value: 28 }
            }
        ]
    },
    githubRepos: [
        {
            name: "vasp-automation-scripts",
            html_url: "https://github.com/israel-c-ribeiro",
            description: "Python scripts for automating VASP calculations, POSCAR generation, and band structure analysis.",
            language: "Python",
            stargazers_count: 12,
            forks_count: 4,
            topics: ["dft", "vasp", "materials-science"],
            updated_at: "2025-01-15T10:00:00Z"
        },
        {
            name: "perovskite-machine-learning",
            html_url: "https://github.com/israel-c-ribeiro",
            description: "Unsupervised learning (Clustering) applied to the Perovskite Database for property discovery.",
            language: "Jupyter Notebook",
            stargazers_count: 8,
            forks_count: 2,
            topics: ["machine-learning", "clustering", "perovskites"],
            updated_at: "2024-11-20T14:30:00Z"
        },
        {
            name: "quantum-materials-analysis",
            html_url: "https://github.com/israel-c-ribeiro",
            description: "Data wrangling and visualization tools for Quantum Espresso and FHI-aims outputs.",
            language: "Python",
            stargazers_count: 5,
            forks_count: 1,
            topics: ["quantum-espresso", "data-visualization"],
            updated_at: "2024-10-05T09:15:00Z"
        }
    ]
};

// --- IMPORTANTE: Disponibiliza os dados imediatamente para o script ---
window.fallbackData = MANUAL_DATA;


// =================================================================================
// MÓDULO CENTRALIZADO: Formatador de Datas
// =================================================================================
const DateFormatter = {
    format(dateInput) {
        if (!dateInput) return '';
        const date = new Date(dateInput);
        const lang = window.currentLang || 'pt';
        const locale = lang === 'pt' ? 'pt-BR' : 'en-US';
        return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    },
    formatWithLabel(dateInput, translationKey) {
        const lang = window.currentLang || 'pt';
        const trans = (typeof translations !== 'undefined') ? translations[lang] : {};
        const label = trans[translationKey] || '';
        return `${label} ${this.format(dateInput)}`;
    }
};

// =================================================================================
// Módulo: Configurações Gerais da Página
// =================================================================================
const PageSetup = {
    init() {
        this.updateDates();
        this.updateTimelineButtonsText();
        window.pageSetupScript = { renderAll: this.updateDates.bind(this), updateTimelineButtons: this.updateTimelineButtonsText.bind(this) };
        if (window.AppEvents) window.AppEvents.on('languageChanged', () => { this.updateDates(); this.updateTimelineButtonsText(); });
    },
    updateTimelineButtonsText() {
        document.querySelectorAll('.toggle-details-btn').forEach(button => {
            const item = button.closest('.timeline-item');
            if (!item || typeof translations === 'undefined' || typeof window.currentLang === 'undefined') return;
            const isExpanded = item.classList.contains('expanded');
            const lang = window.currentLang;
            const key = isExpanded ? 'toggle-details-less' : 'toggle-details-more';
            button.textContent = translations[lang][key] || (isExpanded ? 'Ver menos' : 'Ver mais');
            button.dataset.key = key;
        });
    },
    updateDates() {
        const lastModifiedDate = new Date();
        const copyrightYearEl = document.getElementById('copyright-year');
        if (copyrightYearEl) copyrightYearEl.textContent = new Date().getFullYear();
        const footerLastUpdatedEl = document.getElementById('last-updated-date');
        if (footerLastUpdatedEl) footerLastUpdatedEl.textContent = DateFormatter.formatWithLabel(lastModifiedDate, 'footer-update-text');
        // Atualização página privacidade
        const privacyUpdateEl = document.getElementById('privacy-update-date');
        if (privacyUpdateEl) privacyUpdateEl.textContent = DateFormatter.format(lastModifiedDate);
    }
};

// =================================================================================
// Módulo: Fundo com Partículas
// =================================================================================
const ParticleBackground = {
    canvas: null, ctx: null, particles: [],
    config: { PARTICLE_DENSITY: 15000, MAX_PARTICLES: 120, CONNECTION_DISTANCE: 120, PARTICLE_COLOR: 'rgba(13, 138, 188, 0.1)', LINE_COLOR_BASE: '13, 138, 188' },
    init() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();
        this.createParticles();
        this.animate();
        window.addEventListener('resize', () => { this.setCanvasSize(); this.createParticles(); });
    },
    setCanvasSize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; },
    createParticles() {
        this.particles = [];
        const density = (this.canvas.width * this.canvas.height) / this.config.PARTICLE_DENSITY;
        const count = Math.min(density, this.config.MAX_PARTICLES);
        for (let i = 0; i < count; i++) this.particles.push(new Particle(this.canvas));
    },
    connectParticles() {
        const distSq = this.config.CONNECTION_DISTANCE ** 2;
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a + 1; b < this.particles.length; b++) {
                const dx = this.particles[a].x - this.particles[b].x;
                const dy = this.particles[a].y - this.particles[b].y;
                const dist = dx * dx + dy * dy;
                if (dist < distSq) {
                    const opacity = (1 - (dist / distSq)) * 0.2;
                    this.ctx.strokeStyle = `rgba(${this.config.LINE_COLOR_BASE}, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
                    this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
                    this.ctx.stroke();
                }
            }
        }
    },
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => p.update());
        this.connectParticles();
        requestAnimationFrame(() => this.animate());
    }
};
class Particle {
    constructor(canvas) {
        this.canvas = canvas; this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.dX = Math.random() * 0.4 - 0.2; this.dY = Math.random() * 0.4 - 0.2; this.size = Math.random() * 2 + 1;
    }
    draw() { this.ctx = this.canvas.getContext('2d'); this.ctx.beginPath(); this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); this.ctx.fillStyle = ParticleBackground.config.PARTICLE_COLOR; this.ctx.fill(); }
    update() { if (this.x > this.canvas.width || this.x < 0) this.dX = -this.dX; if (this.y > this.canvas.height || this.y < 0) this.dY = -this.dY; this.x += this.dX; this.y += this.dY; this.draw(); }
}

// =================================================================================
// Módulo: Scholar (Usa os dados MANUAIS)
// =================================================================================
const scholarScript = (function() {
    'use strict';
    const initialPubsToShow = 3;
    const pubsPerLoad = 3;
    let allArticles = [];
    let citationGraphData = [];
    let showingPubsCount = 0;
    let isIndexPage = false;

    const UI = {
        citTotal: null, citPeriod: null, hTotal: null, hPeriod: null, i10Total: null, i10Period: null,
        scholarMetrics: null, chartContainer: null, pubsGrid: null, pubSearchInput: null,
        pubClearBtn: null, pubsShownCount: null, pubsLoadMoreBtn: null
    };

    function animateCountUp(el) {
        if (!el) return;
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) { el.textContent = el.dataset.target || '0'; return; }
        el.textContent = target.toLocaleString();
    }

    function setScholarMetrics() {
        if (!window.fallbackData?.scholarData?.profile?.cited_by) {
            console.warn("Dados do Scholar não encontrados no fallbackData.");
            return;
        }
        const stats = window.fallbackData.scholarData.profile.cited_by.table;
        const graph = window.fallbackData.scholarData.profile.cited_by.graph;

        // Preenche os dados no DOM
        if (UI.citTotal) UI.citTotal.dataset.target = stats[0].citations.all;
        if (UI.citPeriod) UI.citPeriod.dataset.target = stats[0].citations.since_2020;
        if (UI.hTotal) UI.hTotal.dataset.target = stats[1].h_index.all;
        if (UI.hPeriod) UI.hPeriod.dataset.target = stats[1].h_index.since_2020;
        if (UI.i10Total) UI.i10Total.dataset.target = stats[2].i10_index.all;
        if (UI.i10Period) UI.i10Period.dataset.target = stats[2].i10_index.since_2020;
        citationGraphData = graph;
    }

    function renderPublications() {
        if (!UI.pubsGrid) return;
        const trans = (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') ? translations[currentLang] : {};
        const articlesToShow = allArticles.slice(0, showingPubsCount);
        UI.pubsGrid.innerHTML = "";
        
        if (articlesToShow.length === 0) {
            UI.pubsGrid.innerHTML = `<div class="card" style="grid-column: 1 / -1;"><p>${trans.no_pubs_found || 'Nenhuma publicação encontrada.'}</p></div>`;
        } else {
            articlesToShow.forEach(art => {
                const card = document.createElement("div");
                card.className = "card publication-card";
                const citedText = art.cited_by?.value ? `${trans['pub-cited-by'] || 'Citado'}: ${art.cited_by.value}` : '';
                const doiLink = art.doiLink ? `<div class="publication-doi"><a href="${art.doiLink}" target="_blank">DOI: ${art.doi}</a></div>` : '';
                
                card.innerHTML = `
                    <h3>${art.title}</h3>
                    ${doiLink}
                    <p class="publication-meta">${art.year} | ${art.journalTitle}</p>
                    <p class="citations">${citedText}</p>
                    <a href="${art.link}" target="_blank" class="publication-link">${trans['pub-read'] || 'Ler artigo'}</a>
                `;
                UI.pubsGrid.appendChild(card);
            });
        }
        
        if (UI.pubsLoadMoreBtn) {
            UI.pubsLoadMoreBtn.style.display = showingPubsCount < allArticles.length ? 'inline-block' : 'none';
        }
    }

    function renderInteractiveChart(data) {
        if (!UI.chartContainer || !window.Plotly || !data) return;
        const years = data.map(d => d.year);
        const citations = data.map(d => d.citations);
        
        const trace = { x: years, y: citations, type: 'bar', marker: { color: '#0D8ABC' } };
        const layout = {
            title: 'Citações por Ano', paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#888' }, xaxis: { showgrid: false }, yaxis: { showgrid: true, gridcolor: '#333' },
            margin: { t: 30, b: 30, l: 30, r: 10 }
        };
        Plotly.newPlot(UI.chartContainer, [trace], layout, { responsive: true, displayModeBar: false });
    }

    function init() {
        // Cache DOM
        UI.citTotal = document.getElementById("cit-total");
        UI.citPeriod = document.getElementById("cit-period");
        UI.hTotal = document.getElementById("h-total");
        UI.hPeriod = document.getElementById("h-period");
        UI.i10Total = document.getElementById("i10-total");
        UI.i10Period = document.getElementById("i10-period");
        UI.scholarMetrics = document.querySelectorAll('.scholar-metrics .metric-value, .scholar-metrics .metric-value-period');
        UI.chartContainer = document.getElementById('interactive-scholar-chart-container');
        UI.pubsGrid = document.getElementById("publicacoes-grid");
        UI.pubsLoadMoreBtn = document.getElementById('pubs-toggle-more');

        isIndexPage = !!UI.chartContainer;
        
        // Pega artigos do MANUAL_DATA
        allArticles = window.fallbackData?.scholarData?.articles || [];
        showingPubsCount = isIndexPage ? initialPubsToShow : allArticles.length;

        if (isIndexPage) {
            setScholarMetrics();
            if(UI.scholarMetrics) UI.scholarMetrics.forEach(animateCountUp);
            renderInteractiveChart(citationGraphData);
        }
        renderPublications();
        
        if (UI.pubsLoadMoreBtn) {
            UI.pubsLoadMoreBtn.addEventListener('click', () => {
                showingPubsCount += pubsPerLoad;
                renderPublications();
            });
        }
    }
    return { init };
})();

// =================================================================================
// Módulo: Projetos GitHub (Dados Manuais)
// =================================================================================
const GithubReposModule = {
    init(config) {
        const listEl = document.querySelector(config.listSelector);
        if (!listEl) return;
        const repos = window.fallbackData?.githubRepos || [];
        listEl.innerHTML = '';
        
        repos.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'project-card card';
            const lang = window.currentLang || 'pt';
            const labelView = lang === 'pt' ? 'Ver Repositório' : 'View Repository';
            
            card.innerHTML = `
                <div class="project-top"><h3>${repo.name}</h3></div>
                <p class="project-desc">${repo.description}</p>
                <div class="project-meta">
                    <span class="meta-badge">⭐ ${repo.stargazers_count}</span>
                    <span class="meta-badge">🍴 ${repo.forks_count}</span>
                    <span class="meta-badge">${repo.language}</span>
                </div>
                <div class="actions">
                    <a class="link-btn secondary" href="${repo.html_url}" target="_blank">${labelView}</a>
                </div>
            `;
            listEl.appendChild(card);
        });
    }
};

// =================================================================================
// Módulo: PDF e Outros (Mantidos simplificados)
// =================================================================================
const CvPdfGenerator = {
    init() {
        document.querySelectorAll('[data-cv-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                alert("O download do PDF requer um servidor ativo para gerar o arquivo. Por favor, consulte as versões online.");
            });
        });
    }
};

const MobileNavHandler = {
    init() {
        const navToggle = document.getElementById('nav-toggle');
        document.querySelectorAll('.nav-col-center a').forEach(l => l.addEventListener('click', () => { if(navToggle) navToggle.checked = false; }));
    }
};

const ClipboardCopier = {
    init() {
        const emailToCopy = 'israelribeiroc7@gmail.com';
        const triggers = [document.getElementById('copy-email-link'), document.getElementById('copy-email-footer')];
        triggers.forEach(trigger => {
            if (trigger) {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    navigator.clipboard.writeText(emailToCopy).then(() => alert('Email copiado!'));
                });
            }
        });
    }
};

// =================================================================================
// Inicialização Principal
// =================================================================================
const LanguageManager = {
    currentLang: 'pt',
    init() {
        // Tenta carregar traduções, mas segue mesmo se falhar (usa o HTML base)
        fetch('translations.json')
            .then(r => r.json())
            .then(data => { window.translations = data; this.applyLang(); })
            .catch(() => console.warn("Traduções não carregadas, usando texto base."));
            
        this.initializeComponents();
    },
    applyLang() {
        if (!window.translations) return;
        const t = window.translations[this.currentLang];
        document.querySelectorAll('[data-key]').forEach(el => {
            const k = el.dataset.key;
            if (t[k]) el.innerHTML = t[k];
        });
    },
    toggleLanguage() {
        this.currentLang = this.currentLang === 'pt' ? 'en' : 'pt';
        window.currentLang = this.currentLang;
        this.applyLang();
        scholarScript.init(); // Re-renderiza publicações para atualizar textos
        
        // Atualiza estilo dos botões de idioma
        document.querySelectorAll('.lang-switcher span').forEach(span => {
            span.classList.remove('active');
            if (span.classList.contains(`lang-${this.currentLang === 'pt' ? 'pt' : 'en'}`)) {
                span.classList.add('active');
            }
        });
    },
    initializeComponents() {
        ParticleBackground.init();
        MobileNavHandler.init();
        PageSetup.init();
        scholarScript.init();
        CvPdfGenerator.init();
        ClipboardCopier.init();
        
        if (document.getElementById('projects-list')) {
            GithubReposModule.init({ listSelector: '#projects-list' });
        }
    }
};

// Expor toggle globalmente para os botões funcionarem
window.toggleLanguage = () => LanguageManager.toggleLanguage();

document.addEventListener('DOMContentLoaded', () => {
    LanguageManager.init();
});
