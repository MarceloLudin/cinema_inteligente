/**
 * Lógica compartilhada do "porteiro" da Groq.
 * Usada tanto pelo server.js (Express / Render / local)
 * quanto pela function do Netlify (netlify/functions/chat.mjs).
 * Assim os dois se comportam igual e só existe UM lugar para mexer.
 */
'use strict';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const PLACEHOLDER_KEY = 'cole_sua_chave_aqui';
const GROQ_TIMEOUT_MS = 25 * 1000;

const resolveModel = (value) => (value || '').trim() || DEFAULT_MODEL;

const isKeyConfigured = (key) => {
    const k = (key || '').trim();
    return k !== '' && k !== PLACEHOLDER_KEY;
};

const clamp = (value, min, max, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const validateMessages = (messages) =>
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= 6 &&
    messages.every(m =>
        m && ['system', 'user', 'assistant'].includes(m.role) &&
        typeof m.content === 'string' && m.content.length <= 8000
    );

// O MODELO é decidido no servidor, nunca pelo navegador.
const buildPayload = (body, model) => {
    const payload = {
        model,
        messages: body.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: clamp(body.temperature, 0, 1.5, 0.7),
        max_tokens: clamp(body.max_tokens, 256, 8192, 4096)
    };
    // Modelos gpt-oss "pensam" antes de responder; 'low' gasta menos tokens nisso.
    if (model.startsWith('openai/gpt-oss')) payload.reasoning_effort = 'low';
    return payload;
};

/**
 * Valida o pedido, chama a Groq e devolve { status, json } pronto para responder.
 */
const handleChat = async ({ apiKey, model, body, timeoutMs = GROQ_TIMEOUT_MS }) => {
    if (!body || !validateMessages(body.messages)) {
        return { status: 400, json: { error: { message: 'Campo "messages" inválido.' } } };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // a chave só é usada aqui, no servidor
            },
            body: JSON.stringify(buildPayload(body, model)),
            signal: controller.signal
        });

        let data = {};
        try { data = await response.json(); } catch (e) { /* resposta sem JSON */ }

        if (!response.ok) {
            console.error(`Erro da Groq (${response.status}) com o modelo ${model}:`, data);
            return { status: response.status, json: { error: data.error || { message: 'Erro na API da Groq.' } } };
        }
        return { status: 200, json: data };

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Timeout ao falar com a Groq.');
            return { status: 504, json: { error: { message: 'A IA demorou demais para responder.' } } };
        }
        console.error('Erro ao falar com a Groq:', error);
        return { status: 500, json: { error: { message: 'Erro interno ao falar com a IA.' } } };
    } finally {
        clearTimeout(timer);
    }
};

/**
 * Rate limit simples em memória, só pra evitar abuso óbvio.
 * (Em serverless, cada instância tem a sua memória — é um freio "de melhor esforço".)
 */
const createRateLimiter = ({ windowMs = 60 * 1000, max = 20 } = {}) => {
    const log = new Map(); // ip -> [timestamps]
    return (ip) => {
        const now = Date.now();
        if (log.size > 1000) {
            for (const [key, times] of log) {
                if (!times.some(t => now - t < windowMs)) log.delete(key);
            }
        }
        const times = (log.get(ip) || []).filter(t => now - t < windowMs);
        times.push(now);
        log.set(ip, times);
        return times.length > max;
    };
};

module.exports = {
    DEFAULT_MODEL, resolveModel, isKeyConfigured,
    handleChat, createRateLimiter, validateMessages, buildPayload
};
