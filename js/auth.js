// js/auth.js — Sistema de Contas, Nomes de Jogador Personalizados e Persistência de Recordes
import { firebaseConfig } from './firebase-config.js';

const USERS_DB_KEY = 'lula_users_db_v2';
const CURRENT_USER_KEY = 'lula_current_user_v2';

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

  // Obter lista de usuários locais
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

  // 1. JOGAR SEM SENHA COM NOME ESCOLHIDO PELO JOGADOR
  async playWithChosenName(username) {
    const cleanName = (username || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Digite um nome de jogador válido (mínimo 2 letras)!' };
    }

    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const localDB = this.getLocalUsersDB();

    // 1. Verifica se esse nome já pertence a uma conta com senha no LocalStorage
    if (localDB[normalizedName] && localDB[normalizedName].hasPassword) {
      return {
        success: false,
        error: `O nome "${cleanName}" pertence a uma conta protegida por senha! Digite a senha na aba "Entrar com Senha" ou escolha outro nome.`
      };
    }

    // 2. Verifica no Firestore se existe conta com senha
    try {
      const checkUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
      const res = await fetch(checkUrl);
      if (res.ok) {
        const doc = await res.json();
        const hasPassword = doc.fields?.hasPassword?.booleanValue || !!doc.fields?.password?.stringValue;
        if (hasPassword) {
          return {
            success: false,
            error: `O nome "${cleanName}" já está cadastrado com senha! Faça login na aba "Entrar com Senha" ou escolha outro nome.`
          };
        }
      }
    } catch (e) {}

    // Cria/Atualiza perfil de jogador
    let userObj = localDB[normalizedName] || {
      username: cleanName,
      password: '',
      hasPassword: false,
      flappyScore: 0,
      runnerScore: 0,
      createdAt: new Date().toISOString()
    };

    localDB[normalizedName] = userObj;
    this.saveLocalUsersDB(localDB);
    this.setCurrentUser(userObj);

    return { success: true, user: userObj };
  }

  // 2. CRIAR CONTA PROTEGIDA COM PALAVRA-CHAVE
  async register(username, password) {
    const cleanName = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'O nome de usuário deve ter pelo menos 2 caracteres!' };
    }
    if (!cleanPass || cleanPass.length < 3) {
      return { success: false, error: 'A palavra-chave (senha) deve ter pelo menos 3 caracteres!' };
    }

    const localDB = this.getLocalUsersDB();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Verifica no LocalStorage se já tem senha cadastrada
    if (localDB[normalizedName] && localDB[normalizedName].hasPassword) {
      return { success: false, error: `O nome "${cleanName}" já está cadastrado com senha! Faça login com sua palavra-chave.` };
    }

    // Verifica no Firestore
    try {
      const checkUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
      const res = await fetch(checkUrl);
      if (res.ok) {
        const doc = await res.json();
        const hasPassword = doc.fields?.hasPassword?.booleanValue || !!doc.fields?.password?.stringValue;
        if (hasPassword) {
          return { success: false, error: `O nome "${cleanName}" já possui senha no banco! Escolha outro nome ou faça login.` };
        }
      }
    } catch (e) {}

    // Preserva pontuação anterior se o usuário já jogou com esse nome
    const prevFlappy = localDB[normalizedName]?.flappyScore || parseInt(localStorage.getItem('lula_best') || '0', 10);
    const prevRunner = localDB[normalizedName]?.runnerScore || parseInt(localStorage.getItem('run_best') || '0', 10);

    const userObj = {
      username: cleanName,
      password: cleanPass,
      hasPassword: true,
      flappyScore: prevFlappy,
      runnerScore: prevRunner,
      createdAt: new Date().toISOString()
    };

    localDB[normalizedName] = userObj;
    this.saveLocalUsersDB(localDB);

    // Salva no Firestore
    try {
      const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2?documentId=${encodeURIComponent(normalizedName)}`;
      const payload = {
        fields: {
          username: { stringValue: cleanName },
          password: { stringValue: cleanPass },
          hasPassword: { booleanValue: true },
          flappyScore: { integerValue: prevFlappy.toString() },
          runnerScore: { integerValue: prevRunner.toString() },
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

  // 3. LOGIN COM NOME E PALAVRA-CHAVE
  async login(username, password) {
    const cleanName = (username || '').trim();
    const cleanPass = (password || '').trim();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanName || !cleanPass) {
      return { success: false, error: 'Preencha o nome e a palavra-chave!' };
    }

    const localDB = this.getLocalUsersDB();
    let userObj = localDB[normalizedName];

    // Busca no Firestore
    if (!userObj || !userObj.password) {
      try {
        const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
        const res = await fetch(docUrl);
        if (res.ok) {
          const doc = await res.json();
          userObj = {
            username: doc.fields?.username?.stringValue || cleanName,
            password: doc.fields?.password?.stringValue || '',
            hasPassword: true,
            flappyScore: parseInt(doc.fields?.flappyScore?.integerValue || '0', 10),
            runnerScore: parseInt(doc.fields?.runnerScore?.integerValue || '0', 10),
            createdAt: doc.fields?.createdAt?.timestampValue || new Date().toISOString()
          };
          localDB[normalizedName] = userObj;
          this.saveLocalUsersDB(localDB);
        }
      } catch (e) {}
    }

    if (!userObj || !userObj.hasPassword) {
      return { success: false, error: `Usuário "${cleanName}" não possui senha cadastrada! Você pode jogar diretamente ou criar uma senha na aba "Criar Conta".` };
    }

    if (userObj.password !== cleanPass) {
      return { success: false, error: 'Palavra-chave incorreta! Tente novamente.' };
    }

    this.setCurrentUser(userObj);
    return { success: true, user: userObj };
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

  // 4. ATUALIZAR RECORDES DA CONTA (NUNCA SOBRESCREVE SE A PONTUAÇÃO ATUAL FOR MENOR)
  updateUserScore(gameType, score) {
    if (!this.currentUser) return;

    const key = gameType === 'runner' ? 'runnerScore' : 'flappyScore';
    const bestKey = gameType === 'runner' ? 'run_best' : 'lula_best';

    const currentBest = this.currentUser[key] || parseInt(localStorage.getItem(bestKey) || '0', 10);

    // Se bateu o recorde pessoal, atualiza
    if (score > currentBest) {
      this.currentUser[key] = score;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      localStorage.setItem(bestKey, score.toString());

      const localDB = this.getLocalUsersDB();
      const norm = this.currentUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (localDB[norm]) {
        localDB[norm][key] = score;
        this.saveLocalUsersDB(localDB);
      }

      // Atualiza Firestore se tiver conta registrada
      if (this.currentUser.hasPassword) {
        try {
          const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(norm)}?updateMask.fieldPaths=${key}`;
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

  // 5. INSERIR MODAL VISUAL DE IDENTIFICAÇÃO NO DOM
  mountAuthModal(onAuthComplete) {
    if (document.getElementById('authModalOverlay')) return;

    const modalHtml = `
      <div id="authModalOverlay" style="
        position: fixed; inset: 0; background: rgba(8, 9, 20, 0.90);
        backdrop-filter: blur(14px); z-index: 1000; display: flex;
        align-items: center; justify-content: center; padding: 18px;
      ">
        <div style="
          background: rgba(22, 27, 38, 0.98); border: 2px solid var(--amarelo-brasil, #ffdf00);
          border-radius: 24px; padding: 30px 26px; max-width: 480px; width: 100%;
          text-align: center; box-shadow: 0 0 50px rgba(255, 223, 0, 0.35);
        ">
          <h2 style="font-family:'Bangers',cursive; font-size:36px; color:var(--amarelo-brasil, #ffdf00); margin-bottom:6px;">
            🇧🇷 ENTRAR NO JOGO
          </h2>
          <p style="color:var(--text-muted, #94a3b8); font-size:13px; margin-bottom:18px;">
            Digite seu nome de jogador para acumular seus pontos no ranking!
          </p>

          <!-- ABAS DE SELEÇÃO -->
          <div style="display:flex; gap:6px; margin-bottom:18px;">
            <button id="authTabQuick" class="btn-primary" style="flex:1; padding:8px 4px; font-size:14px;">🎮 Jogar Rápido</button>
            <button id="authTabRegister" class="btn-secondary" style="flex:1; padding:8px 4px; font-size:14px;">🔑 Criar Conta</button>
            <button id="authTabLogin" class="btn-secondary" style="flex:1; padding:8px 4px; font-size:14px;">👤 Entrar</button>
          </div>

          <div id="authAlert" style="display:none; padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:16px; font-weight:600; text-align:left;"></div>

          <div style="text-align:left; margin-bottom:14px;">
            <label style="display:block; font-size:12px; font-weight:700; color:var(--text-muted, #94a3b8); margin-bottom:4px; text-transform:uppercase;">
              Nome do Jogador / Apelido
            </label>
            <input type="text" id="authUsername" placeholder="Ex: Daniel_BR, Empresario_Top" maxlength="20" style="
              width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);
              border-radius: 12px; padding: 12px 16px; color: #fff; font-size: 15px; font-family: inherit; outline: none;
            ">
          </div>

          <div id="passwordFieldGroup" style="text-align:left; margin-bottom:20px; display:none;">
            <label style="display:block; font-size:12px; font-weight:700; color:var(--text-muted, #94a3b8); margin-bottom:4px; text-transform:uppercase;">
              Palavra-chave (Senha)
            </label>
            <input type="password" id="authPassword" placeholder="Sua senha secreta" maxlength="24" style="
              width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);
              border-radius: 12px; padding: 12px 16px; color: #fff; font-size: 15px; font-family: inherit; outline: none;
            ">
          </div>

          <button id="authBtnSubmit" class="btn-primary" style="width:100%; font-size:20px; padding:13px; margin-bottom:6px;">
            🎮 JOGAR COM ESTE NOME
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    let activeTab = 'quick'; // 'quick', 'register', 'login'
    const overlay = document.getElementById('authModalOverlay');
    const tabQuick = document.getElementById('authTabQuick');
    const tabRegister = document.getElementById('authTabRegister');
    const tabLogin = document.getElementById('authTabLogin');
    const passwordGroup = document.getElementById('passwordFieldGroup');
    const btnSubmit = document.getElementById('authBtnSubmit');
    const alertBox = document.getElementById('authAlert');
    const usernameInput = document.getElementById('authUsername');

    const setTab = (tab) => {
      activeTab = tab;
      alertBox.style.display = 'none';

      [tabQuick, tabRegister, tabLogin].forEach(t => t.className = 'btn-secondary');

      if (tab === 'quick') {
        tabQuick.className = 'btn-primary';
        passwordGroup.style.display = 'none';
        btnSubmit.textContent = '🎮 JOGAR COM ESTE NOME';
      } else if (tab === 'register') {
        tabRegister.className = 'btn-primary';
        passwordGroup.style.display = 'block';
        btnSubmit.textContent = '✨ CRIAR CONTA COM SENHA';
      } else if (tab === 'login') {
        tabLogin.className = 'btn-primary';
        passwordGroup.style.display = 'block';
        btnSubmit.textContent = '🚀 ENTRAR NA CONTA';
      }
    };

    tabQuick.onclick = () => setTab('quick');
    tabRegister.onclick = () => setTab('register');
    tabLogin.onclick = () => setTab('login');

    const showAlert = (msg, isError = true) => {
      alertBox.textContent = msg;
      alertBox.style.display = 'block';
      alertBox.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
      alertBox.style.color = isError ? '#f87171' : '#34d399';
      alertBox.style.border = isError ? '1px solid #ef4444' : '1px solid #10b981';
    };

    btnSubmit.onclick = async () => {
      const u = usernameInput.value;
      const p = document.getElementById('authPassword').value;
      btnSubmit.disabled = true;

      let res;
      if (activeTab === 'quick') {
        res = await this.playWithChosenName(u);
      } else if (activeTab === 'register') {
        res = await this.register(u, p);
      } else if (activeTab === 'login') {
        res = await this.login(u, p);
      }

      btnSubmit.disabled = false;

      if (res.success) {
        overlay.remove();
        if (onAuthComplete) onAuthComplete(res.user);
      } else {
        showAlert(res.error);
      }
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
        ">Trocar</button>
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
        ">🔑 Entrar / Mudar Nome</button>
      `;
      document.getElementById('btnLoginProfile').onclick = () => {
        this.mountAuthModal(() => this.renderProfileBadge(containerSelector));
      };
    }
  }
}

export const auth = new AuthManager();
