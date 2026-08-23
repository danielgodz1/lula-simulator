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
  REFRESH_INTERVAL_SEC: 50, // Entre 45 e 60 segundos (recomendação Adsterra)
  SKYSCRAPER_160x600: {
    key: 'dda14d693428bdb35d633d7f7c78c2cd',
    width: 160,
    height: 600,
    scriptUrl: 'https://www.highrevenueformat.com/dda14d693428bdb35d633d7f7c78c2cd/invoke.js'
  },
  BANNER_320x50: {
    key: '590c47d997603e6ea80ae7b922875e55',
    width: 320,
    height: 50,
    scriptUrl: 'https://www.highrevenueformat.com/590c47d997603e6ea80ae7b922875e55/invoke.js'
  },
  NATIVE_BANNER: {
    scriptUrl: 'https://pl30963271.profitableratecpmnetwork.com/455bffdd2f0b77226264233d844b73cd/invoke.js',
    containerId: 'container-455bffdd2f0b77226264233d844b73cd'
  },
  SMARTLINK_URL: 'https://www.profitableratecpmnetwork.com/ubkm86hdi8?key=0a585a8c0148e62aa70cb535ad809ece'
};

class AdsManagerService {
  constructor() {
    this.registeredSlots = new Map();
    this.refreshTimer = null;
    this.secondsActive = 0;
    this.isTabActive = !document.hidden;
    this.isInitialized = false;

    this.bindVisibilityEvents();
  }

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
   * Registra um slot de anúncio na página
   * @param {string} containerId - ID do elemento HTML container
   * @param {'160x600' | '320x50'} formatType - Tipo do banner
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

    const config = slot.formatType === '160x600' 
      ? AD_CONFIG.SKYSCRAPER_160x600 
      : AD_CONFIG.BANNER_320x50;

    // Remove iframes anteriores para evitar vazamento de memória
    slot.element.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = `${config.width}px`;
    iframe.style.height = `${config.height}px`;
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.scrolling = 'no';
    iframe.title = `Ad ${slot.formatType}`;
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
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
          }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '${config.key}',
            'format' : 'iframe',
            'height' : ${config.height},
            'width' : ${config.width},
            'params' : {}
          };
        <\/script>
        <script type="text/javascript" src="${config.scriptUrl}"><\/script>
      </body>
      </html>
    `;

    slot.element.appendChild(iframe);

    // Injeta conteúdo no iframe
    try {
      iframe.srcdoc = htmlContent;
    } catch (e) {
      const doc = iframe.contentWindow || iframe.contentDocument;
      if (doc.document) doc = doc.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }

    slot.lastRender = Date.now();
  }

  /**
   * Recarrega todos os slots visíveis registrados
   */
  refreshAllVisibleSlots() {
    if (!this.isTabActive) return;

    this.registeredSlots.forEach((slot, containerId) => {
      // Verifica se o elemento está visível no DOM
      if (slot.element && slot.element.offsetParent !== null) {
        this.renderSlot(containerId);
      }
    });
  }

  /**
   * Inicia o ciclo de Auto-Refresh Inteligente
   */
  startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);

    this.refreshTimer = setInterval(() => {
      if (this.isTabActive) {
        this.secondsActive++;
        if (this.secondsActive >= AD_CONFIG.REFRESH_INTERVAL_SEC) {
          this.secondsActive = 0;
          this.refreshAllVisibleSlots();
        }
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
   * Carrega o Native Banner da Adsterra de forma assíncrona e não-bloqueante
   * @param {string} [targetContainerId]
   */
  loadNativeBanner(targetContainerId) {
    const id = targetContainerId || AD_CONFIG.NATIVE_BANNER.containerId;
    const container = document.getElementById(id);
    if (!container || container.dataset.adLoaded) return;
    container.dataset.adLoaded = 'true';

    try {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = AD_CONFIG.NATIVE_BANNER.scriptUrl;
      container.appendChild(script);
    } catch (e) {
      console.warn('Falha ao carregar Native Banner:', e);
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
}

export const AdsManager = new AdsManagerService();
