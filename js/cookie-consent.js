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
      if (localStorage.getItem(STORAGE_KEY) === 'accepted') {
        return;
      }
    } catch (e) {}

    const isEn = typeof window !== 'undefined' && (
      document.documentElement.lang === 'en' ||
      window.location.pathname.startsWith('/en') ||
      window.location.hostname.includes('flappylula.com')
    );

    const privacyUrl = isEn ? '/en/privacy.html' : '/privacidade.html';

    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.style.cssText = `
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 32px);
      max-width: 860px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
      border: 1.5px solid #22c55e;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(34, 197, 94, 0.3);
      border-radius: 16px;
      padding: 14px 20px;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      color: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 13px;
      box-sizing: border-box;
      backdrop-filter: blur(10px);
      animation: slideUpCookie 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    banner.innerHTML = `
      <div style="flex: 1; min-width: 260px; line-height: 1.5;">
        <span>🍪 <strong>${isEn ? 'Privacy & Cookies' : 'Privacidade & Cookies'}:</strong></span>
        ${isEn
          ? 'We use essential cookies and Google AdSense partner cookies to provide games, analyze traffic and deliver personalized ads according to GDPR & LGPD. Learn more in our <a href="' + privacyUrl + '" style="color:#ffdf00; text-decoration:underline; font-weight:700;">Privacy Policy</a>.'
          : 'Utilizamos cookies essenciais e de publicidade (Google AdSense) para viabilizar os jogos, analisar tráfego e exibir anúncios em conformidade com a LGPD e GDPR. Saiba mais em nossa <a href="' + privacyUrl + '" style="color:#ffdf00; text-decoration:underline; font-weight:700;">Política de Privacidade</a>.'}
      </div>
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style="
          color: #94a3b8;
          text-decoration: underline;
          font-size: 12px;
          cursor: pointer;
        ">${isEn ? 'Ad Settings' : 'Ajustes Google'}</a>
        <button id="btnAcceptCookieConsent" style="
          background: linear-gradient(135deg, #00e676, #10b981);
          color: #032310;
          font-weight: 800;
          font-size: 13px;
          padding: 8px 18px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 230, 118, 0.4);
          transition: transform 0.15s ease;
        ">${isEn ? 'Accept All' : 'Aceitar Todos'}</button>
      </div>
    `;

    document.body.appendChild(banner);

    const btnAccept = banner.querySelector('#btnAcceptCookieConsent');
    if (btnAccept) {
      btnAccept.addEventListener('click', () => {
        try {
          localStorage.setItem(STORAGE_KEY, 'accepted');
        } catch (e) {}
        banner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        banner.style.opacity = '0';
        banner.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => banner.remove(), 300);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
