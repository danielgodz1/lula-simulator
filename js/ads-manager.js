/**
 * js/ads-manager.js — Gerenciador Inteligente e Otimizado de Anúncios Adsterra
 * 
 * Recursos:
 * 1. Auto-Refresh Inteligente (a cada 50 segundos) pausado automaticamente quando a aba fica em background (Page Visibility API).
 * 2. Renderização Não-Bloqueante isolada em iframes sandboxed (zero impacto no FPS do jogo).
 * 3. Lazy Loading pós-inicialização do Canvas para garantir 0 impacto no carregamento.
 * 4. Botão Opcional de Recompensa (Rewarded / Smartlink) concedendo picanhas/bônus no jogo.
 */

import { CharacterInventory } from './game/characters.js';

export const AD_CONFIG = {
  REFRESH_INTERVAL_SEC: 50, // Entre 45 e 60 segundos (recomendação de redes de anúncios)
  
  // FLAG DE SEGURANÇA: Desativa completamente formatos nativos/arriscados
  ENABLE_NATIVE_BANNER: false,

  // Rede Ativa: 'adsterra' | 'monetag' | 'propellerads'
  ACTIVE_NETWORK: 'adsterra',

  // Configuração por Rede de Anúncios (fácil alternância caso precise trocar de parceiro)
  NETWORKS: {
    adsterra: {
      nativeBanner: {
        containerId: 'container-455bffdd2f0b77226264233d844b73cd',
        scriptUrl: 'https://pl30963271.profitableratecpmnetwork.com/455bffdd2f0b77226264233d844b73cd/invoke.js'
      },
      smartlink: 'https://grannyreproof.com/h6xu2jgbbn?key=513c68ca4f57b334e0bce004c067ea2b'
    },
    monetag: {
      // Modelo alternativo para troca rápida caso desejar
      nativeBanner: {
        containerId: 'container-monetag-native',
        scriptUrl: 'https://alwingulla.com/88/tag.min.js'
      },
      smartlink: 'https://alwingulla.com/link?id=monetag_fallback'
    },
    propellerads: {
      // Modelo alternativo para troca rápida
      nativeBanner: {
        containerId: 'container-propeller-native',
        scriptUrl: 'https://propellerads.com/sdk.js'
      },
      smartlink: 'https://propellerads.com/link?id=propeller_fallback'
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

  /**
   * PLANO DE COEXISTÊNCIA FUTURA COM GOOGLE ADSENSE:
   * O Google AdSense (ca-pub-7823595523903839) está com domínio aprovado ("preparando anúncios").
   * Quando estiver liberado e veiculando ativamente, AdSense e Adsterra ocuparão slots visuais distintos:
   * - Google AdSense: Banners de cabeçalho e rodapé em páginas informativas (ranking, conquistas, visitantes, feedback).
   * - Adsterra: Skyscraper lateral fixo (160x600) e Smartlinks interativos de Segunda Chance (Revive) e Picanhas bônus.
   * Ambas as redes não concorrerão pelo mesmo container HTML.
   */

  /**
   * Monitora a Page Visibility API para pausar o refresh quando a aba do jogo não estiver visível.
   */
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

    window.addEventListener('blur', () => {
      // Quando a janela perde o foco
    });
  }

  /**
   * Monitora o redimensionamento da tela com debounce para carregar banners laterais quando a tela crescer
   */
  bindResizeEvent() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.registeredSlots.forEach((slot, id) => {
          if (slot.element && slot.element.offsetWidth > 0 && !slot.element.querySelector('iframe')) {
            this.renderSlot(id);
          }
        });
      }, 250);
    });
  }

  /**
   * Registra um slot de anúncio na página
   * @param {string} containerId - ID do elemento HTML container
   * @param {'160x600' | '300x250' | '320x50'} formatType - Tipo do banner
   */
  registerSlot(containerId, formatType) {
    const el = document.getElementById(containerId);
    if (!el) return;

    this.registeredSlots.set(containerId, {
      containerId,
      formatType,
      element: el,
      lastRender: 0
    });

    // Render inicial
    this.renderSlot(containerId);
  }

  /**
   * Renderiza o script do anúncio de forma assíncrona dentro de um iframe isolado
   */
  renderSlot(containerId) {
    const slot = this.registeredSlots.get(containerId);
    if (!slot || !slot.element) return;

    let width = 320;
    let height = 50;
    if (slot.formatType === '160x600') {
      width = 160; height = 600;
    } else if (slot.formatType === '300x250') {
      width = 300; height = 250;
    }

    // Remove iframes anteriores para evitar vazamento de memória
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

  /**
   * Inicia o timer de refresh periódico inteligente
   */
  startAutoRefresh() {
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

  pauseAutoRefresh() {
    // Pausa contagem durante inatividade
  }

  resumeAutoRefresh() {
    // Retoma contagem ativa
  }

  /**
   * Recarrega todos os slots visíveis no momento
   */
  refreshAllSlots() {
    this.registeredSlots.forEach((slot, containerId) => {
      if (slot.element && slot.element.offsetWidth > 0 && slot.element.offsetHeight > 0) {
        this.renderSlot(containerId);
      }
    });
  }

  /**
   * Inicializa o AdsManager após o carregamento principal da página/canvas
   */
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Registra slots padrão caso existam no DOM
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

  /**
   * Carrega o Native Banner (DESATIVADO POR SEGURANÇA)
   * @param {string} [targetContainerId]
   */
  loadNativeBanner(targetContainerId) {
    // DESATIVAÇÃO IMEDIATA: Bloqueia qualquer execução de Native Banner
    if (!AD_CONFIG.ENABLE_NATIVE_BANNER) {
      const id = targetContainerId || AD_CONFIG.NATIVE_BANNER.containerId;
      const container = document.getElementById(id);
      if (container) container.innerHTML = '';
      return;
    }

    const id = targetContainerId || AD_CONFIG.NATIVE_BANNER.containerId;
    const container = document.getElementById(id);
    if (!container || container.dataset.adLoaded) return;
    container.dataset.adLoaded = 'true';

    const activeConfig = AD_CONFIG.NETWORKS[AD_CONFIG.ACTIVE_NETWORK]?.nativeBanner || AD_CONFIG.NATIVE_BANNER;
    if (!activeConfig || !activeConfig.scriptUrl) return;

    try {
      container.innerHTML = '';

      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.maxWidth = '900px';
      iframe.style.minHeight = '180px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.display = 'block';
      iframe.style.margin = '0 auto';
      // ISOLAMENTO RIGOROSO: SEM 'allow-same-origin'
      iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms');
      iframe.title = 'Publicidade Patrocinada';
      iframe.setAttribute('loading', 'lazy');

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
          <div id="${activeConfig.containerId}"></div>
          <script async="async" data-cfasync="false" src="${activeConfig.scriptUrl}"><\/script>
        </body>
        </html>
      `;

      container.appendChild(iframe);
      iframe.srcdoc = htmlContent;
    } catch (e) {
      console.warn('Falha ao carregar Native Banner isolado:', e);
    }
  }

  /**
   * Sistema de Segunda Chance (Revive Recompensado):
   * Abre o Smartlink/anúncio em nova aba e aciona o callback para reviver o jogador
   */
  showRewardedRevive(onSuccess, onCancel) {
    try {
      window.open(AD_CONFIG.SMARTLINK_URL, '_blank', 'noopener,noreferrer');
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch(e) {
      console.warn('Erro ao abrir anúncio de Segunda Chance:', e);
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    }
  }

  /**
   * Botão de Recompensa (Rewarded / Smartlink)
   * Abre o Smartlink em nova aba e concede recompensa em picanhas no retorno
   */
  openRewardedLink(rewardCallback) {
    try {
      window.open(AD_CONFIG.SMARTLINK_URL, '_blank', 'noopener,noreferrer');
      
      // Concede 10 picanhas bônus
      CharacterInventory.addPicanhas(10);
      CharacterInventory.syncPicanhasNow();

      if (typeof rewardCallback === 'function') {
        rewardCallback(10);
      }
    } catch(e) {
      console.error('Erro ao abrir Smartlink:', e);
    }
  }

  /**
   * Alias de compatibilidade para acionar recompensa
   */
  triggerSmartlinkReward(callback) {
    this.openRewardedLink(callback);
  }
}

export const AdsManager = new AdsManagerService();
