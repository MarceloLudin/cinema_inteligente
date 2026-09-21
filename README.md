# 🎬 Cinema Inteligente

O **Cinema Inteligente** é uma aplicação desenvolvida para facilitar a escolha de filmes e séries de acordo com o perfil e as preferências do usuário.

A proposta surgiu a partir de uma situação comum: ter várias plataformas de streaming disponíveis, muitas opções para assistir e, mesmo assim, não saber o que escolher.

Com o Cinema Inteligente, o usuário informa o que está procurando, como seu humor ou um gênero específico, e recebe recomendações organizadas de acordo com sua solicitação.

---

## 🎯 Objetivo do Projeto

O principal objetivo é tornar a escolha de filmes e séries mais rápida, simples e personalizada.

A aplicação busca:

- 🎭 Recomendar conteúdos de acordo com o humor informado;
- 🎬 Permitir buscas por gênero e tipo de conteúdo;
- ⭐ Apresentar uma pontuação de compatibilidade;
- 📺 Informar em qual plataforma o conteúdo está disponível;
- 🔗 Disponibilizar acesso direto ao conteúdo;
- 📝 Apresentar uma breve explicação para cada recomendação;
- 📚 Manter um histórico das pesquisas realizadas;
- 🧠 Disponibilizar um quiz relacionado ao conteúdo assistido.

---

## 🚀 Como Funciona

O funcionamento da aplicação acontece de forma simples e intuitiva.

### 1. Escolha do usuário

O usuário informa o que deseja assistir.

Por exemplo:

> "Estou me sentindo ansioso e quero assistir uma série."

Também é possível realizar uma busca utilizando um gênero ou tipo de conteúdo.

### 2. Processamento da solicitação

O sistema analisa as informações fornecidas e identifica quais conteúdos possuem maior compatibilidade com a solicitação.

### 3. Recomendações

São apresentadas recomendações contendo informações como:

- 🖼️ Capa;
- 🎬 Título;
- 📂 Tipo de conteúdo;
- 📝 Motivo da recomendação;
- 📺 Plataforma disponível;
- ⭐ Pontuação de compatibilidade;
- 🔗 Link para acesso.

### 4. Escolha do conteúdo

Depois de analisar as recomendações, o usuário pode escolher o filme ou série que deseja assistir.

---

## ⭐ Sistema de Compatibilidade

Cada recomendação possui uma pontuação de compatibilidade.

Essa pontuação representa o quanto o conteúdo está relacionado com aquilo que foi solicitado pelo usuário.

Dessa forma, é possível visualizar rapidamente quais opções possuem maior relação com a busca realizada.

---

## 🎭 Busca por Humor

Uma das principais funcionalidades do projeto é a possibilidade de buscar conteúdos de acordo com o humor do usuário.

É possível informar situações como:

- 😄 Feliz
- 😢 Triste
- 😰 Ansioso
- 😎 Animado
- 😌 Relaxado
- ❤️ Romântico

A partir da informação fornecida, o sistema apresenta conteúdos relacionados àquele momento.

---

## 🎬 Busca por Gênero

Também é possível realizar pesquisas utilizando gêneros cinematográficos.

Alguns exemplos:

- 😂 Comédia
- 💥 Ação
- 👻 Terror
- ❤️ Romance
- 🚀 Ficção científica
- 🎭 Drama
- 🗺️ Aventura

A busca por gênero permite encontrar conteúdos de acordo com uma preferência específica.

---

## 📝 Quiz

O projeto também possui uma funcionalidade de quiz relacionada ao conteúdo assistido.

Após assistir a um filme ou série, o usuário pode responder perguntas sobre:

- História;
- Personagens;
- Acontecimentos;
- Detalhes do conteúdo.

Ao final, o usuário recebe uma pontuação de acordo com suas respostas.

Essa funcionalidade pode ser utilizada tanto para diversão quanto em situações educacionais.

---

## 📚 Histórico

As pesquisas realizadas podem ser armazenadas no histórico da aplicação.

Isso permite que o usuário consulte posteriormente conteúdos e recomendações que já foram pesquisados.

O histórico permanece disponível no próprio dispositivo do usuário.

---

## 🖥️ Interface

A aplicação foi desenvolvida com foco em uma utilização simples e intuitiva.

O usuário consegue:

1. Informar o que deseja assistir;
2. Realizar a busca;
3. Visualizar as recomendações;
4. Comparar as opções;
5. Acessar o conteúdo escolhido;
6. Consultar o histórico;
7. Realizar o quiz.

---

## 🔄 Fluxo da Aplicação

```text
┌──────────────────────┐
│       Usuário        │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Escolhe humor/gênero │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│   Realiza a busca    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Sistema processa     │
│     solicitação      │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Busca os conteúdos   │
│    correspondentes   │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Organiza as          │
│    recomendações     │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Exibe os resultados  │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Usuário escolhe      │
│      conteúdo        │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Acessa o conteúdo    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Pode realizar o quiz │
└──────────────────────┘

