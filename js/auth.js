// js/auth.js — Sistema de Contas, Login com Palavra-chave, Anônimos e Persistência de Recordes
import { firebaseConfig } from './firebase-config.js';

const USERS_DB_KEY = 'lula_users_db';
const CURRENT_USER_KEY = 'lula_current_user';
const ANON_COUNTER_KEY = 'lula_anon_counter';

class AuthManager {
  constructor() {
    this.currentUser = this.loadCurrentUser();
  }

  loadCurrentUser() {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Obter lista de usuários locais (com sincronização Firestore)
  getLocalUsersDB() {
    try {
      const data = localStorage.getItem(USERS_DB_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  saveLocalUsersDB(db) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  }

  // 1. CRIAR CONTA COM NOME E PALAVRA-CHAVE
  async register(username, password) {
    const cleanName = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanName || cleanName.length < 3) {
      return { success: false, error: 'O nome de usuário deve ter pelo menos 3 caracteres!' };
    }
    if (!cleanPass || cleanPass.length < 3) {
      return { success: false, error: 'A palavra-chave deve ter pelo menos 3 caracteres!' };
    }

    const localDB = this.getLocalUsersDB();
    const normalizedName = cleanName.toLowerCase();

    // Verifica no LocalStorage
    if (localDB[normalizedName]) {
      return { success: false, error: `O nome "${cleanName}" já existe! Escolha outro nome ou faça login com sua palavra-chave.` };
    }

    // Verifica no Firestore
    try {
      const checkUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users/${encodeURIComponent(normalizedName)}`;
      const res = await fetch(checkUrl);
      if (res.status === 200) {
        return { success: false, error: `O nome "${cleanName}" já existe cadastrado no sistema! Escolha outro nome ou faça login.` };
      }
    } catch (e) {}

    // Salva Usuário
    const userObj = {
      username: cleanName,
      password: cleanPass,
      isAnonymous: false,
      flappyScore: 0,
      runnerScore: 0,
      createdAt: new Date().toISOString()
    };

    localDB[normalizedName] = userObj;
    this.saveLocalUsersDB(localDB);

    // Salva no Firestore
    try {
      const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users?documentId=${encodeURIComponent(normalizedName)}`;
      const payload = {
        fields: {
          username: { stringValue: cleanName },
          password: { stringValue: cleanPass },
          flappyScore: { integerValue: '0' },
          runnerScore: { integerValue: '0' },
          createdAt: { timestampValue: userObj.createdAt }
        }
      };
      fetch(docUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (e) {}

    this.setCurrentUser(userObj);
    return { success: true, user: userObj };
  }

  // 2. LOGIN COM NOME E PALAVRA-CHAVE
  async login(username, password) {
    const cleanName = (username || '').trim();
    const cleanPass = (password || '').trim();
    const normalizedName = cleanName.toLowerCase();

    const localDB = this.getLocalUsersDB();
    let userObj = localDB[normalizedName];

    // Busca no Firestore se não estiver no local
    if (!userObj) {
      try {
        const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users/${encodeURIComponent(normalizedName)}`;
        const res = await fetch(docUrl);
        if (res.ok) {
          const doc = await res.json();
          userObj = {
            username: doc.fields?.username?.stringValue || cleanName,
            password: doc.fields?.password?.stringValue || '',
            isAnonymous: false,
            flappyScore: parseInt(doc.fields?.flappyScore?.integerValue || '0', 10),
            runnerScore: parseInt(doc.fields?.runnerScore?.integerValue || '0', 10),
            createdAt: doc.fields?.createdAt?.timestampValue || new Date().toISOString()
          };
          localDB[normalizedName] = userObj;
          this.saveLocalUsersDB(localDB);
        }
      } catch (e) {}
    }

    if (!userObj) {
      return { success: false, error: `Usuário "${cleanName}" não encontrado! Verifique o nome ou crie uma conta nova.` };
    }

    if (userObj.password !== cleanPass) {
      return { success: false, error: 'Palavra-chave incorreta! Tente novamente.' };
    }

    this.setCurrentUser(userObj);
    return { success: true, user: userObj };
  }

  // 3. JOGAR COMO ANÔNIMO (Anonimo_1, Anonimo_2...)
  playAsAnonymous() {
    let anonNum = parseInt(localStorage.getItem(ANON_COUNTER_KEY) || '0', 10) + 1;
    localStorage.setItem(ANON_COUNTER_KEY, anonNum.toString());

    const anonUser = {
      username: `Anonimo_${anonNum}`,
      isAnonymous: true,
      flappyScore: 0,
      runnerScore: 0
    };

    this.setCurrentUser(anonUser);
    return anonUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem('lula_player', user.username);

    if (user.flappyScore !== undefined) {
      localStorage.setItem('lula_best', user.flappyScore.toString());
    }
    if (user.runnerScore !== undefined) {
      localStorage.setItem('run_best', user.runnerScore.toString());
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('lula_player');
  }

  // 4. ATUALIZAR RECORDES DA CONTA
  updateUserScore(gameType, score) {
    if (!this.currentUser) {
      this.playAsAnonymous();
    }

    const key = gameType === 'runner' ? 'runnerScore' : 'flappyScore';
    const bestKey = gameType === 'runner' ? 'run_best' : 'lula_best';

    if (score > (this.currentUser[key] || 0)) {
      this.currentUser[key] = score;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      localStorage.setItem(bestKey, score.toString());

      // Atualiza banco local
      if (!this.currentUser.isAnonymous) {
        const localDB = this.getLocalUsersDB();
        const norm = this.currentUser.username.toLowerCase();
        if (localDB[norm]) {
          localDB[norm][key] = score;
          this.saveLocalUsersDB(localDB);
        }

        // Atualiza Firestore
        try {
          const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users/${encodeURIComponent(norm)}?updateMask.fieldPaths=${key}`;
          const payload = {
            fields: {
              [key]: { integerValue: score.toString() }
            }
          };
          fetch(docUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(() => {});
        } catch (e) {}
      }
    }
  }

  // 5. INSERIR MODAL VISUAL DE AUTENTICAÇÃO NO DOM
  mountAuthModal(onAuthComplete) {
    if (document.getElementById('authModalOverlay')) return;

    const modalHtml = `
      <div id="authModalOverlay" style="
        position: fixed; inset: 0; background: rgba(8, 9, 20, 0.88);
        backdrop-filter: blur(12px); z-index: 1000; display: flex;
        align-items: center; justify-content: center; padding: 20px;
      ">
        <div style="
          background: rgba(22, 27, 38, 0.98); border: 2px solid var(--amarelo-brasil, #ffdf00);
          border-radius: 24px; padding: 32px 28px; max-width: 460px; width: 100%;
          text-align: center; box-shadow: 0 0 50px rgba(255, 223, 0, 0.35);
        ">
          <h2 style="font-family:'Bangers',cursive; font-size:38px; color:var(--amarelo-brasil, #ffdf00); margin-bottom:6px;">
            🇧🇷 IDENTIFICAÇÃO DO JOGADOR
          </h2>
          <p style="color:var(--text-muted, #94a3b8); font-size:14px; margin-bottom:20px;">
            Crie sua conta ou entre para acumular seus pontos no ranking!
          </p>

          <div style="display:flex; gap:8px; margin-bottom:20px;">
            <button id="authTabLogin" class="btn-primary" style="flex:1; padding:10px; font-size:16px;">Entrar</button>
            <button id="authTabRegister" class="btn-secondary" style="flex:1; padding:10px; font-size:16px;">Criar Conta</button>
          </div>

          <div id="authAlert" style="display:none; padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:16px; font-weight:600;"></div>

          <div style="text-align:left; margin-bottom:14px;">
            <label style="display:block; font-size:12px; font-weight:700; color:var(--text-muted, #94a3b8); margin-bottom:4px; text-transform:uppercase;">
              Nome do Jogador / Apelido
            </label>
            <input type="text" id="authUsername" placeholder="Ex: Empresario_BR" maxlength="20" style="
              width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);
              border-radius: 12px; padding: 12px 16px; color: #fff; font-size: 15px; font-family: inherit;
            ">
          </div>

          <div style="text-align:left; margin-bottom:22px;">
            <label style="display:block; font-size:12px; font-weight:700; color:var(--text-muted, #94a3b8); margin-bottom:4px; text-transform:uppercase;">
              Palavra-chave (Senha)
            </label>
            <input type="password" id="authPassword" placeholder="Sua senha secreta" maxlength="24" style="
              width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);
              border-radius: 12px; padding: 12px 16px; color: #fff; font-size: 15px; font-family: inherit;
            ">
          </div>

          <button id="authBtnSubmit" class="btn-primary" style="width:100%; font-size:20px; padding:12px; margin-bottom:14px;">
            🚀 ENTRAR NO JOGO
          </button>

          <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:16px;">
            <button id="authBtnAnon" style="
              background: none; border: none; color: var(--text-muted, #94a3b8);
              font-size: 14px; cursor: pointer; text-decoration: underline; font-weight: 600;
            ">
              Não quero criar conta (Jogar como Anônimo)
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    let isRegisterMode = false;
    const overlay = document.getElementById('authModalOverlay');
    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');
    const btnSubmit = document.getElementById('authBtnSubmit');
    const btnAnon = document.getElementById('authBtnAnon');
    const alertBox = document.getElementById('authAlert');

    const showAlert = (msg, isError = true) => {
      alertBox.textContent = msg;
      alertBox.style.display = 'block';
      alertBox.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
      alertBox.style.color = isError ? '#f87171' : '#34d399';
      alertBox.style.border = isError ? '1px solid #ef4444' : '1px solid #10b981';
    };

    tabLogin.onclick = () => {
      isRegisterMode = false;
      tabLogin.className = 'btn-primary';
      tabRegister.className = 'btn-secondary';
      btnSubmit.textContent = '🚀 ENTRAR NO JOGO';
      alertBox.style.display = 'none';
    };

    tabRegister.onclick = () => {
      isRegisterMode = true;
      tabRegister.className = 'btn-primary';
      tabLogin.className = 'btn-secondary';
      btnSubmit.textContent = '✨ CRIAR CONTA E JOGAR';
      alertBox.style.display = 'none';
    };

    btnSubmit.onclick = async () => {
      const u = document.getElementById('authUsername').value;
      const p = document.getElementById('authPassword').value;
      btnSubmit.disabled = true;

      const res = isRegisterMode ? await this.register(u, p) : await this.login(u, p);
      btnSubmit.disabled = false;

      if (res.success) {
        overlay.remove();
        if (onAuthComplete) onAuthComplete(res.user);
      } else {
        showAlert(res.error);
      }
    };

    btnAnon.onclick = () => {
      const anonUser = this.playAsAnonymous();
      overlay.remove();
      if (onAuthComplete) onAuthComplete(anonUser);
    };
  }

  // 6. ADICIONAR BADGE DE PERFIL E TOGGLE HAMBURGER NO HEADER
  renderProfileBadge(containerSelector = 'nav') {
    const nav = document.querySelector(containerSelector);
    if (!nav) return;

    let rightGroup = document.getElementById('navRightGroup');
    if (!rightGroup) {
      rightGroup = document.createElement('div');
      rightGroup.id = 'navRightGroup';
      rightGroup.className = 'nav-right-group';
      nav.appendChild(rightGroup);
    }

    let badge = document.getElementById('playerProfileBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'playerProfileBadge';
      badge.style.cssText = 'display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:var(--amarelo-brasil);';
      rightGroup.appendChild(badge);
    }

    // Botão Hamburger Mobile
    let toggleBtn = document.getElementById('navToggleBtn');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'navToggleBtn';
      toggleBtn.className = 'nav-toggle-btn';
      toggleBtn.innerHTML = '☰ Menu';
      rightGroup.appendChild(toggleBtn);

      const navLinks = nav.querySelector('.nav-links');
      if (navLinks) {
        toggleBtn.onclick = (e) => {
          e.stopPropagation();
          navLinks.classList.toggle('open');
          toggleBtn.innerHTML = navLinks.classList.contains('open') ? '✕ Fechar' : '☰ Menu';
        };

        // Fecha menu ao clicar em qualquer link ou fora
        document.addEventListener('click', (e) => {
          if (!nav.contains(e.target)) {
            navLinks.classList.remove('open');
            toggleBtn.innerHTML = '☰ Menu';
          }
        });
      }
    }

    const user = this.getCurrentUser();
    if (user) {
      badge.innerHTML = `
        <span>👤 ${user.username}</span>
        <button id="btnLogoutProfile" style="
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; border-radius: 6px; padding: 2px 8px; font-size: 11px; cursor: pointer;
        ">Sair</button>
      `;
      document.getElementById('btnLogoutProfile').onclick = () => {
        this.logout();
        window.location.reload();
      };
    } else {
      badge.innerHTML = `
        <button id="btnLoginProfile" style="
          background: rgba(255,223,0,0.2); border: 1px solid var(--amarelo-brasil);
          color: var(--amarelo-brasil); border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; font-weight: 700;
        ">🔑 Entrar</button>
      `;
      document.getElementById('btnLoginProfile').onclick = () => {
        this.mountAuthModal(() => this.renderProfileBadge(containerSelector));
      };
    }
  }
}

export const auth = new AuthManager();
