// js/cookie-consent.js — Banner de Consentimento de Cookies LGPD & GDPR (Google AdSense Compliance)
(function () {
  'use strict';

  const STORAGE_KEY = 'lula_cookie_consent';

  function isBot() {
    try {
      if (navigator.webdriver) return true;
      const ua = navigator.userAgent || '';
      return /bot|googlebot|mediapartners|adsbot|lighthouse|pagespeed|bingbot|crawler|spider/i.test(ua);
    } catch (e) {
      return false;
    }
  }

  function initCookieConsent() {
    if (isBot()) return;

    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (consent === 'accepted' || consent === 'dismissed') {
        return;
      }
    } catch (e) {}

    const isEn = typeof window !== 'undefined' && (
      document.documentElement.lang === 'en' ||
      window.location.pathname.startsWith('/en') ||
      window.location.hostname.includes('flappylula.com')
    );

    const isGamePage = typeof document !== 'undefined' && (
      document.body.classList.contains('game-body') ||
      !!document.querySelector('.game-wrapper')
    );

    const privacyUrl = isEn ? '/en/privacy.html' : '/privacidade.html';

    // Injeta regras de CSS para não bloquear a gameplay
    if (!document.getElementById('cookieConsentStyle')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'cookieConsentStyle';
      styleEl.textContent = `
        body.game-playing #cookieConsentBanner,
        body.is-fullscreen #cookieConsentBanner {
          display: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.style.cssText = `
      position: fixed;
      bottom: ${isGamePage ? '10px' : '16px'};
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 24px);
      max-width: ${isGamePage ? '620px' : '860px'};
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.98));
      border: 1.5px solid #22c55e;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(34, 197, 94, 0.3);
      border-radius: 14px;
      padding: ${isGamePage ? '9px 14px' : '14px 20px'};
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      color: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: ${isGamePage ? '11.5px' : '13px'};
      box-sizing: border-box;
      backdrop-filter: blur(10px);
      animation: slideUpCookie 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    banner.innerHTML = `
      <div style="flex: 1; min-width: 220px; line-height: 1.45;">
        <span>🍪 <strong>${isEn ? 'Privacy & Cookies' : 'Privacidade & Cookies'}:</strong></span>
        ${isEn
          ? 'We use essential and AdSense cookies to enhance gameplay and deliver ads. <a href="' + privacyUrl + '" style="color:#ffdf00; text-decoration:underline; font-weight:700;">Privacy Policy</a>.'
          : 'Cookies essenciais e Google AdSense para viabilizar os jogos e anúncios. <a href="' + privacyUrl + '" style="color:#ffdf00; text-decoration:underline; font-weight:700;">Política de Privacidade</a>.'}
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style="
          color: #94a3b8;
          text-decoration: underline;
          font-size: 11px;
          cursor: pointer;
        ">${isEn ? 'Settings' : 'Ajustes'}</a>
        <button id="btnAcceptCookieConsent" style="
          background: linear-gradient(135deg, #00e676, #10b981);
          color: #032310;
          font-weight: 800;
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 230, 118, 0.4);
          transition: transform 0.15s ease;
        ">${isEn ? 'Accept' : 'Aceitar'}</button>
        <button id="btnCloseCookieConsent" title="${isEn ? 'Close' : 'Fechar'}" style="
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e1;
          font-size: 12px;
          cursor: pointer;
          font-weight: bold;
          padding: 0;
          line-height: 1;
        ">✕</button>
      </div>
    `;

    document.body.appendChild(banner);

    const closeBanner = (status) => {
      try {
        localStorage.setItem(STORAGE_KEY, status);
      } catch (e) {}
      banner.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      banner.style.opacity = '0';
      banner.style.transform = 'translate(-50%, 20px)';
      setTimeout(() => banner.remove(), 260);
    };

    const btnAccept = banner.querySelector('#btnAcceptCookieConsent');
    if (btnAccept) {
      btnAccept.addEventListener('click', () => closeBanner('accepted'));
    }

    const btnClose = banner.querySelector('#btnCloseCookieConsent');
    if (btnClose) {
      btnClose.addEventListener('click', () => closeBanner('dismissed'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
