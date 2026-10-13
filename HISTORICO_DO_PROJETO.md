# 📜 Histórico e Documentação Técnica do Projeto "Lula Simulator"

> **Versão:** 2.5 (Reta Final 2º Turno — 25/10/2026)  
> **Desenvolvedor:** Daniel dos Santos  
> **Instituição / Contexto:** SENAI — Curso de Programação com Inteligência Artificial  
> **Domínios Oficiais:**  
> - Domínio Nacional (PT-BR): `https://lulasimulator.com.br` (arquivos na raiz `/`)  
> - Domínio Internacional (EN): `https://flappylula.com` (arquivos traduzidos na pasta `/en/`)

---

## 🎯 1. Visão Geral do Projeto

O **Lula Simulator** é uma aplicação web de jogos satíricos e paródia política brasileira de alta performance, desenvolvida de forma independente com tecnologias modernas:
- **Flappy Lula 2D:** Arcade clássico de voo com física de gravidade, coleta de picanhas e eventos dinâmicos (Modo Prisão a cada 13 pontos).
- **Empresário vs CLT 3D:** Endless runner tridimensional desenvolvido com **Three.js** e aceleração **WebGL**, com curvas em ladeiras, obstáculos urbanos e aceleração progressiva até 6.0x (20.000m).
- **Compliance e Monetização:** Totalmente preparado para aprovação no **Google AdSense** e **Google H5 Games**, operando em modo seguro durante revisões e em estrita conformidade com a LGPD e GDPR.

---

## 🛡️ 2. Atualizações da Versão 2.5 (Outubro/2026)

### 1. Blindagem de Roteamento e Anti-Bloqueio de Bots ([`js/language-manager.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/language-manager.js))
- **Whitelist de Crawlers (`isSearchOrAdBot`):** Detecta `Googlebot`, `Mediapartners-Google`, `AdsBot-Google`, `Lighthouse`, `PageSpeed`, `Bingbot`, `crawler`, `spider`, etc., e `navigator.webdriver`.
- **Zero Redirecionamentos para Bots:** Bots nunca sofrem `window.location.replace` nem recebem modais bloqueantes, permitindo indexação e auditoria limpa em ambos os domínios.
- **Persistência Humana:** Usuários com preferência salva em `localStorage.getItem('user_lang_pref')` navegam sem redirecionamentos forçados. Toast/Banner flutuante não-intrusivo para visitantes internacionais.

### 2. Compliance Legal AdSense, LGPD & GDPR
- **Páginas Legais:** Criadas [`privacidade.html`](file:///c:/Users/NT118/antigravity/lula-simulator/privacidade.html), [`en/privacy.html`](file:///c:/Users/NT118/antigravity/lula-simulator/en/privacy.html), [`termos.html`](file:///c:/Users/NT118/antigravity/lula-simulator/termos.html) e [`en/terms.html`](file:///c:/Users/NT118/antigravity/lula-simulator/en/terms.html).
- **Cláusulas Obrigatórias AdSense:** Detalhamento do Cookie DART do Google, links de opt-out ([`https://adssettings.google.com`](https://adssettings.google.com)), armazenamento de dados no Firebase Firestore e anonimização de IP.
- **Cookie Consent Banner ([`js/cookie-consent.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/cookie-consent.js)):** Banner leve LGPD/GDPR no primeiro acesso com persistência em `localStorage`.
- **Rodapé Semântico com 4 Colunas:** Padronizado em todas as 20 páginas (Modos de Jogo, Comunidade, Legal & Transparência, Idiomas Oficiais).
- **Robots e Sitemaps:** [`robots.txt`](file:///c:/Users/NT118/antigravity/lula-simulator/robots.txt), [`robots-en.txt`](file:///c:/Users/NT118/antigravity/lula-simulator/robots-en.txt), [`sitemap.xml`](file:///c:/Users/NT118/antigravity/lula-simulator/sitemap.xml) e [`sitemap-en.xml`](file:///c:/Users/NT118/antigravity/lula-simulator/sitemap-en.xml) atualizados com liberação expressa para `Mediapartners-Google` e `Googlebot`.

### 3. Modo "AdSense Review Safe" ([`js/ads-manager.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/ads-manager.js))
- `ADSENSE_REVIEW_MODE = true`: Desativa completamente scripts da Adsterra e auto-refresh de iframes.
- Oculta automaticamente containers vazios com `display: none` para prevenir layout shifts e espaços vazios.
- Sistema de Revive (Segunda Chance) aciona modal interno com contagem de 5 segundos (Rewarded Ad Break oficial) ou a API do Google H5 Games (`adBreak`), pausando e retomando áudios sem smartlinks externos em nova aba.

### 4. Enriquecimento Editorial Denso (Anti-Conteúdo Insuficiente)
- **Home (`index.html` e `en/index.html`):** Inserida a seção *"Guia Oficial de Estratégia, Mecânicas e Enciclopédia de Personagens"* com mais de 600 palavras em HTML semântico explicando a física do Flappy 2D, o Modo Prisão (13 pontos), antecipação de curvas nos morros no 3D Runner e cards caricatos de todos os personagens jogáveis.
- **Páginas de Jogos (`jogo.html` e `correr.html`):** Guias textuais completos abaixo do Canvas com mais de 360 palavras, tabelas de controles, sistema de selos e changelog.

### 5. SEO Técnico Máximo, Dados Estruturados & Core Web Vitals
- Preconnect para `https://fonts.gstatic.com` com atributo `crossorigin`.
- Inclusão da fonte retro `'Press Start 2P'` com `&display=swap` no Google Fonts.
- Dimensões explícitas `width="1024" height="1024"` e `fetchpriority="high"` nas imagens principais do Hero.
- Metatags `og:image:width` (1200) e `og:image:height` (630) para miniaturas instantâneas no WhatsApp.
- Dados Estruturados Schema.org JSON-LD unificados com `@graph` (`WebSite`, `VideoGame`, `FAQPage`, `BreadcrumbList`).

### 6. Engajamento Viral — Reta Final do 2º Turno (25/10/2026)
- [`js/election-timer.js`](file:///c:/Users/NT118/antigravity/lula-simulator/js/election-timer.js) atualizado: marca o 1º Turno (04/10/2026) como concluído e aciona contagem regressiva para o **2º Turno (25/10/2026)**.
- Game Over com botão pulsante **"⚔️ Desafiar Amigo no WhatsApp (Duelo 2º Turno)"** gerando links `?duel=ID` com mensagem provocativa.
- Indicador dinâmico de **"Próxima Conquista"** incentivando o jogador a reviver e buscar novo recorde.

### 7. Padronização do Menu Mobile
- Identificador `id="navToggle"` e listeners JavaScript unificados em todas as páginas PT e EN.

---

## 🗂️ Mapa de Arquivos

```
lula-simulator/
├── index.html                  # Home PT-BR (Guia Editorial, Hero 1024x1024, Aquecimento 2º Turno, FAQ)
├── jogo.html                   # Flappy Lula 2D PT-BR (Guia Textual, Duelo WhatsApp, Modo Prisão)
├── correr.html                 # Empresário 3D PT-BR (Guia Textual, Duelo WhatsApp, Three.js 6x)
├── ranking.html                # Ranking Top 300 PT-BR
├── loja.html                   # Loja de Skins PT-BR
├── conquistas.html             # Badges e Conquistas PT-BR
├── social.html                 # Social, Duelos PvP e Notificações PT-BR
├── visitantes.html             # Visitantes Globais PT-BR
├── feedback.html               # Feedbacks da Comunidade PT-BR
├── contato.html                # Contato com o Desenvolvedor PT-BR
├── privacidade.html            # Política de Privacidade & Cookies DART (LGPD/GDPR)
├── termos.html                 # Termos de Uso e Declaração de Paródia
│
├── en/                         # Versão espelhada em Inglês (flappylula.com)
│   ├── index.html
│   ├── jogo.html
│   ├── correr.html
│   ├── privacy.html
│   ├── terms.html
│   └── ... (demais páginas traduzidas)
│
├── js/
│   ├── language-manager.js     # Gerenciador Dual-Domain e Blindagem Anti-Bot
│   ├── ads-manager.js          # AdSense Review Safe e Rewarded Ad Modal H5 Games
│   ├── cookie-consent.js       # Banner leve de consentimento LGPD/GDPR
│   ├── election-timer.js       # Contagem regressiva do 2º Turno (25/10/2026)
│   ├── game/                   # Módulos Three.js do Empresário 3D
│   ├── audio.js                # Sistema de áudio do Flappy 2D
│   ├── auth.js                 # Autenticação e perfil Firebase
│   └── firebase-config.js      # Conexão Firestore e Scores
│
├── css/
│   └── styles.css              # Design System cósmico/neon, rodapé semântico e animações
├── robots.txt                  # Robots PT com permissão expressa para Googlebot/Mediapartners
├── robots-en.txt               # Robots EN com permissão expressa para Googlebot/Mediapartners
├── sitemap.xml                 # Sitemap PT-BR indexando todas as páginas incluindo legais
├── sitemap-en.xml              # Sitemap EN indexando todas as páginas incluindo legais
└── HISTORICO_DO_PROJETO.md     # Este documento de referência
```
