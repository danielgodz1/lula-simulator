# 🇧🇷 Lula Simulator — The Ultimate Brazilian Arcade & Satire Experience

> **Um projeto arcade satírico e interativo completo, com múltiplos modos de jogo (2D e 3D), sistema de personagens com habilidades únicas, galeria de conquistas, placar global em tempo real e arquitetura de backend em nuvem com máxima segurança.**

---

## 🎮 Modos de Jogo

### 1. 🐦 Flappy Lula (Arcade 2D)
- **Engine**: Canvas HTML5 com renderização **Retina Super-Sampling HD (2x a 3x)** no PC e Celular.
- **Gráficos & Ambientação**:
  - Tubulações estilizadas em degradê com bordas de alto contraste.
  - Chão texturizado com camadas de grama e terra pixel-art.
  - Skyline dinâmico com prédios, janelinhas iluminadas e nuvens em paralaxe suave.
  - Dificuldade progressiva suave e balanceada a cada 300 pontos, travada em 60 FPS fixos.
- **Eventos & Easter Eggs**:
  - **🚨 Modo Prisão (13 Pontos)**: Ao atingir 13 picanhas, faixas de alerta *"171 DETECTADO!"* são acionadas e bonecos 2D presidiários com a inscrição "171" correm na parte inferior do cenário.
  - **🔊 Sistema de Áudio Dinâmico**:
    - Trilha de abertura sutil no início da partida (*"Brasil, Brasil!"*).
    - Áudio especial ao ultrapassar 100 pontos (*"O homem, uma máquina, uma besta enjaulada!"*).
    - Áudio temático na derrota do Lula (*"É só isso, acabou..."*).
    - Gerenciamento inteligente contra sobreposição e volume calibrado.

---

### 2. 🏃 O Empresário vs CLT (Endless Runner 3D)
- **Engine**: **Three.js (WebGL)** com iluminação dinâmica, sombras suaves, névoa volumétrica e ciclo dia/noite em tempo real.
- **Ambientação Brasileira & Favela Urbana**:
  - **Morro da Favela em Parallax Contínuo**: Cenário panorâmico com centenas de casinhas empilhadas na encosta, postes com fiação suspensa e caixas d'água cilíndricas.
  - **Ciclo Dinâmico de 24 Horas**: Começa às 5h da manhã (Alvorecer) e progride suavemente para Manhã Radiante, Meio-Dia Tropical, Pôr do Sol (*Golden Hour*) e Noite Estrelada com janelas e postes que se acendem dinamicamente.
- **Mecânicas de Jogabilidade & Power-ups 3D**:
  - **👟 Sapatos Sociais Dourados Alados (Super Pulo)**: Ícone 3D reluzente na pista que equipa nos pés do empresário, batendo asinhas no ar para saltos altos.
  - **🧲 Ímã 3D em Ferradura (Magnet)**: Modelo 3D em formato U que o personagem segura na mão esquerda para atrair todas as moedas e picanhas.
  - **📄 Documentos e Obstáculos Brasileiros**: Carteira de Trabalho CLT 44H, Cartão Bolsa Família e Cartão Auxílio Brasil em cards estilizados flutuantes com UV Mapping.
  - **Deslize Realista de 90º (Slide)**: O personagem deita rente ao chão para passar sob varais de roupa, reduzindo a hitbox pela metade.
  - **🔊 Áudio Espacial**: Efeito Doppler realista na passagem dos trens de metrô e buzina de alerta na mesma faixa.

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

## 🏅 Sistema de Conquistas & Badges ([conquistas.html](conquistas.html))

- **Galeria Visual Completa**: Acompanhe seu progresso de picanhas e recordes para desbloquear cada figura histórica.
- **Barra de Progresso Dinâmica**: Percentuais calculados em tempo real com metas específicas por personagem e missão.
- **Modal de Zoom**: Inspecione o avatar em alta definição e leia a descrição detalhada da habilidade.

---

## 🏆 Placar Global & Ranking de Líderes ([ranking.html](ranking.html))

- **Classificação Dupla**: Abas separadas para o **Flappy Lula** (pontos em picanhas 🥩) e **Empresário 3D** (distância em km 🏃).
- **Consolidação Otimizada**: Utiliza documento consolidado Top 50 com 1 única leitura por consulta e cache local TTL (90s).
- **Busca em Tempo Real**: Filtro instantâneo por nome/apelido de jogador.
- **Pódios & Medalhas**: Destaque visual para o 1º (👑), 2º (🥈), 3º (🥉) e demais posições.

---

## ⭐ Avaliações da Comunidade & Feedbacks ([feedback.html](feedback.html))

- Envio de avaliações de 1 a 5 estrelas com comentários públicos sobre a experiência.
- Sanitização rigorosa contra injeção de scripts (XSS) e filtros de integridade.

---

## 🛡️ Arquitetura de Segurança, Banco de Dados & Backend

### 1. Autenticação Autoritativa com Firebase Admin SDK (`/api/auth`)
- **Geração Segura de Hash e Salt no Servidor**: O servidor gera um Salt criptográfico individual de 128-bit (`crypto.randomBytes(16)`) associado a hash **SHA-256**. O cliente nunca decide ou envia hashes diretamente.
- **Proteção Anti-Sobrescrita no Registro**: Antes de cadastrar, o servidor verifica se o documento de credenciais ou perfil já possui senha, retornando `HTTP 409 Conflict` em tentativas de registro duplicado.
- **Migração Automática & Limpeza**: Contas legadas são autenticadas e migradas automaticamente para o padrão com Salt Individual, removendo campos confidenciais residuais do documento público via `admin.firestore.FieldValue.delete()`.

### 2. Cloud Firestore com Regras Restritivas ([firestore.rules](firestore.rules))
- **Subcoleção Privada Isolada (`/private/credentials`)**: 100% fechada para o cliente (`allow read, write: if isAdmin();`). Leituras e gravações ocorrem exclusivamente através do Admin SDK autenticado.
- **Imutabilidade de Pontuações**: Regra estrita `request.resource.data.score >= resource.data.score` impedindo que qualquer jogador reduza o recorde de outro.
- **Validação de Esquema (`keys().hasOnly(...)`)**: Bloqueia a injeção de propriedades arbitrárias em todas as coleções.

### 3. Vercel Serverless Functions (`/api/`)
- **Gestão Segura de Credenciais**: Chaves de serviço gerenciadas via variáveis de ambiente seguras da Vercel (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), mantendo o repositório público 100% livre de segredos.
- **Prevenção de NoSQL Injection**: Higienização e codificação de parâmetros de entrada com `encodeURIComponent()` e regex sanitizadora.

---

## 🌟 Últimas Atualizações & Novas Funcionalidades

- **✂️ Perfil do Jogador com Foto Customizada & Recorte Interativo**:
  - Faça upload de qualquer foto direto da câmera ou galeria do celular e PC.
  - **Ferramenta de Enquadramento & Zoom no Navegador**: Arraste a foto para ajustar a posição e use o slider de zoom (`🔍 Zoom 1x a 3.5x`) com prévia da máscara circular.
  - **Compressão Ultra-Leve no Cliente (Canvas WebP/JPEG)**: Redimensiona para $100 \times 100\text{ px}$ com compressão automática ($\approx 3\text{KB}$ a $6\text{KB}$), garantindo zero sobrecarga no banco de dados e no tráfego de rede.
  - **Avatares Pré-definidos**: Escolha instantânea entre personagens do jogo (Lula, Marçal, Dilma, Empresário, Bolsonaro, Moraes, Nikolas, Janja).
- **🏆 Fotos de Perfil no Ranking Nacional ([ranking.html](ranking.html))**:
  - Exibição de miniaturas de avatar personalizadas ao lado de cada jogador no placar de líderes.
  - Fallback automático para o Avatar Retrô Padrão em SVG (sem requisições extras).
  - Arquitetura de leitura única no Firestore (`lula_leaderboards_v2`), preservando a alta performance e baixo custo de operações.
- **☁️ Sincronização Multi-Dispositivo na Nuvem (`/api/sync`)**:
  - Sincronização bidirecional e atômica de progresso entre celular e computador (`dilmaScore`, `flappyScore`, `runnerScore`, `totalPicanhas`, `runnerCoins`, `unlockedCharacters` e `avatar`).
  - **Desbloqueio definitivo do Pablo Marçal**: Garante que o progresso obtido no celular (ex: 200 pontos com a Dilma) seja propagado instantaneamente para o PC e vice-versa.
  - Botão manual *"🔄 Sincronizar com a Nuvem"* no modal de perfil e no painel de conquistas com relatório detalhado de status.
- **🚀 Carregamento Instantâneo & Fallback 3D Procedural (Empresário 3D)**:
  - Inicialização com zero delay em dispositivos móveis e computadores.
  - Renderização procedural imediata de personagens 3D enquanto os modelos `.glb` são baixados em segundo plano com *hot-swap* automático.
- **🔊 Seletor de Áudio em 3 Modos**:
  - `🔊 Áudio Completo`: Efeitos arcade + falas e memes sonoros.
  - `🎮 Apenas Sons do Jogo`: Efeitos essenciais de gameplay sem memes falados.
  - `🔇 Modo Mudo`: Silenciamento total com persistência local.
- **📱 Navbar Responsiva & Menu Mobile Aprimorado**:
  - Botão *"☰ Menu"* exibido exclusivamente em telas mobile (`<= 950px`) e oculto no Desktop.
  - Cartão de perfil integrado no menu lateral mobile com foto do jogador, contagem de recursos e acesso rápido à edição.

---

## 💻 Tecnologias Utilizadas

- **Frontend Core**: HTML5, Vanilla JavaScript (ES6+ Modules), Vanilla CSS3 (Design System próprio, Glassmorphism, Micro-animações).
- **Gráficos 3D**: [Three.js r128](https://threejs.org/) (WebGL) com Shaders GLSL customizados para animação fisiológica de corrida.
- **Backend Serverless**: Node.js 18+ em Vercel Functions (`/api/auth`).
- **Banco de Dados & Autenticação**: Google Cloud Firestore & Firebase Admin SDK.
- **Deploy & CI/CD**: [Vercel](https://vercel.com) com deploy automático a cada push no GitHub.

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/danielgodz1/lula-simulator.git
   cd lula-simulator
   ```

2. Instale as dependências do backend serverless:
   ```bash
   npm install
   ```

3. Inicie o servidor local:
   ```bash
   # Com Vercel CLI (executa frontend e serverless functions em /api):
   npx vercel dev

   # Ou qualquer servidor estático para o frontend:
   npx serve .
   ```

---

## 📜 Licença & Créditos

Projeto desenvolvido por **Daniel dos Santos** no **SENAI** (Curso de Programação com Inteligência Artificial) como uma sátira social e política interativa sobre o Brasil. 🇧🇷
