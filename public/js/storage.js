/**
 * Storage Module
 * Handles localStorage operations for history persistence
 */

const Storage = (function() {
    'use strict';

    const HISTORY_KEY = 'cinema_inteligente_history';

    /**
     * Get all history items
     */
    const getHistory = () => {
        try {
            const data = localStorage.getItem(HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading history:', error);
            return [];
        }
    };

    /**
     * Save a new recommendation to history
     */
    const saveToHistory = (query, contentType, results) => {
        try {
            const history = getHistory();
            
            const entry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                query: query,
                contentType: contentType,
                results: results
            };

            history.unshift(entry);

            // Limit history size
            if (history.length > Config.APP_SETTINGS.historyLimit) {
                history.pop();
            }

            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Error saving to history:', error);
            return false;
        }
    };

    /**
     * Clear all history
     */
    const clearHistory = () => {
        try {
            localStorage.removeItem(HISTORY_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    };

    /**
     * Delete a specific history entry
     */
    const deleteHistoryEntry = (id) => {
        try {
            const history = getHistory();
            const filtered = history.filter(entry => entry.id !== id);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting history entry:', error);
            return false;
        }
    };

    /**
     * Filter history by content type
     */
    const filterHistory = (type) => {
        const history = getHistory();
        
        if (type === 'all') {
            return history;
        }

        return history.map(entry => ({
            ...entry,
            results: entry.results.filter(item => item.type === type)
        })).filter(entry => entry.results.length > 0);
    };

    // Public API
    return {
        getHistory,
        saveToHistory,
        clearHistory,
        deleteHistoryEntry,
        filterHistory
    };
})();
