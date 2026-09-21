/**
 * UI Module
 * Handles all DOM manipulation and UI updates
 */

const UI = (function() {
    'use strict';

    // Ícones e cores por plataforma
    const PLATFORM_STYLES = {
        'Netflix':      { icon: '🔴', color: '#E50914', bg: 'rgba(229,9,20,0.15)' },
        'Prime Video':  { icon: '🔵', color: '#00A8E1', bg: 'rgba(0,168,225,0.15)' },
        'Disney+':      { icon: '🔷', color: '#113CCF', bg: 'rgba(17,60,207,0.15)' },
        'Max':          { icon: '🟣', color: '#5822B4', bg: 'rgba(88,34,180,0.15)' },
        'Globoplay':    { icon: '🟠', color: '#F26522', bg: 'rgba(242,101,34,0.15)' },
        'Apple TV+':    { icon: '⚫', color: '#A2AAAD', bg: 'rgba(162,170,173,0.15)' },
        'Paramount+':   { icon: '🔵', color: '#0064FF', bg: 'rgba(0,100,255,0.15)' },
        'Crunchyroll':  { icon: '🟠', color: '#F47521', bg: 'rgba(244,117,33,0.15)' },
        'Mubi':         { icon: '🟤', color: '#A0522D', bg: 'rgba(160,82,45,0.15)' },
        'Star+':        { icon: '⭐', color: '#6EC1E4', bg: 'rgba(110,193,228,0.15)' },
        'YouTube':      { icon: '▶️', color: '#FF0000', bg: 'rgba(255,0,0,0.15)' },
        'Google Play':  { icon: '▶️', color: '#34A853', bg: 'rgba(52,168,83,0.15)' },
        'iTunes':       { icon: '🎵', color: '#FC3C44', bg: 'rgba(252,60,68,0.15)' },
        'Claro tv+':    { icon: '🔴', color: '#E4002B', bg: 'rgba(228,0,43,0.15)' }
    };

    // Cache de resultados atuais para atualizar posters
    let currentResults = [];

    // DOM Elements Cache
    const elements = {
        navBtns: document.querySelectorAll('.nav-btn'),
        sections: {
            home: document.getElementById('home-section'),
            history: document.getElementById('history-section')
        },
        typeBtns: document.querySelectorAll('.type-btn'),
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: {
            mood: document.getElementById('mood-tab'),
            genre: document.getElementById('genre-tab')
        },
        moodBtns: document.querySelectorAll('[data-mood]'),
        genreBtns: document.querySelectorAll('[data-genre]'),
        moodInput: document.getElementById('mood-description'),
        genreInput: document.getElementById('genre-description'),
        btnSearch: document.getElementById('btn-search'),
        btnReset: document.getElementById('btn-reset'),
        btnRetry: document.getElementById('btn-retry'),
        btnClearHistory: document.getElementById('btn-clear-history'),
        btnGoHome: document.getElementById('btn-go-home'),
        resultsSection: document.getElementById('results-section'),
        resultsGrid: document.getElementById('results-grid'),
        loadingSection: document.getElementById('loading-section'),
        historyList: document.getElementById('history-list'),
        emptyHistory: document.getElementById('empty-history'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        toastContainer: document.getElementById('toast-container')
    };

    /**
     * Escuta evento de posters carregados e atualiza imagens
     */
    document.addEventListener('postersLoaded', (e) => {
        const enriched = e.detail;
        enriched.forEach((item, index) => {
            if (item.posterUrl) {
                const posterEl = document.querySelector(`.result-card[data-index="${index}"] .result-poster-img`);
                if (posterEl) {
                    posterEl.src = item.posterUrl;
                    posterEl.classList.remove('poster-loading');
                }
            }
        });
    });

    /**
     * Show a toast notification
     */
    const showToast = (message, type = 'info') => {
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Fechar">×</button>
        `;

        elements.toastContainer.appendChild(toast);
        toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
        setTimeout(() => removeToast(toast), Config.APP_SETTINGS.toastDuration);
    };

    const removeToast = (toast) => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    };

    /**
     * Switch between sections
     */
    const switchSection = (sectionName) => {
        elements.navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionName);
        });
        Object.entries(elements.sections).forEach(([name, section]) => {
            section.classList.toggle('active', name === sectionName);
        });
    };

    /**
     * Switch between tabs
     */
    const switchTab = (tabName) => {
        elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        Object.entries(elements.tabContents).forEach(([name, content]) => {
            content.classList.toggle('active', name === tabName);
        });
    };

    /**
     * Set content type
     */
    const setContentType = (type) => {
        elements.typeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    };

    /**
     * Select an option
     */
    const selectOption = (btn, group) => {
        const allBtns = group === 'mood' ? elements.moodBtns : elements.genreBtns;
        allBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    };

    /**
     * Clear all selections
     */
    const clearSelections = () => {
        elements.moodBtns.forEach(btn => btn.classList.remove('selected'));
        elements.genreBtns.forEach(btn => btn.classList.remove('selected'));
        elements.moodInput.value = '';
        elements.genreInput.value = '';
    };

    /**
     * Show loading state
     */
    const showLoading = () => {
        elements.loadingSection.classList.remove('hidden');
        elements.resultsSection.classList.add('hidden');
        elements.btnSearch.disabled = true;
    };

    /**
     * Hide loading state
     */
    const hideLoading = () => {
        elements.loadingSection.classList.add('hidden');
        elements.btnSearch.disabled = false;
    };

    /**
     * Gera placeholder de poster com gradiente baseado no título
     */
    const getPosterPlaceholder = (title, type) => {
        const colors = [
            ['#1a1a2e', '#16213e'], ['#0d0d0d', '#1a0000'],
            ['#0a0a1a', '#000d1a'], ['#1a0a00', '#1a1000'],
            ['#0d001a', '#1a001a'], ['#001a0d', '#001a1a']
        ];
        const idx = title.charCodeAt(0) % colors.length;
        const [c1, c2] = colors[idx];
        const icon = type === 'series' ? '📺' : '🎬';
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
                <defs>
                    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${c1}"/>
                        <stop offset="100%" style="stop-color:${c2}"/>
                    </linearGradient>
                </defs>
                <rect width="300" height="450" fill="url(#g)"/>
                <text x="150" y="200" text-anchor="middle" font-size="64">${icon}</text>
                <text x="150" y="270" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="14" font-weight="bold">${title.substring(0,20)}</text>
            </svg>
        `)}`;
    };

    /**
     * Gera HTML dos badges de plataforma
     */
    const renderPlatformBadges = (platforms) => {
        if (!platforms || platforms.length === 0) {
            return `<div class="platforms-section">
                <span class="platforms-label">📍 Onde assistir</span>
                <div class="platforms-list">
                    <span class="platform-badge platform-unavailable">Não disponível em streaming</span>
                </div>
            </div>`;
        }

        const badges = platforms.map(p => {
            const style = PLATFORM_STYLES[p.name] || { icon: '▶️', color: '#888', bg: 'rgba(136,136,136,0.15)' };
            const badgeStyle = `background:${style.bg};border-color:${style.color};color:${style.color}`;

            if (p.url) {
                return `<a href="${p.url}" target="_blank" rel="noopener noreferrer" 
                    class="platform-badge platform-link" style="${badgeStyle}" title="Buscar no ${p.name}">
                    ${style.icon} ${escapeHtml(p.name)}
                    <span class="platform-arrow">↗</span>
                </a>`;
            }
            return `<span class="platform-badge" style="${badgeStyle}">${style.icon} ${escapeHtml(p.name)}</span>`;
        }).join('');

        return `<div class="platforms-section">
            <span class="platforms-label">📍 Onde assistir</span>
            <div class="platforms-list">${badges}</div>
        </div>`;
    };

    /**
     * Render quiz button for a result card
     */
    const renderQuizButton = (item) => {
        const isNew = !Quiz.hasSeenFeature();
        const newBadge = isNew ? `<span class="quiz-new-badge">NOVO</span>` : '';
        return `
            <button 
                class="quiz-trigger-btn" 
                data-quiz-title="${escapeHtml(item.title)}"
                data-quiz-type="${item.type}"
                data-quiz-year="${item.year}"
                title="Testar sua atenção após assistir">
                🧠 Fazer o Quiz ${newBadge}
            </button>`;
    };

    /**
     * Render a single result card
     */
    const createResultCard = (item, index) => {
        const typeLabel = item.type === 'series' ? 'Série' : 'Filme';
        const typeIcon = item.type === 'series' ? '📺' : '🎥';
        const placeholder = getPosterPlaceholder(item.title, item.type);
        const posterSrc = item.posterUrl || placeholder;
        
        return `
            <article class="result-card" data-index="${index}">
                <div class="result-poster-wrapper">
                    <img 
                        class="result-poster-img ${item.posterUrl ? '' : 'poster-loading'}" 
                        src="${posterSrc}" 
                        alt="Poster de ${escapeHtml(item.title)}"
                        loading="lazy"
                        onerror="this.src='${placeholder}'"
                    />
                    <div class="result-poster-overlay">
                        <span class="result-type-badge ${item.type}">
                            ${typeIcon} ${typeLabel}
                        </span>
                        <span class="match-score-overlay">
                            ⭐ ${item.matchScore}%
                        </span>
                    </div>
                </div>
                <div class="result-card-body">
                    <h3 class="result-title">${escapeHtml(item.title)}</h3>
                    <div class="result-meta">
                        <span class="result-meta-item">📅 ${item.year}</span>
                        <span class="result-meta-item">⏱️ ${item.duration}</span>
                        <span class="result-meta-item">⭐ ${item.rating.toFixed(1)}</span>
                    </div>
                    <div class="result-genres">
                        ${item.genres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')}
                    </div>
                    <div class="result-reason">
                        <span class="result-reason-label">💡 Por que assistir</span>
                        <p class="result-reason-text">${escapeHtml(item.reason)}</p>
                    </div>
                    ${renderPlatformBadges(item.platforms)}
                    ${renderQuizButton(item)}
                </div>
            </article>
        `;
    };

    /**
     * Bind quiz buttons inside a container
     */
    const bindQuizButtons = (container) => {
        container.querySelectorAll('.quiz-trigger-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const title = btn.dataset.quizTitle;
                const type  = btn.dataset.quizType;
                const year  = parseInt(btn.dataset.quizYear) || 2020;
                Quiz.startQuizFlow(title, type, year);
            });
        });
    };

    /**
     * Display results
     */
    const showResults = (results) => {
        currentResults = results;
        hideLoading();
        elements.resultsGrid.innerHTML = results.map((item, i) => createResultCard(item, i)).join('');
        bindQuizButtons(elements.resultsGrid);
        elements.resultsSection.classList.remove('hidden');
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /**
     * Hide results
     */
    const hideResults = () => {
        elements.resultsSection.classList.add('hidden');
        elements.resultsGrid.innerHTML = '';
        currentResults = [];
    };

    /**
     * Render history list
     */
    const renderHistory = (history) => {
        if (history.length === 0) {
            elements.historyList.innerHTML = '';
            elements.emptyHistory.classList.remove('hidden');
            return;
        }

        elements.emptyHistory.classList.add('hidden');
        const groupedHistory = groupByDate(history);
        
        elements.historyList.innerHTML = Object.entries(groupedHistory)
            .map(([date, entries]) => `
                <div class="history-group">
                    <div class="history-date">📅 ${date}</div>
                    ${entries.map(entry => `
                        <div class="history-query">🔍 "${escapeHtml(entry.query)}"</div>
                        <div class="history-items">
                            ${entry.results.map((item, idx) => createHistoryItem(item, `${entry.id}-${idx}`)).join('')}
                        </div>
                    `).join('')}
                </div>
            `).join('');

        bindQuizButtons(elements.historyList);

        // Buscar posters para itens sem imagem
        history.forEach(entry => {
            entry.results.forEach((item, idx) => {
                if (!item.posterUrl) {
                    const key = `${entry.id}-${idx}`;
                    API.enrichWithPosters([item]).then(enriched => {
                        if (enriched[0] && enriched[0].posterUrl) {
                            const imgEl = document.querySelector(`.history-poster[data-key="${key}"]`);
                            if (imgEl) {
                                imgEl.src = enriched[0].posterUrl;
                            }
                        }
                    }).catch(() => {});
                }
            });
        });
    };

    /**
     * Create a history item card
     */
    const createHistoryItem = (item, key) => {
        const typeLabel = item.type === 'series' ? 'Série' : 'Filme';
        const typeIcon = item.type === 'series' ? '📺' : '🎥';
        const placeholder = getPosterPlaceholder(item.title, item.type);

        const platformsHtml = item.platforms && item.platforms.length > 0
            ? item.platforms.slice(0, 3).map(p => {
                const style = PLATFORM_STYLES[p.name] || { icon: '▶️', color: '#888', bg: 'rgba(136,136,136,0.15)' };
                if (p.url) {
                    return `<a href="${p.url}" target="_blank" rel="noopener noreferrer" class="platform-badge platform-badge-sm platform-link" style="background:${style.bg};border-color:${style.color};color:${style.color}">${style.icon} ${escapeHtml(p.name)}</a>`;
                }
                return `<span class="platform-badge platform-badge-sm" style="background:${style.bg};border-color:${style.color};color:${style.color}">${style.icon} ${escapeHtml(p.name)}</span>`;
            }).join('')
            : '';

        return `
            <div class="history-item" data-type="${item.type}">
                <div class="history-item-inner">
                    <img 
                        class="history-poster" 
                        data-key="${key || ''}"
                        src="${item.posterUrl || placeholder}" 
                        alt="${escapeHtml(item.title)}"
                        onerror="this.src='${placeholder}'"
                    />
                    <div class="history-item-content">
                        <div class="history-item-header">
                            <h4 class="history-item-title">${escapeHtml(item.title)}</h4>
                            <span class="result-type-badge ${item.type}">${typeIcon} ${typeLabel}</span>
                        </div>
                        <div class="history-item-meta">
                            <span>📅 ${item.year}</span>
                            <span>⭐ ${item.rating.toFixed(1)}</span>
                            <span>✨ ${item.matchScore}%</span>
                        </div>
                        ${platformsHtml ? `<div class="history-platforms">${platformsHtml}</div>` : ''}
                        <p class="history-item-reason">${escapeHtml(item.reason)}</p>
                        <button 
                            class="quiz-trigger-btn" 
                            data-quiz-title="${escapeHtml(item.title)}"
                            data-quiz-type="${item.type}"
                            data-quiz-year="${item.year}"
                            style="margin-top:8px">
                            🧠 Fazer o Quiz
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Group history by date
     */
    const groupByDate = (history) => {
        const groups = {};
        history.forEach(entry => {
            const date = new Date(entry.timestamp);
            const dateKey = formatDate(date);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(entry);
        });
        return groups;
    };

    const formatDate = (date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (isSameDay(date, today)) return 'Hoje';
        if (isSameDay(date, yesterday)) return 'Ontem';
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getFullYear() === d2.getFullYear();
    };

    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    };

    const setHistoryFilter = (filter) => {
        elements.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    };

    // Public API
    return {
        elements,
        showToast,
        switchSection,
        switchTab,
        setContentType,
        selectOption,
        clearSelections,
        showLoading,
        hideLoading,
        showResults,
        hideResults,
        renderHistory,
        setHistoryFilter
    };
})();
