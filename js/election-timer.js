// js/election-timer.js — Contador Dinâmico das Datas Eleitorais de 2026 (1º e 2º Turnos)
// Mantém as informações temporais sempre atualizadas para SEO e usuários

export function initElectionCountdown() {
  const round1Date = new Date('2026-10-04T08:00:00-03:00');
  const round2Date = new Date('2026-10-25T08:00:00-03:00');
  const now = new Date();

  const isEn = document.documentElement.lang === 'en' || window.location.pathname.startsWith('/en');

  const calcDays = (target) => {
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const daysRound1 = calcDays(round1Date);
  const daysRound2 = calcDays(round2Date);

  const elR1 = document.getElementById('electionTimerRound1');
  const elR2 = document.getElementById('electionTimerRound2');
  const elStatus = document.getElementById('electionWarmupStatus');

  if (elR1) {
    if (daysRound1 > 0) {
      elR1.textContent = isEn ? `⏳ ${daysRound1} days to 1st Round` : `⏳ Faltam ${daysRound1} dias p/ 1º Turno`;
    } else if (daysRound1 === 0) {
      elR1.textContent = isEn ? `🗳️ TODAY IS 1st ROUND!` : `🗳️ HOJE É O 1º TURNO!`;
    } else {
      elR1.textContent = isEn ? `✅ 1st Round Concluded` : `✅ 1º Turno Realizado`;
    }
  }

  if (elR2) {
    if (daysRound2 > 0) {
      elR2.textContent = isEn ? `⏳ ${daysRound2} days to 2nd Round` : `⏳ Faltam ${daysRound2} dias p/ 2º Turno`;
    } else if (daysRound2 === 0) {
      elR2.textContent = isEn ? `🗳️ TODAY IS 2nd ROUND!` : `🗳️ HOJE É O 2º TURNO!`;
    } else {
      elR2.textContent = isEn ? `✅ 2nd Round Concluded` : `✅ 2º Turno Realizado`;
    }
  }

  if (elStatus) {
    if (daysRound1 > 0) {
      elStatus.textContent = isEn 
        ? `🔥 Brazilian Election Season 2026: Relax & Play the Best Political Meme Game!` 
        : `🔥 Temporada Eleitoral 2026: Descontraia no Jogo de Memes Políticos Mais Jogado do Brasil!`;
    } else {
      elStatus.textContent = isEn
        ? `🇧🇷 2026 Election Season Live: Fun & Memes for Everyone!`
        : `🇧🇷 Apuração & Memes 2026: Diversão Garantida no Arcade!`;
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initElectionCountdown);
  } else {
    initElectionCountdown();
  }
}
