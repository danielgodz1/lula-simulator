// js/tracker.js — Rastreamento Inteligente e Anti-Duplicação de Dispositivos Únicos
(function () {
  'use strict';

  const STORAGE_KEY_DEVICE = 'lula_unique_device_id_v2';
  const STORAGE_KEY_REGISTERED = 'lula_device_registered_v2';
  const COOKIE_DEVICE_KEY = 'lula_did';
  const COOKIE_REG_KEY = 'lula_reg';
  const SESSION_PING_KEY = 'lula_session_ping_v2';

  // Leitor seguro de cookies
  function getCookie(name) {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    } catch (_) {}
    return null;
  }

  // Gravador de cookies com validade de 400 dias (máximo permitido pelos navegadores modernos)
  function setCookie(name, val, days = 400) {
    try {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${encodeURIComponent(val)}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
    } catch (_) {}
  }

  // Gera ou recupera o ID exclusivo persistente deste computador/celular
  function getOrCreateDeviceId() {
    try {
      let id = localStorage.getItem(STORAGE_KEY_DEVICE);
      if (!id) {
        id = getCookie(COOKIE_DEVICE_KEY);
      }
      if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      }
      localStorage.setItem(STORAGE_KEY_DEVICE, id);
      setCookie(COOKIE_DEVICE_KEY, id, 400);
      return id;
    } catch (e) {
      return 'dev_' + Math.random().toString(36).substring(2, 11);
    }
  }

  // Verifica se o dispositivo já foi computado como visitante único
  function isDeviceAlreadyRegistered() {
    try {
      if (localStorage.getItem(STORAGE_KEY_REGISTERED) === 'true') return true;
      if (getCookie(COOKIE_REG_KEY) === '1') {
        localStorage.setItem(STORAGE_KEY_REGISTERED, 'true');
        return true;
      }
    } catch (_) {}
    return false;
  }

  function markDeviceAsRegistered() {
    try {
      localStorage.setItem(STORAGE_KEY_REGISTERED, 'true');
      setCookie(COOKIE_REG_KEY, '1', 400);
    } catch (_) {}
  }

  async function registerVisit() {
    try {
      // Evita requisições repetidas na mesma sessão ativa da aba
      const sessionAlreadyPinged = sessionStorage.getItem(SESSION_PING_KEY);
      const isAlreadyRegistered = isDeviceAlreadyRegistered();
      const hasDetectedCountry = Boolean(localStorage.getItem('lula_detected_country'));

      // Se o dispositivo já é conhecido e já tem as infos de país salvas localmente, não precisa gastar tráfego
      if (isAlreadyRegistered && hasDetectedCountry && sessionAlreadyPinged) {
        return;
      }

      sessionStorage.setItem(SESSION_PING_KEY, '1');
      const deviceId = getOrCreateDeviceId();

      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          deviceId: deviceId,
          isNewDevice: !isAlreadyRegistered,
          path: window.location.pathname,
          referrer: document.referrer || '',
          screen: `${window.innerWidth}x${window.innerHeight}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        markDeviceAsRegistered();

        // Salva dados locais da localização detectada para uso no jogo e perfil
        if (data && data.country) {
          localStorage.setItem('lula_detected_country', data.country);
          localStorage.setItem('lula_detected_flag', data.flag || '🇧🇷');
        }
      }
    } catch (e) {
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
