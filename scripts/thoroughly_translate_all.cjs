// scripts/thoroughly_translate_all.cjs — Tradução Minuciosa e Completa de en/ranking.html, en/feedback.html e en/contato.html

const fs = require('fs');

// -------------------------------------------------------------
// 1. EN/RANKING.HTML
// -------------------------------------------------------------
let r = fs.readFileSync('en/ranking.html', 'utf8');

r = r.replace('<title>Ranking Geral & Placar Nacional — Lula Simulator</title>', '<title>Global Leaderboard & Hall of Fame — Flappy Lula</title>');
r = r.replace('<title>Ranking Nacional — Placar Oficial do Lula Simulator</title>', '<title>Global Leaderboard & Hall of Fame — Flappy Lula</title>');
r = r.replace('Confira o ranking nacional em tempo real dos melhores jogadores de Flappy Lula e Empresário 3D. Veja quem é o maior pontuador do Brasil!', 'Check real-time global leaderboards for Flappy Lula and 3D Runner. See who holds the world record score!');
r = r.replace('Confira os recordes e veja quem lidera o ranking de picanhas e distância no Lula Simulator!', 'Check world records and see who leads the global leaderboard in Flappy Lula and 3D Runner!');
r = r.replace('Confira o placar oficial e recordes do Lula Simulator!', 'Check the official world leaderboard and high scores of Flappy Lula!');
r = r.replace('Ranking Geral & Placar Nacional — Lula Simulator', 'Global Leaderboard & Hall of Fame — Flappy Lula');
r = r.replace('<span>Lula Simulator</span>', '<span>Flappy Lula</span>');

r = r.replace('<h1>🏆 RANKING NACIONAL</h1>', '<h1>🏆 GLOBAL LEADERBOARD</h1>');
r = r.replace('Confira a classificação dos jogadores em tempo real nos modos Geral, Semanal e Invictos!', 'Check real-time player rankings across All-Time, Weekly, and Win Streak leaderboards!');

r = r.replace('🐦 Flappy Lula (Steaks)', '🐦 Flappy Lula (Steaks)');
r = r.replace('🏃 Empresário 3D (KM)', '🏃 3D Runner (km)');
r = r.replace('🏃 Empresário 3D (km)', '🏃 3D Runner (km)');

r = r.replace('🌟 Recorde Geral', '🌟 All-Time Best');
r = r.replace('📅 Recorde Semanal', '📅 Weekly Leaderboard');
r = r.replace('💰 Total Acumulado', '💰 Total Accumulated');
r = r.replace('🔥 Invictos (Win Streak)', '🔥 Win Streak Champions');

r = r.replace('🔍 Buscar jogador (ex: Victor, Duda, Daniel)...', '🔍 Search player by name (e.g. Victor, Daniel)...');
r = r.replace('Carregando jogadores...', 'Loading champions...');
r = r.replace('Consultando banco de dados seguro... 🇧🇷', 'Connecting to global database... 🌍');

r = r.replace("const periodLabel = currentPeriod === 'weekly' ? 'da semana' : (currentPeriod === 'accumulated' ? 'acumulado' : (currentPeriod === 'invictos' ? 'de invictos' : 'geral'));", "const periodLabel = currentPeriod === 'weekly' ? 'Weekly' : (currentPeriod === 'accumulated' ? 'Accumulated' : (currentPeriod === 'invictos' ? 'Win Streak' : 'All-Time'));");
r = r.replace("container.innerHTML = `<div style=\"text-align:center; padding:40px; color:var(--text-muted);\">Carregando placar ${periodLabel}... 🇧🇷</div>`;", "container.innerHTML = `<div style=\"text-align:center; padding:40px; color:var(--text-muted);\">Loading ${periodLabel} leaderboard... 🌍</div>`;");

r = r.replace("const countText = allCurrentScores.length === 1 ? '1 Jogador' : `${allCurrentScores.length} Jogadores`;", "const countText = allCurrentScores.length === 1 ? '1 Player' : `${allCurrentScores.length} Players`;");
r = r.replace("const prefix = currentPeriod === 'weekly' ? 'Semanal' : (currentPeriod === 'accumulated' ? 'Acumulado' : 'Geral');", "const prefix = currentPeriod === 'weekly' ? 'Weekly' : (currentPeriod === 'accumulated' ? 'Total' : 'All-Time');");

r = r.replace('${searchTerm ? `Nenhum jogador encontrado para "${escapeHTML(searchTerm)}"` : \'Nenhum jogador pontuou ainda. Seja o primeiro! 🚀\'}', '${searchTerm ? `No players found matching "${escapeHTML(searchTerm)}"` : \'No scores registered yet. Be the first! 🚀\'}');
r = r.replace("const safePlayer = escapeHTML(item.player || 'Anônimo');", "const safePlayer = escapeHTML(item.player || 'Anonymous');");
r = r.replace("🎖️ Imbrochável", "🎖️ Legend");
r = r.replace("🥩 Picanha Ouro", "🥩 Golden Steak");
r = r.replace("⚖️ STF", "⚖️ Supreme Judge");
r = r.replace("🚀 Mindset 3X", "🚀 Mindset 3X");
r = r.replace("🌪️ Vento", "🌪️ Cosmic Wind");
r = r.replace("title=\"Nível de Prestígio ${prestigeLvl}\"", "title=\"Prestige Level ${prestigeLvl}\"");
r = r.replace(".toLocaleString('pt-BR')", ".toLocaleString('en-US')");

fs.writeFileSync('en/ranking.html', r, 'utf8');
console.log('✔ en/ranking.html thoroughly translated');

// -------------------------------------------------------------
// 2. EN/FEEDBACK.HTML
// -------------------------------------------------------------
let fb = fs.readFileSync('en/feedback.html', 'utf8');

fb = fb.replace('<title>Feedbacks & Avaliações da Comunidade — Lula Simulator</title>', '<title>Community Reviews & Feedback — Flappy Lula</title>');
fb = fb.replace('Deixe seu feedback sobre o Lula Simulator! Avalie os jogos Flappy Lula e Empresário 3D e envie sugestões.', 'Leave your feedback for Flappy Lula! Rate the games and share suggestions with the developer and community.');

fb = fb.replace('<h1>⭐ AVALIAÇÕES & FEEDBACKS</h1>', '<h1>⭐ COMMUNITY REVIEWS & FEEDBACK</h1>');
fb = fb.replace('O que a comunidade está achando dos jogos? Deixe sua avaliação!', 'What do players think about the game? Leave your review and star rating!');

fb = fb.replace('<h2>📝 Deixe seu Feedback</h2>', '<h2>📝 Leave Your Feedback</h2>');
fb = fb.replace('Compartilhe sua opinião sobre o <strong>Flappy Lula</strong> e o <strong>Empresário 3D</strong>!', 'Share your thoughts and suggestions about <strong>Flappy Lula</strong> and <strong>3D Runner</strong>!');

fb = fb.replace('<label>Seu Nome / Apelido</label>', '<label>Your Name / Username</label>');
fb = fb.replace('placeholder="Ex: Empresário_BR"', 'placeholder="e.g. FlappyMaster_US"');

fb = fb.replace('<label>Avaliação em Estrelas ⭐</label>', '<label>Star Rating ⭐</label>');
fb = fb.replace('<label>Comentário</label>', '<label>Review / Comment</label>');
fb = fb.replace('placeholder="O que achou do jogo do presidente e do Empresário 3D?"', 'placeholder="What did you think of the game, characters, and modes?"');

fb = fb.replace('🚀 ENVIAR FEEDBACK', '🚀 SUBMIT FEEDBACK');
fb = fb.replace('<h2>💬 Avaliações & Feedbacks da Comunidade</h2>', '<h2>💬 Player Reviews & Community Feedback</h2>');
fb = fb.replace('Carregando avaliações...', 'Loading community reviews...');

fb = fb.replace("alert('Por favor preencha seu Nome e Comentário!');", "alert('Please enter your name and comment!');");
fb = fb.replace("btn.textContent = 'Enviando...';", "btn.textContent = 'Submitting...';");
fb = fb.replace("btn.textContent = '🚀 ENVIAR FEEDBACK';", "btn.textContent = '🚀 SUBMIT FEEDBACK';");
fb = fb.replace("statusAlert.textContent = '✓ Avaliação enviada com sucesso! Muito obrigado pelo feedback!';", "statusAlert.textContent = '✓ Review submitted successfully! Thank you for your feedback!';");
fb = fb.replace("statusAlert.textContent = 'Ocorreu um erro ao enviar. Tente novamente mais tarde.';", "statusAlert.textContent = 'An error occurred while submitting. Please try again shortly.';");
fb = fb.replace("feedbacksList.innerHTML = '<div style=\"text-align:center; padding:30px; color:var(--text-muted);\">Nenhuma avaliação ainda. Seja o primeiro a avaliar! ⭐</div>';", "feedbacksList.innerHTML = '<div style=\"text-align:center; padding:30px; color:var(--text-muted);\">No reviews yet. Be the first to leave feedback! ⭐</div>';");
fb = fb.replace("feedbacksList.innerHTML = '<div style=\"text-align:center; padding:30px; color:var(--text-muted);\">Erro ao carregar avaliações.</div>';", "feedbacksList.innerHTML = '<div style=\"text-align:center; padding:30px; color:var(--text-muted);\">Failed to load reviews.</div>';");
fb = fb.replace("const safePlayer = escapeHTML(fb.player || 'Anônimo');", "const safePlayer = escapeHTML(fb.player || 'Anonymous');");

fs.writeFileSync('en/feedback.html', fb, 'utf8');
console.log('✔ en/feedback.html thoroughly translated');

// -------------------------------------------------------------
// 3. EN/CONTATO.HTML
// -------------------------------------------------------------
let ct = fs.readFileSync('en/contato.html', 'utf8');

ct = ct.replace('<title>Contato — Desenvolvedor do Lula Simulator</title>', '<title>Contact the Developer — Flappy Lula</title>');
ct = ct.replace('Entre em contato com o desenvolvedor do Lula Simulator para parcerias, sugestões ou suporte.', 'Contact the developer of Flappy Lula for partnerships, feature suggestions, or player support.');

ct = ct.replace('<h1>📬 FALE CONOSCO</h1>', '<h1>📬 CONTACT THE DEVELOPER</h1>');
ct = ct.replace('Envie sua mensagem, sugestão ou dúvida diretamente para nossa equipe!', 'Send your message, feature suggestions, business inquiries, or questions directly to the creator!');

ct = ct.replace('<h2>✉️ Enviar Mensagem Direta</h2>', '<h2>✉️ Send a Direct Message</h2>');
ct = ct.replace('Sua mensagem será encaminhada com total privacidade diretamente para a nossa caixa de entrada.', 'Your message will be sent with full privacy directly to our inbox.');

ct = ct.replace('<label>Your Name / Apelido</label>', '<label>Your Name / Username</label>');
ct = ct.replace('<label>Seu Nome / Apelido</label>', '<label>Your Name / Username</label>');
ct = ct.replace('placeholder="Ex: Daniel Silva"', 'placeholder="e.g. Daniel Smith"');

ct = ct.replace('<label>Your Email</label>', '<label>Your Email Address</label>');
ct = ct.replace('<label>Seu E-mail</label>', '<label>Your Email Address</label>');
ct = ct.replace('placeholder="seuemail@exemplo.com"', 'placeholder="youremail@example.com"');

ct = ct.replace('<label>Subject</label>', '<label>Subject</label>');
ct = ct.replace('<label>Assunto</label>', '<label>Subject</label>');
ct = ct.replace('placeholder="Ex: Sugestão para o jogo do Empresário 3D"', 'placeholder="e.g. Partnership inquiry or game suggestion"');

ct = ct.replace('<label>Mensagem</label>', '<label>Detailed Message</label>');
ct = ct.replace('placeholder="Escreva aqui sua mensagem detalhada..."', 'placeholder="Write your detailed message, feedback, or suggestion here..."');

ct = ct.replace('🚀 ENVIAR MENSAGEM', '🚀 SEND MESSAGE');

ct = ct.replace("alert('Por favor preencha seu Nome e a Mensagem!');", "alert('Please fill in your name and message!');");
ct = ct.replace("btn.textContent = 'Enviando...';", "btn.textContent = 'Sending...';");
ct = ct.replace("btn.textContent = '🚀 ENVIAR MENSAGEM';", "btn.textContent = '🚀 SEND MESSAGE';");
ct = ct.replace("statusAlert.textContent = '✓ Mensagem enviada com sucesso! Agradecemos seu contato!';", "statusAlert.textContent = '✓ Message sent successfully! Thank you for reaching out!';");
ct = ct.replace("statusAlert.textContent = 'Ocorreu um erro ao enviar a mensagem. Tente novamente mais tarde.';", "statusAlert.textContent = 'An error occurred while sending the message. Please try again shortly.';");

fs.writeFileSync('en/contato.html', ct, 'utf8');
console.log('✔ en/contato.html thoroughly translated');

console.log('✨ All 3 requested pages thoroughly translated and saved!');
