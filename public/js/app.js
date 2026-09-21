/**
 * Application Main Module
 * Handles application logic and event bindings
 */

const App = (function() {
    'use strict';

    // Application State
    const state = {
        currentTab: 'mood',
        contentType: 'both',
        selectedMood: null,
        selectedGenre: null,
        historyFilter: 'all',
        isLoading: false
    };

    /**
     * Get current selection based on active tab
     */
    const getCurrentSelection = () => {
        const activeTab = state.currentTab;
        
        if (activeTab === 'mood') {
            // Check for text input first
            const textInput = UI.elements.moodInput.value.trim();
            if (textInput) {
                return { type: 'description', value: textInput };
            }
            // Then check for button selection
            if (state.selectedMood) {
                return { type: 'mood', value: state.selectedMood };
            }
        } else {
            // Check for text input first
            const textInput = UI.elements.genreInput.value.trim();
            if (textInput) {
                return { type: 'description', value: textInput };
            }
            // Then check for button selection
            if (state.selectedGenre) {
                return { type: 'genre', value: state.selectedGenre };
            }
        }

        return null;
    };

    /**
     * Handle search action
     */
    const handleSearch = async () => {
        const selection = getCurrentSelection();

        if (!selection) {
            UI.showToast('Selecione um humor, gênero ou descreva o que procura.', 'error');
            return;
        }

        if (state.isLoading) return;

        state.isLoading = true;
        UI.showLoading();

        try {
            const results = await API.getRecommendations(
                selection.type,
                selection.value,
                state.contentType
            );

            // queryText para salvar no histórico
            const queryText = selection.type === 'description' 
                ? selection.value 
                : (Config.MOOD_MAP[selection.value] || Config.GENRE_MAP[selection.value] || selection.value);
            
            // Salva no histórico quando os posters chegarem (com posterUrl preenchido)
            // Usa { once: true } para não acumular listeners
            document.addEventListener('postersReadyForStorage', (e) => {
                Storage.saveToHistory(queryText, state.contentType, e.detail);
            }, { once: true });

            UI.showResults(results);
            UI.showToast('Recomendações encontradas!', 'success');

        } catch (error) {
            console.error('Search error:', error);
            UI.hideLoading();
            UI.showToast(
                error.message || 'Erro ao buscar recomendações. Tente novamente.',
                'error'
            );
        } finally {
            state.isLoading = false;
        }
    };

    /**
     * Handle reset action
     */
    const handleReset = () => {
        state.selectedMood = null;
        state.selectedGenre = null;
        UI.clearSelections();
        UI.hideResults();
    };

    /**
     * Load and render history
     */
    const loadHistory = () => {
        const history = Storage.filterHistory(state.historyFilter);
        UI.renderHistory(history);
    };

    /**
     * Initialize event listeners
     */
    const initEventListeners = () => {
        // Navigation
        UI.elements.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                UI.switchSection(section);
                
                if (section === 'history') {
                    loadHistory();
                }
            });
        });

        // Content Type
        UI.elements.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                state.contentType = btn.dataset.type;
                UI.setContentType(state.contentType);
            });
        });

        // Tabs
        UI.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentTab = btn.dataset.tab;
                UI.switchTab(state.currentTab);
            });
        });

        // Mood Options
        UI.elements.moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                state.selectedMood = btn.dataset.mood;
                UI.selectOption(btn, 'mood');
                UI.elements.moodInput.value = '';
            });
        });

        // Genre Options
        UI.elements.genreBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                state.selectedGenre = btn.dataset.genre;
                UI.selectOption(btn, 'genre');
                UI.elements.genreInput.value = '';
            });
        });

        // Text Inputs - clear button selections when typing
        UI.elements.moodInput.addEventListener('input', () => {
            if (UI.elements.moodInput.value.trim()) {
                state.selectedMood = null;
                UI.elements.moodBtns.forEach(btn => btn.classList.remove('selected'));
            }
        });

        UI.elements.genreInput.addEventListener('input', () => {
            if (UI.elements.genreInput.value.trim()) {
                state.selectedGenre = null;
                UI.elements.genreBtns.forEach(btn => btn.classList.remove('selected'));
            }
        });

        // Enter key on inputs
        UI.elements.moodInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });

        UI.elements.genreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });

        // Action Buttons
        UI.elements.btnSearch.addEventListener('click', handleSearch);
        UI.elements.btnReset.addEventListener('click', handleReset);
        UI.elements.btnRetry.addEventListener('click', handleReset);

        // History
        UI.elements.btnClearHistory.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
                Storage.clearHistory();
                loadHistory();
                UI.showToast('Histórico limpo com sucesso.', 'success');
            }
        });

        UI.elements.btnGoHome.addEventListener('click', () => {
            UI.switchSection('home');
            UI.elements.navBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.section === 'home');
            });
        });

        // History Filters
        UI.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                state.historyFilter = btn.dataset.filter;
                UI.setHistoryFilter(state.historyFilter);
                loadHistory();
            });
        });
    };

    /**
     * Initialize the application
     */
    const init = () => {
        initEventListeners();
        
        // Initial setup
        UI.switchSection('home');
        UI.switchTab('mood');
        UI.setContentType('both');

        console.log('🎬 Cinema Inteligente initialized');
    };

    // Public API
    return {
        init
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
