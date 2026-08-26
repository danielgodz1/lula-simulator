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
        return `https://${DOMAIN_EN}/en/${page === 'index.html' ? '' : page}`;
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
      ? '<span style="font-size:18px; line-height:1;">🇧🇷</span>'
      : '<span style="font-size:18px; line-height:1;">🇺🇸</span>';

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

  function isFromBrazil() {
    try {
      const userLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      if (userLang.includes('pt') || userLang.includes('br')) return true;
      if (Array.isArray(navigator.languages) && navigator.languages.some(l => l.toLowerCase().includes('pt') || l.toLowerCase().includes('br'))) return true;

      const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
      const brazilTimezones = ['sao_paulo', 'recife', 'belem', 'fortaleza', 'manaus', 'cuiaba', 'porto_velho', 'boa_vista', 'campo_grande', 'maceio', 'noronha', 'rio_branco', 'santarem', 'araguaina', 'bahia'];
      if (brazilTimezones.some(b => tz.includes(b))) return true;

      const savedCountry = (localStorage.getItem('lula_country') || '').toUpperCase();
      if (savedCountry === 'BR' || savedCountry === 'BRAZIL' || savedCountry === 'BRASIL') return true;
    } catch (e) {}
    return false;
  }

  function mountSuggestionBanner() {
    const isEn = isEnglishContext();
    const fromBrazil = isFromBrazil();
    const userLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    const isUserPortuguese = userLang.startsWith('pt');

    let shouldShow = false;
    let bannerHtml = '';
    let targetUrl = '';

    if (isEn && (fromBrazil || isUserPortuguese)) {
      // Usuário do Brasil acessando flappylula.com (versão em inglês)
      // Mostra a notificação em destaque convidando para a versão nacional
      shouldShow = true;
      targetUrl = getTargetUrl('pt');
      bannerHtml = `
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:center;">
          <span>🇧🇷 <b>Identificamos que você está no Brasil! Deseja jogar a versão oficial em português?</b></span>
          <a href="${targetUrl}" id="btnAcceptLangSwitch" style="
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: #ffffff;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
            border: 1px solid #4ade80;
            transition: transform 0.15s ease;
          ">🎮 Jogar em Português (lulasimulator.com.br)</a>
        </div>
      `;
    } else if (!isEn && !fromBrazil && !isUserPortuguese && userLang.length >= 2) {
      // Usuário internacional em lulasimulator.com.br (PT)
      shouldShow = true;
      targetUrl = getTargetUrl('en');
      bannerHtml = `
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:center;">
          <span>🇺🇸 <b>Prefer to play in English?</b></span>
          <a href="${targetUrl}" id="btnAcceptLangSwitch" style="
            background: linear-gradient(135deg, #38bdf8, #0284c7);
            color: #ffffff;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4);
            border: 1px solid #7dd3fc;
            transition: transform 0.15s ease;
          ">🎮 Play in English (flappylula.com)</a>
        </div>
      `;
    }

    if (!shouldShow) return;

    // Se já existe um banner, remove antes de recriar
    const existing = document.getElementById('langSuggestionBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'langSuggestionBanner';
    banner.style.cssText = `
      position: sticky;
      top: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(90deg, #1e1b4b 0%, #0f172a 50%, #1e1b4b 100%);
      border-bottom: 2px solid #22c55e;
      color: #ffffff;
      padding: 9px 16px;
      font-size: 12.5px;
      z-index: 100000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.7);
      animation: slideDownBanner 0.3s ease-out forwards;
      box-sizing: border-box;
    `;

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'flex: 1; text-align: center;';
    contentDiv.innerHTML = bannerHtml;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Fechar Notificação';
    closeBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #cbd5e1;
      font-size: 12px;
      cursor: pointer;
      margin-left: 12px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(239, 68, 68, 0.3)';
      closeBtn.style.color = '#fff';
      closeBtn.style.borderColor = '#ef4444';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      closeBtn.style.color = '#cbd5e1';
      closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });

    const dismiss = () => {
      banner.style.display = 'none';
    };

    closeBtn.addEventListener('click', dismiss);

    banner.appendChild(contentDiv);
    banner.appendChild(closeBtn);
    document.body.insertBefore(banner, document.body.firstChild);
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
