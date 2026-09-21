/**
 * API Module
 * Comunicação com o nosso servidor, que por sua vez fala com a Groq.
 * A chave da API nunca passa pelo navegador — veja server.js e .env.
 */

const API = (function () {
    'use strict';

    /**
     * PLATAFORMAS DE STREAMING - mapeamento de nomes para URLs de busca
     */
    const PLATFORM_SEARCH_URLS = {
        'Netflix': 'https://www.netflix.com/search?q=',
        'Prime Video': 'https://www.primevideo.com/search/ref=atv_nb_sr?phrase=',
        'Disney+': 'https://www.disneyplus.com/search/',
        'Max': 'https://play.max.com/search?q=',
        'Globoplay': 'https://globoplay.globo.com/busca/?q=',
        'Apple TV+': 'https://tv.apple.com/search?term=',
        'Paramount+': 'https://www.paramountplus.com/search/',
        'Crunchyroll': 'https://www.crunchyroll.com/search?q=',
        'Mubi': 'https://mubi.com/pt/search?q=',
        'Star+': 'https://www.starplus.com/search?q=',
        'Claro tv+': 'https://www.clarotvmais.com.br/busca?q=',
        'YouTube': 'https://www.youtube.com/results?search_query=',
        'Google Play': 'https://play.google.com/store/search?q=',
        'iTunes': 'https://www.apple.com/br/search/'
    };

    /**
     * Busca o poster real no OMDb (endpoint público, sem chave própria nossa)
     */
    const fetchPoster = async (title, year, type) => {
        try {
            const query = encodeURIComponent(title);
            const omdbUrl = `https://www.omdbapi.com/?t=${query}&y=${year}&apikey=trilogy`;
            const response = await fetch(omdbUrl);

            if (response.ok) {
                const data = await response.json();
                if (data.Poster && data.Poster !== 'N/A') {
                    return data.Poster;
                }
            }
        } catch (e) {
            // silently fail
        }
        return null;
    };

    /**
     * Mensagem amigável para cada erro HTTP vindo do nosso servidor.
     */
    const describeHttpError = (status) => {
        if (status === 401 || status === 403) return 'A chave da IA no servidor está ausente ou inválida.';
        if (status === 404) return 'Servidor ou modelo de IA não encontrado. Abra o site pelo servidor (npm start) e confira o GROQ_MODEL.';
        if (status === 429) return 'Muitas requisições. Aguarde um instante e tente de novo.';
        if (status >= 500) return 'A IA está instável no momento. Tente novamente.';
        return `Erro API: ${status}`;
    };

    /**
     * Extrai o JSON de dentro do texto da IA (ignora ```json e texto solto).
     */
    const extractJson = (text) => {
        const raw = String(text || '').trim();
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start === -1 || end <= start) throw new Error('Resposta da IA sem JSON');
        return raw.slice(start, end + 1);
    };

    /**
     * CRIA O PROMPT
     */
    const buildPrompt = (selectionType, value, contentType) => {
        const contentTypeText = {
            both: 'filmes e séries',
            movie: 'apenas filmes',
            series: 'apenas séries'
        }[contentType] || 'filmes e séries';

        let userContext = '';

        if (selectionType === 'mood') {
            const moodPt = Config.MOOD_MAP[value] || value;
            userContext = `O usuário está se sentindo "${moodPt}".`;
        } else if (selectionType === 'genre') {
            const genrePt = Config.GENRE_MAP[value] || value;
            userContext = `O usuário quer assistir algo do gênero "${genrePt}".`;
        } else if (selectionType === 'description') {
            userContext = `O usuário descreveu o que procura: "${value}"`;
        }

        return `
Você é um especialista em cinema e séries com profundo conhecimento sobre plataformas de streaming disponíveis no Brasil.

${userContext}

Recomende exatamente 6 ${contentTypeText}.

RESPONDA SOMENTE EM JSON VÁLIDO, sem texto antes ou depois, sem markdown, sem blocos de código.

Formato obrigatório:

{
  "recommendations": [
    {
      "title": "Nome Original do Título",
      "type": "movie",
      "year": 2020,
      "duration": "2h 15min",
      "genres": ["Ação", "Drama"],
      "rating": 8.5,
      "matchScore": 95,
      "reason": "Motivo da recomendação em português, explicando por que combina com o humor/gênero do usuário.",
      "platforms": [
        {
          "name": "Netflix",
          "available": true
        },
        {
          "name": "Prime Video",
          "available": false
        }
      ],
      "posterSearch": "Título para buscar no Google Imagens ou TMDB"
    }
  ]
}

REGRAS:
- type deve ser "movie" para filmes ou "series" para séries
- matchScore entre 70 e 99
- rating entre 6.0 e 10.0
- Responda em português brasileiro
- Para platforms: liste APENAS as plataformas onde o título está REALMENTE disponível no Brasil atualmente (Netflix, Prime Video, Disney+, Max, Globoplay, Apple TV+, Paramount+, Crunchyroll, Mubi). Se não souber com certeza, liste as mais prováveis. Coloque available: true apenas nas que estão disponíveis.
- Se o título não estiver em nenhuma plataforma de streaming, coloque um array vazio em platforms e indique "Aluguel/Compra" ou "Cinemas" conforme aplicável.
- posterSearch deve ser o título em inglês (título original) para facilitar busca de imagens
- Retorne APENAS o JSON, nada mais
`;
    };

    /**
     * CONVERTE RESPOSTA
     */
    const parseResponse = (responseText) => {
        try {
            const parsed = JSON.parse(extractJson(responseText));

            if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
                throw new Error('Estrutura inválida');
            }

            return parsed.recommendations.map(item => {
                // Filtrar apenas plataformas disponíveis
                const availablePlatforms = Array.isArray(item.platforms)
                    ? item.platforms
                        .filter(p => p.available)
                        .map(p => {
                            const name = p.name || '';
                            const baseUrl = PLATFORM_SEARCH_URLS[name] || null;
                            const searchTitle = encodeURIComponent(item.posterSearch || item.title);
                            return {
                                name,
                                url: baseUrl ? `${baseUrl}${searchTitle}` : null
                            };
                        })
                        .filter(p => p.name)
                    : [];

                return {
                    title: item.title || 'Título Desconhecido',
                    type: item.type === 'series' ? 'series' : 'movie',
                    year: parseInt(item.year) || 2024,
                    duration: item.duration || 'N/A',
                    genres: Array.isArray(item.genres) ? item.genres : [],
                    rating: parseFloat(item.rating) || 7.0,
                    matchScore: parseInt(item.matchScore) || 85,
                    reason: item.reason || 'Recomendado para você.',
                    platforms: availablePlatforms,
                    posterSearch: item.posterSearch || item.title,
                    posterUrl: null // será preenchido async
                };
            });

        } catch (error) {
            console.error('Erro ao converter JSON:', error);
            console.error('Texto recebido:', responseText);
            throw new Error('Erro ao processar resposta da IA');
        }
    };

    /**
     * BUSCA POSTERS PARA OS RESULTADOS (assíncrono, não bloqueia exibição)
     */
    const enrichWithPosters = async (results) => {
        const enriched = await Promise.all(results.map(async (item) => {
            const posterUrl = await fetchPoster(item.posterSearch, item.year, item.type);
            return { ...item, posterUrl };
        }));
        return enriched;
    };

    /**
     * BUSCA RECOMENDAÇÕES
     * Chama o NOSSO servidor (/api/chat), sem nenhuma chave no navegador.
     * O servidor injeta a chave da Groq, escolhe o modelo e repassa a resposta pra cá.
     */
    const getRecommendations = async (selectionType, value, contentType) => {
        const prompt = buildPrompt(selectionType, value, contentType);

        try {
            console.log('Enviando requisição para o servidor...');

            const response = await fetch(Config.API_CONFIG.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'Você é um especialista em cinema e séries. Responda APENAS com JSON válido, sem markdown, sem texto adicional.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: Config.API_CONFIG.temperature,
                    max_tokens: Config.API_CONFIG.maxTokens
                })
            });

            console.log('Status da resposta:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro da API:', errorText);
                throw new Error(describeHttpError(response.status));
            }

            const data = await response.json();
            console.log('Dados da API:', data);

            if (!data.choices || !data.choices[0]?.message?.content) {
                throw new Error('Resposta inválida da API');
            }

            const content = data.choices[0].message.content;
            const results = parseResponse(content);

            // Enriquecer com posters em background (não bloqueia exibição)
            enrichWithPosters(results).then(enriched => {
                // Atualiza posters nos cards da tela de resultados
                document.dispatchEvent(new CustomEvent('postersLoaded', { detail: enriched }));
                // Salva no histórico COM posterUrl já preenchido
                document.dispatchEvent(new CustomEvent('postersReadyForStorage', { detail: enriched }));
            });

            return results;

        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    };

    // Public API
    return {
        getRecommendations,
        enrichWithPosters,
        describeHttpError,
        extractJson,
        PLATFORM_SEARCH_URLS
    };
})();
