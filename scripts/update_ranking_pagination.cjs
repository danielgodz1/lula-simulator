const fs = require('fs');
const path = require('path');

// 1. UPDATE ranking.html
let ptRanking = fs.readFileSync(path.join(__dirname, '../ranking.html'), 'utf8');

const ptPaginationCSS = `
    /* CONTROLES DE PAGINAÇÃO (25 JOGADORES POR PÁGINA) */
    .pagination-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-top: 18px;
      padding: 16px 14px;
      background: rgba(22, 27, 38, 0.85);
      border: 1.5px solid var(--border-card);
      border-radius: 16px;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }

    .pagination-info {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 600;
      text-align: center;
    }

    .pagination-info strong {
      color: var(--amarelo-brasil);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .page-nav-btn {
      min-width: 38px;
      height: 38px;
      padding: 0 12px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      user-select: none;
    }

    .page-nav-btn:hover:not(:disabled) {
      background: rgba(255, 223, 0, 0.18);
      border-color: var(--amarelo-brasil);
      color: var(--amarelo-brasil);
      transform: translateY(-1px);
    }

    .page-nav-btn.active {
      background: var(--amarelo-brasil);
      border-color: var(--amarelo-brasil);
      color: #000;
      font-weight: 900;
      box-shadow: 0 0 14px rgba(255, 223, 0, 0.45);
    }

    .page-nav-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      border-color: transparent;
      background: rgba(255, 255, 255, 0.02);
      transform: none;
    }

    .pagination-ellipsis {
      color: var(--text-muted);
      font-weight: 800;
      padding: 0 4px;
      user-select: none;
    }

    .pagination-jump {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .jump-input {
      width: 58px;
      padding: 5px 8px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 12px;
      text-align: center;
      outline: none;
    }

    .jump-input:focus {
      border-color: var(--amarelo-brasil);
    }

    .jump-btn {
      padding: 5px 12px;
      border-radius: 6px;
      background: rgba(0, 230, 118, 0.15);
      border: 1px solid var(--verde-neon);
      color: var(--verde-neon);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .jump-btn:hover {
      background: var(--verde-neon);
      color: #000;
    }

    @media (max-width: 600px) {
      .page-nav-btn {
        min-width: 32px;
        height: 32px;
        padding: 0 8px;
        font-size: 11px;
      }
      .pagination-info {
        font-size: 11px;
      }
    }
  </style>`;

if (!ptRanking.includes('.pagination-container')) {
  ptRanking = ptRanking.replace('</style>', ptPaginationCSS);
}

// Add rankingPagination element after ranking-card
const ptPaginationHtml = `    </div>

    <!-- CONTROLES DE PAGINAÇÃO (25 JOGADORES POR PÁGINA) -->
    <div id="rankingPagination" class="pagination-container" style="display: none;"></div>`;

if (!ptRanking.includes('id="rankingPagination"')) {
  ptRanking = ptRanking.replace(/(\s*<\/div>\s*<!-- BANNER DE MONETIZAÇÃO INFERIOR)/, `\n\n    <!-- CONTROLES DE PAGINAÇÃO (25 JOGADORES POR PÁGINA) -->\n    <div id="rankingPagination" class="pagination-container" style="display: none;"></div>$1`);
}

// Replace script section
const ptScriptStart = `<script type="module">`;
const ptScriptEnd = `</script>\r\n  <script src="/js/tracker.js"></script>`;
const ptScriptEndAlt = `</script>\n  <script src="/js/tracker.js"></script>`;

const newPtScript = `<script type="module">
    import { getTopScores, firebaseConfig } from '/js/firebase-config.js';
    import { auth, DEFAULT_AVATAR_SVG } from '/js/auth.js';
    import { escapeHTML } from '/js/security.js';
    import { social } from '/js/social-manager.js';

    auth.renderProfileBadge('nav');
    social.mountNotificationBell(document.getElementById('notifBellHeaderContainer'));

    let currentTab = 'flappy';
    let currentPeriod = 'general';
    let allCurrentScores = [];
    const PAGE_SIZE = 25;
    let currentPage = 1;

    document.getElementById('tabFlappy').onclick = () => switchTab('flappy');
    document.getElementById('tabRunner').onclick = () => switchTab('runner');
    document.getElementById('periodGeneral').onclick = () => switchPeriod('general');
    document.getElementById('periodWeekly').onclick = () => switchPeriod('weekly');
    document.getElementById('periodAccumulated').onclick = () => switchPeriod('accumulated');
    document.getElementById('periodInvictos').onclick = () => switchPeriod('invictos');

    function switchTab(tab) {
      currentTab = tab;
      currentPage = 1;
      document.getElementById('tabFlappy').className = \`tab-btn \${tab === 'flappy' ? 'active' : ''}\`;
      document.getElementById('tabRunner').className = \`tab-btn \${tab === 'runner' ? 'active' : ''}\`;
      document.getElementById('searchRankingInput').value = '';
      loadRankingData();
    }

    function switchPeriod(period) {
      currentPeriod = period;
      currentPage = 1;
      document.getElementById('periodGeneral').className = \`period-btn \${period === 'general' ? 'active' : ''}\`;
      document.getElementById('periodWeekly').className = \`period-btn \${period === 'weekly' ? 'active' : ''}\`;
      document.getElementById('periodAccumulated').className = \`period-btn \${period === 'accumulated' ? 'active' : ''}\`;
      document.getElementById('periodInvictos').className = \`period-btn \${period === 'invictos' ? 'active' : ''}\`;
      document.getElementById('searchRankingInput').value = '';
      loadRankingData();
    }

    async function loadRankingData(force = false) {
      const container = document.getElementById('rankingList');
      const paginationContainer = document.getElementById('rankingPagination');
      const totalBadge = document.getElementById('totalPlayersBadge');
      const periodLabel = currentPeriod === 'weekly' ? 'da semana' : (currentPeriod === 'accumulated' ? 'acumulado' : (currentPeriod === 'invictos' ? 'de invictos' : 'geral'));
      container.innerHTML = \`<div style="text-align:center; padding:40px; color:var(--text-muted);">Carregando placar \${periodLabel}... 🇧🇷</div>\`;
      if (paginationContainer) paginationContainer.style.display = 'none';

      if (currentPeriod === 'invictos') {
        try {
          const res = await fetch('/api/social?action=win_streaks');
          if (res.ok) {
            const data = await res.json();
            const streaks = data.streaks || [];
            allCurrentScores = streaks.map(d => ({
              player: d.player || 'Jogador',
              score: parseInt(d.bestWinStreak || d.winStreak || 0, 10),
              bestWinStreak: parseInt(d.bestWinStreak || 0, 10),
              avatar: d.avatar || '',
              country: d.country || 'BR',
              countryName: d.countryName || 'Brasil',
              flag: d.flag || '🇧🇷',
              prestigeLevel: parseInt(d.prestigeLevel || 0, 10)
            })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
          } else {
            allCurrentScores = [];
          }
        } catch(e) {
          allCurrentScores = [];
        }
      } else {
        // Busca todos os jogadores pelo documento consolidado (com cache TTL e filtro de período, até 5000 entradas)
        allCurrentScores = await getTopScores(currentTab, 5000, force, currentPeriod);
      }

      // Fallback da conta atual caso banco esteja vazio ou jogador ainda não esteja no ranking
      const u = auth.getCurrentUser();
      if (allCurrentScores.length === 0 && u) {
        let val = 0;
        if (currentPeriod === 'accumulated') {
          val = currentTab === 'runner' ? (u.runnerCoins || 0) : (u.totalPicanhas || 0);
        } else {
          val = currentTab === 'runner' ? (u.runnerScore || 0) : (u.flappyScore || 0);
        }
        if (val > 0) {
          allCurrentScores = [{ player: u.username, score: val, avatar: u.avatar || '', prestigeLevel: u.prestigeLevel || 0 }];
        }
      }

      const countText = allCurrentScores.length === 1 ? '1 Jogador' : \`\${allCurrentScores.length} Jogadores\`;
      const prefix = currentPeriod === 'weekly' ? 'Semanal' : (currentPeriod === 'accumulated' ? 'Acumulado' : (currentPeriod === 'invictos' ? 'Invictos' : 'Geral'));
      totalBadge.textContent = \`\${prefix}: \${countText}\`;
      currentPage = 1;
      renderFilteredScores();
    }

    function renderFilteredScores() {
      const container = document.getElementById('rankingList');
      const paginationContainer = document.getElementById('rankingPagination');
      const searchTerm = (document.getElementById('searchRankingInput').value || '').trim().toLowerCase();
      const unit = currentPeriod === 'accumulated' 
        ? (currentTab === 'runner' ? '💰' : '🥩') 
        : (currentTab === 'runner' ? 'km' : '🥩');
      const curUser = auth.getCurrentUser();

      let filtered = allCurrentScores;
      if (searchTerm) {
        filtered = allCurrentScores.filter(item => 
          (item.player || '').toLowerCase().includes(searchTerm) ||
          (item.countryName || '').toLowerCase().includes(searchTerm) ||
          (item.country || '').toLowerCase().includes(searchTerm)
        );
      }

      const totalItems = filtered.length;

      if (totalItems === 0) {
        container.innerHTML = \`
          <div style="text-align: center; padding: 36px; color: var(--text-muted); font-size:14px;">
            \${searchTerm ? \`Nenhum jogador encontrado para "\${escapeHTML(searchTerm)}"\` : 'Nenhum jogador pontuou ainda. Seja o primeiro! 🚀'}
          </div>
        \`;
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
      }

      const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
      const pageScores = filtered.slice(startIndex, endIndex);

      container.innerHTML = '';
      pageScores.forEach((item, pageIdx) => {
        // Encontra o rank original no ranking completo para preservar a classificação real
        const originalRank = allCurrentScores.findIndex(s => s.player === item.player && s.score === item.score);
        const rankIdx = originalRank !== -1 ? originalRank : (startIndex + pageIdx);

        const row = document.createElement('div');
        row.className = 'ranking-row';

        const rankClass = rankIdx === 0 ? 'rank-1' : rankIdx === 1 ? 'rank-2' : rankIdx === 2 ? 'rank-3' : 'rank-other';
        const badge = rankIdx === 0 ? '👑' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : \`\${rankIdx + 1}º\`;
        const safePlayer = escapeHTML(item.player || 'Anônimo');
        const safeScore = parseInt(item.score || 0, 10);
        const safeFlag = item.flag || '🇧🇷';
        const safeCountryName = escapeHTML(item.countryName || 'Brasil');
        const rawCountry = (item.country || 'BR').trim().toUpperCase();
        const countryCode = rawCountry.length === 2 ? rawCountry.toLowerCase() : 'br';

        // Se for o jogador atual e tiver avatar no perfil, garante a exibição
        const isCurPlayer = curUser && curUser.username && (item.player || '').toLowerCase() === curUser.username.toLowerCase();
        const effectiveAvatar = (isCurPlayer && curUser.avatar) ? curUser.avatar : item.avatar;
        const avatarUrl = effectiveAvatar && effectiveAvatar.length > 5 ? effectiveAvatar : DEFAULT_AVATAR_SVG;

        // Medalha / Selo Especial Equipado
        const equippedMedal = (isCurPlayer ? localStorage.getItem('lula_equipped_medal') : '') || item.equippedMedal || (rankIdx === 0 ? 'medal_bolsonaro' : (rankIdx === 1 ? 'medal_picanha' : (rankIdx === 2 ? 'medal_stf' : '')));
        let medalHtml = '';
        if (equippedMedal === 'medal_bolsonaro') {
          medalHtml = \`<span class="ranking-medal-tag medal-bolsonaro" title="Medalha Imbrochável (Clube Bolsonaro)"><img src="/img/conquistas/medalha_bolsonaro.png" class="mini-medal-img" alt="Medalha Imbrochável"> 🎖️ Imbrochável</span>\`;
        } else if (equippedMedal === 'medal_picanha') {
          medalHtml = \`<span class="ranking-medal-tag medal-picanha" title="Picanha de Ouro Presidencial">🥩 Picanha Ouro</span>\`;
        } else if (equippedMedal === 'medal_stf') {
          medalHtml = \`<span class="ranking-medal-tag medal-stf" title="Habeas Corpus Supremo">⚖️ STF</span>\`;
        } else if (equippedMedal === 'medal_marcal') {
          medalHtml = \`<span class="ranking-medal-tag medal-marcal" title="Código Quântico do Mindset">🚀 Mindset 3X</span>\`;
        } else if (equippedMedal === 'medal_dilma') {
          medalHtml = \`<span class="ranking-medal-tag medal-dilma" title="Estocador de Vento Oficial">🌪️ Vento</span>\`;
        }

        // Insígnia de Prestígio
        const prestigeLvl = (isCurPlayer && curUser.prestigeLevel) ? curUser.prestigeLevel : (item.prestigeLevel || 0);
        let prestigeHtml = '';
        if (prestigeLvl > 0) {
          prestigeHtml = \`<span style="font-size:10px; font-weight:800; padding:2px 6px; border-radius:6px; background:rgba(255,215,0,0.18); border:1px solid #ffd700; color:#ffd700;" title="Nível de Prestígio \${prestigeLvl}">⭐ P.\${prestigeLvl}</span>\`;
        }

        row.innerHTML = \`
          <div><span class="rank-badge \${rankClass}">\${badge}</span></div>
          <div><img class="ranking-avatar" src="\${avatarUrl}" onerror="this.src='\${DEFAULT_AVATAR_SVG}'" alt="\${safePlayer}" loading="lazy" width="38" height="38"></div>
          <div style="display: flex; flex-direction: column; gap: 3px; min-width: 0;">
            <div style="font-weight:700; font-size:15px; color:#fff; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${safePlayer}</span>
              \${prestigeHtml}
              \${medalHtml}
            </div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted);">
              <img src="https://flagcdn.com/20x15/\${countryCode}.png" 
                   srcset="https://flagcdn.com/40x30/\${countryCode}.png 2x" 
                   width="15" height="11" 
                   alt="\${safeCountryName}" 
                   style="border-radius:2px; object-fit:cover; display:inline-block; vertical-align:middle; box-shadow:0 1px 2px rgba(0,0,0,0.4);"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
              <span style="display:none;" title="\${safeCountryName}">\${safeFlag}</span>
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${safeCountryName}</span>
            </div>
          </div>
          <div class="score-val">\${safeScore.toLocaleString('pt-BR')} <small style="font-size:10px; color:var(--text-muted);">\${unit}</small></div>
        \`;

        container.appendChild(row);
      });

      renderPagination(totalItems, totalPages, startIndex + 1, endIndex);
    }

    function renderPagination(totalItems, totalPages, firstShown, lastShown) {
      const paginationContainer = document.getElementById('rankingPagination');
      if (!paginationContainer) return;

      if (totalItems <= PAGE_SIZE) {
        paginationContainer.style.display = 'none';
        return;
      }

      paginationContainer.style.display = 'flex';

      let pagesHtml = '';
      const maxButtons = 5;
      let startP = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let endP = Math.min(totalPages, startP + maxButtons - 1);
      if (endP - startP + 1 < maxButtons) {
        startP = Math.max(1, endP - maxButtons + 1);
      }

      if (startP > 1) {
        pagesHtml += \`<button class="page-nav-btn" data-page="1">1</button>\`;
        if (startP > 2) {
          pagesHtml += \`<span class="pagination-ellipsis">…</span>\`;
        }
      }

      for (let p = startP; p <= endP; p++) {
        pagesHtml += \`<button class="page-nav-btn \${p === currentPage ? 'active' : ''}" data-page="\${p}">\${p}</button>\`;
      }

      if (endP < totalPages) {
        if (endP < totalPages - 1) {
          pagesHtml += \`<span class="pagination-ellipsis">…</span>\`;
        }
        pagesHtml += \`<button class="page-nav-btn" data-page="\${totalPages}">\${totalPages}</button>\`;
      }

      paginationContainer.innerHTML = \`
        <div class="pagination-info">
          Mostrando <strong>\${firstShown}–\${lastShown}</strong> de <strong>\${totalItems}</strong> jogadores · Página <strong>\${currentPage}</strong> de <strong>\${totalPages}</strong>
        </div>
        <div class="pagination-controls">
          <button class="page-nav-btn" id="btnFirstPage" \${currentPage === 1 ? 'disabled' : ''} title="Primeira página">«</button>
          <button class="page-nav-btn" id="btnPrevPage" \${currentPage === 1 ? 'disabled' : ''} title="Página anterior">‹ Anterior</button>
          \${pagesHtml}
          <button class="page-nav-btn" id="btnNextPage" \${currentPage === totalPages ? 'disabled' : ''} title="Próxima página">Próxima ›</button>
          <button class="page-nav-btn" id="btnLastPage" \${currentPage === totalPages ? 'disabled' : ''} title="Última página">»</button>
        </div>
        <div class="pagination-jump">
          <span>Ir para página:</span>
          <input type="number" id="jumpPageInput" class="jump-input" min="1" max="\${totalPages}" value="\${currentPage}">
          <button id="btnJumpPage" class="jump-btn">Ir</button>
        </div>
      \`;

      document.getElementById('btnFirstPage')?.addEventListener('click', () => goToPage(1));
      document.getElementById('btnPrevPage')?.addEventListener('click', () => goToPage(currentPage - 1));
      document.getElementById('btnNextPage')?.addEventListener('click', () => goToPage(currentPage + 1));
      document.getElementById('btnLastPage')?.addEventListener('click', () => goToPage(totalPages));

      paginationContainer.querySelectorAll('.page-nav-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = parseInt(e.currentTarget.getAttribute('data-page'), 10);
          if (target && target !== currentPage) goToPage(target);
        });
      });

      const jumpInput = document.getElementById('jumpPageInput');
      const jumpBtn = document.getElementById('btnJumpPage');
      const doJump = () => {
        const val = parseInt(jumpInput?.value, 10);
        if (!isNaN(val) && val >= 1 && val <= totalPages && val !== currentPage) {
          goToPage(val);
        }
      };
      jumpBtn?.addEventListener('click', doJump);
      jumpInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doJump();
      });
    }

    function goToPage(targetPage) {
      currentPage = targetPage;
      renderFilteredScores();
      const rankingCard = document.querySelector('.ranking-card');
      if (rankingCard) {
        rankingCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    document.getElementById('searchRankingInput').addEventListener('input', () => {
      currentPage = 1;
      renderFilteredScores();
    });

    loadRankingData();
    import('./js/ads-manager.js').then(m => m.AdsManager.init());
  </script>`;

const sIdx = ptRanking.indexOf(ptScriptStart);
const eIdx = ptRanking.indexOf('</script>\r\n  <script src="/js/tracker.js"></script>') !== -1 
  ? ptRanking.indexOf('</script>\r\n  <script src="/js/tracker.js"></script>')
  : ptRanking.indexOf('</script>\n  <script src="/js/tracker.js"></script>');

if (sIdx !== -1 && eIdx !== -1) {
  ptRanking = ptRanking.substring(0, sIdx) + newPtScript + ptRanking.substring(eIdx + 9);
}

fs.writeFileSync(path.join(__dirname, '../ranking.html'), ptRanking, 'utf8');
console.log('✅ ranking.html updated successfully with pagination!');

// 2. UPDATE en/ranking.html
let enRanking = fs.readFileSync(path.join(__dirname, '../en/ranking.html'), 'utf8');

if (!enRanking.includes('.pagination-container')) {
  enRanking = enRanking.replace('</style>', ptPaginationCSS);
}

if (!enRanking.includes('id="rankingPagination"')) {
  enRanking = enRanking.replace(/(\s*<\/div>\s*<!-- BANNER DE MONETIZAÇÃO INFERIOR)/, `\n\n    <!-- PAGINATION CONTROLS (25 PLAYERS PER PAGE) -->\n    <div id="rankingPagination" class="pagination-container" style="display: none;"></div>$1`);
}

const newEnScript = `<script type="module">
    import { getTopScores, firebaseConfig } from '/js/firebase-config.js';
    import { auth, DEFAULT_AVATAR_SVG } from '/js/auth.js';
    import { escapeHTML } from '/js/security.js';
    import { social } from '/js/social-manager.js';

    auth.renderProfileBadge('nav');
    social.mountNotificationBell(document.getElementById('notifBellHeaderContainer'));

    let currentTab = 'flappy';
    let currentPeriod = 'general';
    let allCurrentScores = [];
    const PAGE_SIZE = 25;
    let currentPage = 1;

    document.getElementById('tabFlappy').onclick = () => switchTab('flappy');
    document.getElementById('tabRunner').onclick = () => switchTab('runner');
    document.getElementById('periodGeneral').onclick = () => switchPeriod('general');
    document.getElementById('periodWeekly').onclick = () => switchPeriod('weekly');
    document.getElementById('periodAccumulated').onclick = () => switchPeriod('accumulated');
    document.getElementById('periodInvictos').onclick = () => switchPeriod('invictos');

    function switchTab(tab) {
      currentTab = tab;
      currentPage = 1;
      document.getElementById('tabFlappy').className = \`tab-btn \${tab === 'flappy' ? 'active' : ''}\`;
      document.getElementById('tabRunner').className = \`tab-btn \${tab === 'runner' ? 'active' : ''}\`;
      document.getElementById('searchRankingInput').value = '';
      loadRankingData();
    }

    function switchPeriod(period) {
      currentPeriod = period;
      currentPage = 1;
      document.getElementById('periodGeneral').className = \`period-btn \${period === 'general' ? 'active' : ''}\`;
      document.getElementById('periodWeekly').className = \`period-btn \${period === 'weekly' ? 'active' : ''}\`;
      document.getElementById('periodAccumulated').className = \`period-btn \${period === 'accumulated' ? 'active' : ''}\`;
      document.getElementById('periodInvictos').className = \`period-btn \${period === 'invictos' ? 'active' : ''}\`;
      document.getElementById('searchRankingInput').value = '';
      loadRankingData();
    }

    async function loadRankingData(force = false) {
      const container = document.getElementById('rankingList');
      const paginationContainer = document.getElementById('rankingPagination');
      const totalBadge = document.getElementById('totalPlayersBadge');
      const periodLabel = currentPeriod === 'weekly' ? 'Weekly' : (currentPeriod === 'accumulated' ? 'Accumulated' : (currentPeriod === 'invictos' ? 'Win Streak' : 'All-Time'));
      container.innerHTML = \`<div style="text-align:center; padding:40px; color:var(--text-muted);">Loading \${periodLabel} leaderboard... 🌍</div>\`;
      if (paginationContainer) paginationContainer.style.display = 'none';

      if (currentPeriod === 'invictos') {
        try {
          const res = await fetch('/api/social?action=win_streaks');
          if (res.ok) {
            const data = await res.json();
            const streaks = data.streaks || [];
            allCurrentScores = streaks.map(d => ({
              player: d.player || 'Player',
              score: parseInt(d.bestWinStreak || d.winStreak || 0, 10),
              bestWinStreak: parseInt(d.bestWinStreak || 0, 10),
              avatar: d.avatar || '',
              country: d.country || 'BR',
              countryName: d.countryName || 'Brazil',
              flag: d.flag || '🇧🇷',
              prestigeLevel: parseInt(d.prestigeLevel || 0, 10)
            })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
          } else {
            allCurrentScores = [];
          }
        } catch(e) {
          allCurrentScores = [];
        }
      } else {
        // Fetch up to 5000 scores via consolidated leaderboard with local TTL cache
        allCurrentScores = await getTopScores(currentTab, 5000, force, currentPeriod);
      }

      // Fallback for current player
      const u = auth.getCurrentUser();
      if (allCurrentScores.length === 0 && u) {
        let val = 0;
        if (currentPeriod === 'accumulated') {
          val = currentTab === 'runner' ? (u.runnerCoins || 0) : (u.totalPicanhas || 0);
        } else {
          val = currentTab === 'runner' ? (u.runnerScore || 0) : (u.flappyScore || 0);
        }
        if (val > 0) {
          allCurrentScores = [{ player: u.username, score: val, avatar: u.avatar || '', prestigeLevel: u.prestigeLevel || 0 }];
        }
      }

      const countText = allCurrentScores.length === 1 ? '1 Player' : \`\${allCurrentScores.length} Players\`;
      const prefix = currentPeriod === 'weekly' ? 'Weekly' : (currentPeriod === 'accumulated' ? 'Total' : (currentPeriod === 'invictos' ? 'Streak' : 'All-Time'));
      totalBadge.textContent = \`\${prefix}: \${countText}\`;
      currentPage = 1;
      renderFilteredScores();
    }

    function renderFilteredScores() {
      const container = document.getElementById('rankingList');
      const paginationContainer = document.getElementById('rankingPagination');
      const searchTerm = (document.getElementById('searchRankingInput').value || '').trim().toLowerCase();
      const unit = currentPeriod === 'accumulated' 
        ? (currentTab === 'runner' ? '💰' : '🥩') 
        : (currentTab === 'runner' ? 'km' : '🥩');
      const curUser = auth.getCurrentUser();

      let filtered = allCurrentScores;
      if (searchTerm) {
        filtered = allCurrentScores.filter(item => 
          (item.player || '').toLowerCase().includes(searchTerm) ||
          (item.countryName || '').toLowerCase().includes(searchTerm) ||
          (item.country || '').toLowerCase().includes(searchTerm)
        );
      }

      const totalItems = filtered.length;

      if (totalItems === 0) {
        container.innerHTML = \`
          <div style="text-align: center; padding: 36px; color: var(--text-muted); font-size:14px;">
            \${searchTerm ? \`No players found matching "\${escapeHTML(searchTerm)}"\` : 'No scores registered yet. Be the first! 🚀'}
          </div>
        \`;
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
      }

      const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
      const pageScores = filtered.slice(startIndex, endIndex);

      container.innerHTML = '';
      pageScores.forEach((item, pageIdx) => {
        const originalRank = allCurrentScores.findIndex(s => s.player === item.player && s.score === item.score);
        const rankIdx = originalRank !== -1 ? originalRank : (startIndex + pageIdx);

        const row = document.createElement('div');
        row.className = 'ranking-row';

        const rankClass = rankIdx === 0 ? 'rank-1' : rankIdx === 1 ? 'rank-2' : rankIdx === 2 ? 'rank-3' : 'rank-other';
        const badge = rankIdx === 0 ? '👑' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : \`\${rankIdx + 1}\`;
        const safePlayer = escapeHTML(item.player || 'Anonymous');
        const safeScore = parseInt(item.score || 0, 10);
        const safeFlag = item.flag || '🇧🇷';
        const safeCountryName = escapeHTML(item.countryName || 'Brazil');
        const rawCountry = (item.country || 'BR').trim().toUpperCase();
        const countryCode = rawCountry.length === 2 ? rawCountry.toLowerCase() : 'br';

        const isCurPlayer = curUser && curUser.username && (item.player || '').toLowerCase() === curUser.username.toLowerCase();
        const effectiveAvatar = (isCurPlayer && curUser.avatar) ? curUser.avatar : item.avatar;
        const avatarUrl = effectiveAvatar && effectiveAvatar.length > 5 ? effectiveAvatar : DEFAULT_AVATAR_SVG;

        const equippedMedal = (isCurPlayer ? localStorage.getItem('lula_equipped_medal') : '') || item.equippedMedal || (rankIdx === 0 ? 'medal_bolsonaro' : (rankIdx === 1 ? 'medal_picanha' : (rankIdx === 2 ? 'medal_stf' : '')));
        let medalHtml = '';
        if (equippedMedal === 'medal_bolsonaro') {
          medalHtml = \`<span class="ranking-medal-tag medal-bolsonaro" title="Medal of Honor"><img src="/img/conquistas/medalha_bolsonaro.png" class="mini-medal-img" alt="Medal"> 🎖️ Legend</span>\`;
        } else if (equippedMedal === 'medal_picanha') {
          medalHtml = \`<span class="ranking-medal-tag medal-picanha" title="Golden Steak">🥩 Golden Steak</span>\`;
        } else if (equippedMedal === 'medal_stf') {
          medalHtml = \`<span class="ranking-medal-tag medal-stf" title="Supreme Justice">⚖️ Supreme Judge</span>\`;
        } else if (equippedMedal === 'medal_marcal') {
          medalHtml = \`<span class="ranking-medal-tag medal-marcal" title="Mindset 3X">🚀 Mindset 3X</span>\`;
        } else if (equippedMedal === 'medal_dilma') {
          medalHtml = \`<span class="ranking-medal-tag medal-dilma" title="Cosmic Wind">🌪️ Cosmic Wind</span>\`;
        }

        const prestigeLvl = (isCurPlayer && curUser.prestigeLevel) ? curUser.prestigeLevel : (item.prestigeLevel || 0);
        let prestigeHtml = '';
        if (prestigeLvl > 0) {
          prestigeHtml = \`<span style="font-size:10px; font-weight:800; padding:2px 6px; border-radius:6px; background:rgba(255,215,0,0.18); border:1px solid #ffd700; color:#ffd700;" title="Prestige Level \${prestigeLvl}">⭐ P.\${prestigeLvl}</span>\`;
        }

        row.innerHTML = \`
          <div><span class="rank-badge \${rankClass}">\${badge}</span></div>
          <div><img class="ranking-avatar" src="\${avatarUrl}" onerror="this.src='\${DEFAULT_AVATAR_SVG}'" alt="\${safePlayer}" loading="lazy" width="38" height="38"></div>
          <div style="display: flex; flex-direction: column; gap: 3px; min-width: 0;">
            <div style="font-weight:700; font-size:15px; color:#fff; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${safePlayer}</span>
              \${prestigeHtml}
              \${medalHtml}
            </div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted);">
              <img src="https://flagcdn.com/20x15/\${countryCode}.png" 
                   srcset="https://flagcdn.com/40x30/\${countryCode}.png 2x" 
                   width="15" height="11" 
                   alt="\${safeCountryName}" 
                   style="border-radius:2px; object-fit:cover; display:inline-block; vertical-align:middle; box-shadow:0 1px 2px rgba(0,0,0,0.4);"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
              <span style="display:none;" title="\${safeCountryName}">\${safeFlag}</span>
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${safeCountryName}</span>
            </div>
          </div>
          <div class="score-val">\${safeScore.toLocaleString('en-US')} <small style="font-size:10px; color:var(--text-muted);">\${unit}</small></div>
        \`;

        container.appendChild(row);
      });

      renderPagination(totalItems, totalPages, startIndex + 1, endIndex);
    }

    function renderPagination(totalItems, totalPages, firstShown, lastShown) {
      const paginationContainer = document.getElementById('rankingPagination');
      if (!paginationContainer) return;

      if (totalItems <= PAGE_SIZE) {
        paginationContainer.style.display = 'none';
        return;
      }

      paginationContainer.style.display = 'flex';

      let pagesHtml = '';
      const maxButtons = 5;
      let startP = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let endP = Math.min(totalPages, startP + maxButtons - 1);
      if (endP - startP + 1 < maxButtons) {
        startP = Math.max(1, endP - maxButtons + 1);
      }

      if (startP > 1) {
        pagesHtml += \`<button class="page-nav-btn" data-page="1">1</button>\`;
        if (startP > 2) {
          pagesHtml += \`<span class="pagination-ellipsis">…</span>\`;
        }
      }

      for (let p = startP; p <= endP; p++) {
        pagesHtml += \`<button class="page-nav-btn \${p === currentPage ? 'active' : ''}" data-page="\${p}">\${p}</button>\`;
      }

      if (endP < totalPages) {
        if (endP < totalPages - 1) {
          pagesHtml += \`<span class="pagination-ellipsis">…</span>\`;
        }
        pagesHtml += \`<button class="page-nav-btn" data-page="\${totalPages}">\${totalPages}</button>\`;
      }

      paginationContainer.innerHTML = \`
        <div class="pagination-info">
          Showing <strong>\${firstShown}–\${lastShown}</strong> of <strong>\${totalItems}</strong> players · Page <strong>\${currentPage}</strong> of <strong>\${totalPages}</strong>
        </div>
        <div class="pagination-controls">
          <button class="page-nav-btn" id="btnFirstPage" \${currentPage === 1 ? 'disabled' : ''} title="First page">«</button>
          <button class="page-nav-btn" id="btnPrevPage" \${currentPage === 1 ? 'disabled' : ''} title="Previous page">‹ Prev</button>
          \${pagesHtml}
          <button class="page-nav-btn" id="btnNextPage" \${currentPage === totalPages ? 'disabled' : ''} title="Next page">Next ›</button>
          <button class="page-nav-btn" id="btnLastPage" \${currentPage === totalPages ? 'disabled' : ''} title="Last page">»</button>
        </div>
        <div class="pagination-jump">
          <span>Go to page:</span>
          <input type="number" id="jumpPageInput" class="jump-input" min="1" max="\${totalPages}" value="\${currentPage}">
          <button id="btnJumpPage" class="jump-btn">Go</button>
        </div>
      \`;

      document.getElementById('btnFirstPage')?.addEventListener('click', () => goToPage(1));
      document.getElementById('btnPrevPage')?.addEventListener('click', () => goToPage(currentPage - 1));
      document.getElementById('btnNextPage')?.addEventListener('click', () => goToPage(currentPage + 1));
      document.getElementById('btnLastPage')?.addEventListener('click', () => goToPage(totalPages));

      paginationContainer.querySelectorAll('.page-nav-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = parseInt(e.currentTarget.getAttribute('data-page'), 10);
          if (target && target !== currentPage) goToPage(target);
        });
      });

      const jumpInput = document.getElementById('jumpPageInput');
      const jumpBtn = document.getElementById('btnJumpPage');
      const doJump = () => {
        const val = parseInt(jumpInput?.value, 10);
        if (!isNaN(val) && val >= 1 && val <= totalPages && val !== currentPage) {
          goToPage(val);
        }
      };
      jumpBtn?.addEventListener('click', doJump);
      jumpInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doJump();
      });
    }

    function goToPage(targetPage) {
      currentPage = targetPage;
      renderFilteredScores();
      const rankingCard = document.querySelector('.ranking-card');
      if (rankingCard) {
        rankingCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    document.getElementById('searchRankingInput').addEventListener('input', () => {
      currentPage = 1;
      renderFilteredScores();
    });

    loadRankingData();
    import('./js/ads-manager.js').then(m => m.AdsManager.init());
  </script>`;

const sIdxEn = enRanking.indexOf(ptScriptStart);
const eIdxEn = enRanking.indexOf('</script>\r\n  <script src="/js/tracker.js"></script>') !== -1 
  ? enRanking.indexOf('</script>\r\n  <script src="/js/tracker.js"></script>')
  : enRanking.indexOf('</script>\n  <script src="/js/tracker.js"></script>');

if (sIdxEn !== -1 && eIdxEn !== -1) {
  enRanking = enRanking.substring(0, sIdxEn) + newEnScript + enRanking.substring(eIdxEn + 9);
}

fs.writeFileSync(path.join(__dirname, '../en/ranking.html'), enRanking, 'utf8');
console.log('✅ en/ranking.html updated successfully with pagination!');
