// js/auth.js — Sistema de Contas, Nomes de Jogador Personalizados e Persistência Cloud de Recordes e Picanhas
import { firebaseConfig } from './firebase-config.js';
import { escapeHTML } from './security.js';

const USERS_DB_KEY = 'lula_users_db_v2';
const CURRENT_USER_KEY = 'lula_current_user_v2';
const TOTAL_PICANHAS_KEY = 'flappy_total_accumulated_picanhas';

class AuthManager {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    // Inicia sincronização em background se houver usuário conectado
    if (this.currentUser) {
      this.syncFromCloud();
    }
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

  // SINCRONIZAÇÃO EM SEGUNDO PLANO COM O FIRESTORE (CLOUD)
  async syncFromCloud() {
    if (!this.currentUser || !this.currentUser.username) return;
    const normalizedName = this.currentUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    try {
      const checkUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
      const res = await fetch(checkUrl);
      if (res.ok) {
        const doc = await res.json();
        const cloudPicanhas = parseInt(doc.fields?.totalPicanhas?.integerValue || '0', 10);
        const cloudFlappy = parseInt(doc.fields?.flappyScore?.integerValue || '0', 10);
        const cloudRunner = parseInt(doc.fields?.runnerScore?.integerValue || '0', 10);

        const localPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
        const localFlappy = parseInt(localStorage.getItem('lula_best') || '0', 10);
        const localRunner = parseInt(localStorage.getItem('run_best') || '0', 10);

        const mergedPicanhas = Math.max(localPicanhas, cloudPicanhas, this.currentUser.totalPicanhas || 0);
        const mergedFlappy = Math.max(localFlappy, cloudFlappy, this.currentUser.flappyScore || 0);
        const mergedRunner = Math.max(localRunner, cloudRunner, this.currentUser.runnerScore || 0);

        this.currentUser.totalPicanhas = mergedPicanhas;
        this.currentUser.flappyScore = mergedFlappy;
        this.currentUser.runnerScore = mergedRunner;

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
        localStorage.setItem(TOTAL_PICANHAS_KEY, mergedPicanhas.toString());
        localStorage.setItem('lula_best', mergedFlappy.toString());
        localStorage.setItem('run_best', mergedRunner.toString());

        // Se o local tinha mais que a nuvem, atualiza a nuvem
        if (localPicanhas > cloudPicanhas || localFlappy > cloudFlappy || localRunner > cloudRunner) {
          const patchUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}?updateMask.fieldPaths=totalPicanhas&updateMask.fieldPaths=flappyScore&updateMask.fieldPaths=runnerScore`;
          const patchPayload = {
            fields: {
              totalPicanhas: { integerValue: mergedPicanhas.toString() },
              flappyScore: { integerValue: mergedFlappy.toString() },
              runnerScore: { integerValue: mergedRunner.toString() }
            }
          };
          fetch(patchUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchPayload)
          }).catch(() => {});
        }
      }
    } catch (e) {}
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
        error: `O nome "${cleanName}" pertence a uma conta protegida por senha! Digite a senha na aba "Entrar" ou escolha outro nome.`
      };
    }

    let remoteUser = null;
    // 2. Verifica no Firestore se existe conta
    try {
      const checkUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
      const res = await fetch(checkUrl);
      if (res.ok) {
        const doc = await res.json();
        const hasPassword = doc.fields?.hasPassword?.booleanValue;
        if (hasPassword) {
          return {
            success: false,
            error: `O nome "${cleanName}" já está cadastrado com senha! Faça login na aba "Entrar" ou escolha outro nome.`
          };
        }
        remoteUser = {
          username: doc.fields?.username?.stringValue || cleanName,
          hasPassword: false,
          flappyScore: parseInt(doc.fields?.flappyScore?.integerValue || '0', 10),
          runnerScore: parseInt(doc.fields?.runnerScore?.integerValue || '0', 10),
          totalPicanhas: parseInt(doc.fields?.totalPicanhas?.integerValue || '0', 10),
          createdAt: doc.fields?.createdAt?.timestampValue || new Date().toISOString()
        };
      }
    } catch (e) {}

    const localPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const localFlappy = parseInt(localStorage.getItem('lula_best') || '0', 10);
    const localRunner = parseInt(localStorage.getItem('run_best') || '0', 10);

    // Cria/Atualiza perfil de jogador
    let userObj = remoteUser || localDB[normalizedName] || {
      username: cleanName,
      hasPassword: false,
      flappyScore: localFlappy,
      runnerScore: localRunner,
      totalPicanhas: localPicanhas,
      createdAt: new Date().toISOString()
    };

    userObj.totalPicanhas = Math.max(userObj.totalPicanhas || 0, localPicanhas);
    userObj.flappyScore = Math.max(userObj.flappyScore || 0, localFlappy);
    userObj.runnerScore = Math.max(userObj.runnerScore || 0, localRunner);

    localDB[normalizedName] = userObj;
    this.saveLocalUsersDB(localDB);

    // Grava perfil público no Firestore se não for conta com senha
    try {
      const publicDocUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
      const publicPayload = {
        fields: {
          username: { stringValue: cleanName },
          hasPassword: { booleanValue: false },
          flappyScore: { integerValue: (userObj.flappyScore || 0).toString() },
          runnerScore: { integerValue: (userObj.runnerScore || 0).toString() },
          totalPicanhas: { integerValue: (userObj.totalPicanhas || 0).toString() },
          createdAt: { timestampValue: userObj.createdAt }
        }
      };
      fetch(publicDocUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publicPayload)
      }).catch(() => {});
    } catch (e) {}

    this.setCurrentUser(userObj);
    return { success: true, user: userObj };
  }

  // 2. REGISTRAR CONTA COM PALAVRA-CHAVE (AUTENTICADO EXCLUSIVAMENTE VIA SERVERLESS COM FIREBASE ADMIN SDK)
  async register(username, password) {
    const cleanName = (username || '').trim();
    const cleanPass = (password || '').trim();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'O nome precisa ter pelo menos 2 letras!' };
    }
    if (!cleanPass || cleanPass.length < 3) {
      return { success: false, error: 'A palavra-chave precisa ter pelo menos 3 caracteres!' };
    }

    const localPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const prevFlappy = parseInt(localStorage.getItem('lula_best') || '0', 10);
    const prevRunner = parseInt(localStorage.getItem('run_best') || '0', 10);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          username: cleanName,
          password: cleanPass,
          flappyScore: prevFlappy,
          runnerScore: prevRunner,
          totalPicanhas: localPicanhas
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || (response.status === 409 ? 'Este nome já está cadastrado com senha!' : 'Erro ao registrar conta no servidor.')
        };
      }

      const userObj = {
        username: data.user?.username || cleanName,
        hasPassword: true,
        flappyScore: data.user?.flappyScore ?? prevFlappy,
        runnerScore: data.user?.runnerScore ?? prevRunner,
        totalPicanhas: data.user?.totalPicanhas ?? localPicanhas,
        createdAt: new Date().toISOString()
      };

      const localDB = this.getLocalUsersDB();
      localDB[normalizedName] = userObj;
      this.saveLocalUsersDB(localDB);

      this.setCurrentUser(userObj);
      return { success: true, user: userObj };
    } catch (err) {
      return {
        success: false,
        error: 'Erro de conexão com o servidor de autenticação. Verifique sua internet.'
      };
    }
  }

  // 3. LOGIN COM NOME E PALAVRA-CHAVE (AUTENTICADO EXCLUSIVAMENTE VIA SERVERLESS COM FIREBASE ADMIN SDK)
  async login(username, password) {
    const cleanName = (username || '').trim();
    const cleanPass = (password || '').trim();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanName || !cleanPass) {
      return { success: false, error: 'Preencha o nome e a palavra-chave!' };
    }

    try {
      const apiRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: cleanName,
          password: cleanPass
        })
      });

      const data = await apiRes.json().catch(() => ({}));

      if (!apiRes.ok || !data.success) {
        return {
          success: false,
          error: data.error || (apiRes.status === 401 ? 'Palavra-chave incorreta! Tente novamente.' : 'Erro ao autenticar no servidor.')
        };
      }

      const localDB = this.getLocalUsersDB();
      const userObj = {
        ...(localDB[normalizedName] || {}),
        ...data.user,
        username: data.user.username || cleanName,
        hasPassword: true
      };

      localDB[normalizedName] = userObj;
      this.saveLocalUsersDB(localDB);
      this.setCurrentUser(userObj);

      return { success: true, user: userObj };
    } catch (err) {
      return {
        success: false,
        error: 'Erro de conexão com o servidor de autenticação. Verifique sua internet.'
      };
    }
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem('lula_player', user.username);

    if (user.flappyScore !== undefined) {
      const cur = parseInt(localStorage.getItem('lula_best') || '0', 10);
      localStorage.setItem('lula_best', Math.max(cur, user.flappyScore).toString());
    }
    if (user.runnerScore !== undefined) {
      const cur = parseInt(localStorage.getItem('run_best') || '0', 10);
      localStorage.setItem('run_best', Math.max(cur, user.runnerScore).toString());
    }
    if (user.totalPicanhas !== undefined) {
      const cur = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
      const finalPicanhas = Math.max(cur, user.totalPicanhas);
      localStorage.setItem(TOTAL_PICANHAS_KEY, finalPicanhas.toString());
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('lula_player');
  }

  updateUserScore(gameType, score) {
    if (!this.currentUser) return;

    const key = gameType === 'runner' ? 'runnerScore' : 'flappyScore';
    const bestKey = gameType === 'runner' ? 'run_best' : 'lula_best';

    const currentBest = this.currentUser[key] || parseInt(localStorage.getItem(bestKey) || '0', 10);

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

  addPicanhas(count) {
    const cur = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const updated = cur + count;
    localStorage.setItem(TOTAL_PICANHAS_KEY, updated.toString());

    if (this.currentUser) {
      this.currentUser.totalPicanhas = updated;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));

      const localDB = this.getLocalUsersDB();
      const norm = this.currentUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (localDB[norm]) {
        localDB[norm].totalPicanhas = updated;
        this.saveLocalUsersDB(localDB);
      }

      try {
        const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(norm)}?updateMask.fieldPaths=totalPicanhas`;
        const payload = {
          fields: {
            totalPicanhas: { integerValue: updated.toString() }
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

  // -------------------------------------------------------------
  // UI DO MODAL DE AUTENTICAÇÃO E PERFIL DO USUÁRIO
  // -------------------------------------------------------------
  mountAuthModal(onSuccessCallback) {
    let existingModal = document.getElementById('authModalOverlay');
    if (existingModal) existingModal.remove();

    const user = this.getCurrentUser();
    const currentName = user ? user.username : (localStorage.getItem('lula_player') || '');

    const overlay = document.createElement('div');
    overlay.id = 'authModalOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 16px; font-family: 'Outfit', sans-serif;
    `;

    overlay.innerHTML = `
      <div style="
        background: #0f172a; border: 2px solid var(--amarelo-brasil, #ffd700);
        border-radius: 16px; width: 100%; max-width: 420px; padding: 24px;
        color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,215,0,0.2);
        position: relative; animation: popIn 0.25s ease-out;
      ">
        <button id="closeAuthModal" style="
          position: absolute; top: 14px; right: 14px; background: none; border: none;
          color: #94a3b8; font-size: 20px; cursor: pointer; font-weight: bold;
        ">✕</button>

        <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 6px 0; color: #fff; text-align: center;">
          🇧🇷 Perfil do Jogador
        </h2>
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0 0 18px 0;">
          Escolha seu nome público ou proteja sua conta com senha!
        </p>

        <!-- TABS -->
        <div style="display: flex; gap: 8px; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
          <button id="tabChosenName" class="auth-tab active" style="flex:1; padding:8px; border-radius:8px; border:none; background:var(--azul-bandeira, #1e3a8a); color:#fff; font-weight:700; cursor:pointer; font-size:12px;">👤 Jogar sem Senha</button>
          <button id="tabRegister" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">🔒 Criar Conta</button>
          <button id="tabLogin" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">🔑 Entrar</button>
        </div>

        <!-- FORM: JOGAR SEM SENHA -->
        <div id="formChosenName" class="auth-form-panel">
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Seu Nome no Placar:</label>
            <input type="text" id="inputChosenName" maxlength="25" value="${escapeHTML(currentName)}" placeholder="Ex: Lula_Gamer_BR" style="
              width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <button id="btnSubmitChosenName" style="
            width: 100%; padding: 12px; border-radius: 8px; border: none;
            background: linear-gradient(135deg, var(--verde-bandeira, #009c3b), var(--verde-neon, #00ff88));
            color: #000; font-weight: 800; font-size: 14px; cursor: pointer; transition: transform 0.15s;
          ">SALVAR E JOGAR 🚀</button>
        </div>

        <!-- FORM: CRIAR CONTA COM SENHA -->
        <div id="formRegister" class="auth-form-panel" style="display: none;">
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Nome de Jogador:</label>
            <input type="text" id="inputRegUser" maxlength="25" value="${escapeHTML(currentName)}" placeholder="Ex: Empresario_Ouro" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Palavra-Chave / Senha:</label>
            <input type="password" id="inputRegPass" maxlength="40" placeholder="Digite uma senha simples" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <button id="btnSubmitRegister" style="
            width: 100%; padding: 12px; border-radius: 8px; border: none;
            background: linear-gradient(135deg, var(--amarelo-brasil, #ffd700), #f59e0b);
            color: #000; font-weight: 800; font-size: 14px; cursor: pointer;
          ">CRIAR CONTA PROTEGIDA 🔒</button>
        </div>

        <!-- FORM: ENTRAR -->
        <div id="formLogin" class="auth-form-panel" style="display: none;">
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Nome de Jogador:</label>
            <input type="text" id="inputLoginUser" maxlength="25" value="${escapeHTML(currentName)}" placeholder="Seu nome cadastrado" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Palavra-Chave / Senha:</label>
            <input type="password" id="inputLoginPass" maxlength="40" placeholder="Sua senha" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <button id="btnSubmitLogin" style="
            width: 100%; padding: 12px; border-radius: 8px; border: none;
            background: linear-gradient(135deg, #38bdf8, #2563eb);
            color: #fff; font-weight: 800; font-size: 14px; cursor: pointer;
          ">ENTRAR NA CONTA 🔑</button>
        </div>

        <!-- MENSAGEM DE STATUS/ERRO -->
        <div id="authStatusMsg" style="
          margin-top: 14px; font-size: 12px; text-align: center; min-height: 18px;
          display: none; padding: 8px; border-radius: 6px;
        "></div>
      </div>
    `;

    document.body.appendChild(overlay);

    const showMsg = (txt, isErr = true) => {
      const msg = document.getElementById('authStatusMsg');
      msg.style.display = 'block';
      msg.style.background = isErr ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
      msg.style.color = isErr ? '#fca5a5' : '#86efac';
      msg.style.border = `1px solid ${isErr ? '#ef4444' : '#22c55e'}`;
      msg.innerText = txt;
    };

    // Tabs Switch
    const tabChosen = document.getElementById('tabChosenName');
    const tabReg = document.getElementById('tabRegister');
    const tabLog = document.getElementById('tabLogin');

    const formChosen = document.getElementById('formChosenName');
    const formReg = document.getElementById('formRegister');
    const formLog = document.getElementById('formLogin');

    const selectTab = (activeTab, activeForm) => {
      [tabChosen, tabReg, tabLog].forEach(t => {
        t.style.background = 'transparent';
        t.style.color = '#94a3b8';
      });
      [formChosen, formReg, formLog].forEach(f => f.style.display = 'none');

      activeTab.style.background = 'var(--azul-bandeira, #1e3a8a)';
      activeTab.style.color = '#fff';
      activeForm.style.display = 'block';
      document.getElementById('authStatusMsg').style.display = 'none';
    };

    tabChosen.onclick = () => selectTab(tabChosen, formChosen);
    tabReg.onclick = () => selectTab(tabReg, formReg);
    tabLog.onclick = () => selectTab(tabLog, formLog);

    document.getElementById('closeAuthModal').onclick = () => overlay.remove();

    // Ações de Submit
    document.getElementById('btnSubmitChosenName').onclick = async () => {
      const name = document.getElementById('inputChosenName').value;
      const res = await this.playWithChosenName(name);
      if (res.success) {
        showMsg('Nome atualizado com sucesso! Carregando...', false);
        setTimeout(() => {
          overlay.remove();
          if (onSuccessCallback) onSuccessCallback(res.user);
        }, 600);
      } else {
        showMsg(res.error);
      }
    };

    document.getElementById('btnSubmitRegister').onclick = async () => {
      const name = document.getElementById('inputRegUser').value;
      const pass = document.getElementById('inputRegPass').value;
      const btn = document.getElementById('btnSubmitRegister');
      btn.innerText = 'CRIANDO CONTA... ⏳';
      btn.disabled = true;

      const res = await this.register(name, pass);
      btn.innerText = 'CRIAR CONTA PROTEGIDA 🔒';
      btn.disabled = false;

      if (res.success) {
        showMsg('Conta criada e protegida com sucesso! Carregando...', false);
        setTimeout(() => {
          overlay.remove();
          if (onSuccessCallback) onSuccessCallback(res.user);
        }, 700);
      } else {
        showMsg(res.error);
      }
    };

    document.getElementById('btnSubmitLogin').onclick = async () => {
      const name = document.getElementById('inputLoginUser').value;
      const pass = document.getElementById('inputLoginPass').value;
      const btn = document.getElementById('btnSubmitLogin');
      btn.innerText = 'AUTENTICANDO... ⏳';
      btn.disabled = true;

      const res = await this.login(name, pass);
      btn.innerText = 'ENTRAR NA CONTA 🔑';
      btn.disabled = false;

      if (res.success) {
        showMsg(`Bem-vindo de volta, ${res.user.username}!`, false);
        setTimeout(() => {
          overlay.remove();
          if (onSuccessCallback) onSuccessCallback(res.user);
        }, 700);
      } else {
        showMsg(res.error);
      }
    };
  }

  // -------------------------------------------------------------
  // RENDERIZAÇÃO DO BADGE NO HEADER / NAVBAR (SEM APAGAR OS LINKS DO MENU)
  // -------------------------------------------------------------
  renderProfileBadge(containerSelector = '#profileBadgeContainer') {
    let target = null;
    if (typeof containerSelector === 'string') {
      target = document.querySelector(containerSelector);
    } else if (containerSelector instanceof HTMLElement) {
      target = containerSelector;
    }

    if (!target) {
      target = document.getElementById('profileBadgeContainer') || document.getElementById('authBadge');
    }

    // Se o elemento selecionado for a tag <nav>, NÃO substitui o <nav>!
    // Procura ou insere um contêiner filho <div id="profileBadgeContainer" class="nav-right-group">
    if (target && target.tagName === 'NAV') {
      let badgeHolder = target.querySelector('#profileBadgeContainer');
      if (!badgeHolder) {
        badgeHolder = document.createElement('div');
        badgeHolder.id = 'profileBadgeContainer';
        badgeHolder.className = 'nav-right-group';
        target.appendChild(badgeHolder);
      }
      target = badgeHolder;
    }

    // Configura o menu mobile hambúrguer se existir
    const toggleBtn = document.getElementById('navToggle') || document.getElementById('btnNavToggle');
    const navLinks = document.getElementById('navLinks') || document.getElementById('navLinksList');
    if (toggleBtn && navLinks && !toggleBtn.dataset.bound) {
      toggleBtn.dataset.bound = 'true';
      toggleBtn.innerHTML = '☰ Menu';
      toggleBtn.style.display = 'inline-flex';
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('open');
        toggleBtn.innerHTML = navLinks.classList.contains('open') ? '✕ Fechar' : '☰ Menu';
      };
      document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && e.target !== toggleBtn) {
          navLinks.classList.remove('open');
          toggleBtn.innerHTML = '☰ Menu';
        }
      });
    }

    if (!target) return;

    const user = this.getCurrentUser();
    const totalPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);

    if (user) {
      const safeUsername = escapeHTML(user.username);
      target.innerHTML = `
        <span title="Total acumulado: ${totalPicanhas} picanhas" style="font-size:12px; font-weight:700; color:#fff; display:inline-flex; align-items:center; white-space:nowrap;">
          👤 ${safeUsername} <b style="color:var(--verde-neon); margin-left:4px;">(${totalPicanhas} 🥩)</b>
        </span>
        <button id="btnLogoutProfile" style="
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25);
          color: #fff; border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer; font-weight:700;
        ">Trocar</button>
      `;
      document.getElementById('btnLogoutProfile').onclick = () => {
        this.logout();
        window.location.reload();
      };
    } else {
      target.innerHTML = `
        <button id="btnLoginProfile" style="
          background: rgba(255,223,0,0.18); border: 1.5px solid var(--amarelo-brasil);
          color: var(--amarelo-brasil); border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; font-weight: 800;
          box-shadow: 0 0 12px rgba(255,223,0,0.2); transition: all 0.2s; white-space:nowrap;
        ">🔑 Entrar / Mudar Nome</button>
      `;
      document.getElementById('btnLoginProfile').onclick = () => {
        this.mountAuthModal(() => this.renderProfileBadge(containerSelector));
      };
    }
  }
}

export const auth = new AuthManager();
