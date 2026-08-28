// js/analytics-view.js — Renderização Dinâmica, Filtros Avançados e Radar de Acessos
(function () {
  'use strict';

  let rawAnalyticsData = null;
  let autoRefreshInterval = null;
  let isFetching = false;

  // Estado centralizado dos filtros
  const filterState = {
    selectedCountryCode: null, // 'BR', 'US', etc. ou null
    selectedCountryName: null,
    selectedCountryFlag: null,
    period: 'all',             // 'all', 'today', 'yesterday', '7d', '30d', 'custom'
    customDateFrom: null,      // 'YYYY-MM-DD'
    customDateTo: null,        // 'YYYY-MM-DD'
    weekday: 'all',            // 'all', 'weekdays', 'weekend', '0', '1', '2', '3', '4', '5', '6'
    device: 'all',             // 'all', 'desktop', 'mobile', 'tablet'
    os: 'all',                 // 'all', 'Windows', 'Android', 'iOS', 'macOS', 'Linux'
    browser: 'all',            // 'all', 'Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'
    radarSearchQuery: '',
    pageLimit: 25
  };

  const WEEKDAYS_PT = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];

  // Elementos do DOM
  const elements = {
    totalVisits: document.getElementById('statTotalVisits'),
    totalCountries: document.getElementById('statTotalCountries'),
    topCountryName: document.getElementById('statTopCountryName'),
    topCountryFlag: document.getElementById('statTopCountryFlag'),
    topCountryPercent: document.getElementById('statTopCountryPercent'),
    topCountryCard: document.getElementById('topCountryBanner'),
    countriesList: document.getElementById('countriesRankingList'),
    recentVisitsList: document.getElementById('recentVisitsList'),
    searchInput: document.getElementById('countrySearchInput'),
    radarSearchInput: document.getElementById('radarSearchInput'),
    refreshBtn: document.getElementById('refreshBtn'),
    lastUpdatedText: document.getElementById('lastUpdatedText'),
    activeFilterBanner: document.getElementById('activeFilterBanner'),
    activeFilterText: document.getElementById('activeFilterText'),
    btnClearAllFilters: document.getElementById('btnClearAllFilters'),
    filteredCountBadge: document.getElementById('filteredCountBadge'),
    periodFilterPills: document.getElementById('periodFilterPills'),
    customDateRow: document.getElementById('customDateRow'),
    filterDateFrom: document.getElementById('filterDateFrom'),
    filterDateTo: document.getElementById('filterDateTo'),
    btnApplyCustomDate: document.getElementById('btnApplyCustomDate'),
    weekdayFilterPills: document.getElementById('weekdayFilterPills'),
    deviceFilterPills: document.getElementById('deviceFilterPills'),
    osFilterPills: document.getElementById('osFilterPills'),
    browserFilterPills: document.getElementById('browserFilterPills'),
    btnLoadMoreVisits: document.getElementById('btnLoadMoreVisits')
  };

  // Helper de ícone de Dispositivo
  function getDeviceIcon(deviceType, model) {
    const t = (deviceType || '').toLowerCase();
    const m = (model || '').toLowerCase();
    if (t.includes('tablet') || t.includes('ipad') || m.includes('ipad')) return '📲 Tablet';
    if (t.includes('mobile') || t.includes('celular') || t.includes('phone') || m.includes('iphone') || m.includes('galaxy') || m.includes('moto') || m.includes('xiaomi')) return '📱 Mobile';
    return '🖥️ Desktop';
  }

  // Helper de ícone de Sistema Operacional
  function getOSIcon(osName) {
    const o = (osName || '').toLowerCase();
    if (o.includes('android')) return '🤖 Android';
    if (o.includes('ios') || o.includes('iphone') || o.includes('ipad')) return '🍏 iOS';
    if (o.includes('windows') || o.includes('win')) return '🪟 Windows';
    if (o.includes('mac') || o.includes('darwin')) return '🍎 macOS';
    if (o.includes('linux')) return '🐧 Linux';
    return osName ? `⚙️ ${osName}` : '⚙️ Web';
  }

  // Helper de ícone de Navegador
  function getBrowserIcon(browserName) {
    const b = (browserName || '').toLowerCase();
    if (b.includes('chrome') || b.includes('crios')) return '🌐 Chrome';
    if (b.includes('safari')) return '🧭 Safari';
    if (b.includes('firefox') || b.includes('fxios')) return '🦊 Firefox';
    if (b.includes('edge') || b.includes('edg')) return '🔷 Edge';
    if (b.includes('opera') || b.includes('opr')) return '🎭 Opera';
    return browserName ? `🌐 ${browserName}` : '🌐 Web';
  }

  // Converte código de país em bandeira gráfica HD (compatível com todos os navegadores e Windows)
  function renderFlag(countryCode, fallbackEmoji = '', size = 'normal') {
    const code = (countryCode || 'BR').toLowerCase().trim();
    if (/^[a-z]{2}$/.test(code)) {
      const isLarge = size === 'large';
      const isSmall = size === 'small';
      const sizeClass = isLarge ? 'large' : (isSmall ? 'small' : '');
      const width = isLarge ? 56 : (isSmall ? 22 : 28);
      const height = isLarge ? 40 : (isSmall ? 15 : 20);

      return `<img src="https://flagcdn.com/w80/${code}.png" 
                   alt="${code.toUpperCase()}" 
                   class="country-flag-img ${sizeClass}" 
                   width="${width}" 
                   height="${height}"
                   loading="lazy" 
                   onerror="this.onerror=null; this.replaceWith('${fallbackEmoji || '🌐'}');">`;
    }
    return `<span class="flag-emoji">${fallbackEmoji || '🌐'}</span>`;
  }

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
      const easeProgress = 1 - Math.pow(1 - progress, 3);
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
  function timeAgo(dateObj) {
    if (!dateObj) return 'agora';
    const now = new Date();
    const seconds = Math.max(1, Math.floor((now - dateObj) / 1000));

    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  }

  // Formata data e hora exata em padrão brasileiro
  function formatExactDateTime(dateObj) {
    if (!dateObj) return '';
    const now = new Date();
    const isToday = now.toDateString() === dateObj.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === dateObj.toDateString();

    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Hoje às ${timeStr}`;
    if (isYesterday) return `Ontem às ${timeStr}`;

    const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${dateStr} às ${timeStr}`;
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

  // Dados mock para fallback offline
  function renderMockData() {
    const mock = {
      totalVisits: 1,
      totalCountries: 1,
      topCountry: { code: 'BR', name: 'Brasil', flag: '🇧🇷', count: 1, percentage: 100 },
      countries: [
        { code: 'BR', name: 'Brasil', flag: '🇧🇷', count: 1, percentage: 100 }
      ],
      recentVisits: [
        { country: 'BR', countryName: 'Brasil', flag: '🇧🇷', city: 'Sua Conexão', deviceType: 'desktop', os: 'Windows', browser: 'Chrome', timestamp: new Date().toISOString() }
      ]
    };
    rawAnalyticsData = mock;
    renderDashboard(mock);
  }

  // Renderiza o Dashboard Completo
  function renderDashboard(data) {
    const total = data.totalVisits || 1;
    const countries = data.countries || [];
    const top = data.topCountry || (countries.length > 0 ? countries[0] : { code: 'BR', name: 'Brasil', flag: '🇧🇷', percentage: 100, count: total });

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
      elements.topCountryFlag.innerHTML = renderFlag(top.code, top.flag, 'small');
    }
    if (elements.topCountryPercent) {
      elements.topCountryPercent.textContent = `${top.percentage || 100}% dos acessos`;
    }

    // 2. Banner de destaque do país líder
    if (elements.topCountryCard) {
      elements.topCountryCard.innerHTML = `
        <div class="top-banner-icon">${renderFlag(top.code, top.flag, 'large')}</div>
        <div class="top-banner-info">
          <h3>${top.name || 'Brasil'} lidera a comunidade!</h3>
          <p>Com <strong>${(top.count || 1).toLocaleString('pt-BR')} conexões</strong> (${top.percentage || 100}% de todo o tráfego), o patriotismo domina o Lula Simulator!</p>
        </div>
      `;
    }

    // 3. Ranking de Países Interativo
    renderCountriesList(countries);

    // 4. Radar / Feed Ao Vivo com Filtros
    renderRecentVisits();
  }

  // Renderiza a lista filtrável e clicável de países
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
      const isSelected = filterState.selectedCountryCode === country.code;

      html += `
        <div class="country-row-card ${index === 0 ? 'top-leader' : ''} ${isSelected ? 'selected-country' : ''}" 
             data-country-code="${country.code}" 
             data-country-name="${country.name}" 
             data-country-flag="${country.flag}"
             title="Clique para filtrar conexões de ${country.name}">
          <div class="country-rank-col">
            ${rankBadge}
          </div>
          <div class="country-flag-col">
            <span class="country-flag">${renderFlag(country.code, country.flag)}</span>
          </div>
          <div class="country-info-col">
            <div class="country-name-header">
              <span class="country-name">${country.name}</span>
              <span class="country-code-pill">${country.code}</span>
              ${isSelected ? '<span class="filter-active-pill">Filtrando</span>' : ''}
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

    // Adiciona evento de clique em cada card de país
    elements.countriesList.querySelectorAll('.country-row-card').forEach(card => {
      card.addEventListener('click', () => {
        const code = card.getAttribute('data-country-code');
        const name = card.getAttribute('data-country-name');
        const flag = card.getAttribute('data-country-flag');

        if (filterState.selectedCountryCode === code) {
          filterState.selectedCountryCode = null;
          filterState.selectedCountryName = null;
          filterState.selectedCountryFlag = null;
        } else {
          filterState.selectedCountryCode = code;
          filterState.selectedCountryName = name;
          filterState.selectedCountryFlag = flag;
        }

        renderCountriesList(rawAnalyticsData?.countries || []);
        renderRecentVisits();
      });
    });
  }

  // Aplica filtros ao histórico e renderiza o Radar de Acessos
  function renderRecentVisits() {
    if (!elements.recentVisitsList) return;

    const allVisits = rawAnalyticsData?.recentVisits || [];
    const now = new Date();

    // 1. Filtragem por País
    let filtered = allVisits.filter(v => {
      if (filterState.selectedCountryCode) {
        if ((v.country || '').toUpperCase() !== filterState.selectedCountryCode.toUpperCase()) {
          return false;
        }
      }
      return true;
    });

    // 2. Filtragem por Busca Textual no Radar (Cidade, País, SO, Navegador)
    const radarQuery = filterState.radarSearchQuery.trim().toLowerCase();
    if (radarQuery) {
      filtered = filtered.filter(v => {
        const cityMatch = (v.city || '').toLowerCase().includes(radarQuery);
        const nameMatch = (v.countryName || '').toLowerCase().includes(radarQuery);
        const codeMatch = (v.country || '').toLowerCase().includes(radarQuery);
        const osMatch = (v.os || '').toLowerCase().includes(radarQuery);
        const browserMatch = (v.browser || '').toLowerCase().includes(radarQuery);
        const deviceMatch = (v.device || v.deviceType || '').toLowerCase().includes(radarQuery);
        return cityMatch || nameMatch || codeMatch || osMatch || browserMatch || deviceMatch;
      });
    }

    // 3. Filtragem por Período / Data
    filtered = filtered.filter(v => {
      const vDate = v.timestamp ? new Date(v.timestamp) : now;
      if (isNaN(vDate.getTime())) return true;

      if (filterState.period === 'today') {
        return vDate.toDateString() === now.toDateString();
      }

      if (filterState.period === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return vDate.toDateString() === yesterday.toDateString();
      }

      if (filterState.period === '7d') {
        const diffMs = now - vDate;
        return diffMs <= 7 * 24 * 60 * 60 * 1000;
      }

      if (filterState.period === '30d') {
        const diffMs = now - vDate;
        return diffMs <= 30 * 24 * 60 * 60 * 1000;
      }

      if (filterState.period === 'custom') {
        if (filterState.customDateFrom) {
          const from = new Date(filterState.customDateFrom + 'T00:00:00');
          if (vDate < from) return false;
        }
        if (filterState.customDateTo) {
          const to = new Date(filterState.customDateTo + 'T23:59:59');
          if (vDate > to) return false;
        }
        return true;
      }

      return true;
    });

    // 4. Filtragem por Dia da Semana
    if (filterState.weekday !== 'all') {
      filtered = filtered.filter(v => {
        const vDate = v.timestamp ? new Date(v.timestamp) : now;
        const day = vDate.getDay(); // 0: Dom, 1: Seg, ..., 6: Sáb

        if (filterState.weekday === 'weekdays') {
          return day >= 1 && day <= 5;
        }
        if (filterState.weekday === 'weekend') {
          return day === 0 || day === 6;
        }

        return day === parseInt(filterState.weekday, 10);
      });
    }

    // 5. Filtragem por Dispositivo
    if (filterState.device !== 'all') {
      filtered = filtered.filter(v => {
        const d = (v.deviceType || v.device || 'desktop').toLowerCase();
        return d.includes(filterState.device.toLowerCase());
      });
    }

    // 6. Filtragem por Sistema Operacional
    if (filterState.os !== 'all') {
      filtered = filtered.filter(v => {
        const o = (v.os || '').toLowerCase();
        return o.includes(filterState.os.toLowerCase());
      });
    }

    // 7. Filtragem por Navegador
    if (filterState.browser !== 'all') {
      filtered = filtered.filter(v => {
        const b = (v.browser || '').toLowerCase();
        return b.includes(filterState.browser.toLowerCase());
      });
    }

    // 8. Atualiza Badge de Contagem
    if (elements.filteredCountBadge) {
      elements.filteredCountBadge.textContent = `${filtered.length} de ${allVisits.length} conexões`;
    }

    // 9. Atualiza Banner de Filtros Ativos
    updateActiveFilterBanner(filtered.length);

    // 10. Renderiza Lista de Conexões (com Paginação / Limite)
    if (filtered.length === 0) {
      elements.recentVisitsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛰️</div>
          <p>Nenhuma conexão encontrada para os filtros selecionados.</p>
          <button type="button" class="btn-clear-filter" style="margin-top: 12px;" id="btnEmptyClearFilters">
            Limpar Filtros e Ver Todos
          </button>
        </div>
      `;

      const emptyClearBtn = document.getElementById('btnEmptyClearFilters');
      if (emptyClearBtn) {
        emptyClearBtn.addEventListener('click', clearAllFilters);
      }

      if (elements.btnLoadMoreVisits) {
        elements.btnLoadMoreVisits.style.display = 'none';
      }
      return;
    }

    const visibleItems = filtered.slice(0, filterState.pageLimit);
    let html = '';

    visibleItems.forEach((visit) => {
      const vDate = visit.timestamp ? new Date(visit.timestamp) : now;
      const timeStr = timeAgo(vDate);
      const exactTime = formatExactDateTime(vDate);
      const weekdayName = WEEKDAYS_PT[vDate.getDay()] || '';
      const isWeekend = vDate.getDay() === 0 || vDate.getDay() === 6;

      const deviceLabel = getDeviceIcon(visit.deviceType || visit.device, visit.device);
      const osLabel = getOSIcon(visit.os);
      const browserLabel = getBrowserIcon(visit.browser);

      html += `
        <div class="feed-item">
          <div class="feed-pulse-indicator"></div>
          <div class="feed-flag">${renderFlag(visit.country, visit.flag)}</div>
          <div class="feed-details" style="flex: 1; min-width: 0;">
            <div class="feed-location">
              ${visit.city || 'Desconhecida'}, <strong>${visit.countryName || 'Brasil'}</strong>
            </div>
            <div class="feed-meta-row" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 3px;">
              <span class="feed-badge-day ${isWeekend ? 'weekend' : ''}">${weekdayName}</span>
              <span class="feed-badge-exact">• ${exactTime}</span>
              <span class="feed-time">(${timeStr})</span>
            </div>
            <div class="feed-hardware-row" style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap; margin-top: 6px;">
              <span style="font-size: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 2px 7px; border-radius: 6px; color: #cbd5e1;">${deviceLabel}</span>
              <span style="font-size: 10px; background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.2); padding: 2px 7px; border-radius: 6px; color: #7dd3fc;">${osLabel}</span>
              <span style="font-size: 10px; background: rgba(250,204,21,0.08); border: 1px solid rgba(250,204,21,0.2); padding: 2px 7px; border-radius: 6px; color: #fef08a;">${browserLabel}</span>
            </div>
          </div>
        </div>
      `;
    });

    elements.recentVisitsList.innerHTML = html;

    // 11. Botão de Carregar Mais Conexões
    if (elements.btnLoadMoreVisits) {
      if (filtered.length > filterState.pageLimit) {
        elements.btnLoadMoreVisits.style.display = 'flex';
        const remaining = filtered.length - filterState.pageLimit;
        elements.btnLoadMoreVisits.innerHTML = `<span>Exibir Mais Conexões (${remaining} restantes)</span> <span>⬇️</span>`;
      } else {
        elements.btnLoadMoreVisits.style.display = 'none';
      }
    }
  }

  // Monta texto e exibe banner de filtros ativos
  function updateActiveFilterBanner(matchCount) {
    if (!elements.activeFilterBanner || !elements.activeFilterText) return;

    const parts = [];

    if (filterState.selectedCountryCode) {
      parts.push(`País: ${renderFlag(filterState.selectedCountryCode, filterState.selectedCountryFlag, 'small')} <strong>${filterState.selectedCountryName || filterState.selectedCountryCode}</strong>`);
    }

    if (filterState.period !== 'all') {
      const periodLabels = {
        today: 'Hoje',
        yesterday: 'Ontem',
        '7d': 'Últimos 7 dias',
        '30d': 'Últimos 30 dias',
        custom: `De ${filterState.customDateFrom || 'início'} até ${filterState.customDateTo || 'hoje'}`
      };
      parts.push(`Período: <strong>${periodLabels[filterState.period] || filterState.period}</strong>`);
    }

    if (filterState.weekday !== 'all') {
      const weekdayLabels = {
        weekdays: 'Dias Úteis',
        weekend: 'Fins de Semana',
        '0': 'Domingos',
        '1': 'Segundas',
        '2': 'Terças',
        '3': 'Quartas',
        '4': 'Quintas',
        '5': 'Sextas',
        '6': 'Sábados'
      };
      parts.push(`Dia: <strong>${weekdayLabels[filterState.weekday] || filterState.weekday}</strong>`);
    }

    if (filterState.device !== 'all') {
      parts.push(`Dispositivo: <strong>${filterState.device}</strong>`);
    }

    if (filterState.os !== 'all') {
      parts.push(`SO: <strong>${filterState.os}</strong>`);
    }

    if (filterState.browser !== 'all') {
      parts.push(`Navegador: <strong>${filterState.browser}</strong>`);
    }

    if (filterState.radarSearchQuery) {
      parts.push(`Busca: <strong>"${filterState.radarSearchQuery}"</strong>`);
    }

    if (parts.length > 0) {
      elements.activeFilterBanner.style.display = 'flex';
      elements.activeFilterText.innerHTML = `🎯 ${parts.join(' • ')} (${matchCount} resultado(s))`;
    } else {
      elements.activeFilterBanner.style.display = 'none';
    }
  }

  // Limpa todos os filtros ativos
  function clearAllFilters() {
    filterState.selectedCountryCode = null;
    filterState.selectedCountryName = null;
    filterState.selectedCountryFlag = null;
    filterState.period = 'all';
    filterState.customDateFrom = null;
    filterState.customDateTo = null;
    filterState.weekday = 'all';
    filterState.device = 'all';
    filterState.os = 'all';
    filterState.browser = 'all';
    filterState.radarSearchQuery = '';
    filterState.pageLimit = 25;

    if (elements.radarSearchInput) elements.radarSearchInput.value = '';
    if (elements.filterDateFrom) elements.filterDateFrom.value = '';
    if (elements.filterDateTo) elements.filterDateTo.value = '';
    if (elements.customDateRow) elements.customDateRow.style.display = 'none';

    // Atualiza pills visuais de período
    if (elements.periodFilterPills) {
      elements.periodFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-period') === 'all');
      });
    }

    // Atualiza pills visuais de dia da semana
    if (elements.weekdayFilterPills) {
      elements.weekdayFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-weekday') === 'all');
      });
    }

    // Atualiza pills visuais de dispositivo
    if (elements.deviceFilterPills) {
      elements.deviceFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-device') === 'all');
      });
    }

    // Atualiza pills visuais de SO
    if (elements.osFilterPills) {
      elements.osFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-os') === 'all');
      });
    }

    // Atualiza pills visuais de Navegador
    if (elements.browserFilterPills) {
      elements.browserFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-browser') === 'all');
      });
    }

    renderCountriesList(rawAnalyticsData?.countries || []);
    renderRecentVisits();
  }

  // Inicializa eventos da interface
  function initEvents() {
    // 1. Busca no ranking de países
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', () => {
        if (rawAnalyticsData && rawAnalyticsData.countries) {
          renderCountriesList(rawAnalyticsData.countries);
        }
      });
    }

    // 2. Busca no Radar de Acessos
    if (elements.radarSearchInput) {
      elements.radarSearchInput.addEventListener('input', (e) => {
        filterState.radarSearchQuery = e.target.value;
        filterState.pageLimit = 25;
        renderRecentVisits();
      });
    }

    // 3. Filtro de Período (Pills)
    if (elements.periodFilterPills) {
      elements.periodFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const period = pill.getAttribute('data-period');
          filterState.period = period;
          filterState.pageLimit = 25;

          elements.periodFilterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          if (period === 'custom') {
            if (elements.customDateRow) elements.customDateRow.style.display = 'flex';
          } else {
            if (elements.customDateRow) elements.customDateRow.style.display = 'none';
            renderRecentVisits();
          }
        });
      });
    }

    // 4. Aplicar Data Personalizada
    if (elements.btnApplyCustomDate) {
      elements.btnApplyCustomDate.addEventListener('click', () => {
        filterState.customDateFrom = elements.filterDateFrom?.value || null;
        filterState.customDateTo = elements.filterDateTo?.value || null;
        filterState.pageLimit = 25;
        renderRecentVisits();
      });
    }

    // 5. Filtro de Dia da Semana (Pills)
    if (elements.weekdayFilterPills) {
      elements.weekdayFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const weekday = pill.getAttribute('data-weekday');
          filterState.weekday = weekday;
          filterState.pageLimit = 25;

          elements.weekdayFilterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          renderRecentVisits();
        });
      });
    }

    // 6. Filtro de Dispositivo (Pills)
    if (elements.deviceFilterPills) {
      elements.deviceFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const dev = pill.getAttribute('data-device');
          filterState.device = dev;
          filterState.pageLimit = 25;

          elements.deviceFilterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          renderRecentVisits();
        });
      });
    }

    // 7. Filtro de Sistema Operacional (Pills)
    if (elements.osFilterPills) {
      elements.osFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const osVal = pill.getAttribute('data-os');
          filterState.os = osVal;
          filterState.pageLimit = 25;

          elements.osFilterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          renderRecentVisits();
        });
      });
    }

    // 8. Filtro de Navegador (Pills)
    if (elements.browserFilterPills) {
      elements.browserFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const browserVal = pill.getAttribute('data-browser');
          filterState.browser = browserVal;
          filterState.pageLimit = 25;

          elements.browserFilterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          renderRecentVisits();
        });
      });
    }

    // 9. Botão de Limpar Filtros
    if (elements.btnClearAllFilters) {
      elements.btnClearAllFilters.addEventListener('click', clearAllFilters);
    }

    // 10. Botão Carregar Mais
    if (elements.btnLoadMoreVisits) {
      elements.btnLoadMoreVisits.addEventListener('click', () => {
        filterState.pageLimit += 25;
        renderRecentVisits();
      });
    }

    // 11. Botão Atualizar Agora
    if (elements.refreshBtn) {
      elements.refreshBtn.addEventListener('click', () => {
        fetchAnalytics(true);
      });
    }

    // 12. Auto-refresh a cada 25 segundos (preserva os filtros do usuário)
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
