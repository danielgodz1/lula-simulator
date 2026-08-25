// js/social-manager.js — Gerenciador Social Centralizado (Amigos, Duelos, Notificações, Feed e Torneio)
import { auth, DEFAULT_AVATAR_SVG } from './auth.js';
import { escapeHTML } from './security.js';

class SocialManager {
  constructor() {
    this.unreadNotifications = 0;
    this.cachedFriends = null;
    this.isPolling = false;
    this.initPolling();
  }

  initPolling() {
    if (typeof window === 'undefined') return;
    
    // Polling leve ao focar a aba ou a cada 60s se o usuário estiver logado
    window.addEventListener('focus', () => {
      if (auth.getCurrentUser()) {
        this.fetchNotifications().catch(() => {});
      }
    });

    setInterval(() => {
      if (auth.getCurrentUser() && document.visibilityState === 'visible') {
        this.fetchNotifications().catch(() => {});
      }
    }, 10000);
  }

  // =========================================================================
  // 1. AMIZADES
  // =========================================================================
  async searchUsers(query) {
    const user = auth.getCurrentUser();
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search_users',
          username: user ? user.username : '',
          query
        })
      });
      const data = await res.json();
      return data.success ? (data.users || []) : [];
    } catch(e) {
      return [];
    }
  }

  async sendFriendRequest(targetUser) {
    const user = auth.getCurrentUser();
    if (!user) return { success: false, error: 'Faça login para adicionar amigos!' };

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_friend_request',
          username: user.username,
          targetUser
        })
      });
      const data = await res.json();
      if (data.success) {
        this.cachedFriends = null;
        this.fetchNotifications().catch(() => {});
      }
      return data;
    } catch(e) {
      return { success: false, error: 'Erro de conexão ao enviar solicitação.' };
    }
  }

  async acceptFriendRequest(targetUser) {
    const user = auth.getCurrentUser();
    if (!user) return { success: false, error: 'Faça login para aceitar amigos!' };

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_friend_request',
          username: user.username,
          targetUser
        })
      });
      const data = await res.json();
      if (data.success) this.cachedFriends = null;
      return data;
    } catch(e) {
      return { success: false, error: 'Erro ao aceitar solicitação.' };
    }
  }

  async rejectFriendRequest(targetUser) {
    const user = auth.getCurrentUser();
    if (!user) return { success: false, error: 'Faça login!' };

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_friend_request',
          username: user.username,
          targetUser
        })
      });
      const data = await res.json();
      if (data.success) this.cachedFriends = null;
      return data;
    } catch(e) {
      return { success: false, error: 'Erro ao remover solicitação.' };
    }
  }

  async getFriendsList(force = false) {
    const user = auth.getCurrentUser();
    if (!user) return { friends: [], pendingReceived: [], pendingIncoming: [], pendingSent: [], pendingOutgoing: [] };

    if (!force && this.cachedFriends) return this.cachedFriends;

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_friends',
          username: user.username
        })
      });
      const data = await res.json();
      if (data.success) {
        const received = data.pendingReceived || data.pendingIncoming || [];
        const sent = data.pendingSent || data.pendingOutgoing || [];
        this.cachedFriends = {
          friends: data.friends || [],
          pendingReceived: received,
          pendingIncoming: received,
          pendingSent: sent,
          pendingOutgoing: sent
        };
        return this.cachedFriends;
      }
    } catch(e) {}

    return { friends: [], pendingReceived: [], pendingIncoming: [], pendingSent: [], pendingOutgoing: [] };
  }

  // =========================================================================
  // 2. DUELOS ASSÍNCRONOS & INVICTOS
  // =========================================================================
  async createDuel(targetUser, game = 'flappy') {
    const user = auth.getCurrentUser();
    if (!user) return { success: false, error: 'Faça login para desafiar outros jogadores!' };

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_duel',
          username: user.username,
          targetUser,
          game
        })
      });
      return await res.json();
    } catch(e) {
      return { success: false, error: 'Erro de conexão ao criar duelo.' };
    }
  }

  async respondDuel(duelId, score) {
    const user = auth.getCurrentUser();
    if (!user) return { success: false, error: 'Faça login!' };

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_duel',
          username: user.username,
          duelId,
          score
        })
      });
      return await res.json();
    } catch(e) {
      return { success: false, error: 'Erro ao resolver duelo.' };
    }
  }

  async getUserDuels() {
    const user = auth.getCurrentUser();
    if (!user) return { pendingDuels: [], completedDuels: [] };

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_duels',
          username: user.username
        })
      });
      const data = await res.json();
      return {
        pendingDuels: data.pendingDuels || [],
        completedDuels: data.completedDuels || []
      };
    } catch(e) {
      return { pendingDuels: [], completedDuels: [] };
    }
  }

  // =========================================================================
  // 3. NOTIFICAÇÕES IN-APP COM SINO NO HEADER
  // =========================================================================
  async fetchNotifications() {
    const user = auth.getCurrentUser();
    if (!user) {
      this.updateBellUI(0);
      return [];
    }

    try {
      const res = await fetch(`/api/notifications?username=${encodeURIComponent(user.username)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.unreadNotifications = data.unreadCount || 0;
          this.updateBellUI(this.unreadNotifications);
          return data.notifications || [];
        }
      }
    } catch(e) {}
    return [];
  }

  async markAllNotificationsRead() {
    const user = auth.getCurrentUser();
    if (!user) return;

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
          username: user.username
        })
      });
      this.unreadNotifications = 0;
      this.updateBellUI(0);
    } catch(e) {}
  }

  updateBellUI(count) {
    const badge = document.getElementById('notifBellBadge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  mountNotificationBell(containerEl) {
    if (!containerEl) return;
    const user = auth.getCurrentUser();
    if (!user) {
      containerEl.innerHTML = '';
      return;
    }

    containerEl.innerHTML = `
      <div style="position: relative; display: inline-flex; align-items: center;">
        <button id="btnNotifBell" style="
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.2);
          color: #fff;
          width: 38px; height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          position: relative;
          transition: all 0.2s;
        " title="Notificações">
          🔔
          <span id="notifBellBadge" style="
            position: absolute; top: -4px; right: -4px;
            background: #ef4444; color: #fff;
            font-size: 10px; font-weight: 900;
            width: 18px; height: 18px; border-radius: 50%;
            display: none; align-items: center; justify-content: center;
            border: 2px solid #080914;
          ">0</span>
        </button>

        <!-- Dropdown de Notificações -->
        <div id="notifDropdown" style="
          display: none;
          position: absolute; top: 48px; right: 0;
          width: 320px; max-height: 400px;
          background: #0f172a;
          border: 2px solid rgba(255,223,0,0.4);
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.9);
          z-index: 10040;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        ">
          <div style="
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);
            background: rgba(0,0,0,0.3);
          ">
            <span style="font-weight: 800; font-size: 13px; color: var(--amarelo-brasil); font-family: 'Bangers', cursive; letter-spacing: 1px;">
              NOTIFICAÇÕES 🔔
            </span>
            <button id="btnMarkAllRead" style="
              background: none; border: none; color: var(--verde-neon);
              font-size: 11px; font-weight: 700; cursor: pointer;
            ">Marcar lidas</button>
          </div>
          <div id="notifDropdownList" style="flex: 1; overflow-y: auto; max-height: 320px; padding: 6px;">
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #94a3b8;">
              Carregando...
            </div>
          </div>
          <div style="padding: 8px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2);">
            <a href="social.html" style="color: #38bdf8; font-size: 12px; font-weight: 700; text-decoration: none;">
              Abrir Central de Amigos & Duelos 👥 ➜
            </a>
          </div>
        </div>
      </div>
    `;

    const btnBell = containerEl.querySelector('#btnNotifBell');
    const dropdown = containerEl.querySelector('#notifDropdown');
    const btnMarkAll = containerEl.querySelector('#btnMarkAllRead');

    btnBell?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isClosed = dropdown.style.display === 'none' || !dropdown.style.display;
      dropdown.style.display = isClosed ? 'flex' : 'none';

      if (isClosed) {
        const notifs = await this.fetchNotifications();
        this.renderNotifListInDropdown(containerEl.querySelector('#notifDropdownList'), notifs);
      }
    });

    btnMarkAll?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.markAllNotificationsRead();
      const notifs = await this.fetchNotifications();
      this.renderNotifListInDropdown(containerEl.querySelector('#notifDropdownList'), notifs);
    });

    document.addEventListener('click', (e) => {
      if (!containerEl.contains(e.target) && dropdown) {
        dropdown.style.display = 'none';
      }
    });

    this.fetchNotifications().catch(() => {});
  }

  renderNotifListInDropdown(listEl, notifs) {
    if (!listEl) return;
    if (!notifs || notifs.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 25px 10px; color: #64748b; font-size: 12px;">
          Nenhuma notificação nova no momento. 📭
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    notifs.forEach(n => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 10px 12px;
        margin-bottom: 4px;
        border-radius: 10px;
        background: ${n.read ? 'rgba(255,255,255,0.03)' : 'rgba(0, 230, 118, 0.08)'};
        border-left: 3px solid ${n.read ? 'transparent' : 'var(--verde-neon)'};
        cursor: pointer;
        transition: background 0.15s;
      `;
      item.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: ${n.read ? '#cbd5e1' : '#fff'}; margin-bottom: 2px;">
          ${escapeHTML(n.title)}
        </div>
        <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
          ${escapeHTML(n.message)}
        </div>
      `;
      item.onclick = () => {
        if (n.link) window.location.href = n.link;
      };
      listEl.appendChild(item);
    });
  }

  // =========================================================================
  // 4. FEED DE ATIVIDADE PÚBLICO (HOME PAGE)
  // =========================================================================
  async getPublicFeed() {
    try {
      const res = await fetch('/api/activity');
      if (res.ok) {
        const data = await res.json();
        return data.success ? (data.activities || []) : [];
      }
    } catch(e) {}
    return [];
  }

  renderActivityFeed(containerEl, activities) {
    if (!containerEl) return;
    if (!activities || activities.length === 0) {
      containerEl.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
          Aguardando novos recordes e duelos da comunidade... ⚡
        </div>
      `;
      return;
    }

    containerEl.innerHTML = '';
    const marquee = document.createElement('div');
    marquee.style.cssText = `
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 10px 4px;
      scrollbar-width: thin;
    `;

    activities.forEach(act => {
      const card = document.createElement('div');
      card.style.cssText = `
        flex: 0 0 280px;
        background: rgba(15, 23, 42, 0.85);
        border: 1.5px solid rgba(255, 223, 0, 0.25);
        border-radius: 14px;
        padding: 12px 14px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 10px;
        transition: transform 0.2s, border-color 0.2s;
      `;
      card.onmouseenter = () => { card.style.transform = 'translateY(-3px)'; card.style.borderColor = 'var(--amarelo-brasil)'; };
      card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.borderColor = 'rgba(255, 223, 0, 0.25)'; };

      const avatarSrc = act.avatar || DEFAULT_AVATAR_SVG;
      const isDuel = act.eventType === 'duel_win';

      card.innerHTML = `
        <img src="${avatarSrc}" onerror="this.src='${DEFAULT_AVATAR_SVG}'" style="
          width: 38px; height: 38px; border-radius: 50%;
          border: 1.5px solid ${isDuel ? '#ef4444' : 'var(--amarelo-brasil)'};
          object-fit: cover; background: #1e293b;
        " alt="Avatar">
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <span style="font-weight: 800; font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHTML(act.username)}
            </span>
            <span style="font-size: 10px; color: ${isDuel ? '#ef4444' : 'var(--verde-neon)'}; font-weight: 800;">
              ${isDuel ? '⚔️ DUELO' : '⭐ RECORDE'}
            </span>
          </div>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${escapeHTML(act.desc || act.title)}
          </p>
        </div>
      `;
      marquee.appendChild(card);
    });

    containerEl.appendChild(marquee);
  }

  // =========================================================================
  // 5. TORNEIO SEMANAL ELIMINATÓRIO (COPA BRASÍLIA)
  // =========================================================================
  async getWeeklyTournament() {
    try {
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tournament) return data.tournament;
      }
    } catch(e) {}

    // Fallback gracioso caso esteja em servidor local estático ou offline
    const defaultRoster = [
      { seed: 1, player: 'Lula 13', score: 250, avatar: 'img/lula.png', flag: '🇧🇷' },
      { seed: 8, player: 'Piloto Federal', score: 95, avatar: 'img/favela.png', flag: '🇧🇷' },
      { seed: 4, player: 'Mindset 3X', score: 180, avatar: 'img/marcal.png', flag: '🇧🇷' },
      { seed: 5, player: 'Estocadora Galáctica', score: 160, avatar: 'img/dilma.png', flag: '🇧🇷' },
      { seed: 2, player: 'Capitão 22', score: 210, avatar: 'img/bolsonaro.png', flag: '🇧🇷' },
      { seed: 7, player: 'Janja VIP', score: 120, avatar: 'img/janja.png', flag: '🇧🇷' },
      { seed: 3, player: 'Xandão Supremo', score: 195, avatar: 'img/moraes.png', flag: '🇧🇷' },
      { seed: 6, player: 'Deputado Viral', score: 140, avatar: 'img/nikolas.png', flag: '🇧🇷' }
    ];

    const quarters = [
      { id: 'q1', p1: defaultRoster[0], p2: defaultRoster[1], winner: defaultRoster[0] },
      { id: 'q2', p1: defaultRoster[2], p2: defaultRoster[3], winner: defaultRoster[2] },
      { id: 'q3', p1: defaultRoster[4], p2: defaultRoster[5], winner: defaultRoster[4] },
      { id: 'q4', p1: defaultRoster[6], p2: defaultRoster[7], winner: defaultRoster[6] }
    ];

    const semis = [
      { id: 's1', p1: quarters[0].winner, p2: quarters[1].winner, winner: quarters[0].winner },
      { id: 's2', p1: quarters[2].winner, p2: quarters[3].winner, winner: quarters[2].winner }
    ];

    const finalMatch = {
      id: 'final',
      p1: semis[0].winner,
      p2: semis[1].winner,
      champion: semis[0].winner
    };

    return {
      name: 'Copa Brasília · Edição Semanal Oficial',
      status: 'active',
      participants: defaultRoster,
      quarters,
      semis,
      final: finalMatch
    };
  }
}

export const social = new SocialManager();
