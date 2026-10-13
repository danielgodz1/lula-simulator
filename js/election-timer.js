// js/election-timer.js — Contador Dinâmico da Reta Final do 2º Turno das Eleições 2026 (25/10/2026)
// Atualizado para refletir o término do 1º Turno (04/10/2026) e contagem regressiva oficial para o 2º Turno

export function initElectionCountdown() {
  const round1Date = new Date('2026-10-04T08:00:00-03:00');
  const round2Date = new Date('2026-10-25T08:00:00-03:00');
  const now = new Date();

  const isEn = (typeof document !== 'undefined') && (
    document.documentElement.lang === 'en' || 
    window.location.pathname.startsWith('/en') || 
    window.location.hostname.includes('flappylula.com')
  );

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
    elR1.textContent = isEn ? `✅ 1st Round Concluded (04/10)` : `✅ 1º Turno Concluído (04/10)`;
    elR1.style.background = 'rgba(34, 197, 94, 0.2)';
    elR1.style.borderColor = '#22c55e';
    elR1.style.color = '#86efac';
  }

  if (elR2) {
    if (daysRound2 > 1) {
      elR2.textContent = isEn ? `🔥 FINAL SPRINT: ${daysRound2} days to 2nd Round (25/10/2026)` : `🔥 RETA FINAL: Faltam ${daysRound2} dias p/ 2º Turno (25/10/2026)`;
    } else if (daysRound2 === 1) {
      elR2.textContent = isEn ? `⚡ AMANHÃ É O 2º TURNO! (25/10)` : `⚡ AMANHÃ É O 2º TURNO! (25/10)`;
    } else if (daysRound2 === 0) {
      elR2.textContent = isEn ? `🗳️ TODAY IS THE 2nd ROUND! (25/10/2026)` : `🗳️ HOJE É O 2º TURNO! (25/10/2026)`;
    } else {
      elR2.textContent = isEn ? `✅ 2026 Elections Concluded` : `✅ Eleições 2026 Concluídas`;
    }
  }

  if (elStatus) {
    if (daysRound2 >= 0) {
      elStatus.textContent = isEn
        ? `🔥 1st Round Completed! Welcome to the Final Sprint for the 2nd Round (Oct 25, 2026) — Play Brazil's #1 Meme Game!`
        : `🔥 1º Turno Finalizado! Reta Final para a Grande Decisão do 2º Turno (25/10/2026) — Descontraia no Jogo de Memes #1 do Brasil!`;
    } else {
      elStatus.textContent = isEn
        ? `🇧🇷 2026 Election Season Archived: Thank You for Playing!`
        : `🇧🇷 Temporada Eleitoral 2026 Finalizada: Obrigado por Jogar!`;
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
