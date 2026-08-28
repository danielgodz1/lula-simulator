# 🇧🇷 Lula Simulator & Flappy Lula — Histórico Completo & Contexto do Projeto

> **Documento de Referência Técnica e de Negócio**  
> **Data de Atualização:** 28 de Agosto de 2026  
> **Desenvolvedor:** Daniel dos Santos (Projeto Interativo SENAI — IA & Engenharia de Software)  
> **Domínios Oficiais:**  
> - 🇧🇷 Brasil (Português): [lulasimulator.com.br](https://lulasimulator.com.br/)  
> - 🌍 Global (Inglês): [flappylula.com](https://flappylula.com/)  

---

## 📌 Visão Geral do Projeto

O **Lula Simulator** é uma plataforma web arcade de paródia política e crítica social satírica sobre a cultura brasileira contemporânea, combinando jogos 2D e 3D em tempo real, inteligência artificial, física interativa, sistema de contas e ranking global em tempo real.

---

## 🎮 1. Flappy Lula (Arcade 2D — `jogo.html` e `en/jogo.html`)

- **Motor & Renderização:** HTML5 Canvas 2D de alta performance com suporte a 60-120 FPS.
- **Física & Jogabilidade:**
  - Pulo suave com gravidade ajustada (`GRAVITY = 0.35`, `JUMP_POWER = -7.8`).
  - Hitbox precisa em caixa horizontal com margens de tolerância para jogabilidade justa.
  - Velocidade progressiva e aumento gradual de dificuldade.
- **Cenário Dinâmico:**
  - Fundo em parallax com arquitetura pixel art de Brasília.
  - Alternância de iluminação e estrelas conforme a pontuação.
- **Modo Prisão a cada 13 Pontos:**
  - Transição de tela com sirenes, barras de cadeia e presidiários animados (171).
  - Tremores dinâmicos de câmera (screen shake) e efeito de terremoto no retorno.
- **Badges & Conquistas:**
  - *Selo Lula Solo*: 50 Picanhas.
  - *Trio Supremo*: 500 Picanhas (Lula, Bolsonaro e Alexandre de Moraes).
- **Sistema de Revive (Segunda Chance):**
  - Integração com anúncios recompensados (Rewarded Ads / Smartlink).
  - Pausa inteligente: aguarda o jogador retornar à aba ativa do navegador antes de disparar o countdown de 3 segundos e escudo de invulnerabilidade.
- **HUD & Controles:**
  - Botão de Som: Alterna entre 🔊 Memes + FX, 🎮 Apenas Efeitos e 🔇 Mudo.
  - Botão de Personagem 🎭: Abre seletor com habilidades e skins cosméticas.
  - Botão de Tela Cheia ⛶: Suporte nativo em Desktop/Android e Pseudo-Fullscreen no iPhone.

---

## 🏃 2. Empresário 3D (Runner 3D Three.js — `correr.html` e `en/correr.html`)

- **Arquitetura Modular (`/js/game/`):**
  - [`main.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/game/main.js): Loop principal de atualização, ciclo de vida e spawn.
  - [`scene.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/game/scene.js): Câmera com ângulo dinâmico, renderizador Three.js e iluminação solar.
  - [`character.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/game/character.js): Modelos 3D estilizados, animações de corrida, salto parabólico, rasteira e troca de pistas.
  - [`environment.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/game/environment.js): Morros da favela com curvas dinâmicas, trilhos de trem e iluminação noturna por postes (`THREE.PointLight`).
  - [`obstacles.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/game/obstacles.js): Trens em movimento, cancelas de pedágio, placas PARE, boletos voadores, CLT e Bolsa Família.
  - [`audio.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/game/audio.js): Áudio posicional, vozes de memes e feedback sonoro.
  - [`ui.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/game/ui.js): Overlay, pontuação em km, moedas, modais e preview 3D de rotação de skins.
- **Visual Nítido & Otimização de Performance:**
  - Cores vivas e tropicais sem efeitos pesados de pós-processamento (sem bloom excessivo ou névoa opaca), garantindo 60 FPS cravados em celulares modestos.
- **Balanceamento de Economia & Dificuldade:**
  - Redução da densidade exagerada de moedas para valorizar a coleta.
  - Velocidade progressiva calibrada para atingir até **6x** em distâncias acima de 20.000 km.
- **Revive Aprimorado:**
  - Retorno imediato na mesma velocidade e posição da colisão após retorno à aba.

---

## 📱 3. Suporte Mobile & iPhone (iOS Safari)

- **Desafio do iOS:** O Safari no iPhone não implementa a API padrão `requestFullscreen()` em elementos HTML arbitrários.
- **Solução (Pseudo-Fullscreen CSS):**
  - Ativação da classe `body.is-fullscreen`.
  - Ocultamento da `<nav>` superior e fixação do canvas em `position: fixed; inset: 0; width: 100vw; height: 100dvh; z-index: 99999;`.
  - Redimensionamento automático via `calcSize()` / `scene.onResize()`.
- **Eventos de Toque:**
  - `pointer-events: auto !important;` e `z-index: 105;` nas pílulas de ação do HUD.
  - Ouvintes com suporte a `click` e `touchend` com `{ passive: false }` para eliminação de delay de toque no mobile.

---

## 🌐 4. Internacionalização (i18n) & SEO Multi-Idioma

- **Estrutura de Pastas:**
  - Raiz `/`: Versão em Português do Brasil (`pt-BR`).
  - Subpasta `/en/`: Versão completa em Inglês (`en`).
- **Páginas 100% Espelhadas e Sincronizadas:**
  - `index.html` (Landing Page com Top 3 ao vivo e FAQ)
  - `jogo.html` (Flappy Lula 2D)
  - `correr.html` (Empresário 3D)
  - `ranking.html` (Top 300 Global e Nacional)
  - `conquistas.html` (Sistema de Badges)
  - `loja.html` (Loja de Skins)
  - `social.html` (Duelos PvP e Notificações)
  - `visitantes.html` (Mapa e contador de países em tempo real)
  - `feedback.html` (Avaliações e comentários dos jogadores)
  - `contato.html` (Formulário de contato)
- **SEO Técnico:**
  - Tags `<link rel="alternate" hreflang="..." />` bidirecionais entre `lulasimulator.com.br` e `flappylula.com`.
  - `sitemap.xml` e `sitemap-en.xml` sincronizados.
  - OpenGraph e Twitter Cards configurados para compartilhamento em redes sociais e WhatsApp.

---

## 👥 5. Sistema Social, Duelos & Nuvem (Firebase Firestore)

- **Autenticação:** Sistema de contas com apelido, avatar SVG personalizável, títulos e bandeiras de países.
- **Nuvem:** Sincronização em tempo real de scores, desbloqueios e skins cosméticas.
- **Duelos PvP Assíncronos (`social.html`):**
  - Desafie amigos gerando links únicos com parâmetro `?duel=ID`.
  - Ao entrar pelo link, o jogo exibe um banner de duelo e compara as pontuações.
- **Sistema de Prestígio:** Jogadores de alto desempenho exibem badges `⭐ P1`, `⭐ P2`, etc., nos rankings.

---

## 🗳️ 6. Timing Eleitoral 2026, Compliance e Políticas de Anúncios

- **Aquecimento Eleitoral 2026:**
  - Seção visual destacada na Home (PT e EN) conectando o jogo ao período de eleições como forma de descontração.
  - Menção às datas oficiais: **1º Turno (04/10/2026)** e **eventual 2º Turno (25/10/2026)**.
- **Módulo Dinâmico ([`js/election-timer.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/election-timer.js)):**
  - Calcula os dias restantes para o 1º e 2º turno automaticamente no cliente, mantendo a página sempre atualizada para algoritmos de busca do Google.
- **Disclaimer Legal de Paródia & Isenção Partidária:**
  - Presente no rodapé de todas as páginas e nas telas de início dos jogos.
  - Declara explicitamente:
    1. Obra independente de humor, sátira e entretenimento.
    2. Sem afiliação, patrocínio ou vínculo com candidatos, partidos políticos ou com o Tribunal Superior Eleitoral (TSE).
    3. **Ausência total de enquetes, pesquisas de intenção de voto ou prognósticos**, protegendo o domínio contra desinformação e garantindo conformidade com o Google AdSense.

---

## 🗂️ Mapa de Arquivos Principais

```
lula-simulator/
├── index.html                  # Home PT-BR (Hero, Top 3 ao vivo, Aquecimento 2026, FAQ)
├── jogo.html                   # Flappy Lula 2D PT-BR
├── correr.html                 # Empresário 3D PT-BR
├── ranking.html                # Ranking Top 300 PT-BR
├── loja.html                   # Loja de Skins PT-BR
├── conquistas.html             # Badges e Conquistas PT-BR
├── social.html                 # Social, Duelos PvP e Notificações PT-BR
├── visitantes.html             # Visitantes Globais PT-BR
├── feedback.html               # Feedbacks da Comunidade PT-BR
├── contato.html                # Contato com o Desenvolvedor PT-BR
│
├── en/                         # Versão espelhada em Inglês (flappylula.com)
│   ├── index.html
│   ├── jogo.html
│   ├── correr.html
│   └── ... (demais páginas traduzidas)
│
├── js/
│   ├── game/                   # Módulos do Empresário 3D (Three.js)
│   │   ├── main.js
│   │   ├── scene.js
│   │   ├── character.js
│   │   ├── environment.js
│   │   ├── obstacles.js
│   │   ├── audio.js
│   │   └── ui.js
│   ├── election-timer.js       # Contador dinâmico de datas das Eleições 2026
│   ├── audio.js                # Sistema de áudio do Flappy 2D
│   ├── auth.js                 # Autenticação e perfil Firebase
│   ├── firebase-config.js      # Conexão Firestore e Scores
│   ├── ads-manager.js          # Gerenciamento de Anúncios e Smartlinks
│   └── social-manager.js       # Gerenciamento de Duelos e Notificações
│
├── sitemap.xml                 # Sitemap PT-BR
├── sitemap-en.xml              # Sitemap EN
├── HISTORICO_DO_PROJETO.md     # Este documento de referência
└── README.md                   # Documentação pública do repositório
```
