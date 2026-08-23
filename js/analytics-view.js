// js/analytics-view.js — Renderização Dinâmica e Estatísticas Globais de Visitantes
(function () {
  'use strict';

  let rawAnalyticsData = null;
  let autoRefreshInterval = null;
  let isFetching = false;

  // Elementos do DOM
  const elements = {
    totalVisits: document.getElementById('statTotalVisits'),
    totalCountries: document.getElementById('statTotalCountries'),
    topCountryName: document.getElementById('statTopCountryName'),
    topCountryFlag: document.getElementById('statTopCountryFlag'),
    topCountryPercent: document.getElementById('statTopCountryPercent'),
    countriesList: document.getElementById('countriesRankingList'),
    recentVisitsList: document.getElementById('recentVisitsList'),
    searchInput: document.getElementById('countrySearchInput'),
    refreshBtn: document.getElementById('refreshBtn'),
    lastUpdatedText: document.getElementById('lastUpdatedText'),
    topCountryCard: document.getElementById('topCountryBanner')
  };

  // Animação de contagem numérica
  function animateValue(obj, start, end, duration) {
    if (!obj) return;
    if (start === end) {
      obj.textContent = Number(end).toLocaleString('pt-BR');
      return;
    }
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = Math.floor(easeProgress * (end - start) + start);
      obj.textContent = current.toLocaleString('pt-BR');
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.textContent = Number(end).toLocaleString('pt-BR');
      }
    };
    window.requestAnimationFrame(step);
  }

  // Formatação de tempo relativo amigável
  function timeAgo(dateString) {
    if (!dateString) return 'agora';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.max(1, Math.floor((now - date) / 1000));

    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  }

  // Busca dados na API
  async function fetchAnalytics(isManual = false) {
    if (isFetching) return;
    isFetching = true;

    if (elements.refreshBtn) {
      elements.refreshBtn.classList.add('loading');
    }

    try {
      const res = await fetch('/api/analytics?t=' + Date.now());
      if (!res.ok) throw new Error('Falha ao obter dados');

      const data = await res.json();
      if (data && data.success) {
        rawAnalyticsData = data;
        renderDashboard(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar estatísticas:', err);
      // Se estiver offline ou primeira vez sem conexão, renderiza mock amigável com Brasil líder
      if (!rawAnalyticsData) {
        renderMockData();
      }
    } finally {
      isFetching = false;
      if (elements.refreshBtn) {
        elements.refreshBtn.classList.remove('loading');
      }
      if (elements.lastUpdatedText) {
        const now = new Date();
        elements.lastUpdatedText.textContent = `Atualizado às ${now.toLocaleTimeString('pt-BR')}`;
      }
    }
  }

  // Renderiza dados simulados caso a API ainda não tenha registros
  function renderMockData() {
    const mock = {
      totalVisits: 1,
      totalCountries: 1,
      topCountry: { code: 'BR', name: 'Brasil', flag: '🇧🇷', count: 1, percentage: 100 },
      countries: [
        { code: 'BR', name: 'Brasil', flag: '🇧🇷', count: 1, percentage: 100 }
      ],
      recentVisits: [
        { country: 'BR', countryName: 'Brasil', flag: '🇧🇷', city: 'Sua Conexão', timestamp: new Date().toISOString() }
      ]
    };
    rawAnalyticsData = mock;
    renderDashboard(mock);
  }

  // Renderiza o Dashboard Completo
  function renderDashboard(data) {
    const total = data.totalVisits || 1;
    const countries = data.countries || [];
    const top = data.topCountry || (countries.length > 0 ? countries[0] : { name: 'Brasil', flag: '🇧🇷', percentage: 100, count: total });

    // 1. Métricas Principais
    if (elements.totalVisits) {
      const prevVal = parseInt(elements.totalVisits.textContent.replace(/\D/g, '') || '0', 10);
      animateValue(elements.totalVisits, prevVal, total, 1000);
    }

    if (elements.totalCountries) {
      const prevVal = parseInt(elements.totalCountries.textContent.replace(/\D/g, '') || '0', 10);
      animateValue(elements.totalCountries, prevVal, data.totalCountries || countries.length, 800);
    }

    if (elements.topCountryName) {
      elements.topCountryName.textContent = top.name || 'Brasil';
    }
    if (elements.topCountryFlag) {
      elements.topCountryFlag.textContent = top.flag || '🇧🇷';
    }
    if (elements.topCountryPercent) {
      elements.topCountryPercent.textContent = `${top.percentage || 100}% dos acessos`;
    }

    // 2. Banner de destaque
    if (elements.topCountryCard) {
      elements.topCountryCard.innerHTML = `
        <div class="top-banner-icon">${top.flag || '🇧🇷'}</div>
        <div class="top-banner-info">
          <h3>${top.name || 'Brasil'} lidera a comunidade!</h3>
          <p>Com <strong>${(top.count || 1).toLocaleString('pt-BR')} jogadores</strong> (${top.percentage || 100}% de todo o tráfego), o patriotismo domina o Lula Simulator!</p>
        </div>
      `;
    }

    // 3. Ranking de Países
    renderCountriesList(countries);

    // 4. Feed de Atividades Recentes
    renderRecentVisits(data.recentVisits || []);
  }

  // Renderiza a lista filtrável de países
  function renderCountriesList(countries) {
    if (!elements.countriesList) return;

    const searchTerm = (elements.searchInput?.value || '').trim().toLowerCase();
    const filtered = countries.filter(c => {
      if (!searchTerm) return true;
      return (
        c.name.toLowerCase().includes(searchTerm) ||
        c.code.toLowerCase().includes(searchTerm)
      );
    });

    if (filtered.length === 0) {
      elements.countriesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>Nenhum país encontrado para "<strong>${searchTerm}</strong>"</p>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach((country, index) => {
      let rankBadge = `<span class="rank-pos">#${index + 1}</span>`;
      if (index === 0) rankBadge = `<span class="rank-badge gold">🥇 #1</span>`;
      else if (index === 1) rankBadge = `<span class="rank-badge silver">🥈 #2</span>`;
      else if (index === 2) rankBadge = `<span class="rank-badge bronze">🥉 #3</span>`;

      const barWidth = Math.max(4, country.percentage || 1);

      html += `
        <div class="country-row-card ${index === 0 ? 'top-leader' : ''}">
          <div class="country-rank-col">
            ${rankBadge}
          </div>
          <div class="country-flag-col">
            <span class="country-flag">${country.flag}</span>
          </div>
          <div class="country-info-col">
            <div class="country-name-header">
              <span class="country-name">${country.name}</span>
              <span class="country-code-pill">${country.code}</span>
            </div>
            <div class="country-progress-wrapper">
              <div class="country-progress-bar" style="width: ${barWidth}%;"></div>
            </div>
          </div>
          <div class="country-stats-col">
            <span class="country-count">${country.count.toLocaleString('pt-BR')} <small>acessos</small></span>
            <span class="country-percent">${country.percentage}%</span>
          </div>
        </div>
      `;
    });

    elements.countriesList.innerHTML = html;
  }

  // Renderiza o Radar / Feed Ao Vivo
  function renderRecentVisits(recent) {
    if (!elements.recentVisitsList) return;

    if (!recent || recent.length === 0) {
      elements.recentVisitsList.innerHTML = `
        <div class="empty-state-feed">
          <p>Aguardando conexões ao vivo...</p>
        </div>
      `;
      return;
    }

    let html = '';
    recent.forEach((visit) => {
      const timeStr = timeAgo(visit.timestamp);
      html += `
        <div class="feed-item">
          <div class="feed-pulse-indicator"></div>
          <div class="feed-flag">${visit.flag || '🇧🇷'}</div>
          <div class="feed-details">
            <div class="feed-location">${visit.city || 'Desconhecida'}, <strong>${visit.countryName || 'Brasil'}</strong></div>
            <div class="feed-time">Conexão detectada • ${timeStr}</div>
          </div>
        </div>
      `;
    });

    elements.recentVisitsList.innerHTML = html;
  }

  // Event Listeners
  function initEvents() {
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', () => {
        if (rawAnalyticsData && rawAnalyticsData.countries) {
          renderCountriesList(rawAnalyticsData.countries);
        }
      });
    }

    if (elements.refreshBtn) {
      elements.refreshBtn.addEventListener('click', () => {
        fetchAnalytics(true);
      });
    }

    // Auto-refresh a cada 25 segundos
    autoRefreshInterval = setInterval(() => {
      fetchAnalytics(false);
    }, 25000);
  }

  // Inicialização
  document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    fetchAnalytics();
  });
})();
