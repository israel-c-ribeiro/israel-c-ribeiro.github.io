/**
 * @file utils.js
 * @description Contém scripts utilitários centralizados para o portfólio do Dr. Israel C. Ribeiro.
 * @version 15.0 (Personalização Quantum Master Inc.)
 */

// =================================================================================
// MÓDULO CENTRALIZADO: Formatador de Datas
// =================================================================================
const DateFormatter = {
    format(dateInput) {
        if (!dateInput) return '';
        const date = new Date(dateInput);
        const lang = window.currentLang || 'pt';
        const locale = lang === 'pt' ? 'pt-BR' : 'en-US';

        return date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },
    formatWithLabel(dateInput, translationKey) {
        const lang = window.currentLang || 'pt';
        const trans = (typeof translations !== 'undefined') ? translations[lang] : {};
        const label = trans[translationKey] || '';
        const formattedDate = this.format(dateInput);
        return `${label} ${formattedDate}`;
    }
};

// =================================================================================
// Módulo: Configurações Gerais da Página
// =================================================================================
const PageSetup = {
    init() {
        this.updateDates();
        this.updateTimelineButtonsText();

        window.pageSetupScript = {
            renderAll: this.updateDates.bind(this),
            updateTimelineButtons: this.updateTimelineButtonsText.bind(this)
        };

        if (window.AppEvents) {
            window.AppEvents.on('languageChanged', () => {
                this.updateDates();
                this.updateTimelineButtonsText();
            });
        }
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
        if (typeof translations === 'undefined' || typeof window.currentLang === 'undefined') {
            console.warn("PageSetup.updateDates: translations ou currentLang não definidos ainda.");
            return;
        }
        
        const lastModifiedDate = document.lastModified ? new Date(document.lastModified) : new Date();

        const copyrightYearEl = document.getElementById('copyright-year');
        if (copyrightYearEl) {
            copyrightYearEl.textContent = new Date().getFullYear();
        }

        const footerLastUpdatedEl = document.getElementById('last-updated-date');
        if (footerLastUpdatedEl) {
            footerLastUpdatedEl.textContent = DateFormatter.formatWithLabel(lastModifiedDate, 'footer-update-text');
        }
    }
};

// =================================================================================
// Módulo: Manipulador da Navegação Móvel
// =================================================================================
const MobileNavHandler = {
    init() {
        const navToggle = document.getElementById('nav-toggle');
        const navLinks = document.querySelectorAll('.nav-col-center a');

        if (!navToggle || !navLinks.length) return;

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navToggle.checked) {
                    navToggle.checked = false;
                }
            });
        });
    }
};

// =================================================================================
// Módulo: Fundo com Partículas
// =================================================================================
const ParticleBackground = {
    canvas: null,
    ctx: null,
    particles: [],
    config: {
        PARTICLE_DENSITY: 15000,
        MAX_PARTICLES: 120,
        CONNECTION_DISTANCE: 120,
        PARTICLE_COLOR: 'rgba(13, 138, 188, 0.1)', // Ajustado para tom azulado da Quantum Master
        LINE_COLOR_BASE: '13, 138, 188',
    },
    init() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();
        this.createParticles();
        this.animate();
        window.addEventListener('resize', () => {
            this.setCanvasSize();
            this.createParticles();
        });
    },
    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    createParticles() {
        this.particles = [];
        const density = (this.canvas.width * this.canvas.height) / this.config.PARTICLE_DENSITY;
        const particleCount = Math.min(density, this.config.MAX_PARTICLES);
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(this.canvas));
        }
    },
    connectParticles() {
        const distSq = this.config.CONNECTION_DISTANCE * this.config.CONNECTION_DISTANCE;
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a + 1; b < this.particles.length; b++) {
                const dx = this.particles[a].x - this.particles[b].x;
                const dy = this.particles[a].y - this.particles[b].y;
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared < distSq) {
                    const opacity = (1 - (distanceSquared / distSq)) * 0.2;
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
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.dX = Math.random() * 0.4 - 0.2;
        this.dY = Math.random() * 0.4 - 0.2;
        this.size = Math.random() * 2 + 1;
    }
    draw() {
        const ctx = this.canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = ParticleBackground.config.PARTICLE_COLOR;
        ctx.fill();
    }
    update() {
        if (this.x > this.canvas.width || this.x < 0) this.dX = -this.dX;
        if (this.y > this.canvas.height || this.y < 0) this.dY = -this.dY;
        this.x += this.dX;
        this.y += this.dY;
        this.draw();
    }
}

// =================================================================================
// Módulo: Formulário de Contato
// =================================================================================
const ContactForm = {
    form: null,
    statusElement: null,
    fields: ['name', 'email', 'subject', 'message'],
    init() {
        this.form = document.getElementById("contact-form");
        if (!this.form) return;
        this.statusElement = document.getElementById("form-status");
        this.form.addEventListener("submit", this.handleSubmit.bind(this));
    },
    validate() {
        // Implementação básica de validação
        return true; 
    },
    async handleSubmit(event) {
        event.preventDefault();
        if (!this.statusElement) return;
        
        // Mensagem de envio
        const sendingMsg = (translations[currentLang] && translations[currentLang].formSending) ? translations[currentLang].formSending : "Enviando...";
        this.updateStatus(sendingMsg, 'var(--accent)');
        
        const data = new FormData(event.target);
        try {
            const response = await fetch(event.target.action, {
                method: this.form.method,
                body: data,
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                const successMsg = (translations[currentLang] && translations[currentLang].formSuccess) ? translations[currentLang].formSuccess : "Mensagem enviada!";
                this.updateStatus(successMsg, 'var(--primary)');
                this.form.reset();
            } else {
                const errorMsg = (translations[currentLang] && translations[currentLang].formError) ? translations[currentLang].formError : "Erro ao enviar.";
                this.updateStatus(errorMsg, 'var(--error)');
            }
        } catch (error) {
            console.error("Erro ao enviar:", error);
            this.updateStatus("Erro de conexão.", 'var(--error)');
        }
    },
    updateStatus(message, color) {
        if (this.statusElement) {
            this.statusElement.textContent = message;
            this.statusElement.style.color = color;
        }
    }
};

// =================================================================================
// Módulo: Repositórios do GitHub
// =================================================================================
const GithubReposModule = {
    state: { allRepos: [], filteredRepos: [], showingCount: 0, currentFilter: '' },
    config: {},
    titleCase: (str) => !str ? '' : str.replace(/[-_]/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
    debounce: (fn, wait = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), wait); }; },
    
    createCard(repo) {
        const card = document.createElement('div');
        card.className = 'project-card card';
        card.setAttribute('role', 'listitem');
        
        const trans = (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') ? translations[currentLang] : {};
        
        // URL ajustada para o seu usuário
        const siteUrl = repo.homepage || (repo.has_pages ? `https://israel-c-ribeiro.github.io/${repo.name}/` : null);
        
        let actionsHtml = '';
        if (siteUrl) actionsHtml += `<a class="link-btn" href="${siteUrl}" target="_blank" rel="noopener" data-key="repo-live-site">${trans['repo-live-site'] || 'Ver Site'}</a>`;
        actionsHtml += `<a class="link-btn ${siteUrl ? 'secondary' : ''}" href="${repo.html_url}" target="_blank" rel="noopener" data-key="repo-view-repo">${trans['repo-view-repo'] || 'Repositório'}</a>`;

        let languageTag = repo.language ? `<span class="meta-badge language-badge" aria-label="Linguagem">${repo.language}</span>` : '';
        const formattedUpdateDate = DateFormatter.formatWithLabel(repo.updated_at, 'repo-last-update');
        
        card.innerHTML = `
            <div class="project-top"><h3>${this.titleCase(repo.name)}</h3></div>
            <p class="project-desc">${repo.description || (trans.no_description || 'Sem descrição.')}</p>
            <div class="project-meta meta-icons">
                <div class="meta-icons">
                    <span class="meta-badge" aria-label="${repo.stargazers_count} estrelas">⭐ ${repo.stargazers_count}</span>
                    <span class="meta-badge" aria-label="${repo.forks_count} forks">🍴 ${repo.forks_count}</span>
                </div>
            </div>
            <div class="project-meta">${(repo.topics || []).slice(0, 4).map(t => `<span class="topic-tag">${t}</span>`).join('')}</div>
            <div class="project-meta" style="margin-top: auto;">${languageTag}</div>
            <div class="project-meta" style="margin-top: auto;"><span class="update-date">${formattedUpdateDate}</span></div>
            <div class="actions">${actionsHtml}</div>`;
        return card;
    },

    updateMetaText() {
        if (!this.config.metaEl) return;
        const trans = (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') ? translations[currentLang] : {};
        const template = trans.showing_repos_template || "Exibindo {shown} de {total} repositórios."; 
    },

    sortRepos: (arr) => [...arr].sort((a, b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count || new Date(b.updated_at) - new Date(a.updated_at)),
    
    render() {
        if (!this.config.listEl) return;
        this.config.listEl.innerHTML = '';

        const trans = (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') ? translations[currentLang] : {};
        const reposToDisplay = this.state.filteredRepos.slice(0, this.state.showingCount);

        if (reposToDisplay.length === 0) {
            this.config.listEl.innerHTML = `<div class="project-card"><p data-key="no_repos_found">${trans.no_repos_found || 'Nenhum repositório encontrado.'}</p></div>`;
        } else {
            reposToDisplay.forEach(repo => this.config.listEl.appendChild(this.createCard(repo)));
        }
        
        if (this.config.clearBtnEl) {
             this.config.clearBtnEl.textContent = trans['clear-btn'] || 'Limpar';
             this.config.clearBtnEl.dataset.key = 'clear-btn';
        }
        if (this.config.loadMoreBtnEl) {
             this.config.loadMoreBtnEl.textContent = trans['show-more'] || 'Mostrar mais';
             this.config.loadMoreBtnEl.dataset.key = 'show-more';
        }

        if (this.config.shownCountEl) {
            const template = trans.showing_repos_template || "Exibindo {shown} de {total}"; 
            this.config.shownCountEl.textContent = template
                .replace("{shown}", reposToDisplay.length)
                .replace("{total}", this.state.filteredRepos.length);
        }

        if (this.config.loadMoreBtnEl) {
            const hasMore = this.state.showingCount < this.state.filteredRepos.length;
            this.config.loadMoreBtnEl.classList.toggle('hidden', !hasMore || this.state.currentFilter.trim() !== '');
        }
    },
    filterAndRender() {
        const filter = this.state.currentFilter.trim().toLowerCase();
        let filtered = this.state.allRepos;
        if (filter) {
            filtered = this.state.allRepos.filter(r =>
                r.name.toLowerCase().includes(filter) || (r.description || '').toLowerCase().includes(filter) ||
                (r.language || '').toLowerCase().includes(filter) || r.topics.some(t => t.toLowerCase().includes(filter))
            );
        }
        this.state.filteredRepos = this.sortRepos(filtered);

        if (this.config.isPaginated && !filter) {
            this.state.showingCount = Math.min(this.config.initialCount, this.state.filteredRepos.length);
        } else {
            this.state.showingCount = this.state.filteredRepos.length; 
        }
        this.updateMetaText(); 
        this.render();
    },
    reRenderWithCurrentLang() {
        this.filterAndRender(); 
    },
    init(userConfig) {
        const listEl = document.querySelector(userConfig.listSelector);
        if (!listEl) return;

        this.config = {
            listEl,
            metaEl: document.querySelector(userConfig.metaSelector),
            searchEl: document.querySelector(userConfig.searchSelector),
            clearBtnEl: document.querySelector(userConfig.clearBtnSelector),
            loadMoreBtnEl: document.querySelector(userConfig.loadMoreBtnSelector),
            shownCountEl: document.querySelector(userConfig.shownCountSelector),
            isPaginated: userConfig.isPaginated || false,
            initialCount: userConfig.initialCount || 3,
            incrementCount: userConfig.incrementCount || 3
        };

        this.state.allRepos = window.fallbackData?.githubRepos || [];
        this.filterAndRender(); 

        if (this.config.searchEl) this.config.searchEl.addEventListener('input', this.debounce(e => { this.state.currentFilter = e.target.value; this.filterAndRender(); }));
        if (this.config.clearBtnEl) this.config.clearBtnEl.addEventListener('click', () => { if (this.config.searchEl) this.config.searchEl.value = ''; this.state.currentFilter = ''; this.filterAndRender(); if (this.config.searchEl) this.config.searchEl.focus(); });
        if (this.config.loadMoreBtnEl && this.config.isPaginated) this.config.loadMoreBtnEl.addEventListener('click', () => { this.state.showingCount = Math.min(this.state.showingCount + this.config.incrementCount, this.state.filteredRepos.length); this.render(); });
        
        if (window.AppEvents) {
            window.AppEvents.on('languageChanged', this.reRenderWithCurrentLang.bind(this));
        }
    }
};

// =================================================================================
// MÓDULO: GOOGLE SCHOLAR E PUBLICAÇÕES (MODO FALLBACK/MANUAL)
// =================================================================================
const scholarScript = (function() {
    'use strict';
    const initialPubsToShow = 3;
    const pubsPerLoad = 3;
    let allArticles = [];
    let citationGraphData = [];
    let showingPubsCount = 0;
    let isIndexPage = false;
    let activeYearFilter = null;

    // Seus dados manuais para preencher se a API falhar ou para inicialização rápida
    // ATUALIZE SEUS NÚMEROS AQUI
    const myScholarStats = {
        citations: { all: 45, since2020: 42 },
        hIndex: { all: 4, since2020: 4 },
        i10Index: { all: 1, since2020: 1 },
        // Dados aproximados para o gráfico (Ano vs Citações)
        chartData: [
            { year: 2020, citations: 2, pubs: 1 },
            { year: 2021, citations: 5, pubs: 0 },
            { year: 2022, citations: 8, pubs: 0 },
            { year: 2023, citations: 12, pubs: 1 },
            { year: 2024, citations: 15, pubs: 1 },
            { year: 2025, citations: 3, pubs: 1 }
        ]
    };

    const UI = {
        citTotal: null, citPeriod: null,
        hTotal: null, hPeriod: null,
        i10Total: null, i10Period: null,
        scholarMetrics: null,
        chartContainer: null,
        pubsGrid: null,
        pubSearchInput: null,
        pubClearBtn: null,
        pubsShownCount: null,
        pubsLoadMoreBtn: null,
    };

    const normalizeTitle = (str) => str ? str.replace(/<[^>]+>/g, '').toLowerCase().trim() : '';

    function animateCountUp(el) {
        if (!el) return;
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) { el.textContent = el.dataset.target || '0'; return; }
        el.textContent = target.toLocaleString(); 
    }

    function setScholarMetrics() {
        // Usa dados manuais por padrão para evitar zeros
        UI.citTotal.dataset.target = myScholarStats.citations.all;
        UI.citPeriod.dataset.target = myScholarStats.citations.since2020;
        UI.hTotal.dataset.target = myScholarStats.hIndex.all;
        UI.hPeriod.dataset.target = myScholarStats.hIndex.since2020;
        UI.i10Total.dataset.target = myScholarStats.i10Index.all;
        UI.i10Period.dataset.target = myScholarStats.i10Index.since2020;
        citationGraphData = myScholarStats.chartData;
    }

    function startMetricsAnimation() {
        if(UI.scholarMetrics) UI.scholarMetrics.forEach(animateCountUp);
    }
    
    function renderPublications() {
        const grid = UI.pubsGrid;
        if (!grid) return;
        
        const trans = (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') ? translations[currentLang] : {};
        const searchFilter = (UI.pubSearchInput?.value || '').trim().toLowerCase();
        
        let baseList = activeYearFilter ? allArticles.filter(art => art.year === activeYearFilter.toString()) : allArticles;
        const filteredArticles = searchFilter ? baseList.filter(art => normalizeTitle(art.title).includes(searchFilter)) : baseList;

        const articlesToShow = filteredArticles.slice(0, showingPubsCount);
        grid.innerHTML = "";
        if (articlesToShow.length === 0) {
            grid.innerHTML = `<div class="card" style="grid-column: 1 / -1;"><p>${trans.no_pubs_found || 'Nenhuma publicação encontrada.'}</p></div>`;
        } else {
            articlesToShow.forEach(art => grid.appendChild(createPublicationCard(art)));
        }
        updateLoadMoreButton(articlesToShow.length, filteredArticles.length);
    }
    
    function createPublicationCard(art) {
        const card = document.createElement("div");
        card.className = "card publication-card";
        const trans = translations[currentLang] || {};
        
        const citationText = art.cited_by?.value ? `${trans['pub-cited-by'] || 'Citado'} ${art.cited_by.value} ${trans['pub-cited-by-times'] || 'vezes'}` : 'Nenhuma citação';
        const publishedText = `${trans['pub-published'] || 'Publicado'}: ${art.year} ${trans['pub-in'] || 'em'} <em>${art.journalTitle || 'N/A'}</em>`;
        const readText = trans['pub-read'] || 'Ler publicação';
        const doiHtml = art.doi ? `<div class="publication-doi"><a href="${art.doiLink}">DOI: ${art.doi}</a></div>` : '';
        
        card.innerHTML = `<h3>${art.title.replace(/<[^>]+>/g, '')}</h3> 
            ${doiHtml} 
            <p class="publication-meta">${publishedText}</p>
            <p class="citations">${citationText}</p>
            <a href="${art.link}" target="_blank" rel="noopener" class="publication-link">${readText}</a>`;
        return card;
    }

    function renderInteractiveChart(graphData) {
        const container = UI.chartContainer;
        if (!container || !window.Plotly) return;

        // Usa dados manuais se graphData estiver vazio
        const data = (graphData && graphData.length > 0) ? graphData : myScholarStats.chartData;

        const years = data.map(d => d.year);
        const citations = data.map(d => d.citations);

        const trace = {
            x: years,
            y: citations,
            type: 'bar',
            marker: { color: '#0D8ABC' } // Azul do tema
        };

        const layout = {
            title: 'Citações por Ano',
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#888' },
            margin: { t: 30, b: 30, l: 30, r: 10 },
            xaxis: { showgrid: false },
            yaxis: { showgrid: true, gridcolor: '#333' }
        };

        const config = { responsive: true, displayModeBar: false };
        Plotly.newPlot(container, [trace], layout, config);
    }
    
    function updateLoadMoreButton(shown, total) {
        const loadMoreBtn = UI.pubsLoadMoreBtn;
        if (loadMoreBtn) {
            loadMoreBtn.style.display = shown < total ? 'inline-block' : 'none';
        }
    }
    
    function attachEventListeners() {
        if (UI.pubSearchInput) {
            UI.pubSearchInput.addEventListener('input', () => {
                showingPubsCount = initialPubsToShow;
                renderPublications();
            });
        }
        if (UI.pubClearBtn) {
            UI.pubClearBtn.addEventListener('click', () => { 
                if(UI.pubSearchInput) UI.pubSearchInput.value = '';
                showingPubsCount = initialPubsToShow;
                renderPublications(); 
            });
        }
        if (UI.pubsLoadMoreBtn) {
            UI.pubsLoadMoreBtn.addEventListener('click', () => { 
                showingPubsCount += pubsPerLoad;
                renderPublications(); 
            });
        }
    }

    function init() {
        UI.citTotal = document.getElementById("cit-total");
        UI.citPeriod = document.getElementById("cit-period");
        UI.hTotal = document.getElementById("h-total");
        UI.hPeriod = document.getElementById("h-period");
        UI.i10Total = document.getElementById("i10-total");
        UI.i10Period = document.getElementById("i10-period");
        UI.scholarMetrics = document.querySelectorAll('.scholar-metrics .metric-value, .scholar-metrics .metric-value-period');
        UI.chartContainer = document.getElementById('interactive-scholar-chart-container');
        UI.pubsGrid = document.getElementById("publicacoes-grid");
        UI.pubSearchInput = document.getElementById('publication-search');
        UI.pubClearBtn = document.getElementById('publication-clear-btn');
        UI.pubsShownCount = document.getElementById('pubs-shown-count');
        UI.pubsLoadMoreBtn = document.getElementById('pubs-toggle-more');

        isIndexPage = !!UI.chartContainer;
        
        // Tenta pegar artigos do fallback ou usa lista vazia
        allArticles = window.fallbackData?.scholarData?.articles || [];
        showingPubsCount = isIndexPage ? initialPubsToShow : allArticles.length;
        
        attachEventListeners();
        renderPublications();

        if (isIndexPage) {
            setScholarMetrics();
            startMetricsAnimation();
            renderInteractiveChart(citationGraphData);
        }
        
        if (window.AppEvents) {
            window.AppEvents.on('languageChanged', () => {
                renderPublications();
                if(isIndexPage) renderInteractiveChart(citationGraphData);
            });
        }
    }
    
    return { init };
})();

// =================================================================================
// MÓDULO: GERADOR DE CV EM PDF
// =================================================================================
const CvPdfGenerator = {
    init() {
        const downloadButtons = document.querySelectorAll('[data-cv-type]');
        if (downloadButtons.length === 0) return;
        downloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const cvType = button.dataset.cvType; 
                if (button.hasAttribute('data-generating')) return;
                this.generateCvPdf(cvType, button); 
            });
        });
    },

    stripHtml(html) { 
        if (!html) return "";
        let doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    },

    async cropImageToCircle(imageDataUrl) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                const size = Math.min(img.width, img.height);
                canvas.width = size;
                canvas.height = size;
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                const sx = (img.width > size) ? (img.width - size) / 2 : 0;
                const sy = (img.height > size) ? (img.height - size) / 2 : 0;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
                
                // Borda
                const themeColor = '#0D8ABC';
                const borderWidth = size * 0.015; 
                ctx.lineWidth = borderWidth;
                ctx.strokeStyle = themeColor;
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, (size / 2) - (borderWidth / 2), 0, Math.PI * 2, true);
                ctx.stroke();

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.crossOrigin = "anonymous"; 
            img.src = imageDataUrl;
        });
    },
    
    async generateCvPdf(cvType, clickedButton) {
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'pt';
        const langContent = translations[lang] || translations['pt'];
        const pdfStrings = langContent.pdf || {};
        const toast = document.getElementById('toast-notification');
        const originalButtonHTML = clickedButton.innerHTML; 

        clickedButton.setAttribute('data-generating', 'true');
        clickedButton.innerHTML = `<span>${langContent['cv-generating'] || 'Gerando PDF...'}</span>`;
        clickedButton.style.pointerEvents = 'none';

        try {
            if (typeof window.jspdf === 'undefined') throw new Error('jsPDF não carregado.');
            const { jsPDF } = window.jspdf;
            const themeColor = '#0D8ABC'; // Azul Quantum Master

            const doc = new jsPDF('p', 'pt', 'a4');
            const page_width = doc.internal.pageSize.getWidth();
            const margin = 40;
            const max_width = page_width - margin * 2;
            let y = margin;
            const item_gap = 12; 
            const section_gap = 20; 

            const checkPageBreak = (neededHeight) => { 
                if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    y = margin;
                 }
            };

             let avatarDataUrl = null;
             try {
                const avatarImg = document.querySelector('.avatar') || document.querySelector('.nav-avatar'); 
                if (avatarImg && avatarImg.src) {
                    let rawDataUrl;
                    if (avatarImg.src.startsWith('data:image')) {
                        rawDataUrl = avatarImg.src;
                    } else {
                         const imageUrl = avatarImg.src.startsWith('http') ? `https://corsproxy.io/?${encodeURIComponent(avatarImg.src)}` : avatarImg.src;
                         const response = await fetch(imageUrl);
                         const blob = await response.blob();
                         rawDataUrl = await new Promise((resolve) => {
                             const reader = new FileReader();
                             reader.onloadend = () => resolve(reader.result);
                             reader.readAsDataURL(blob);
                         });
                    }
                    if (rawDataUrl) avatarDataUrl = await this.cropImageToCircle(rawDataUrl);
                }
             } catch (e) { console.warn("Avatar não carregado para PDF"); }

            // CABEÇALHO
            const avatarSize = 100;
            if (avatarDataUrl) {
                doc.addImage(avatarDataUrl, 'PNG', margin, y, avatarSize, avatarSize); 
            }
            
            const xPadding = 15;
            const headerX = avatarDataUrl ? margin + avatarSize + xPadding : margin; 
            const headerW = avatarDataUrl ? max_width - (avatarSize + xPadding) : max_width; 

            // TÍTULOS
            doc.setFontSize(20).setFont('helvetica', 'bold').setTextColor(0).text('Dr. Israel C. Ribeiro', headerX, y + 20, { maxWidth: headerW });
            doc.setFontSize(12).setFont('helvetica', 'normal').setTextColor(themeColor).text('CEO & Fundador | Químico Computacional', headerX, y + 38, { maxWidth: headerW });
            
            doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(80);
            doc.text(`Email: israelribeiroc7@gmail.com`, headerX, y + 60); 
            doc.text(`LinkedIn: https://www.linkedin.com/in/israel-ribeiro1/`, headerX, y + 72); 
            const locationLabel = (lang === 'pt') ? 'Localização:' : 'Location:';
            doc.text(`${locationLabel} Mons, Belgium`, headerX, y + 84); 

            const finalYIncrement = avatarDataUrl ? avatarSize + 25 : 100;
            y += finalYIncrement + item_gap; 

            // AUXILIAR DE SEÇÃO
             const addSectionTitle = (title) => {
                 y += section_gap; 
                 checkPageBreak(30); 
                 doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor('#0f172a');
                 doc.text(title.toUpperCase(), margin, y);
                 y += 6;
                 doc.setLineWidth(0.5); 
                 doc.setDrawColor(themeColor);
                 doc.line(margin, y, page_width - margin, y);
                 y += 15; 
             };

            // AUXILIAR DE TEXTO
            const addJustifiedText = (content, options = {}) => { 
                 const { fontSize = 9, x = margin, width = max_width, color = 80, lineHeightFactor = 1.15 } = options; 
                 if (!content) return;
                 doc.setFontSize(fontSize).setFont('helvetica', 'normal').setTextColor(color);
                 const cleanedContent = this.stripHtml(content).replace(/\s+/g, ' ').trim();
                 const lines = doc.splitTextToSize(cleanedContent, width);
                 const textHeight = lines.length * (fontSize * lineHeightFactor);
                 checkPageBreak(textHeight);
                 doc.text(lines, x, y, { align: 'justify', maxWidth: width, lineHeightFactor: lineHeightFactor });
                 y += textHeight + 5; 
             };

            // --- CONTEÚDO DO PDF ---

            // 1. SOBRE
            addSectionTitle(pdfStrings['about-title'] || 'SOBRE MIM');
            addJustifiedText(langContent['about-p1']);
            if (cvType !== 'pro') { // Mais detalhes no acadêmico
                addJustifiedText(langContent['about-p2']);
                addJustifiedText(langContent['about-p3']);
            }

            // 2. FORMAÇÃO ACADÊMICA (ORDEM CORRIGIDA)
            addSectionTitle(pdfStrings['education-title'] || 'FORMAÇÃO ACADÊMICA');
            
            // Array ordenado conforme solicitado
            const educationData = [
                { type: 'entry', date: 'edu-date-pd', title: 'edu-title-pd', institution: 'Université de Mons (UMONS), Bélgica', advisor: 'edu-advisor-pd', details: 'edu-desc-pd' },
                { type: 'entry', date: 'edu-date2', title: 'edu-title2', institution: 'Universidade de São Paulo (USP)', advisor: 'edu-advisor2', details: 'edu-desc2' },
                { type: 'entry', date: 'edu-date1', title: 'edu-title1', institution: 'Universidade de São Paulo (USP)', advisor: 'edu-advisor1', details: 'edu-desc1' },
                { type: 'entry', date: 'edu-date7', title: 'edu-title7', institution: 'Universidade Federal de São João del-Rei (UFSJ)', advisor: 'edu-advisor7', details: 'edu-desc7' },
                { type: 'entry', date: null, title: 'edu-title-tec', institution: 'Centro de Ensino Profissionalizante (CENEP)', advisor: '', details: 'edu-desc-tec', year: 'Concluído' }
            ];

            educationData.forEach((item) => {
                // Filtra Técnico se for CV Profissional (opcional, mas mantém foco)
                if (cvType === 'pro' && item.title === 'edu-title-tec') return;

                checkPageBreak(60);
                const title = langContent[item.title] || item.title;
                const date = item.year ? item.year : (langContent[item.date] || '');
                const advisorHTML = langContent[item.advisor] || '';
                const details = langContent[item.details] || '';

                doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(40).text(title, margin, y);
                doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(100).text(date, page_width - margin, y, { align: 'right' });
                y += 12;
                doc.setFontSize(9).setFont('helvetica', 'italic').setTextColor(80).text(item.institution, margin, y);
                y += 12;

                if (advisorHTML) {
                    doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(100);
                    doc.text(this.stripHtml(advisorHTML), margin, y);
                    y += 12;
                }
                
                if (details && cvType !== 'pro') {
                    addJustifiedText(details, { fontSize: 8, width: max_width });
                }
                y += item_gap;
            });

            // 3. HABILIDADES
            addSectionTitle(pdfStrings['skills-title'] || 'HABILIDADES');
            const skillKeys = ['skill-name-vasp', 'skill-name-qe', 'skill-name-python', 'skill-name-ml', 'skill-name-xrd'];
            const skills = skillKeys.map(key => `• ${langContent[key] || key}`);
            if (skills.length > 0) {
                 doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(80); 
                 doc.text(skills.join('   '), margin, y, { maxWidth: max_width });
                 y += 20;
            }

            // 4. PROJETOS
            addSectionTitle(pdfStrings['projects-title'] || 'PROJETOS');
            const repos = GithubReposModule.state?.allRepos || [];
            repos.slice(0, 3).forEach(repo => {
                 checkPageBreak(40);
                 const repoTitle = `• ${GithubReposModule.titleCase(repo.name)}`;
                 doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(themeColor);
                 doc.text(repoTitle, margin, y);
                 y += 12;
                 addJustifiedText(repo.description || 'Sem descrição.', { x: margin + 8, width: max_width - 8, fontSize: 9 });
                 y += 5;
            });

            // SAVE
            const fileNameKey = cvType === 'pro' ? 'cv-file-name-pro' : 'cv-file-name-academic';
            const finalName = langContent[fileNameKey] || `CV-Israel_Ribeiro_${cvType}.pdf`;
            doc.save(finalName);

        } catch (error) {
            console.error('Erro PDF:', error);
            if (toast) toast.textContent = 'Erro ao gerar PDF.';
        } finally {
            clickedButton.innerHTML = originalButtonHTML;
            clickedButton.style.pointerEvents = 'auto';
            clickedButton.removeAttribute('data-generating'); 
        }
    }
};

// =================================================================================
// Módulo: Copiar para a Área de Transferência
// =================================================================================
const ClipboardCopier = {
    init() {
        const emailToCopy = 'israelribeiroc7@gmail.com';
        const triggers = [document.getElementById('copy-email-link'), document.getElementById('copy-email-footer')];
        triggers.forEach(trigger => {
            if (trigger) {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    this.copyToClipboard(emailToCopy);
                });
            }
        });
    },
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => this.showToast(`Email copiado!`));
    },
    showToast(message) {
        const toast = document.getElementById('toast-notification');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
};

// =================================================================================
// MÓDULO DE TRADUÇÃO E ESTADO GLOBAL
// =================================================================================
const LanguageManager = {
    currentLang: 'pt',
    _events: {},
    emitter: {
        on: (event, callback) => {
            if (!LanguageManager._events[event]) LanguageManager._events[event] = [];
            LanguageManager._events[event].push(callback);
        },
        emit: (event, data) => {
            if (!LanguageManager._events[event]) return;
            LanguageManager._events[event].forEach(callback => callback(data));
        }
    },
    init() {
        window.AppEvents = { on: this.emitter.on.bind(this.emitter) };
        Promise.all([
            fetch('translations.json').then(r => r.json()),
            fetch('fallback-data.json').then(r => r.json())
        ]).then(([translationsData, fallbackData]) => {
            window.translations = translationsData;
            window.fallbackData = fallbackData;
            this.setLanguage(this.currentLang);
            initializePageComponents();
        }).catch(error => console.error("Erro ao carregar JSONs:", error));
    },
    toggleLanguage() {
        const newLang = this.currentLang === 'pt' ? 'en' : 'pt';
        this.setLanguage(newLang);
    },
    setLanguage(lang) {
        if (!translations[lang]) return;
        this.currentLang = lang;
        window.currentLang = lang; 
        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
        this._updateTextContent(lang);
        this._updateLanguageSwitcherUI(lang);
        this.emitter.emit('languageChanged', this.currentLang);
    },
    _updateTextContent(lang) {
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.dataset.key;
            if (translations[lang][key]) el.innerHTML = translations[lang][key];
        });
        document.querySelectorAll('[data-key-placeholder]').forEach(el => {
            el.placeholder = translations[lang][el.dataset.keyPlaceholder] || '';
        });
    },
    _updateLanguageSwitcherUI(lang) {
        const isPt = lang === 'pt';
        document.querySelectorAll('.lang-switcher span').forEach(span => {
            span.classList.remove('active');
            if ((isPt && span.classList.contains('lang-pt')) || (!isPt && span.classList.contains('lang-en'))) {
                span.classList.add('active');
            }
        });
    }
};

window.toggleLanguage = () => LanguageManager.toggleLanguage();

// =================================================================================
// Inicialização
// =================================================================================
function initializePageComponents() {
    ParticleBackground.init();
    MobileNavHandler.init();
    PageSetup.init(); 
    ClipboardCopier.init();
    ContactForm.init();
    CvPdfGenerator.init();
    scholarScript.init();
    
    // Github
    if (document.getElementById('projects-list')) {
        GithubReposModule.init({
            listSelector: '#projects-list',
            metaSelector: '#projects-meta',
            searchSelector: '#project-search',
            clearBtnSelector: '#clear-btn',
            loadMoreBtnSelector: '#toggle-more',
            shownCountSelector: '#shown-count',
            isPaginated: !!document.getElementById('toggle-more'),
            initialCount: 3
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    LanguageManager.init();
});
