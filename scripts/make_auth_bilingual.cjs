// scripts/make_auth_bilingual.cjs — Injeta suporte bilíngue completo no js/auth.js

const fs = require('fs');

let code = fs.readFileSync('js/auth.js', 'utf8');

// Injeta função auxiliar isEnglishContext
if (!code.includes('function isEnglishContext()')) {
  code = code.replace(
    "const TOTAL_PICANHAS_KEY = 'flappy_total_accumulated_picanhas';",
    `const TOTAL_PICANHAS_KEY = 'flappy_total_accumulated_picanhas';\n\nfunction isEnglishContext() {\n  return typeof window !== 'undefined' && (window.location.pathname.startsWith('/en/') || window.location.hostname.includes('flappylula.com'));\n}`
  );
}

// 1. Crop Modal
code = code.replace(
  "✂️ AJUSTAR & ENQUADRAR FOTO",
  "${isEnglishContext() ? '✂️ ADJUST & CROP PHOTO' : '✂️ AJUSTAR & ENQUADRAR FOTO'}"
);
code = code.replace(
  "Arraste a imagem para posicionar e use o slider para dar zoom no rosto!",
  "${isEnglishContext() ? 'Drag to position and use slider to zoom in!' : 'Arraste a imagem para posicionar e use o slider para dar zoom no rosto!'}"
);
code = code.replace(
  ">Cancelar<",
  ">${isEnglishContext() ? 'Cancel' : 'Cancelar'}<"
);
code = code.replace(
  "SALVAR FOTO ✂️",
  "${isEnglishContext() ? 'SAVE PHOTO ✂️' : 'SALVAR FOTO ✂️'}"
);

// 2. Daily Streak Modal
code = code.replace(
  "STREAK DIÁRIO: DIA ${streak}!",
  "${isEnglishContext() ? `DAILY STREAK: DAY ${streak}!` : `STREAK DIÁRIO: DIA ${streak}!`}"
);
code = code.replace(
  "Você entrou no jogo em dias consecutivos e resgatou sua recompensa diária!",
  "${isEnglishContext() ? 'You logged in on consecutive days and claimed your daily bonus!' : 'Você entrou no jogo em dias consecutivos e resgatou sua recompensa diária!'}"
);
code = code.replace(
  "BÔNUS COLETADO HOJE:",
  "${isEnglishContext() ? 'BONUS CLAIMED TODAY:' : 'BÔNUS COLETADO HOJE:'}"
);
code = code.replace(
  "+${currentReward.picanhas} 🥩 PICANHAS ${currentReward.coins > 0 ? `+${currentReward.coins} 💰` : ''}",
  "+${currentReward.picanhas} ${isEnglishContext() ? '🥩 STEAKS' : '🥩 PICANHAS'} ${currentReward.coins > 0 ? (isEnglishContext() ? `+${currentReward.coins} 💰 COINS` : `+${currentReward.coins} 💰 MOEDAS`) : ''}"
);
code = code.replace(
  "CONTINUAR JOGANDO 🇧🇷",
  "${isEnglishContext() ? 'CONTINUE PLAYING 🚀' : 'CONTINUAR JOGANDO 🇧🇷'}"
);

// 3. getDailyMissions
code = code.replace(
  `missions: [
          { id: 'm_flappy_games', title: 'Voo Sindical', desc: 'Jogue 3 partidas no Flappy Lula', target: 3, current: 0, reward: 30, currency: 'picanhas', claimed: false },
          { id: 'm_flappy_score', title: 'Churrasco Presidencial', desc: 'Atinja 25 pontos numa única corrida no Flappy Lula', target: 25, current: 0, reward: 50, currency: 'picanhas', claimed: false },
          { id: 'm_runner_coins', title: 'Investimento Faria Lima', desc: 'Colete 40 moedas no Empresário 3D', target: 40, current: 0, reward: 60, currency: 'coins', claimed: false }
        ]`,
  `missions: isEnglishContext() ? [
          { id: 'm_flappy_games', title: 'Union Flight', desc: 'Play 3 games in Flappy Lula', target: 3, current: 0, reward: 30, currency: 'picanhas', claimed: false },
          { id: 'm_flappy_score', title: 'Presidential BBQ', desc: 'Score 25 points in a single Flappy run', target: 25, current: 0, reward: 50, currency: 'picanhas', claimed: false },
          { id: 'm_runner_coins', title: 'Financial District', desc: 'Collect 40 coins in 3D Runner', target: 40, current: 0, reward: 60, currency: 'coins', claimed: false }
        ] : [
          { id: 'm_flappy_games', title: 'Voo Sindical', desc: 'Jogue 3 partidas no Flappy Lula', target: 3, current: 0, reward: 30, currency: 'picanhas', claimed: false },
          { id: 'm_flappy_score', title: 'Churrasco Presidencial', desc: 'Atinja 25 pontos numa única corrida no Flappy Lula', target: 25, current: 0, reward: 50, currency: 'picanhas', claimed: false },
          { id: 'm_runner_coins', title: 'Investimento Faria Lima', desc: 'Colete 40 moedas no Empresário 3D', target: 40, current: 0, reward: 60, currency: 'coins', claimed: false }
        ]`
);

// 4. mountAuthModal
code = code.replace(
  "${isUserLoggedIn ? '🇧🇷 PERFIL DO JOGADOR' : '🇧🇷 ACESSO / IDENTIFICAÇÃO'}",
  "${isUserLoggedIn ? (isEnglishContext() ? '🐦 PLAYER PROFILE' : '🇧🇷 PERFIL DO JOGADOR') : (isEnglishContext() ? '🐦 SIGN IN / PLAYER ACCESS' : '🇧🇷 ACESSO / IDENTIFICAÇÃO')}"
);
code = code.replace(
  "${isUserLoggedIn ? 'Gerencie sua foto de perfil, recordes e sincronização na nuvem.' : 'Escolha seu nome público ou proteja sua conta com senha!'}",
  "${isUserLoggedIn ? (isEnglishContext() ? 'Manage your profile avatar, high scores, and cloud synchronization.' : 'Gerencie sua foto de perfil, recordes e sincronização na nuvem.') : (isEnglishContext() ? 'Choose your public username or protect your account with a password!' : 'Escolha seu nome público ou proteja sua conta com senha!')}"
);

code = code.replace(">👤 Meu Perfil<", ">${isEnglishContext() ? '👤 My Profile' : '👤 Meu Perfil'}<");
code = code.replace(">☁️ Sincronizar<", ">${isEnglishContext() ? '☁️ Cloud Sync' : '☁️ Sincronizar'}<");
code = code.replace(">🔄 Trocar Conta<", ">${isEnglishContext() ? '🔄 Switch Account' : '🔄 Trocar Conta'}<");
code = code.replace(">👤 Jogar sem Senha<", ">${isEnglishContext() ? '👤 Play as Guest' : '👤 Jogar sem Senha'}<");
code = code.replace(">🔒 Criar Conta<", ">${isEnglishContext() ? '🔒 Create Account' : '🔒 Criar Conta'}<");
code = code.replace(">🔑 Entrar<", ">${isEnglishContext() ? '🔑 Sign In' : '🔑 Entrar'}<");

code = code.replace(
  "${user.hasPassword ? '🔒 Conta Protegida por Senha' : '👤 Nome Público de Jogador'}",
  "${user.hasPassword ? (isEnglishContext() ? '🔒 Password-Protected Account' : '🔒 Conta Protegida por Senha') : (isEnglishContext() ? '👤 Public Guest Player' : '👤 Nome Público de Jogador')}"
);
code = code.replace(
  "🎨 Escolher Avatar do Jogo ou Enviar Foto:",
  "${isEnglishContext() ? '🎨 Choose Avatar or Upload Custom Photo:' : '🎨 Escolher Avatar do Jogo ou Enviar Foto:'}"
);
code = code.replace(
  "📊 Estatísticas & Desbloqueios da Conta:",
  "${isEnglishContext() ? '📊 Account Stats & Character Unlocks:' : '📊 Estatísticas & Desbloqueios da Conta:'}"
);

code = code.replace("🥩 Picanhas: <b", "${isEnglishContext() ? '🥩 Steaks:' : '🥩 Picanhas:'} <b");
code = code.replace("💰 Moedas 3D: <b", "${isEnglishContext() ? '💰 3D Coins:' : '💰 Moedas 3D:'} <b");
code = code.replace("🐦 Flappy Recorde: <b", "${isEnglishContext() ? '🐦 Flappy Best:' : '🐦 Flappy Recorde:'} <b");
code = code.replace("🏃 Runner Recorde: <b", "${isEnglishContext() ? '🏃 3D Runner Best:' : '🏃 Runner Recorde:'} <b");

code = code.replace(
  "${isNikolasUnlocked ? '✨ Desbloqueado' : '🔒 300 pts Flappy + 300 km 3D'}",
  "${isNikolasUnlocked ? (isEnglishContext() ? '✨ Unlocked' : '✨ Desbloqueado') : '🔒 300 pts Flappy + 300 km 3D'}"
);
code = code.replace(
  "${isMarcalUnlocked ? '✨ Desbloqueado' : '🔒 900 pts c/ Nikolas'}",
  "${isMarcalUnlocked ? (isEnglishContext() ? '✨ Unlocked' : '✨ Desbloqueado') : (isEnglishContext() ? '🔒 900 pts w/ Nikolas' : '🔒 900 pts c/ Nikolas')}"
);

code = code.replace(
  "🔄 SINCRONIZAR DADOS COM A NUVEM",
  "${isEnglishContext() ? '🔄 SYNC DATA WITH CLOUD' : '🔄 SINCRONIZAR DADOS COM A NUVEM'}"
);
code = code.replace(
  "Sincronização Multi-Dispositivos",
  "${isEnglishContext() ? 'Multi-Device Cloud Sync' : 'Sincronização Multi-Dispositivos'}"
);
code = code.replace(
  "Se você desbloqueou o Pablo Marçal, acumulou picanhas ou bateu recordes no celular ou no PC, clique abaixo para fundir e salvar tudo na nuvem!",
  "${isEnglishContext() ? 'If you unlocked characters, accumulated steaks, or set records across devices, tap below to merge and sync to the cloud!' : 'Se você desbloqueou o Pablo Marçal, acumulou picanhas ou bateu recordes no celular ou no PC, clique abaixo para fundir e salvar tudo na nuvem!'}"
);
code = code.replace(
  "🔄 SINCRONIZAR AGORA 🚀",
  "${isEnglishContext() ? '🔄 SYNC NOW 🚀' : '🔄 SINCRONIZAR AGORA 🚀'}"
);

code = code.replace("Seu Nome no Placar:", "${isEnglishContext() ? 'Your Leaderboard Name:' : 'Seu Nome no Placar:'}");
code = code.replace("SALVAR E JOGAR 🚀", "${isEnglishContext() ? 'SAVE & PLAY 🚀' : 'SALVAR E JOGAR 🚀'}");

code = code.replace("Nome de Jogador:", "${isEnglishContext() ? 'Player Username:' : 'Nome de Jogador:'}");
code = code.replace("Palavra-Chave / Senha:", "${isEnglishContext() ? 'Password / Passphrase:' : 'Palavra-Chave / Senha:'}");
code = code.replace('placeholder="Digite uma senha simples"', 'placeholder="${isEnglishContext() ? \'Enter a simple password\' : \'Digite uma senha simples\'}"');
code = code.replace("CRIAR CONTA PROTEGIDA 🔒", "${isEnglishContext() ? 'CREATE PROTECTED ACCOUNT 🔒' : 'CRIAR CONTA PROTEGIDA 🔒'}");

code = code.replace('placeholder="Seu nome cadastrado"', 'placeholder="${isEnglishContext() ? \'Your registered username\' : \'Seu nome cadastrado\'}"');
code = code.replace('placeholder="Sua senha"', 'placeholder="${isEnglishContext() ? \'Your password\' : \'Sua senha\'}"');
code = code.replace("ENTRAR NA CONTA 🔑", "${isEnglishContext() ? 'SIGN IN 🔑' : 'ENTRAR NA CONTA 🔑'}");

// 5. Drawer e Badge
code = code.replace(">👤 Ver Perfil & Foto<", ">${isEnglishContext() ? '👤 View Profile & Avatar' : '👤 Ver Perfil & Foto'}<");
code = code.replace(">🚪 Sair<", ">${isEnglishContext() ? '🚪 Sign Out' : '🚪 Sair'}<");
code = code.replace(">Sair</button>", ">${isEnglishContext() ? 'Sign Out' : 'Sair'}</button>");
code = code.replace("🔑 ENTRAR / ESCOLHER NICK", "${isEnglishContext() ? '🔑 SIGN IN / GUEST' : '🔑 ENTRAR / ESCOLHER NICK'}");
code = code.replace("🔑 Entrar / Mudar Nome", "${isEnglishContext() ? '🔑 Sign In / Profile' : '🔑 Entrar / Mudar Nome'}");

fs.writeFileSync('js/auth.js', code, 'utf8');
console.log('✔ js/auth.js bilingue atualizado com sucesso!');
