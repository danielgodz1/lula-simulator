// js/firebase-config.js — Integração Segura com Firestore, Anti-Cheat e Validações de Banco

export const firebaseConfig = {
  projectId: "motoai-43ed4",
  authDomain: "motoai-43ed4.firebaseapp.com",
  storageBucket: "motoai-43ed4.appspot.com"
};

// 1. SALVAR RECORDE MÁXIMO DO JOGADOR COM VALIDAÇÃO ANTI-CHEAT
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

  // Sanitização
  playerName = (playerName || 'Jogador').trim().slice(0, 25);
  const numScore = parseInt(score, 10);

  // Anti-Cheat: Ignora valores inválidos ou negativos
  if (isNaN(numScore) || numScore <= 0 || numScore > 50000) {
    return;
  }

  const localKey = gameType === 'runner' ? 'run_best' : 'lula_best';
  const currentBest = parseInt(localStorage.getItem(localKey) || '0', 10);
  if (numScore > currentBest) {
    localStorage.setItem(localKey, numScore.toString());
  }

  // Envio obrigatório pela API Serverless protegida (Vercel) com validação e sanitização
  try {
    await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: playerName, score: numScore, game: gameType })
    });
  } catch (e) {}
}

// 2. OBTER PLACAR COM TODOS OS JOGADORES QUE TÊM PONTOS NO SISTEMA
export async function getTopScores(collectionName, limit = 300) {
  const isRunner = collectionName.includes('runner');
  const game = isRunner ? 'runner' : 'flappy';
  const cacheKey = `lula_cache_scores_${game}`;

  const getCached = () => {
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch(e) { return []; }
  };

  // 1. Tenta API Serverless
  try {
    const apiRes = await fetch(`/api/score?game=${game}&limit=${limit}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success && Array.isArray(data.scores) && data.scores.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(data.scores));
        return data.scores;
      }
    }
  } catch (e) {}

  // 2. Fallback direto ao Firestore com agregação completa
  try {
    const targetColl = collectionName.endsWith('_v2') ? collectionName : `${collectionName}_v2`;
    const userScoreField = isRunner ? 'runnerScore' : 'flappyScore';
    const userMap = new Map();

    // Consulta a coleção de placares
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${targetColl}?pageSize=300`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.documents && data.documents.length > 0) {
        data.documents.forEach(doc => {
          const rawPlayer = doc.fields?.player?.stringValue || doc.name.split('/').pop() || 'Anônimo';
          const player = rawPlayer.replace(/<[^>]*>?/gm, '').trim();
          const score = parseInt(doc.fields?.score?.integerValue || '0', 10);
          if (score > 0 && score <= 50000) {
            const key = player.toLowerCase();
            if (!userMap.has(key) || score > userMap.get(key).score) {
              userMap.set(key, { player, score });
            }
          }
        });
      }
    }

    if (userMap.size > 0) {
      const list = Array.from(userMap.values());
      list.sort((a, b) => b.score - a.score);
      const resList = list.slice(0, limit);
      localStorage.setItem(cacheKey, JSON.stringify(resList));
      return resList;
    }
  } catch (e) {}

  // 3. Fallback de Cache Resiliente
  const cached = getCached();
  if (cached.length > 0) return cached.slice(0, limit);

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
