// js/tracker.js — Rastreamento Silencioso de Sessão e Geolocalização
(function () {
  'use strict';

  // Evita múltiplas chamadas na mesma sessão de navegação
  const SESSION_KEY = 'lula_visited_session_v2';

  async function registerVisit() {
    try {
      const alreadyTracked = sessionStorage.getItem(SESSION_KEY);
      if (alreadyTracked) return;

      // Marca imediatamente para evitar disparos simultâneos
      sessionStorage.setItem(SESSION_KEY, '1');

      // Tenta registrar na API Serverless
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer || '',
          screen: `${window.innerWidth}x${window.innerHeight}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Salva dados locais da localização detectada para personalizações da interface
        if (data && data.country) {
          localStorage.setItem('lula_detected_country', data.country);
          localStorage.setItem('lula_detected_flag', data.flag || '🇧🇷');
        }
      }
    } catch (e) {
      // Falha silenciosa para nunca interromper a experiência de jogo
      console.debug('Analytics ping skipped:', e);
    }
  }

  // Executa quando o documento estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerVisit);
  } else {
    registerVisit();
  }
})();
