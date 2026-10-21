/**
 * js/ads-manager.js — Gerenciador Inteligente de Anúncios e Compliance Adsterra / H5 Games
 * 
 * Suporta:
 * - Banners Responsivos: 320x50, 160x600, 160x300
 * - Social Bar Adsterra
 * - Smartlink Oficial para Segunda Chance (Revive Recompensado) e Bônus de Picanhas
 * - Blindagem contra travamentos (localStorage / document.cookie mock para iframes isolados)
 */

import { CharacterInventory } from './game/characters.js';

export const ADSENSE_REVIEW_MODE = false;

export const AD_CONFIG = {
  REFRESH_INTERVAL_SEC: 60,
  ENABLE_NATIVE_BANNER: false,
  ACTIVE_NETWORK: 'adsterra',

  BANNER_320x50: {
    key: '66d34c9bfbb1a19bb44210de393265f9',
    width: 320,
    height: 50,
    scriptUrl: 'https://bicea.org/22/66d34c9bfbb1a19bb44210de393265f9'
  },
  SKYSCRAPER_160x600: {
    key: 'ed07225cb34a228aede2dbebc0ca00ef',
    width: 160,
    height: 600,
    scriptUrl: 'https://bicea.org/22/ed07225cb34a228aede2dbebc0ca00ef'
  },
  BANNER_160x300: {
    key: '9a20b8895b4fb04fd16d972ead80b4e0',
    width: 160,
    height: 300,
    scriptUrl: 'https://bicea.org/22/9a20b8895b4fb04fd16d972ead80b4e0'
  },
  SMARTLINK_URL: 'https://arwf.org/4/513c68ca4f57b334e0bce004c067ea2b',
  SOCIAL_BAR_URL: 'https://bicea.org/14/a3d3dc0b773b28035faa72b2af635754'
};

class AdsManagerService {
  constructor() {
    this.registeredSlots = new Map();
    this.refreshTimer = null;
    this.secondsActive = 0;
    this.isTabActive = typeof document !== 'undefined' ? !document.hidden : true;
    this.isInitialized = false;

    if (typeof document !== 'undefined') {
      this.bindVisibilityEvents();
      this.bindResizeEvent();
    }
  }

  bindVisibilityEvents() {
    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive) {
        this.resumeAutoRefresh();
      } else {
        this.pauseAutoRefresh();
      }
    });

    window.addEventListener('focus', () => {
      this.isTabActive = true;
      this.resumeAutoRefresh();
    });
  }

  bindResizeEvent() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (ADSENSE_REVIEW_MODE) return;
        this.registeredSlots.forEach((slot, id) => {
          if (slot.element && slot.element.offsetWidth > 0 && !slot.element.querySelector('iframe')) {
            this.renderSlot(id);
          }
        });
      }, 300);
    });
  }

  registerSlot(containerId, formatType) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (ADSENSE_REVIEW_MODE) {
      el.style.display = 'none';
      return;
    }

    el.style.display = '';

    this.registeredSlots.set(containerId, {
      containerId,
      formatType,
      element: el,
      lastRender: 0
    });

    this.renderSlot(containerId);
  }

  renderSlot(containerId) {
    if (ADSENSE_REVIEW_MODE) {
      const el = document.getElementById(containerId);
      if (el) el.style.display = 'none';
      return;
    }

    const slot = this.registeredSlots.get(containerId);
    if (!slot || !slot.element) return;

    const isEn = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/en/') || 
      window.location.hostname.includes('flappylula.com')
    );

    let width = 320;
    let height = 50;
    let key = AD_CONFIG.BANNER_320x50.key;
    let scriptUrl = AD_CONFIG.BANNER_320x50.scriptUrl;
    let formatParam = '320x50';

    if (slot.formatType === '160x600' || containerId === 'adSidebarLeft' || containerId === 'adSidebarRight') {
      // No flappylula.com ou se a janela for baixa, usa o banner 160x300
      const isShortScreen = typeof window !== 'undefined' && window.innerHeight < 680;
      if (isEn || isShortScreen || slot.formatType === '160x300') {
        width = 160;
        height = 300;
        key = AD_CONFIG.BANNER_160x300.key;
        scriptUrl = AD_CONFIG.BANNER_160x300.scriptUrl;
        formatParam = '160x300';
      } else {
        width = 160;
        height = 600;
        key = AD_CONFIG.SKYSCRAPER_160x600.key;
        scriptUrl = AD_CONFIG.SKYSCRAPER_160x600.scriptUrl;
        formatParam = '160x600';
      }
    } else if (slot.formatType === '160x300') {
      width = 160;
      height = 300;
      key = AD_CONFIG.BANNER_160x300.key;
      scriptUrl = AD_CONFIG.BANNER_160x300.scriptUrl;
      formatParam = '160x300';
    }

    slot.element.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('title', 'Publicidade Patrocinada');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-same-origin');

    const frameUrl = `${isEn ? '/en/ad-frame.html' : '/ad-frame.html'}?format=${formatParam}&key=${key}&t=${Date.now()}`;
    iframe.src = frameUrl;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
  </style>
  <script>
    (function() {
      try { Object.defineProperty(document, 'cookie', { get: () => '', set: () => {}, configurable: true }); } catch(e){}
      try {
        const dummy = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0 };
        Object.defineProperty(window, 'localStorage', { get: () => dummy, configurable: true });
        Object.defineProperty(window, 'sessionStorage', { get: () => dummy, configurable: true });
      } catch(e){}
    })();
  <\/script>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${key}',
      'format' : 'iframe',
      'height' : ${height},
      'width' : ${width},
      'params' : {}
    };
  <\/script>
  <script type="text/javascript" src="${scriptUrl}"><\/script>
</body>
</html>`;

    slot.element.appendChild(iframe);
    try {
      iframe.srcdoc = htmlContent;
    } catch (e) {
      // Fallback para iframe.src caso srcdoc falhe
    }

    slot.lastRender = Date.now();
  }

  startAutoRefresh() {
    if (ADSENSE_REVIEW_MODE) return;
    if (this.refreshTimer) clearInterval(this.refreshTimer);

    this.refreshTimer = setInterval(() => {
      if (!this.isTabActive) return;

      this.secondsActive++;
      if (this.secondsActive >= AD_CONFIG.REFRESH_INTERVAL_SEC) {
        this.secondsActive = 0;
        this.refreshAllSlots();
      }
    }, 1000);
  }

  pauseAutoRefresh() {}
  resumeAutoRefresh() {}

  refreshAllSlots() {
    if (ADSENSE_REVIEW_MODE) return;
    this.registeredSlots.forEach((slot, containerId) => {
      if (slot.element && slot.element.offsetWidth > 0 && slot.element.offsetHeight > 0) {
        this.renderSlot(containerId);
      }
    });
  }

  loadSocialBar() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('adsterra-social-bar')) return;

    try {
      const script = document.createElement('script');
      script.id = 'adsterra-social-bar';
      script.setAttribute('data-cfasync', 'false');
      script.src = AD_CONFIG.SOCIAL_BAR_URL;
      document.body.appendChild(script);
    } catch (e) {
      console.warn('Falha ao carregar Social Bar:', e);
    }
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (ADSENSE_REVIEW_MODE) {
      const adContainers = document.querySelectorAll('.ad-banner-container-320x50, #adSidebarLeft, #adSidebarRight, #adBannerFooter, #adBannerHero, #adBannerFeatures, #adBannerGameOver, #adBannerConquistas, #adBannerRankingTop, #adBannerRankingBottom, #adBannerFeedback, #adBannerContact');
      adContainers.forEach(el => {
        el.style.display = 'none';
        el.innerHTML = '';
      });
      return;
    }

    // Carrega o Social Bar Adsterra
    this.loadSocialBar();

    const commonSlots = [
      { id: 'adSidebarLeft', format: '160x600' },
      { id: 'adSidebarRight', format: '160x600' },
      { id: 'adBannerGameOver', format: '320x50' },
      { id: 'adBannerStartOverlay', format: '320x50' },
      { id: 'adBannerHero', format: '320x50' },
      { id: 'adBannerFeatures', format: '320x50' },
      { id: 'adBannerFooter', format: '320x50' },
      { id: 'adBannerConquistas', format: '320x50' },
      { id: 'adBannerRankingTop', format: '320x50' },
      { id: 'adBannerRankingBottom', format: '320x50' },
      { id: 'adBannerFeedback', format: '320x50' },
      { id: 'adBannerContact', format: '320x50' },
      { id: 'adMobileFixedFooter', format: '320x50' },
      { id: 'adBannerLoja', format: '320x50' },
      { id: 'adBannerVisitantes', format: '320x50' },
      { id: 'adBannerSocial', format: '320x50' }
    ];

    commonSlots.forEach(s => {
      if (document.getElementById(s.id)) {
        this.registerSlot(s.id, s.format);
      }
    });

    this.startAutoRefresh();
  }

  loadNativeBanner(targetContainerId) {
    const id = targetContainerId || 'adContainerNative';
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = '';
      if (!AD_CONFIG.ENABLE_NATIVE_BANNER) {
        container.style.display = 'none';
      }
    }
  }

  /**
   * Modal Interativo e Seguro de Anúncio Recompensado (Segunda Chance e Bônus):
   * Exibe visualmente o banner do patrocinador, oferece botão direto com o Smartlink
   * e libera a recompensa após contagem de 5s ou no retorno da aba!
   */
  showRewardedAdModal(onComplete, onCancel) {
    const isEn = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/en/') || 
      window.location.hostname.includes('flappylula.com')
    );

    // Pausa elementos de áudio ativos durante a exibição
    const allAudios = document.querySelectorAll('audio');
    const wasPlayingAudios = [];
    allAudios.forEach(a => {
      if (!a.paused) {
        wasPlayingAudios.push(a);
        try { a.pause(); } catch(e){}
      }
    });

    let existingModal = document.getElementById('adsterraRewardedModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'adsterraRewardedModal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(8, 9, 20, 0.94);
      backdrop-filter: blur(8px);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
      animation: fadeInRewardModal 0.25s ease-out;
    `;

    let secondsLeft = 5;
    let rewardGranted = false;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: linear-gradient(145deg, #161a33 0%, #0b0f1f 100%);
      border: 2px solid #22c55e;
      border-radius: 20px;
      box-shadow: 0 0 45px rgba(34, 197, 94, 0.45);
      max-width: 440px;
      width: 100%;
      padding: 24px 20px;
      text-align: center;
      color: #ffffff;
      position: relative;
    `;

    modalContent.innerHTML = `
      <div style="font-size: 38px; margin-bottom: 6px;">📺💖</div>
      <h3 style="font-family: 'Bangers', cursive; font-size: 26px; color: #ffdf00; letter-spacing: 1.5px; margin: 0 0 6px;">
        ${isEn ? 'SECOND CHANCE · REWARDED AD' : 'SEGUNDA CHANCE · ANÚNCIO'}
      </h3>
      <p style="color: #cbd5e1; font-size: 13px; line-height: 1.45; margin: 0 0 14px;">
        ${isEn 
          ? 'Support the free game by checking the sponsor below to revive with 3s of invulnerability!' 
          : 'Apoie o jogo gratuito visualizando o anúncio abaixo para reviver com 3s de invulnerabilidade!'}
      </p>

      <!-- Container do Banner do Patrocinador dentro do Modal -->
      <div id="rewardedModalBannerContainer" style="
        min-height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.35);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        margin-bottom: 16px;
        overflow: hidden;
      ">
        <iframe src="${isEn ? '/en/ad-frame.html' : '/ad-frame.html'}?format=320x50&t=${Date.now()}" 
          style="width:320px; height:50px; border:none; overflow:hidden;" 
          scrolling="no" 
          title="Patrocinador"></iframe>
      </div>

      <!-- Botão de Acesso Direto ao Smartlink do Patrocinador -->
      <div style="margin-bottom: 16px;">
        <a id="btnOpenSponsorLink" href="${AD_CONFIG.SMARTLINK_URL}" target="_blank" rel="noopener noreferrer" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 16px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #ffffff;
          font-weight: 800;
          font-size: 14px;
          text-decoration: none;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.35);
          transition: transform 0.15s ease;
          box-sizing: border-box;
        ">
          🚀 ${isEn ? 'OPEN SPONSOR LINK (Unlock Faster)' : 'VISITAR PATROCINADOR (Liberar Rápido)'}
        </a>
      </div>

      <!-- Barra de Progresso do Anúncio (5s) -->
      <div style="background: rgba(255, 255, 255, 0.1); border-radius: 999px; height: 9px; overflow: hidden; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <div id="rewardProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #22c55e, #ffdf00); transition: width 1s linear;"></div>
      </div>

      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 12px; color: #94a3b8;">${isEn ? 'Reward unlocks in:' : 'Recompensa liberada em:'}</span>
        <span id="rewardCountdownBadge" style="
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid #22c55e;
          color: #86efac;
          font-weight: 800;
          font-size: 14px;
          padding: 2px 10px;
          border-radius: 999px;
          font-family: monospace;
        ">5s</span>
      </div>

      <!-- Botão de Cancelar (para não prender o jogador caso desista) -->
      <div>
        <button id="btnCancelRewardedModal" style="
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 12px;
          text-decoration: underline;
          cursor: pointer;
          padding: 6px 10px;
          font-family: inherit;
        ">
          ${isEn ? '✖ Cancel and restart game' : '✖ Cancelar e recomeçar partida'}
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const progressBar = modalContent.querySelector('#rewardProgressBar');
    const badge = modalContent.querySelector('#rewardCountdownBadge');
    const btnCancel = modalContent.querySelector('#btnCancelRewardedModal');
    const btnOpenSponsor = modalContent.querySelector('#btnOpenSponsorLink');

    const restoreAudio = () => {
      wasPlayingAudios.forEach(a => {
        try { a.play(); } catch(e){}
      });
    };

    const finishReward = () => {
      if (rewardGranted) return;
      rewardGranted = true;
      restoreAudio();
      window.removeEventListener('focus', onFocusReturn);
      modal.remove();
      if (typeof onComplete === 'function') {
        onComplete();
      }
    };

    const cancelReward = () => {
      if (rewardGranted) return;
      rewardGranted = true;
      restoreAudio();
      window.removeEventListener('focus', onFocusReturn);
      modal.remove();
      if (typeof onCancel === 'function') {
        onCancel();
      }
    };

    if (btnCancel) {
      btnCancel.addEventListener('click', (e) => {
        e.stopPropagation();
        cancelReward();
      });
    }

    const onFocusReturn = () => {
      // Quando o jogador clica no link do patrocinador e volta para o jogo, concede o benefício
      setTimeout(finishReward, 600);
    };

    if (btnOpenSponsor) {
      btnOpenSponsor.addEventListener('click', () => {
        window.addEventListener('focus', onFocusReturn, { once: true });
        // Também acelera o desbloqueio
        secondsLeft = Math.min(secondsLeft, 2);
      });
    }

    const interval = setInterval(() => {
      if (rewardGranted) {
        clearInterval(interval);
        return;
      }

      secondsLeft--;
      const percent = Math.max(0, Math.min(100, ((5 - secondsLeft) / 5) * 100));
      if (progressBar) progressBar.style.width = `${percent}%`;

      if (secondsLeft > 0) {
        if (badge) badge.textContent = `${secondsLeft}s`;
      } else {
        clearInterval(interval);
        if (badge) {
          badge.textContent = 'PRONTO! 🎉';
          badge.style.background = '#22c55e';
          badge.style.color = '#000';
        }
        setTimeout(finishReward, 500);
      }
    }, 1000);
  }

  /**
   * Sistema de Segunda Chance (Revive Recompensado):
   * Exibe o modal seguro com anúncio Adsterra e smartlink, liberando o reviver!
   */
  showRewardedRevive(onSuccess, onCancel, onOpening) {
    if (typeof onOpening === 'function') {
      onOpening();
    }

    this.showRewardedAdModal(onSuccess, onCancel);
  }

  /**
   * Botão de Recompensa (Rewarded / Smartlink) para ganho de Picanhas extras
   */
  openRewardedLink(rewardCallback) {
    this.showRewardedAdModal(() => {
      CharacterInventory.addPicanhas(10);
      CharacterInventory.syncPicanhasNow();
      if (typeof rewardCallback === 'function') {
        rewardCallback(10);
      }
    });
  }

  triggerSmartlinkReward(callback) {
    this.openRewardedLink(callback);
  }
}

export const AdsManager = new AdsManagerService();
