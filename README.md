# 🇧🇷 Lula Simulator — The Ultimate Brazilian Arcade & Satire Experience

> **Um projeto arcade satírico e interativo completo, com múltiplos modos de jogo (2D e 3D), sistema de personagens com habilidades únicas, galeria de conquistas, placar global e arquitetura em nuvem com segurança máxima.**

---

## 🎮 Modos de Jogo

### 1. 🐦 Flappy Lula (Arcade 2D)
- **Engine**: Canvas HTML5 com renderização **Retina Super-Sampling HD (2x a 3x)** no PC e Celular.
- **Gráficos & Ambientação**:
  - Tubulações estilizadas em degradê com bordas de alto contraste.
  - Chão texturizado com camadas de grama e terra pixel-art.
  - Skyline dinâmico com prédios, janelinhas iluminadas e nuvens em paralaxe suave.
- **Modos de Dificuldade**:
  - ⚡ **Modo Fácil**: Velocidade balanceada, maior espaçamento entre os canos e curva suave.
  - 🔥 **Modo Difícil**: Velocidade turbo acelerada e menor tempo de reação.
- **Eventos & Easter Eggs**:
  - **🚨 Modo Prisão (13 Pontos)**: Ao atingir 13 picanhas, faixas de alerta *"171 DETECTADO!"* são acionadas e bonecos 2D presidiários com a inscrição "171" correm na parte inferior do cenário.
  - **🔊 Sistema de Áudio Dinâmico**:
    - Trilha de abertura sutil no início da partida (*"Brasil, Brasil!"*).
    - Áudio especial ao ultrapassar 100 pontos (*"O homem, uma máquina, uma besta enjaulada!"*).
    - Áudio temático na derrota do Lula (*"É só isso, acabou..."*).
    - Gerenciamento inteligente contra sobreposição e volume calibrado.

---

### 2. 🏃 O Empresário vs CLT (Endless Runner 3D)
- **Engine**: **Three.js (WebGL)** com iluminação dinâmica, sombras, névoa volumétrica e trilha urbana procedural.
- **Mecânicas**:
  - Corrida em 3 pistas com controles via teclado (`A`/`D`, Setas, `W`/Espaço para pular, `S` para deslizar) ou touch/swipe no mobile.
  - Esquive de Carteiras de Trabalho gigantes, impostos, trens em alta velocidade e bloqueios fiscais.
  - Hitbox balanceada e sistema de física com pulo duplo.

---

## 🎭 Elenco de Personagens & Habilidades Especiais

| Personagem | Título | Requisito de Desbloqueio | Habilidade & Efeitos Visuais |
| :--- | :--- | :---: | :--- |
| 🕊️ **Lula da Silva** | *O Presidente* | **Inicial (Padrão)** | Voo suave e tolerante a colisões leves. Acúmulo padrão de picanhas. |
| 👠 **Janja da Silva** | *A Primeira-Dama* | **30 Picanhas** 🥩 | Hitbox reduzida e voo ágil com aura violeta/rosa. |
| 🏛️ **Alexandre de Moraes** | *O Ministro* | **50 Picanhas** 🥩 | Voo imponente com aura azul e tolerância judicial a impactos. |
| ⚡ **Nikolas Ferreira** | *O Viral da Internet* | **60 Picanhas** 🥩 | **Habilidade Viral**: Velocidade acelerada com 2x picanhas. A cada 1 minuto de partida, o Lula aparece flutuando concedendo **20 segundos de lentidão** e pontos triplicados (3x)! |
| 🏍️ **Jair Bolsonaro** | *O Ex-Presidente* | **100 Picanhas** 🥩 | **Modo Motociata**: Aura verde-amarela acelerada e impulsão aerodinâmica. |
| 🥔 **Dilma Rousseff** | *A Estocadora de Vento* | **100 Picanhas** 🥩 | **Saudação à Mandioca**: Solta chuva contínua de mandiocas e aipins dourados (`🥔`, `🍠`, `🌾`) pelos canos. Acumula picanhas normalmente no placar! |
| 💵 **Pablo Marçal** | *O Homem do Código* | **Liberar Dilma + Fazer 200 pts com ela** 🏆 | **Mindset Quântico 3X**: Velocidade 1.35x maior, **triplica todos os pontos obtidos (3X score)** e joga chuva de notas de dinheiro e dólares (`💵`, `💸`, `💰`, `🤑`) pelo ar. |

---

## 🏅 Sistema de Conquistas, Badges & Galeria ([conquistas.html](file:///c:/Users/NT118/antigravity/lula-simulator/conquistas.html))

- **Galeria Visual Completa**: Acompanhe seu progresso de picanhas e recordes para desbloquear cada figura histórica.
- **Barra de Progresso Dinâmica**: Percentuais calculados em tempo real com metas específicas por personagem e missão.
- **Modal de Zoom**: Clique em qualquer conquista para inspecionar o avatar em alta definição e ler a descrição detalhada da habilidade.

---

## 🏆 Placar Global & Ranking de Líderes ([ranking.html](file:///c:/Users/NT118/antigravity/lula-simulator/ranking.html))

- **Classificação Dupla**: Abas separadas para o **Flappy Lula** (pontos em picanhas 🥩) e **Empresário 3D** (distância em km 🏃).
- **Cobertura 100% de Jogadores**: Exibe todos os jogadores com pontuação registrada no banco de dados.
- **Busca em Tempo Real**: Filtro instantâneo por nome/apelido de jogador.
- **Pódios & Medalhas**: Destaque para o 1º (👑), 2º (🥈), 3º (🥉) e posições gerais.

---

## ⭐ Avaliações da Comunidade & Feedbacks ([feedback.html](file:///c:/Users/NT118/antigravity/lula-simulator/feedback.html))

- Envio de avaliações de 1 a 5 estrelas com comentários públicos sobre a experiência.
- Sanitização contra injeção de scripts (XSS).

---

## 🛡️ Arquitetura de Segurança, Banco de Dados & Backend

### 1. Cloud Firestore com Regras Blindadas ([firestore.rules](file:///c:/Users/NT118/antigravity/lula-simulator/firestore.rules))
- **Administrador Exclusivo**: Permissões de administração e exclusão restritas unicamente à conta Google oficial do projeto (`insanodanieldoublegaming@gmail.com`).
- **Imutabilidade de Pontuações**: Regra estrita `request.resource.data.score >= resource.data.score` — nenhum terceiro ou script consegue diminuir, zerar ou ocultar o placar de ninguém.
- **Subcoleção Privada de Credenciais (`/private/credentials`)**: 
  - O documento público `lula_users_v2/{userId}` contém apenas dados de perfil.
  - Senhas são criptografadas com **SHA-256 + Salt aleatório de 16 bytes (32 hex)** gerado por usuário.
  - A subcoleção privada bloqueia leituras não autorizadas (`allow get: if isAdmin();`), retornando **HTTP 403** para qualquer tentativa de scraping externo.
- **Controle Estrito de Campos (`keys().hasOnly(...)`)**: Bloqueia a injeção de chaves maliciosas extras em todas as coleções.

### 2. Vercel Serverless Functions (`/api/`)
- **`/api/auth`**: Autenticação e registro seguros no servidor com migração automática de contas antigas para salt individual.
- **`/api/score`**: Agregação de placares com IP de datacenter e fallback inteligente.
- **`/api/feedback` & `/api/contact`**: Validação e sanitização de dados no backend.

### 3. Otimização de Performance & Rede
- **Redução de 95% do consumo de banco**: O gameplay executa **100% no cliente (ZERO requisições durante o voo)** e realiza uma única sincronização leve no *Game Over*.
- **Cache Local Resiliente**: O frontend mantém cache local seguro para garantir que placares e feedbacks nunca fiquem em branco, mesmo em eventuais limites de cota do Google.

---

## 💻 Tecnologias Utilizadas

- **Frontend Core**: HTML5, Vanilla JavaScript (ES6+ Modules), CSS3 (Flexbox/Grid, Glassmorphism, Micro-animações).
- **Gráficos 3D**: [Three.js](https://threejs.org/) (WebGL).
- **Backend Serverless**: Node.js em Vercel Functions.
- **Banco de Dados & Autenticação**: Google Cloud Firestore & Web Crypto API (`SubtleCrypto` SHA-256 + `getRandomValues`).
- **Deploy & Hosting**: [Vercel](https://vercel.com).

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/danielzin173/lula-simulator.git
   cd lula-simulator
   ```

2. Inicie qualquer servidor HTTP estático:
   ```bash
   # Com Python:
   python -m http.server 8080

   # Ou com Node.js (npx):
   npx serve .
   ```

3. Acesse `http://localhost:8080` no seu navegador.

---

## 🌐 Deploy em Produção
- **Projeto Oficial no GitHub**: [danielzin173/lula-simulator](https://github.com/danielzin173/lula-simulator)
