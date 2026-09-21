/**
 * Servidor do Cinema Inteligente (para rodar local ou em hospedagem Node: Render, Railway...)
 * -------------------------------------------------------------------------------
 * Serve o site (pasta public/) E funciona como "porteiro" entre o navegador
 * e a API da Groq. A chave vive só aqui, na variável GROQ_API_KEY.
 *
 * No Netlify este arquivo NÃO é usado: lá quem faz esse papel é a function
 * netlify/functions/chat.mjs (ambos usam lib/groq-proxy.js).
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const proxy = require('./lib/groq-proxy');

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const GROQ_MODEL = proxy.resolveModel(process.env.GROQ_MODEL);

if (!proxy.isKeyConfigured(GROQ_API_KEY)) {
    console.error('\n🚫 ERRO: variável GROQ_API_KEY não configurada.');
    console.error('   Local: copie o .env.example para .env e cole sua chave da Groq.');
    console.error('   Na web: crie a variável GROQ_API_KEY no painel da hospedagem.\n');
    process.exit(1);
}

// Hospedagens colocam um proxy na frente do app; sem isso todo mundo teria o mesmo IP.
app.set('trust proxy', 1);

app.use(express.json({ limit: '100kb' }));

// Só a pasta public/ é servida (server.js, lib/, .env ficam de fora).
app.use(express.static(path.join(__dirname, 'public')));

// Usado pelas hospedagens para saber se o app está de pé.
app.get('/health', (req, res) => res.json({ ok: true }));

const isRateLimited = proxy.createRateLimiter({ windowMs: 60 * 1000, max: 20 });

app.post('/api/chat', async (req, res) => {
    if (isRateLimited(req.ip)) {
        return res.status(429).json({ error: { message: 'Muitas requisições. Aguarde um instante.' } });
    }
    const { status, json } = await proxy.handleChat({
        apiKey: GROQ_API_KEY,
        model: GROQ_MODEL,
        body: req.body
    });
    res.status(status).json(json);
});

app.listen(PORT, () => {
    console.log(`\n🎬 Cinema Inteligente rodando na porta ${PORT} (modelo: ${GROQ_MODEL})`);
    console.log(`   Local: http://localhost:${PORT}\n`);
});
