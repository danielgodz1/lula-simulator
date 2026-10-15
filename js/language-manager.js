// js/language-manager.js — Gerenciador Inteligente de Idiomas, Blindagem Anti-Bot/AdSense e Roteamento Dual-Domain
// Suporta separação de domínios: lulasimulator.com.br (PT-BR) e flappylula.com (EN)

(function () {
  'use strict';

  const STORAGE_LANG_PREF_KEY = 'user_lang_pref';
  const DOMAIN_PT = 'lulasimulator.com.br';
  const DOMAIN_EN = 'flappylula.com';

  /**
   * 1. WHITELIST DE CRAWLERS E ROBÔS (CRÍTICO PARA GOOGLE ADSENSE E SEO)
   * Detecta Googlebot, Mediapartners-Google, AdsBot, Lighthouse, Bingbot e outros.
   * Robôs NUNCA sofrem redirecionamento automático nem recebem modais bloqueantes.
   */
  function isSearchOrAdBot() {
    try {
      if (typeof navigator === 'undefined') return false;

      // Automação / Headless browser (Lighthouse, Puppeteer, Selenium)
      if (navigator.webdriver) return true;

      const ua = navigator.userAgent || '';
      const botPattern = /bot|googlebot|mediapartners|adsbot|lighthouse|pagespeed|bingbot|crawler|spider|slurp|facebookexternalhit|whatsapp|duckduckbot|yandex|baidu/i;
      if (botPattern.test(ua)) return true;

      // Verificação de plugins vazios típica de bots headless
      if (navigator.plugins && navigator.plugins.length === 0 && !/mobile/i.test(ua)) {
        // Pode ser um crawler em headless mode
      }
    } catch (e) {
      // Falha silenciosa
    }
    return false;
  }

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

    // Mapeamento de nomes de páginas traduzidas caso existam
    let targetPage = page;
    if (targetLang === 'en') {
      if (page === 'privacidade.html') targetPage = 'privacy.html';
      if (page === 'termos.html') targetPage = 'terms.html';
    } else {
      if (page === 'privacy.html') targetPage = 'privacidade.html';
      if (page === 'terms.html') targetPage = 'termos.html';
    }

    if (targetLang === 'en') {
      if (isProductionHost) {
        return `https://${DOMAIN_EN}/${targetPage === 'index.html' ? '' : targetPage}`;
      }
      return `/en/${targetPage === 'index.html' ? 'index.html' : targetPage}`;
    } else {
      if (isProductionHost) {
        return `https://${DOMAIN_PT}/${targetPage === 'index.html' ? '' : targetPage}`;
      }
      return `/${targetPage === 'index.html' ? 'index.html' : targetPage}`;
    }
  }

  /**
   * Salva preferência explícita do usuário
   */
  function setUserLangPreference(lang) {
    try {
      localStorage.setItem(STORAGE_LANG_PREF_KEY, lang);
    } catch (e) {}
  }

  function getUserLangPreference() {
    try {
      return localStorage.getItem(STORAGE_LANG_PREF_KEY);
    } catch (e) {
      return null;
    }
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

  /**
   * Roteamento Dual-Domain e detecção inteligente sem quebrar bots
   */
  function handleSmartRouting() {
    // SE FOR UM BOT, NUNCA REDIRECIONAR AUTOMATICAMENTE!
    if (isSearchOrAdBot()) {
      return;
    }

    const host = window.location.hostname.toLowerCase();
    const isEnHost = host.includes(DOMAIN_EN);
    const isPtHost = host.includes(DOMAIN_PT);
    const isEn = isEnglishContext();
    const savedPref = getUserLangPreference();

    // 1. Se o usuário estiver no domínio oficial em inglês flappylula.com
    if (isEnHost) {
      // Se não estiver na pasta /en/ nem reescrita (caso local ou proxy), garantir sem loop
      return;
    }

    // 2. Se o usuário já possui preferência salva no navegador, respeitar integralmente
    if (savedPref) {
      if (savedPref === 'en' && !isEn) {
        // Usuário optou por inglês anteriormente
        const target = getTargetUrl('en');
        if (target && target !== window.location.href) {
          window.location.replace(target);
        }
      }
      return;
    }

    // 3. Usuário novo (sem preferência salva) acessando lulasimulator.com.br ou raiz PT:
    // Se estiver fora do Brasil OU com locale em inglês primário:
    if (!isEn && !isFromBrazil()) {
      const userLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      const isEnglishUser = userLang.startsWith('en');

      if (isEnglishUser) {
        // Redireciona suavemente para a versão em inglês
        const target = getTargetUrl('en');
        if (target && target !== window.location.href) {
          // Marca parâmetro para alertar no destino com a opção de voltar
          const separator = target.includes('?') ? '&' : '?';
          window.location.replace(`${target}${separator}auto_routed=1`);
        }
      }
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
      ? '<span style="font-size:18px; line-height:1; font-family: \'Segoe UI Emoji\', \'Apple Color Emoji\', \'Noto Color Emoji\', sans-serif;">🇧🇷 PT</span>'
      : '<span style="font-size:18px; line-height:1; font-family: \'Segoe UI Emoji\', \'Apple Color Emoji\', \'Noto Color Emoji\', sans-serif;">🇺🇸 EN</span>';

    link.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      margin-left: 6px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #ffffff;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
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

    link.addEventListener('click', () => {
      setUserLangPreference(targetLang);
    });

    // Insere no grupo direito da nav se existir, ou no nav
    const rightGroup = nav.querySelector('.nav-right-group') || nav;
    rightGroup.appendChild(link);
  }

  /**
   * Banner/Toast não-intrusivo de sugestão de idioma
   */
  function mountSuggestionBanner() {
    // BOTS NÃO VEEM BANNER NEM INTERFERÊNCIAS VISUAIS
    if (isSearchOrAdBot()) return;

    const isEn = isEnglishContext();
    const fromBrazil = isFromBrazil();
    const urlParams = new URLSearchParams(window.location.search);
    const wasAutoRouted = urlParams.get('auto_routed') === '1';
    const savedPref = getUserLangPreference();

    let shouldShow = false;
    let bannerHtml = '';

    // Caso A: Usuário estava em lulasimulator.com.br e foi auto-roteado para EN (ou acessou direto com IP internacional)
    if (isEn && wasAutoRouted && !savedPref) {
      shouldShow = true;
      const ptUrl = getTargetUrl('pt');
      bannerHtml = `
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:center; text-align:center;">
          <span>🌍 <b>Playing from outside Brazil?</b> Switch to our official English domain <b>FlappyLula.com</b> for the best global experience, or</span>
          <button id="btnStayLulaSimulator" style="
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: #ffffff;
            font-weight: 800;
            padding: 5px 12px;
            border-radius: 6px;
            border: 1px solid #4ade80;
            cursor: pointer;
            font-size: 12px;
            text-decoration: none;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
          ">🇧🇷 Stay here on LulaSimulator.com.br</button>
        </div>
      `;
    }
    // Caso B: Usuário do Brasil acessando versão em inglês
    else if (isEn && fromBrazil && !savedPref) {
      shouldShow = true;
      const ptUrl = getTargetUrl('pt');
      bannerHtml = `
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:center; text-align:center;">
          <span>🇧🇷 <b>Identificamos que você está no Brasil! Deseja jogar a versão oficial em português?</b></span>
          <a href="${ptUrl}" id="btnGoToPortuguese" style="
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: #ffffff;
            font-weight: 800;
            padding: 5px 14px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
            border: 1px solid #4ade80;
          ">🎮 Jogar em Português (lulasimulator.com.br)</a>
          <button id="btnStayEnglish" style="
            background: transparent;
            color: #94a3b8;
            border: 1px solid rgba(255,255,255,0.2);
            padding: 4px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11.5px;
          ">Manter em Inglês</button>
        </div>
      `;
    }
    // Caso C: Usuário internacional acessando a raiz PT diretamente
    else if (!isEn && !fromBrazil && !savedPref) {
      shouldShow = true;
      const enUrl = getTargetUrl('en');
      bannerHtml = `
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:center; text-align:center;">
          <span>🌍 <b>Playing from outside Brazil?</b> Prefer to play in English on <b>FlappyLula.com</b>?</span>
          <a href="${enUrl}" id="btnGoToEnglish" style="
            background: linear-gradient(135deg, #38bdf8, #0284c7);
            color: #ffffff;
            font-weight: 800;
            padding: 5px 14px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4);
            border: 1px solid #7dd3fc;
          ">🎮 Switch to FlappyLula.com</a>
          <button id="btnStayLulaSimulator" style="
            background: transparent;
            color: #cbd5e1;
            border: 1px solid rgba(255,255,255,0.2);
            padding: 4px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11.5px;
          ">Stay on LulaSimulator.com.br</button>
        </div>
      `;
    }

    if (!shouldShow) return;

    try {
      if (localStorage.getItem('lula_lang_banner_dismissed') === 'true') {
        return;
      }
    } catch (e) {}

    const isGamePage = typeof document !== 'undefined' && (
      document.body.classList.contains('game-body') ||
      !!document.querySelector('.game-wrapper')
    );

    // Injeta regras de CSS para não bloquear a gameplay
    if (!document.getElementById('langBannerStyle')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'langBannerStyle';
      styleEl.textContent = `
        body.game-playing #langSuggestionBanner,
        body.is-fullscreen #langSuggestionBanner {
          display: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const existing = document.getElementById('langSuggestionBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'langSuggestionBanner';
    banner.style.cssText = `
      position: ${isGamePage ? 'relative' : 'sticky'};
      top: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(90deg, #1e1b4b 0%, #0f172a 50%, #1e1b4b 100%);
      border-bottom: 2px solid #22c55e;
      color: #ffffff;
      padding: ${isGamePage ? '6px 12px' : '8px 16px'};
      font-size: ${isGamePage ? '11.5px' : '12.5px'};
      z-index: 100000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.7);
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
    `;

    const dismiss = () => {
      banner.style.display = 'none';
      try {
        localStorage.setItem('lula_lang_banner_dismissed', 'true');
      } catch (e) {}
    };

    closeBtn.addEventListener('click', dismiss);

    banner.appendChild(contentDiv);
    banner.appendChild(closeBtn);
    document.body.insertBefore(banner, document.body.firstChild);

    // Bindings de ações nos botões do banner
    const btnStayLula = banner.querySelector('#btnStayLulaSimulator');
    if (btnStayLula) {
      btnStayLula.addEventListener('click', () => {
        setUserLangPreference('pt');
        dismiss();
        if (isEn) {
          const ptTarget = getTargetUrl('pt');
          window.location.href = ptTarget;
        }
      });
    }

    const btnStayEn = banner.querySelector('#btnStayEnglish');
    if (btnStayEn) {
      btnStayEn.addEventListener('click', () => {
        setUserLangPreference('en');
        dismiss();
      });
    }

    const btnGoEn = banner.querySelector('#btnGoToEnglish');
    if (btnGoEn) {
      btnGoEn.addEventListener('click', () => {
        setUserLangPreference('en');
      });
    }

    const btnGoPt = banner.querySelector('#btnGoToPortuguese');
    if (btnGoPt) {
      btnGoPt.addEventListener('click', () => {
        setUserLangPreference('pt');
      });
    }
  }

  function init() {
    handleSmartRouting();
    mountNavLanguageSwitch();
    mountSuggestionBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.LanguageManager = {
    isSearchOrAdBot,
    isEnglishContext,
    getTargetUrl,
    setUserLangPreference,
    getUserLangPreference
  };
})();
