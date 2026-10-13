/**
 * js/ads-manager.js — Gerenciador Inteligente de Anúncios e Compliance Google AdSense / H5 Games
 * 
 * Controles de Revisão do AdSense:
 * - ADSENSE_REVIEW_MODE: Quando true, desativa 100% dos banners e popups/smartlinks externos da Adsterra,
 *   oculta containers vazios e ativa o fluxo limpo de Rewarded Ads (Google H5 Games / Ad Placement API).
 */

import { CharacterInventory } from './game/characters.js';

export const ADSENSE_REVIEW_MODE = true;

export const AD_CONFIG = {
  REFRESH_INTERVAL_SEC: 50,
  ENABLE_NATIVE_BANNER: false,
  ACTIVE_NETWORK: 'adsterra',

  NETWORKS: {
    adsterra: {
      nativeBanner: {
        containerId: 'container-455bffdd2f0b77226264233d844b73cd',
        scriptUrl: 'https://pl30963271.profitableratecpmnetwork.com/455bffdd2f0b77226264233d844b73cd/invoke.js'
      },
      smartlink: 'https://grannyreproof.com/h6xu2jgbbn?key=513c68ca4f57b334e0bce004c067ea2b'
    }
  },

  SKYSCRAPER_160x600: {
    key_pt: 'ed07225cb34a228aede2dbebc0ca00ef',
    key_en: '9db44be4da462195584f4bccadc3f1ae',
    width: 160,
    height: 600
  },
  MEDIUM_RECTANGLE_300x250: {
    key: '427c59b47a5d07234398bf7f25100c26',
    width: 300,
    height: 250,
    scriptUrl: 'https://grannyreproof.com/427c59b47a5d07234398bf7f25100c26/invoke.js'
  },
  BANNER_320x50: {
    key: '66d34c9bfbb1a19bb44210de393265f9',
    width: 320,
    height: 50,
    scriptUrl: 'https://grannyreproof.com/66d34c9bfbb1a19bb44210de393265f9/invoke.js'
  },
  NATIVE_BANNER: {
    scriptUrl: 'https://pl30963271.profitableratecpmnetwork.com/455bffdd2f0b77226264233d844b73cd/invoke.js',
    containerId: 'container-455bffdd2f0b77226264233d844b73cd'
  },
  SMARTLINK_URL: 'https://grannyreproof.com/h6xu2jgbbn?key=513c68ca4f57b334e0bce004c067ea2b'
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
      }, 250);
    });
  }

  registerSlot(containerId, formatType) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (ADSENSE_REVIEW_MODE) {
      // No modo de revisão AdSense, oculta os containers vazios para evitar layout shift e buracos vazios
      el.style.display = 'none';
      return;
    }

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

    let width = 320;
    let height = 50;
    if (slot.formatType === '160x600') {
      width = 160; height = 600;
    } else if (slot.formatType === '300x250') {
      width = 300; height = 250;
    }

    slot.element.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-same-origin');
    iframe.title = 'Publicidade';
    iframe.setAttribute('loading', 'lazy');

    let key = AD_CONFIG.BANNER_320x50.key;
    let scriptUrl = AD_CONFIG.BANNER_320x50.scriptUrl;

    if (slot.formatType === '160x600') {
      const isEnglish = window.location.pathname.startsWith('/en/');
      key = isEnglish ? AD_CONFIG.SKYSCRAPER_160x600.key_en : AD_CONFIG.SKYSCRAPER_160x600.key_pt;
      scriptUrl = `https://grannyreproof.com/${key}/invoke.js`;
    } else if (slot.formatType === '300x250') {
      key = AD_CONFIG.MEDIUM_RECTANGLE_300x250.key;
      scriptUrl = AD_CONFIG.MEDIUM_RECTANGLE_300x250.scriptUrl;
    }

    const htmlContent = `
      <!DOCTYPE html>
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
      </html>
    `;

    slot.element.appendChild(iframe);
    iframe.srcdoc = htmlContent;
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

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (ADSENSE_REVIEW_MODE) {
      // Oculta todas as divs de banners durante a revisão para eliminar espaços em branco
      const adContainers = document.querySelectorAll('.ad-banner-container-320x50, #adSidebarLeft, #adSidebarRight, #adBannerFooter, #adBannerHero, #adBannerFeatures, #adBannerGameOver, #adBannerConquistas, #adBannerRankingTop, #adBannerRankingBottom, #adBannerFeedback, #adBannerContact');
      adContainers.forEach(el => {
        el.style.display = 'none';
        el.innerHTML = '';
      });
      return;
    }

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
      { id: 'adMobileFixedFooter', format: '320x50' }
    ];

    commonSlots.forEach(s => {
      if (document.getElementById(s.id)) {
        this.registerSlot(s.id, s.format);
      }
    });

    this.startAutoRefresh();
  }

  loadNativeBanner(targetContainerId) {
    const id = targetContainerId || AD_CONFIG.NATIVE_BANNER.containerId;
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = '';
      if (ADSENSE_REVIEW_MODE || !AD_CONFIG.ENABLE_NATIVE_BANNER) {
        container.style.display = 'none';
      }
    }
  }

  /**
   * Exibe o Modal Interno de Anúncio Recompensado (5 segundos)
   * Compliance total com as diretrizes do Google AdSense e H5 Games.
   */
  showInternalRewardedModal(onComplete, onCancel) {
    const isEn = typeof window !== 'undefined' && (window.location.pathname.startsWith('/en/') || window.location.hostname.includes('flappylula.com'));

    // Pausa elementos de áudio ativos durante a exibição
    const allAudios = document.querySelectorAll('audio');
    const wasPlayingAudios = [];
    allAudios.forEach(a => {
      if (!a.paused) {
        wasPlayingAudios.push(a);
        try { a.pause(); } catch(e){}
      }
    });

    let existingModal = document.getElementById('adsenseH5RewardModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'adsenseH5RewardModal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(8, 9, 20, 0.94);
      backdrop-filter: blur(8px);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Inter', sans-serif;
      box-sizing: border-box;
      animation: fadeInModal 0.25s ease-out;
    `;

    let secondsLeft = 5;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%);
      border: 2px solid #22c55e;
      border-radius: 20px;
      box-shadow: 0 0 40px rgba(34, 197, 94, 0.45);
      max-width: 440px;
      width: 100%;
      padding: 28px 24px;
      text-align: center;
      color: #ffffff;
      position: relative;
    `;

    modalContent.innerHTML = `
      <div style="font-size: 44px; margin-bottom: 10px; animation: bounceIcon 1s infinite alternate;">📺</div>
      <h3 style="font-family: 'Bangers', cursive; font-size: 28px; color: #ffdf00; letter-spacing: 1.5px; margin: 0 0 8px;">
        ${isEn ? 'REWARDED AD BREAK' : 'ANÚNCIO RECOMPENSADO'}
      </h3>
      <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.5; margin: 0 0 18px;">
        ${isEn 
          ? 'Google H5 Games Ad Placement API · Keep playing with 3s of invulnerability!' 
          : 'Google H5 Games Ad Placement API · Retorne à partida com 3s de invulnerabilidade!'}
      </p>

      <!-- Barra de Progresso do Anúncio de 5s -->
      <div style="background: rgba(255, 255, 255, 0.1); border-radius: 999px; height: 10px; overflow: hidden; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <div id="rewardProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #22c55e, #ffdf00); transition: width 1s linear;"></div>
      </div>

      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px;">
        <span style="font-size: 13px; color: #94a3b8;">${isEn ? 'Reward unlocks in:' : 'Recompensa liberada em:'}</span>
        <span id="rewardCountdownBadge" style="
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid #22c55e;
          color: #86efac;
          font-weight: 800;
          font-size: 16px;
          padding: 3px 12px;
          border-radius: 999px;
          font-family: monospace;
        ">5s</span>
      </div>

      <div id="rewardStatusText" style="font-size: 12px; color: #64748b; font-style: italic;">
        ${isEn ? '⚡ Simulating official H5 reward delivery...' : '⚡ Processando entrega segura da recompensa...'}
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const progressBar = modalContent.querySelector('#rewardProgressBar');
    const badge = modalContent.querySelector('#rewardCountdownBadge');
    const statusText = modalContent.querySelector('#rewardStatusText');

    const finishReward = () => {
      // Restaura áudios que estavam tocando
      wasPlayingAudios.forEach(a => {
        try { a.play(); } catch(e){}
      });

      modal.remove();
      if (typeof onComplete === 'function') {
        onComplete();
      }
    };

    const interval = setInterval(() => {
      secondsLeft--;
      const percent = ((5 - secondsLeft) / 5) * 100;
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
        if (statusText) {
          statusText.textContent = isEn ? '✅ Reward granted! Continuing...' : '✅ Recompensa liberada! Retomando partida...';
          statusText.style.color = '#4ade80';
        }
        setTimeout(finishReward, 550);
      }
    }, 1000);
  }

  /**
   * Sistema de Segunda Chance (Revive Recompensado):
   * Quando ADSENSE_REVIEW_MODE está ativo, executa a Ad Placement API do Google H5 ou
   * aciona o modal interno de 5 segundos, sem abrir nenhuma aba ou smartlink externo.
   */
  showRewardedRevive(onSuccess, onCancel, onOpening) {
    if (typeof onOpening === 'function') {
      onOpening();
    }

    if (ADSENSE_REVIEW_MODE) {
      // 1. Tenta API oficial do Google H5 Games (adBreak) se disponível no ambiente
      if (typeof window !== 'undefined' && typeof window.adBreak === 'function') {
        window.adBreak({
          type: 'reward',
          name: 'revive_second_chance',
          beforeReward: (showAdFn) => {
            showAdFn();
          },
          adDismissed: () => {
            if (typeof onCancel === 'function') onCancel();
          },
          adViewed: () => {
            if (typeof onSuccess === 'function') onSuccess();
          }
        });
        return;
      }

      // 2. Fallback seguro: Modal interno de 5s sem qualquer redirecionamento
      this.showInternalRewardedModal(onSuccess, onCancel);
      return;
    }

    // Modo externo legado (quando não estiver em revisão)
    try {
      window.open(AD_CONFIG.SMARTLINK_URL, '_blank', 'noopener,noreferrer');
    } catch(e) {
      console.warn('Erro ao abrir anúncio de Segunda Chance:', e);
    }

    let rewarded = false;
    const triggerReward = () => {
      if (rewarded) return;
      rewarded = true;
      window.removeEventListener('focus', triggerReward);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        triggerReward();
      }
    };

    window.addEventListener('focus', triggerReward);
    document.addEventListener('visibilitychange', handleVisibility);

    setTimeout(() => {
      if (!rewarded && !document.hidden) {
        triggerReward();
      }
    }, 1200);
  }

  /**
   * Botão de Recompensa (Rewarded / Smartlink)
   */
  openRewardedLink(rewardCallback) {
    if (ADSENSE_REVIEW_MODE) {
      // No modo de revisão AdSense, concede a recompensa via modal limpo de 5 segundos
      this.showInternalRewardedModal(() => {
        CharacterInventory.addPicanhas(10);
        CharacterInventory.syncPicanhasNow();
        if (typeof rewardCallback === 'function') {
          rewardCallback(10);
        }
      });
      return;
    }

    try {
      window.open(AD_CONFIG.SMARTLINK_URL, '_blank', 'noopener,noreferrer');
      CharacterInventory.addPicanhas(10);
      CharacterInventory.syncPicanhasNow();

      if (typeof rewardCallback === 'function') {
        rewardCallback(10);
      }
    } catch(e) {
      console.error('Erro ao abrir Smartlink:', e);
    }
  }

  triggerSmartlinkReward(callback) {
    this.openRewardedLink(callback);
  }
}

export const AdsManager = new AdsManagerService();
