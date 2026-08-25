// js/language-manager.js — Gerenciador Inteligente de Idiomas, Banner de Sugestão e Seletor Permanente
// Suporta separação de domínios: lulasimulator.com.br (PT-BR) e flappylula.com (EN)

(function () {
  'use strict';

  const STORAGE_DISMISS_KEY = 'lula_lang_banner_dismissed';
  const DOMAIN_PT = 'lulasimulator.com.br';
  const DOMAIN_EN = 'flappylula.com';

  function isEnglishContext() {
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return host.includes(DOMAIN_EN) || path.startsWith('/en/') || path === '/en';
  }

  function getCleanPageFilename() {
    let path = window.location.pathname;
    if (path.startsWith('/en/')) {
      path = path.substring(3);
    } else if (path === '/en') {
      path = '/';
    }
    if (path === '' || path === '/') {
      return 'index.html';
    }
    return path.replace(/^\//, '');
  }

  function getTargetUrl(targetLang) {
    const page = getCleanPageFilename();
    const host = window.location.hostname.toLowerCase();
    const isProductionHost = host.includes(DOMAIN_PT) || host.includes(DOMAIN_EN);

    if (targetLang === 'en') {
      if (isProductionHost) {
        return `https://${DOMAIN_EN}/${page === 'index.html' ? '' : page}`;
      }
      return `/en/${page === 'index.html' ? 'index.html' : page}`;
    } else {
      if (isProductionHost) {
        return `https://${DOMAIN_PT}/${page === 'index.html' ? '' : page}`;
      }
      return `/${page === 'index.html' ? 'index.html' : page}`;
    }
  }

  function mountNavLanguageSwitch() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    if (document.getElementById('navLangSwitchBtn')) return;

    const isEn = isEnglishContext();
    const targetLang = isEn ? 'pt' : 'en';
    const targetUrl = getTargetUrl(targetLang);

    const link = document.createElement('a');
    link.id = 'navLangSwitchBtn';
    link.href = targetUrl;
    link.className = 'nav-lang-switch';
    link.title = isEn ? 'Mudar para Português (lulasimulator.com.br)' : 'Switch to English (flappylula.com)';
    link.innerHTML = isEn
      ? '<span style="font-size:13px;">🇧🇷</span> <span class="lang-text" style="font-weight:bold; font-size:11px; margin-left:3px;">PT</span>'
      : '<span style="font-size:13px;">🇺🇸</span> <span class="lang-text" style="font-weight:bold; font-size:11px; margin-left:3px;">EN</span>';

    // Estilização retrô moderna compatível com o tema
    link.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 5px 10px;
      margin-left: 6px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #ffffff;
      text-decoration: none;
      font-family: inherit;
      transition: all 0.2s ease;
      cursor: pointer;
    `;

    link.addEventListener('mouseenter', () => {
      link.style.background = 'rgba(255, 255, 255, 0.20)';
      link.style.borderColor = 'var(--amarelo-brasil, #ffdf00)';
    });
    link.addEventListener('mouseleave', () => {
      link.style.background = 'rgba(255, 255, 255, 0.08)';
      link.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });

    nav.appendChild(link);
  }

  function mountSuggestionBanner() {
    if (localStorage.getItem(STORAGE_DISMISS_KEY) === 'true') {
      return;
    }

    const isEn = isEnglishContext();
    const userLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    const isUserPortuguese = userLang.startsWith('pt');

    let shouldShow = false;
    let bannerHtml = '';
    let targetUrl = '';

    if (isEn && isUserPortuguese) {
      // Usuário em flappylula.com (EN) com navegador em Português
      shouldShow = true;
      targetUrl = getTargetUrl('pt');
      bannerHtml = `
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center;">
          <span>🇧🇷 <b>Prefere jogar em português?</b></span>
          <a href="${targetUrl}" id="btnAcceptLangSwitch" style="
            background: #22c55e;
            color: #0f172a;
            font-weight: bold;
            padding: 3px 10px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 11.5px;
            display: inline-block;
          ">Jogar em Português</a>
        </div>
      `;
    } else if (!isEn && !isUserPortuguese && userLang.length >= 2) {
      // Usuário em lulasimulator.com.br (PT) com navegador estrangeiro (Inglês/Outro)
      shouldShow = true;
      targetUrl = getTargetUrl('en');
      bannerHtml = `
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center;">
          <span>🇺🇸 <b>Prefer to play in English?</b></span>
          <a href="${targetUrl}" id="btnAcceptLangSwitch" style="
            background: #38bdf8;
            color: #0f172a;
            font-weight: bold;
            padding: 3px 10px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 11.5px;
            display: inline-block;
          ">Play in English</a>
        </div>
      `;
    }

    if (!shouldShow) return;

    const banner = document.createElement('div');
    banner.id = 'langSuggestionBanner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(90deg, #1e1b4b, #0f172a);
      border-bottom: 1.5px solid #38bdf8;
      color: #ffffff;
      padding: 7px 14px;
      font-size: 12px;
      z-index: 100000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      animation: slideDownBanner 0.3s ease-out forwards;
    `;

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'flex: 1; text-align: center;';
    contentDiv.innerHTML = bannerHtml;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Dispensar';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 14px;
      cursor: pointer;
      padding: 4px 8px;
      margin-left: 8px;
      font-weight: bold;
      transition: color 0.2s;
    `;
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = '#ffffff');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = '#94a3b8');

    const dismiss = () => {
      localStorage.setItem(STORAGE_DISMISS_KEY, 'true');
      banner.style.display = 'none';
      document.body.style.paddingTop = '0px';
    };

    closeBtn.addEventListener('click', dismiss);

    banner.appendChild(contentDiv);
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);

    // Ajusta o topo do body caso haja navbar fixa
    document.body.style.paddingTop = `${banner.offsetHeight}px`;

    const acceptBtn = banner.querySelector('#btnAcceptLangSwitch');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        localStorage.setItem(STORAGE_DISMISS_KEY, 'true');
      });
    }
  }

  function init() {
    mountNavLanguageSwitch();
    mountSuggestionBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.LanguageManager = {
    isEnglishContext,
    getTargetUrl
  };
})();
