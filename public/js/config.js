/**
 * Configuration Module
 * Configurações públicas da aplicação.
 *
 * IMPORTANTE: a chave da API da Groq NÃO fica mais aqui.
 * Ela mora no servidor (arquivo .env), em GROQ_API_KEY.
 * O front-end fala com o nosso próprio servidor em /api/chat,
 * e é o servidor quem conversa com a Groq usando a chave secreta.
 * O modelo de IA também é definido no servidor (variável GROQ_MODEL).
 */

const Config = (function() {
    'use strict';

    // Endpoint do NOSSO servidor (não é mais a Groq direto).
    // O servidor (server.js) recebe essa chamada e repassa pra Groq
    // usando a chave que está guardada no .env, fora do alcance do navegador.
    const API_CONFIG = {
        baseUrl: '/api/chat',
        maxTokens: 4096,
        temperature: 0.7
    };

    // Application Settings
    const APP_SETTINGS = {
        maxResults: 6,
        historyLimit: 50,
        toastDuration: 4000,
        debounceDelay: 300
    };

    // Mood mappings (Portuguese)
    const MOOD_MAP = {
        happy: 'feliz',
        sad: 'triste',
        angry: 'com raiva',
        anxious: 'ansioso',
        romantic: 'romântico',
        bored: 'entediado',
        inspired: 'inspirado',
        thoughtful: 'pensativo'
    };

    // Genre mappings (Portuguese)
    const GENRE_MAP = {
        comedy: 'comédia',
        action: 'ação',
        horror: 'terror',
        romance: 'romance',
        scifi: 'ficção científica',
        drama: 'drama',
        animation: 'animação',
        thriller: 'suspense',
        documentary: 'documentário',
        fantasy: 'fantasia'
    };

    // Public API
    return {
        API_CONFIG,
        APP_SETTINGS,
        MOOD_MAP,
        GENRE_MAP
    };
})();
