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
| ⚡ **Nikolas Ferreira** | *O Viral da Internet* | **300 Pts Flappy + 300 km Corredor** 🏃 | **Habilidade Viral**: Velocidade acelerada com 2x picanhas. A cada 1 minuto de partida, o Lula aparece flutuando concedendo **20 segundos de lentidão** e pontos triplicados (3x)! |
| 🏍️ **Jair Bolsonaro** | *O Capitão Patriota* | **60 Picanhas** 🥩 | **Voo Patriota**: Espaço entre os canos 15% mais aberto para desvios fáceis e seguros. |
| 🥔 **Dilma Rousseff** | *Coração Valente* | **100 Picanhas** 🥩 | **Estocando Vento**: Gravidade 10% mais suave permitindo planeios controlados com facilidade. |
| 💵 **Pablo Marçal** | *O Homem do Código* | **Liberar Nikolas + Fazer 900 pts com ele** 🏆 | **Mindset Quântico 3X**: Velocidade 1.35x maior, **triplica todos os pontos obtidos (3X score)** e joga chuva de notas de dinheiro e dólares (`💵`, `💸`, `💰`, `🤑`) pelo ar. |

---

## 🛍️ Loja de Skins Cosméticas & Prestígio Lendário ([loja.html](loja.html))

- **17 Skins Visuais Exclusivas**: Variações estilizadas para todos os personagens, compráveis com **Picanhas Acumuladas** (Flappy Lula) ou **Moedas do Corredor** (Empresário 3D):
  - **Lula**: *Terno Presidencial Dourado*, *Lula Ciborgue 2077*, *Lula de Férias na Praia*.
  - **Bolsonaro**: *Capitão Motociclista*, *Patriota Dourado Lendário*.
  - **Nikolas**: *Nikolas Gamer RGB*, *Nikole de Peruca*.
  - **Janja**: *Janja Alta Costura*, *Janja Fashionista Neon*.
  - **Moraes**: *Xandão Toga Dourada STF*, *Guardião Cósmico da Constituição*.
  - **Dilma**: *Mandiocósmica Dourada*, *Estocadora do Vento Galáctica*.
  - **Marçal**: *Marçal Black Card Bilionário*, *Holográfico Quântico 3X*.
  - **Empresário 3D**: *Faria Lima Colete Puffer*, *Empresário Cyberpunk Neon*.
- **Seleção & Equipamento In-Game ([jogo.html](jogo.html))**: Seletor visual integrado no modal de personagens do Flappy Lula, permitindo alternar livremente entre o visual *Padrão* e qualquer skin desbloqueada.
- **Renderização com Alfa Transparente Puro**: Sprites com canal alfa de 32 bits, alinhamento anatômico de voo e animação de capas ondulantes temáticas.
- **Nível de Prestígio**: Reinicie seu saldo de picanhas em troca de insígnias permanentes de prestígio exibidas no Perfil e no Ranking Nacional.

---

## 🏅 Sistema de Conquistas & Badges ([conquistas.html](conquistas.html))

- **Galeria Visual Completa**: Acompanhe seu progresso de picanhas, quilômetros corridos e recordes para desbloquear cada figura histórica.
- **Barra de Progresso Combinada**: Percentuais calculados em tempo real com metas específicas por personagem e missões multi-jogo (ex: requisito duplo de Flappy + Corredor 3D).
- **Modal de Zoom**: Inspecione o avatar em alta definição e leia a descrição detalhada da habilidade.

---

## 🏆 Placar Global & Ranking de Líderes ([ranking.html](ranking.html))

- **Classificação Dupla**: Abas para o **Flappy Lula** (pontos em picanhas 🥩) e **Empresário 3D** (distância em km 🏃).
- **Abas de Recorde de Partida vs Total Acumulado**: Disputa tanto pelo maior recorde de uma única corrida quanto pelo volume total acumulado de picanhas e moedas.
- **Classificação Semanal Rotativa**: Início automático a cada segunda-feira com cálculo baseado em semana ISO (`YYYY-Www`), permitindo que novos jogadores cheguem ao Topo da Semana.
- **Consolidação Otimizada**: Utiliza documento consolidado Top 50 com 1 única leitura por consulta e cache local TTL (90s).

---

## ✉️ Formulário de Contato & E-mail Transacional ([contato.html](contato.html) & [api/contact.js](api/contact.js))

- **Envio de E-mails via Resend**: Integração direta com a API do Resend (`RESEND_API_KEY`) para encaminhamento imediato de mensagens com formatação HTML e `reply-to` automático.
- **Armazenamento Resiliente no Firestore**: Mensagens gravadas na coleção `lula_contact_messages`, garantindo zero perda de dados mesmo em instabilidades de rede.
- **Proteção Anti-Spam & Rate Limiting**: Honeypots invisíveis e controle de frequência por IP.

---

## ⭐ Avaliações da Comunidade & Feedbacks ([feedback.html](feedback.html))

- Envio de avaliações de 1 a 5 estrelas com comentários públicos sobre a experiência.
- Notificação automática por e-mail para novas avaliações enviadas.
- Sanitização rigorosa contra injeção de scripts (XSS) e filtros de integridade.

---

## 🛡️ Arquitetura de Segurança, Banco de Dados & Backend

### 1. Autenticação Autoritativa com Firebase Admin SDK (`/api/auth`)
- **Geração Segura de Hash e Salt no Servidor**: O servidor gera um Salt criptográfico individual de 128-bit (`crypto.randomBytes(16)`) associado a hash **SHA-256**. O cliente nunca decide ou envia hashes diretamente.
- **Proteção Anti-Sobrescrita no Registro**: Antes de cadastrar, o servidor verifica se o documento de credenciais ou perfil já possui senha, retornando `HTTP 409 Conflict` em tentativas de registro duplicado.
- **Sincronização Multiplataforma**: Inventário de personagens (`unlockedCharacters`) e skins (`unlockedSkins`/`equippedSkins`) sincronizado em nuvem no Firestore (`lula_users_v2`), mantendo o progresso entre celular e computador.

### 2. Cloud Firestore com Regras Restritivas ([firestore.rules](firestore.rules))
- **Subcoleção Privada Isolada (`/private/credentials`)**: 100% fechada para o cliente (`allow read, write: if isAdmin();`). Leituras e gravações ocorrem exclusivamente através do Admin SDK autenticado.
- **Imutabilidade de Pontuações**: Regra estrita `request.resource.data.score >= resource.data.score` impedindo que qualquer jogador reduza o recorde de outro.
- **Validação de Esquema (`keys().hasOnly(...)`)**: Bloqueia a injeção de propriedades arbitrárias em todas as coleções.

### 3. Vercel Serverless Functions (`/api/`)
- **Gestão Segura de Credenciais**: Chaves de serviço gerenciadas via variáveis de ambiente seguras da Vercel (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `RESEND_API_KEY`), mantendo o repositório público 100% livre de segredos.
- **Prevenção de NoSQL Injection**: Higienização e codificação de parâmetros de entrada com `encodeURIComponent()` e regex sanitizadora.

---

---

## 👥 Sistema Social, Amizades & Duelos Competitivos ([social.html](social.html) & [api/social.js](api/social.js))

- **🤝 Sistema de Amigos Completo**:
  - **Busca Instantânea por Username**: Pesquisa de jogadores em tempo real com auto-completar inteligente.
  - **Badges de Status Dinâmicos**: O sistema identifica o estado da relação com cada jogador, exibindo `⭐ JÁ É AMIGO`, `⏳ PEDIDO ENVIADO` ou `ACEITAR PEDIDO` de forma automática.
  - **Gestão de Solicitações**: Seção de solicitações enviadas (com opção de cancelamento) e solicitações recebidas (aceitar/recusar).
  - **Bloqueio de Auto-Amizade**: Proteção nativa impedindo que o jogador envie solicitações para si mesmo ou apareça nos seus próprios resultados de busca.
- **⚔️ Duelos Assíncronos & Placar de Invictos (*Win Streak*)**:
  - Desafie qualquer amigo ou jogador para duelos de 48 horas no **Flappy Lula** ou no **Empresário 3D**.
  - Comparação de pontuação em tempo real: ao bater o recorde do adversário, a vitória é confirmada e o jogador acumula sequências de vitórias no placar de invictos.
- **🏆 Copa Brasília (Torneio Semanal)**:
  - Chaveamento eliminatório gerado semanalmente reunindo os 8 melhores jogadores do ranking nacional.
  - Premiação automática e troféu virtual para o grande campeão da semana.
- **🔔 Central de Notificações In-App**:
  - Sino de alertas integrado no cabeçalho de todas as páginas com contador de notificações não lidas.
  - Alertas automáticos para novos pedidos de amizade, aceitações, desafios recebidos e vitórias em duelos.

---

## 💻 Tecnologias Utilizadas

- **Frontend Core**: HTML5, Vanilla JavaScript (ES6+ Modules), Vanilla CSS3 (Design System próprio, Glassmorphism, Micro-animações).
- **Gráficos 3D**: [Three.js r128](https://threejs.org/) (WebGL) com Shaders GLSL customizados e Otimização de Garbage Collection (Object Pooling).
- **Backend Serverless**: Node.js 18+ em Vercel Functions (`/api/auth`, `/api/score`, `/api/shop`, `/api/social`, `/api/contact`, `/api/feedback`, `/api/sync`).
- **Comunicação Transacional**: [Resend](https://resend.com) SDK para disparo de e-mails em HTML.
- **Banco de Dados & Autenticação**: Google Cloud Firestore & Firebase Admin SDK.
- **Deploy & CI/CD**: [Vercel](https://vercel.com) com deploy automático a cada push no GitHub.

---

## 🌟 Últimas Atualizações & Novas Funcionalidades (v3.0)

- **👥 Sistema Social Completo & Duelos Competitivos ([social.html](social.html) & [api/social.js](api/social.js))**:
  - Adição direta de amigos, gestão de pedidos pendentes e cancelamento.
  - Duelos assíncronos com sistema de pontuação e ranking de invictos.
  - Torneio Semanal "Copa Brasília" e sino de notificações in-app em tempo real.
- **🐦 Rebalanceamento de Física & Dificuldade Progressiva Arcade ([jogo.html](jogo.html))**:
  - **Curva de Velocidade Calibrada**: Progressão suave de $1.0\times \to 2.0\times$ aos 1.000 pontos (similar ao tempo clássico de 24 min do Flappy Bird original) e aceleração progressiva de $2.0\times \to 5.0\times$ aos 5.000 pontos.
  - **Variação Orgânica de Altura dos Canos**: Alternância dinâmica entre zonas altas (céu), médias e baixas (solo) com espaçamento horizontal confortável ($>300\text{px}$).
  - **Vão de Passagem (GAP) de Alta Precisão**: Vão vertical calibrado para premiar precisão e controle de salto.
  - **Remoção de Silhueta Shadow/Ghost**: Tela 100% limpa e nítida durante a gameplay para máximo foco.
- **🏆 Pódio Top 3 Nacional Simplificado na Home ([index.html](index.html))**:
  - Exibição focada exclusivamente no **Top 3** do Brasil (Flappy Lula e Empresário 3D), mantendo a página inicial ultra-rápida, leve e elegante.
  - Ranking completo Top 300 disponível com filtros detalhados na página dedicada [ranking.html](ranking.html).
- **⚡ Super Auditoria & Otimização de Performance 3D ([correr.html](correr.html))**:
  - **Object Pooling Rigoroso (Zero Garbage Collection)**: Moedas, partículas e elementos dinâmicos reciclados continuamente.
  - **Painel de Métricas de Debug em Tempo Real**: Ativável via tecla `D` ou botão `⚡ FPS`.
- **📅 Placar Geral vs Placar Semanal Rotativo ([ranking.html](ranking.html) & [/api/score.js](api/score.js))**:
  - Classificação rotativa por Semana ISO (`YYYY-Www`) com medalhas de honra equipáveis.

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

## 🔍 Guia Completo de SEO & Indexação no Google (Mesmo em `.vercel.app`)

### ❓ É possível fazer um bom SEO e aparecer no Google com o domínio `.vercel.app`?
**Sim, com certeza!** O algoritmo do Google **não penaliza** subdomínios da Vercel (`.vercel.app`). O Google avalia:
1. **Velocidade de Carregamento (Core Web Vitals)**: O site feito em Vanilla JS/HTML tem carregamento quase instantâneo e pontuação máxima (95-100) no Google Lighthouse.
2. **On-Page SEO Estruturado**: Presença de `sitemap.xml`, `robots.txt`, títulos e descrições semânticas, tags Open Graph e dados estruturados JSON-LD.
3. **Estratégia de Palavras-Chave de Alta Intenção**:
   - A palavra isolada *"Lula"* é extremamente concorrida com portais de notícias governamentais e Wikipédia.
   - **Porém**, para termos onde o público realmente procura um jogo ou experiência divertida, o site tem altíssimo potencial de alcançar o **Top 1 a Top 3**:
     - `lula simulator`
     - `jogo do lula`
     - `simulador do lula`
     - `jogo lula online`
     - `flappy lula`
     - `jogo do empresario lula`
     - `jogar jogo do lula gratis`

---

### 🛠️ Otimizações de SEO Implementadas no Código
- **📄 [sitemap.xml](sitemap.xml)**: Mapeamento de todas as páginas do site com prioridades e frequência de atualização para os robôs de busca.
- **🤖 [robots.txt](robots.txt)**: Instruções autorizando indexação de todas as páginas públicas e apontamento para o Sitemap.
- **🏷️ Meta Tags & Open Graph**: Títulos otimizados, meta descriptions chamativas, keywords e imagens de preview para compartilhamentos no WhatsApp, Telegram, Instagram e Twitter/X.
- **📊 Dados Estruturados Schema.org (`VideoGame`)**: Código JSON-LD informando ao Google que o site é um jogo interativo com avaliação, autor e categoria.
- **❓ Seção de Perguntas Frequentes (FAQ)**: Conteúdo semântico na página inicial que responde diretamente às pesquisas dos usuários no Google.

---

### 🚀 Passo a Passo para Ativar a Indexação Imediata no Google Search Console

Para o Google encontrar e colocar seu site nas pesquisas em poucos dias (em vez de esperar semanas), siga este roteiro gratuito:

1. **Acesse o Google Search Console**:
   - Entre em [search.google.com/search-console](https://search.google.com/search-console) e faça login com sua conta Google.
2. **Adicione a Propriedade**:
   - Selecione a opção **"Prefixo do URL"** (à direita).
   - Digite: `https://lulasimulator.com.br` e clique em **Continuar**.
3. **Confirme a Propriedade**:
   - Escolha o método **"Tag HTML"** ou faça login na mesma conta do Google Analytics se já possuir.
4. **Envie o Sitemap**:
   - No menu lateral esquerdo do Search Console, clique em **Sitemaps**.
   - No campo *"Adicionar um novo sitemap"*, digite: `sitemap.xml` e clique em **Enviar**.
5. **Solicite a Indexação Prioritária da Página Principal**:
   - Na barra de busca superior *"Inspecionar qualquer URL em https://lulasimulator.com.br"*, cole `https://lulasimulator.com.br/`.
   - Quando o relatório carregar, clique no botão **"Solicitar Indexação"**.
   - Pronto! O robô do Google (*Googlebot*) visitará o site em caráter prioritário.

---

### 💡 Dicas para Turbinar o Alcance Orgânico & Migração de Domínio

1. **Compartilhamento em Redes Sociais (Vídeos Curtos)**:
   - Publique clipes de gameplay no **TikTok**, **Instagram Reels** e **YouTube Shorts** mostrando momentos engraçados (o modo prisão aos 13 pontos, o meme do Pablo Marçal 3x, a chuva de mandiocas da Dilma).
   - Coloque o link na bio e nos comentários. O tráfego direto e menções geram forte sinal de relevância para o Google.
2. **Migração & Redirecionamento Automático na Vercel**:
   - Com o domínio `lulasimulator.com.br` adicionado na Vercel (*Settings > Domains*), marque-o como **Primary Domain**.
   - A própria Vercel gerará o redirecionamento `301 Permanent Redirect` do subdomínio antigo `.vercel.app` para `https://lulasimulator.com.br` automaticamente, preservando 100% da autoridade e visitas.

---

## 📜 Licença & Créditos

Projeto desenvolvido por **Daniel dos Santos** no **SENAI** (Curso de Programação com Inteligência Artificial) como uma sátira social e política interativa sobre o Brasil. 🇧🇷
