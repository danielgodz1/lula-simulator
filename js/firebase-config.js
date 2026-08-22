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

// 2. SALVAR RECORDE MÁXIMO DO JOGADOR COM PRÉ-VERIFICAÇÃO DE HIGHSCORE (0 ESCRITAS SE NÃO BATER RECORDE)
export async function savePlayerScore(gameType, score) {
  let playerName = 'Jogador';
  try {
    const rawUser = localStorage.getItem('lula_current_user_v2') || localStorage.getItem('lula_current_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u && u.username) playerName = u.username;
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
  const currentBest = parseInt(localStorage.getItem(localKey) || '0', 10);

  // OTIMIZAÇÃO CRÍTICA DE GRAVAÇÕES:
  // Se o score atual não superou o HighScore pessoal salvo, NÃO dispara requisição de gravação no Firestore!
  if (numScore <= currentBest) {
    return { saved: false, reason: 'score_not_improved' };
  }

  // Atualiza o recorde localmente
  localStorage.setItem(localKey, numScore.toString());

  // Atualização otimista no cache em memória do cliente
  try {
    if (inMemoryLeaderboardCache[gameKey] && Array.isArray(inMemoryLeaderboardCache[gameKey].data)) {
      const list = [...inMemoryLeaderboardCache[gameKey].data];
      const pKey = playerName.toLowerCase();
      const exIdx = list.findIndex(item => (item.player || '').toLowerCase() === pKey);
      if (exIdx !== -1) {
        if (numScore > list[exIdx].score) {
          list[exIdx] = { ...list[exIdx], score: numScore, updatedAt: new Date().toISOString() };
        }
      } else if (list.length < 50 || numScore > (list[list.length - 1]?.score || 0)) {
        list.push({ player: playerName, score: numScore, updatedAt: new Date().toISOString() });
      }
      list.sort((a, b) => b.score - a.score);
      inMemoryLeaderboardCache[gameKey].data = list.slice(0, 50);
    }
  } catch (e) {}

  // Envia apenas quando realmente houver novo recorde pessoal
  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: playerName, score: numScore, game: gameKey })
    });
    return { saved: true, ok: res.ok };
  } catch (e) {
    return { saved: true, offline: true };
  }
}

// 3. OBTER PLACAR COM DOCUMENTO ÚNICO E CACHE LOCAL TTL (1 LEITURA POR CONSULTA EXPIRADA)
export async function getTopScores(gameTypeOrCollection = 'flappy', limit = 50, forceRefresh = false) {
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
    const apiRes = await fetch(`/api/score?game=${game}&limit=${Math.max(limit, 50)}`);
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

// 4. OBTER AVALIAÇÕES COM CACHE RESILIENTE
export async function getFeedbacks(limit = 20) {
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
