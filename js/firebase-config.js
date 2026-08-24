// js/firebase-config.js — Integração Segura com Firestore, Anti-Cheat e Validações de Banco

export const firebaseConfig = {
  projectId: "motoai-43ed4",
  authDomain: "motoai-43ed4.firebaseapp.com",
  storageBucket: "motoai-43ed4.appspot.com"
};

// 1. GERENCIADOR DE CACHE EM MEMÓRIA COM TTL (TIME-TO-LIVE)
const LEADERBOARD_CACHE_TTL_MS = 90 * 1000; // 90 segundos de cache no cliente

const inMemoryLeaderboardCache = {
  flappy: { data: null, timestamp: 0 },
  runner: { data: null, timestamp: 0 }
};

let currentSessionTokens = {
  flappy: '',
  runner: ''
};

/**
 * Inicia uma sessão de partida segura obtendo um token assinado do servidor
 */
export async function startScoreSession(gameType = 'flappy') {
  const isRunner = gameType === 'runner' || (typeof gameType === 'string' && gameType.includes('runner'));
  const cleanGame = isRunner ? 'runner' : 'flappy';

  let playerName = 'Jogador';
  try {
    const rawUser = localStorage.getItem('lula_current_user_v2') || localStorage.getItem('lula_current_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u && u.username) playerName = u.username;
    }
  } catch (e) {}

  try {
    const res = await fetch('/api/start-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: cleanGame, player: playerName })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.sessionToken) {
        currentSessionTokens[cleanGame] = data.sessionToken;
        return data.sessionToken;
      }
    }
  } catch (e) {
    console.warn('⚠️ Falha ao obter sessionToken no início:', e.message);
  }
  return '';
}

// 2. SALVAR RECORDE MÁXIMO DO JOGADOR COM SINCRONIZAÇÃO RESILIENTE
export async function savePlayerScore(gameType, score) {
  let playerName = 'Jogador';
  let playerAvatar = '';
  try {
    const rawUser = localStorage.getItem('lula_current_user_v2') || localStorage.getItem('lula_current_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u && u.username) playerName = u.username;
      if (u && u.avatar) playerAvatar = u.avatar;
    }
  } catch (e) {}

  if (playerName === 'Jogador') {
    playerName = localStorage.getItem('lula_player') || 'Jogador';
  }

  // Sanitização e validação numérica
  playerName = (playerName || 'Jogador').trim().slice(0, 25);
  const numScore = parseInt(score, 10);

  // Anti-Cheat: Ignora valores inválidos, zerados ou negativos
  if (isNaN(numScore) || numScore <= 0 || numScore > 50000) {
    return { saved: false, reason: 'invalid_score' };
  }

  const isRunner = gameType === 'runner' || (typeof gameType === 'string' && gameType.includes('runner'));
  const gameKey = isRunner ? 'runner' : 'flappy';
  const localKey = isRunner ? 'run_best' : 'lula_best';
  const syncedKey = isRunner ? 'run_synced_best' : 'lula_synced_best';
  const currentBest = parseInt(localStorage.getItem(localKey) || '0', 10);

  const finalScoreToSend = Math.max(numScore, currentBest);

  // Atualiza o recorde localmente
  if (numScore > currentBest) {
    localStorage.setItem(localKey, numScore.toString());
  }

  // Garante que haja um session token válido
  let token = currentSessionTokens[gameKey];
  if (!token) {
    token = await startScoreSession(gameKey);
  }

  const detectedCountry = localStorage.getItem('lula_detected_country') || 'BR';

  // Atualização otimista imediata no cache em memória e localStorage
  const cacheKey = `lula_cache_scores_v2_${gameKey}`;
  const timestampKey = `lula_cache_scores_ts_${gameKey}`;
  try {
    let list = inMemoryLeaderboardCache[gameKey]?.data;
    if (!Array.isArray(list)) {
      const stored = localStorage.getItem(cacheKey);
      if (stored) list = JSON.parse(stored);
    }
    if (!Array.isArray(list)) list = [];

    const pKey = playerName.toLowerCase();
    const exIdx = list.findIndex(item => (item.player || '').toLowerCase() === pKey);
    if (exIdx !== -1) {
      if (numScore >= list[exIdx].score) {
        list[exIdx] = { player: playerName, score: numScore, avatar: playerAvatar || list[exIdx].avatar || '', country: detectedCountry, updatedAt: new Date().toISOString() };
      }
    } else {
      list.push({ player: playerName, score: numScore, avatar: playerAvatar || '', country: detectedCountry, updatedAt: new Date().toISOString() });
    }
    list.sort((a, b) => b.score - a.score);
    const updatedList = list.slice(0, 300);

    inMemoryLeaderboardCache[gameKey] = { data: updatedList, timestamp: Date.now() };
    localStorage.setItem(cacheKey, JSON.stringify(updatedList));
    localStorage.setItem(timestampKey, Date.now().toString());
  } catch (e) {}

  // 1. Salva via API Serverless Segura
  let savedOk = false;
  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player: playerName,
        score: finalScoreToSend,
        game: gameKey,
        avatar: playerAvatar,
        sessionToken: token,
        country: detectedCountry
      })
    });
    if (res.ok) {
      savedOk = true;
      localStorage.setItem(syncedKey, finalScoreToSend.toString());
      // Renova o token de sessão para a próxima partida
      currentSessionTokens[gameKey] = '';
      return { saved: true, ok: true };
    }
  } catch (e) {}

  // 2. Fallback direto ao Firestore (para localhost / fallback resiliente)
  if (!savedOk) {
    try {
      const collName = isRunner ? 'lula_runner_scores_v2' : 'lula_scores_v2';
      const docId = encodeURIComponent(playerName.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

      // Grava doc individual
      const userDocUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collName}/${docId}`;
      const userFields = {
        player: { stringValue: playerName },
        score: { integerValue: finalScoreToSend.toString() },
        updatedAt: { timestampValue: new Date().toISOString() }
      };
      if (playerAvatar) {
        userFields.avatar = { stringValue: playerAvatar };
      }

      await fetch(userDocUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: userFields })
      });

      // Atualiza documento consolidado
      const lbDocUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_leaderboards_v2/${gameKey}`;
      const lbRes = await fetch(lbDocUrl);
      let scoresArr = [];
      if (lbRes.ok) {
        const lbDoc = await lbRes.json();
        const rawVals = lbDoc.fields?.scores?.arrayValue?.values || [];
        scoresArr = rawVals.map(v => ({
          player: (v.mapValue?.fields?.player?.stringValue || 'Anônimo').replace(/<[^>]*>?/gm, '').trim(),
          score: parseInt(v.mapValue?.fields?.score?.integerValue || '0', 10),
          avatar: v.mapValue?.fields?.avatar?.stringValue || '',
          updatedAt: v.mapValue?.fields?.updatedAt?.timestampValue || ''
        })).filter(s => !isNaN(s.score) && s.score > 0);
      }

      const pKey = playerName.toLowerCase();
      const exIdx = scoresArr.findIndex(s => (s.player || '').toLowerCase() === pKey);
      if (exIdx !== -1) {
        if (numScore >= scoresArr[exIdx].score) {
          scoresArr[exIdx] = { player: playerName, score: numScore, avatar: playerAvatar || scoresArr[exIdx].avatar || '', updatedAt: new Date().toISOString() };
        }
      } else {
        scoresArr.push({ player: playerName, score: numScore, avatar: playerAvatar || '', updatedAt: new Date().toISOString() });
      }
      scoresArr.sort((a, b) => b.score - a.score);
      const top300 = scoresArr.slice(0, 300);

      await fetch(lbDocUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            game: { stringValue: gameKey },
            updatedAt: { timestampValue: new Date().toISOString() },
            scores: {
              arrayValue: {
                values: top300.map(s => {
                  const f = {
                    player: { stringValue: s.player },
                    score: { integerValue: s.score.toString() },
                    updatedAt: { timestampValue: s.updatedAt || new Date().toISOString() }
                  };
                  if (s.avatar) f.avatar = { stringValue: s.avatar };
                  return { mapValue: { fields: f } };
                })
              }
            }
          }
        })
      });

      localStorage.setItem(syncedKey, numScore.toString());
      return { saved: true, directFirestore: true };
    } catch (err) {
      console.warn('Erro no salvamento de recorde direto:', err);
    }
  }

  return { saved: true, cached: true };
}

// 3. OBTER PLACAR COM DOCUMENTO ÚNICO E CACHE LOCAL TTL (1 LEITURA POR CONSULTA EXPIRADA)
export async function getTopScores(gameTypeOrCollection = 'flappy', limit = 300, forceRefresh = false) {
  const isRunner = typeof gameTypeOrCollection === 'string' && gameTypeOrCollection.includes('runner');
  const game = isRunner ? 'runner' : 'flappy';
  const now = Date.now();
  const cacheKey = `lula_cache_scores_v2_${game}`;
  const timestampKey = `lula_cache_scores_ts_${game}`;

  // 1. Verificação instantânea do Cache em Memória (0 requisições, 0 leituras)
  if (!forceRefresh && inMemoryLeaderboardCache[game].data && (now - inMemoryLeaderboardCache[game].timestamp < LEADERBOARD_CACHE_TTL_MS)) {
    return inMemoryLeaderboardCache[game].data.slice(0, limit);
  }

  // 2. Verificação de Cache em LocalStorage
  if (!forceRefresh) {
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      const cachedTs = parseInt(localStorage.getItem(timestampKey) || '0', 10);
      if (cachedRaw && (now - cachedTs < LEADERBOARD_CACHE_TTL_MS)) {
        const cachedData = JSON.parse(cachedRaw);
        if (Array.isArray(cachedData) && cachedData.length > 0) {
          inMemoryLeaderboardCache[game] = { data: cachedData, timestamp: cachedTs };
          return cachedData.slice(0, limit);
        }
      }
    } catch (e) {}
  }

  const setCacheData = (data) => {
    inMemoryLeaderboardCache[game] = { data, timestamp: Date.now() };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch(e) {}
  };

  // 3. Consulta à API Serverless Otimizada (Que lê 1 único documento consolidado)
  try {
    const apiRes = await fetch(`/api/score?game=${game}&limit=${Math.max(limit, 300)}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success && Array.isArray(data.scores) && data.scores.length > 0) {
        setCacheData(data.scores);
        return data.scores.slice(0, limit);
      }
    }
  } catch (e) {}

  // 4. Fallback direto ao Firestore: Leitura de 1 ÚNICO documento consolidado (lula_leaderboards_v2/{game})
  try {
    const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_leaderboards_v2/${game}`;
    const res = await fetch(docUrl);
    if (res.ok) {
      const docData = await res.json();
      const rawValues = docData.fields?.scores?.arrayValue?.values || [];
      const scores = rawValues.map(v => ({
        player: (v.mapValue?.fields?.player?.stringValue || 'Anônimo').replace(/<[^>]*>?/gm, '').trim(),
        score: parseInt(v.mapValue?.fields?.score?.integerValue || '0', 10),
        avatar: v.mapValue?.fields?.avatar?.stringValue || '',
        country: v.mapValue?.fields?.country?.stringValue || 'BR',
        countryName: v.mapValue?.fields?.countryName?.stringValue || 'Brasil',
        flag: v.mapValue?.fields?.flag?.stringValue || '🇧🇷',
        updatedAt: v.mapValue?.fields?.updatedAt?.timestampValue || ''
      })).filter(s => !isNaN(s.score) && s.score > 0);

      scores.sort((a, b) => b.score - a.score);

      if (scores.length > 0) {
        setCacheData(scores);
        return scores.slice(0, limit);
      }
    }
  } catch (e) {}

  // 5. Fallback Resiliente: Retorna cache anterior mesmo que expirado se estiver offline
  if (inMemoryLeaderboardCache[game].data && inMemoryLeaderboardCache[game].data.length > 0) {
    return inMemoryLeaderboardCache[game].data.slice(0, limit);
  }

  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, limit);
    }
  } catch (e) {}

  return [];
}

// 3. ENVIAR AVALIAÇÃO / FEEDBACK SEGURO
export async function sendFeedback(feedbackData) {
  try {
    const apiRes = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    if (apiRes.ok) return { success: true };
  } catch (e) {}

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_feedbacks`;
    const payload = {
      fields: {
        name: { stringValue: (feedbackData.name || 'Anônimo').slice(0, 40) },
        stars: { integerValue: (feedbackData.stars || 5).toString() },
        comment: { stringValue: (feedbackData.comment || '').slice(0, 500) },
        country: { stringValue: (feedbackData.country || 'BR').slice(0, 5) },
        countryName: { stringValue: (feedbackData.countryName || 'Brasil').slice(0, 40) },
        flag: { stringValue: (feedbackData.flag || '🇧🇷').slice(0, 10) },
        createdAt: { timestampValue: feedbackData.createdAt || new Date().toISOString() }
      }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
  return { success: false, error: 'Offline fallback' };
}

// 4. OBTER AVALIAÇÕES COM CACHE RESILIENTE
export async function getFeedbacks(limit = 30) {
  const cacheKey = 'lula_cache_feedbacks';
  const getCached = () => {
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch(e) { return []; }
  };

  try {
    const apiRes = await fetch(`/api/feedback?limit=${limit}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success && Array.isArray(data.feedbacks) && data.feedbacks.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(data.feedbacks));
        return data.feedbacks;
      }
    }
  } catch (e) {}

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_feedbacks?pageSize=${limit}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.documents && data.documents.length > 0) {
        const list = data.documents.map(doc => ({
          name: doc.fields?.name?.stringValue || 'Anônimo',
          stars: parseInt(doc.fields?.stars?.integerValue || '5', 10),
          comment: doc.fields?.comment?.stringValue || '',
          country: doc.fields?.country?.stringValue || 'BR',
          countryName: doc.fields?.countryName?.stringValue || 'Brasil',
          flag: doc.fields?.flag?.stringValue || '🇧🇷',
          createdAt: doc.fields?.createdAt?.timestampValue || ''
        }));
        localStorage.setItem(cacheKey, JSON.stringify(list));
        return list;
      }
    }
  } catch (e) {}

  const cached = getCached();
  if (cached.length > 0) return cached.slice(0, limit);

  return [];
}

// 5. ENVIAR MENSAGEM DE CONTATO
export async function sendContactMessage(msgData) {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msgData)
    });
    if (res.ok) return { success: true };
  } catch (e) {}

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_contatos`;
    const payload = {
      fields: {
        name: { stringValue: (msgData.name || 'Anônimo').slice(0, 60) },
        email: { stringValue: (msgData.email || '').slice(0, 100) },
        subject: { stringValue: (msgData.subject || '').slice(0, 100) },
        message: { stringValue: (msgData.message || '').slice(0, 2000) },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
  return { success: false, error: 'Offline fallback' };
}
