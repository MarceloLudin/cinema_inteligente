/**
 * Quiz Module
 * Generates and manages AI-powered attention quizzes for movies/series
 */

const Quiz = (function () {
    'use strict';

    const QUIZ_SEEN_KEY = 'cinema_quiz_feature_seen';
    const QUIZ_STORAGE_KEY = 'cinema_quiz_data';

    // ─── State ───────────────────────────────────────────────────────────────
    let currentQuiz = null;   // { title, type, questions[], id }
    let userAnswers = {};      // { questionIndex: answerIndex }
    let quizPhase = 'idle';   // idle | intro | answering | result

    // ─── Helpers ─────────────────────────────────────────────────────────────
    const hasSeenFeature = () => !!localStorage.getItem(QUIZ_SEEN_KEY);
    const markFeatureSeen = () => localStorage.setItem(QUIZ_SEEN_KEY, '1');

    const saveQuiz = (quizData) => {
        try {
            const existing = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY) || '[]');
            existing.unshift(quizData);
            if (existing.length > 20) existing.pop();
            localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(existing));
        } catch (e) { /* silent */ }
    };

    const escHtml = (str) => {
        const d = document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    };

    // ─── Prompt builder ──────────────────────────────────────────────────────
    const buildQuizPrompt = (title, type, year) => `
Você é um especialista em cinema e séries. Crie um "Quiz de Atenção" sobre "${title}" (${type === 'series' ? 'série' : 'filme'}, ${year}).

O quiz deve testar se o usuário REALMENTE assistiu e prestou atenção — perguntas sobre detalhes de plot, personagens, cenas marcantes, diálogos, reviravoltas, etc.

RESPONDA SOMENTE COM JSON VÁLIDO. Sem markdown, sem texto antes ou depois.

{
  "quizTitle": "Quiz de Atenção: ${title}",
  "description": "Uma frase curta e instigante sobre o quiz (ex: Você prestou atenção nos detalhes?)",
  "questions": [
    {
      "question": "Pergunta clara sobre um detalhe do conteúdo",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctIndex": 0,
      "explanation": "Breve explicação de por que esta é a resposta certa, com spoiler do detalhe"
    }
  ]
}

REGRAS:
- Exatamente 7 perguntas
- 4 opções por pergunta
- correctIndex é 0-3 (índice da opção correta no array options)
- As perguntas devem variar: plot, personagens, diálogos, detalhes visuais, final, reviravoltas
- Inclua pelo menos 2 perguntas "difíceis" (detalhes sutis)
- Responda em português brasileiro
- A explanation deve revelar o detalhe do conteúdo (spoiler ok — o usuário já assistiu)
- Retorne APENAS o JSON
`;

    // ─── Fetch quiz from API ─────────────────────────────────────────────────
    const generateQuiz = async (title, type, year) => {
        const prompt = buildQuizPrompt(title, type, year);

        // Chama o NOSSO servidor (/api/chat) — a chave da Groq fica só no server.js/.env
        const response = await fetch(Config.API_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'Você cria quizzes de cinema. Responda APENAS com JSON válido.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.6,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const httpError = new Error(API.describeHttpError(response.status));
            httpError.friendly = true;
            throw httpError;
        }

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const parsed = JSON.parse(API.extractJson(raw));

        if (!parsed.questions || parsed.questions.length === 0) throw new Error('Quiz inválido');

        return {
            id: Date.now(),
            title,
            type,
            year,
            quizTitle: parsed.quizTitle,
            description: parsed.description,
            questions: parsed.questions
        };
    };

    // ─── Scoring ─────────────────────────────────────────────────────────────
    const calcScore = () => {
        if (!currentQuiz) return { correct: 0, total: 0, pct: 0 };
        let correct = 0;
        currentQuiz.questions.forEach((q, i) => {
            if (userAnswers[i] === q.correctIndex) correct++;
        });
        const total = currentQuiz.questions.length;
        return { correct, total, pct: Math.round((correct / total) * 100) };
    };

    const getScoreLabel = (pct) => {
        if (pct >= 86) return { emoji: '🏆', label: 'Cinéfilo de Elite!', msg: 'Uau! Você não perdeu nenhum detalhe. Atenção cirúrgica.' };
        if (pct >= 71) return { emoji: '🌟', label: 'Fã Dedicado!', msg: 'Muito bem! Você realmente prestou atenção.' };
        if (pct >= 57) return { emoji: '👍', label: 'Bom Espectador', msg: 'Acertou a maioria. Talvez valha um re-watch?' };
        if (pct >= 43) return { emoji: '🎬', label: 'Espectador Casual', msg: 'Alguns detalhes escaparam. Uma segunda vez revela muito.' };
        return { emoji: '😅', label: 'Hora do Re-watch!', msg: 'Parece que você pode ter se distraído. Que tal assistir de novo?' };
    };

    // ─── Modal HTML ──────────────────────────────────────────────────────────
    const renderModal = (html, id = 'quiz-modal') => {
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'quiz-modal-overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        // Close on overlay click (but not on inner click)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(id);
        });

        requestAnimationFrame(() => overlay.classList.add('visible'));
        return overlay;
    };

    const closeModal = (id = 'quiz-modal') => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('visible');
        setTimeout(() => el.remove(), 300);
    };

    // ─── Feature intro popup (first time only) ───────────────────────────────
    const showFeatureIntro = (title, onConfirm, onDismiss) => {
        const html = `
        <div class="quiz-modal quiz-intro-modal">
            <button class="quiz-modal-close" id="quiz-intro-close">×</button>
            <div class="quiz-intro-icon">🧠</div>
            <h2 class="quiz-intro-title">Quiz de Atenção</h2>
            <p class="quiz-intro-desc">
                Após assistir <strong>${escHtml(title)}</strong>, volte aqui para responder um quiz criado pela IA sobre o conteúdo.<br><br>
                A IA vai testar se você realmente prestou atenção: personagens, detalhes de plot, reviravoltas e cenas marcantes.
            </p>
            <div class="quiz-intro-steps">
                <div class="quiz-step"><span class="quiz-step-num">1</span><span>Assista ao filme ou série</span></div>
                <div class="quiz-step"><span class="quiz-step-num">2</span><span>Volte e clique em "Fazer o Quiz"</span></div>
                <div class="quiz-step"><span class="quiz-step-num">3</span><span>Responda 7 perguntas e veja sua pontuação</span></div>
            </div>
            <div class="quiz-intro-actions">
                <button class="quiz-btn quiz-btn-ghost" id="quiz-intro-dismiss">Agora não</button>
                <button class="quiz-btn quiz-btn-primary" id="quiz-intro-confirm">Entendi, vou assistir!</button>
            </div>
        </div>`;

        const modal = renderModal(html, 'quiz-intro-modal');
        document.getElementById('quiz-intro-close').addEventListener('click', () => { closeModal('quiz-intro-modal'); onDismiss && onDismiss(); });
        document.getElementById('quiz-intro-dismiss').addEventListener('click', () => { closeModal('quiz-intro-modal'); onDismiss && onDismiss(); });
        document.getElementById('quiz-intro-confirm').addEventListener('click', () => {
            closeModal('quiz-intro-modal');
            markFeatureSeen();
            onConfirm && onConfirm();
        });
    };

    // ─── Quiz loading modal ──────────────────────────────────────────────────
    const showQuizLoading = (title) => {
        const html = `
        <div class="quiz-modal quiz-loading-modal">
            <div class="quiz-loading-spinner"></div>
            <h3 class="quiz-loading-title">Criando quiz para <em>${escHtml(title)}</em>…</h3>
            <p class="quiz-loading-sub">A IA está analisando o conteúdo</p>
        </div>`;
        renderModal(html, 'quiz-loading-modal');
    };

    // ─── Quiz question modal ─────────────────────────────────────────────────
    const renderQuestionScreen = (qIndex) => {
        const q = currentQuiz.questions[qIndex];
        const total = currentQuiz.questions.length;
        const answered = userAnswers[qIndex] !== undefined;
        const selected = userAnswers[qIndex];

        const optionsHtml = q.options.map((opt, i) => {
            let cls = 'quiz-option';
            if (answered) {
                if (i === q.correctIndex) cls += ' correct';
                else if (i === selected && i !== q.correctIndex) cls += ' wrong';
            }
            if (i === selected) cls += ' selected';
            return `<button class="quiz-option-btn ${cls}" data-idx="${i}" ${answered ? 'disabled' : ''}>
                <span class="quiz-option-letter">${String.fromCharCode(65 + i)}</span>
                <span class="quiz-option-text">${escHtml(opt)}</span>
                ${answered && i === q.correctIndex ? '<span class="quiz-option-icon">✓</span>' : ''}
                ${answered && i === selected && i !== q.correctIndex ? '<span class="quiz-option-icon">✗</span>' : ''}
            </button>`;
        }).join('');

        const explanationHtml = answered ? `
            <div class="quiz-explanation">
                <span class="quiz-explanation-label">💡 Explicação</span>
                <p>${escHtml(q.explanation)}</p>
            </div>` : '';

        const progress = ((qIndex + 1) / total) * 100;
        const isLast = qIndex === total - 1;

        const nextBtn = answered
            ? `<button class="quiz-btn quiz-btn-primary" id="quiz-next-btn">
                ${isLast ? '🏆 Ver Resultado' : 'Próxima →'}
               </button>`
            : '';

        const html = `
        <div class="quiz-modal quiz-question-modal">
            <button class="quiz-modal-close" id="quiz-q-close">×</button>
            <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${progress}%"></div></div>
            <div class="quiz-q-header">
                <span class="quiz-q-counter">${qIndex + 1} / ${total}</span>
                <span class="quiz-q-title">${escHtml(currentQuiz.quizTitle)}</span>
            </div>
            <p class="quiz-question-text">${escHtml(q.question)}</p>
            <div class="quiz-options">${optionsHtml}</div>
            ${explanationHtml}
            <div class="quiz-q-footer">
                ${qIndex > 0 ? `<button class="quiz-btn quiz-btn-ghost" id="quiz-prev-btn">← Anterior</button>` : '<span></span>'}
                ${nextBtn}
            </div>
        </div>`;

        const modal = renderModal(html, 'quiz-modal');

        document.getElementById('quiz-q-close').addEventListener('click', () => closeModal('quiz-modal'));

        if (!answered) {
            modal.querySelectorAll('.quiz-option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    userAnswers[qIndex] = idx;
                    renderQuestionScreen(qIndex); // re-render with answer shown
                });
            });
        }

        const nextEl = document.getElementById('quiz-next-btn');
        if (nextEl) {
            nextEl.addEventListener('click', () => {
                if (isLast) showResultScreen();
                else renderQuestionScreen(qIndex + 1);
            });
        }

        const prevEl = document.getElementById('quiz-prev-btn');
        if (prevEl) {
            prevEl.addEventListener('click', () => renderQuestionScreen(qIndex - 1));
        }
    };

    // ─── Result screen ────────────────────────────────────────────────────────
    const showResultScreen = () => {
        const { correct, total, pct } = calcScore();
        const { emoji, label, msg } = getScoreLabel(pct);

        const answersHtml = currentQuiz.questions.map((q, i) => {
            const ua = userAnswers[i];
            const ok = ua === q.correctIndex;
            return `<div class="quiz-result-item ${ok ? 'correct' : 'wrong'}">
                <span class="quiz-result-item-icon">${ok ? '✓' : '✗'}</span>
                <div>
                    <p class="quiz-result-q">${escHtml(q.question)}</p>
                    ${!ok ? `<p class="quiz-result-correct">Correto: <strong>${escHtml(q.options[q.correctIndex])}</strong></p>` : ''}
                </div>
            </div>`;
        }).join('');

        const html = `
        <div class="quiz-modal quiz-result-modal">
            <button class="quiz-modal-close" id="quiz-res-close">×</button>
            <div class="quiz-score-hero">
                <div class="quiz-score-emoji">${emoji}</div>
                <div class="quiz-score-pct">${pct}%</div>
                <div class="quiz-score-label">${label}</div>
                <div class="quiz-score-fraction">${correct} de ${total} corretas</div>
                <p class="quiz-score-msg">${msg}</p>
            </div>
            <div class="quiz-answers-review">
                <h4 class="quiz-review-title">Revisão das respostas</h4>
                ${answersHtml}
            </div>
            <div class="quiz-result-footer">
                <button class="quiz-btn quiz-btn-ghost" id="quiz-retry-btn">↺ Tentar Novamente</button>
                <button class="quiz-btn quiz-btn-primary" id="quiz-close-result">✓ Fechar</button>
            </div>
        </div>`;

        renderModal(html, 'quiz-modal');

        document.getElementById('quiz-res-close').addEventListener('click', () => closeModal('quiz-modal'));
        document.getElementById('quiz-close-result').addEventListener('click', () => closeModal('quiz-modal'));
        document.getElementById('quiz-retry-btn').addEventListener('click', () => {
            userAnswers = {};
            renderQuestionScreen(0);
        });

        // Persist result
        saveQuiz({ ...currentQuiz, score: { correct, total, pct }, completedAt: new Date().toISOString() });
    };

    // ─── Main entry point called from card "Fazer Quiz" button ──────────────
    const startQuizFlow = async (title, type, year) => {
        if (!hasSeenFeature()) {
            showFeatureIntro(title, () => {
                // After they click "Entendi, vou assistir!" — just close
                // They'll click "Fazer Quiz" again when they come back
                UI.showToast(`Quiz para "${title}" disponível quando você voltar!`, 'info');
            });
            return;
        }

        // Show loading
        showQuizLoading(title);
        userAnswers = {};

        try {
            currentQuiz = await generateQuiz(title, type, year);
        } catch (e) {
            closeModal('quiz-loading-modal');
            UI.showToast(e.friendly ? e.message : 'Erro ao gerar o quiz. Tente novamente.', 'error');
            console.error('Quiz gen error:', e);
            return;
        }

        closeModal('quiz-loading-modal');
        quizPhase = 'answering';
        renderQuestionScreen(0);
    };

    // ─── Public API ───────────────────────────────────────────────────────────
    return {
        startQuizFlow,
        hasSeenFeature
    };
})();
