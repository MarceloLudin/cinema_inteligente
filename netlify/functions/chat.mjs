/**
 * Function do Netlify: faz o papel do server.js quando o site está no Netlify.
 * Responde em POST /api/chat (rota definida em "config.path" abaixo).
 *
 * A chave vem da variável de ambiente GROQ_API_KEY, configurada no painel
 * do Netlify (Project configuration → Environment variables), com escopo
 * que inclua "Functions".
 */
import proxy from '../../lib/groq-proxy.js';

const isRateLimited = proxy.createRateLimiter({ windowMs: 60 * 1000, max: 20 });

export default async (req, context) => {
    if (isRateLimited(context?.ip || 'unknown')) {
        return Response.json(
            { error: { message: 'Muitas requisições. Aguarde um instante.' } },
            { status: 429 }
        );
    }

    const apiKey = Netlify.env.get('GROQ_API_KEY');
    if (!proxy.isKeyConfigured(apiKey)) {
        console.error('GROQ_API_KEY não configurada (ou sem escopo "Functions") no Netlify.');
        return Response.json(
            { error: { message: 'Chave da IA não configurada no servidor.' } },
            { status: 401 }
        );
    }

    const body = await req.json().catch(() => null);
    const model = proxy.resolveModel(Netlify.env.get('GROQ_MODEL'));

    const { status, json } = await proxy.handleChat({ apiKey, model, body });
    return Response.json(json, { status });
};

export const config = {
    path: '/api/chat',
    method: 'POST'
};
