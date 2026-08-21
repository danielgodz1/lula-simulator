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

  // 1. Tenta enviar pela API Serverless protegida (Vercel)
  try {
    const apiRes = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: playerName, score: numScore, game: gameType })
    });
    if (apiRes.ok) return;
  } catch (e) {}

  // 2. Fallback direto ao Firestore com documento único por jogador
  const collectionName = gameType === 'runner' ? 'lula_runner_scores_v2' : 'lula_scores_v2';
  const docId = encodeURIComponent(playerName.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collectionName}/${docId}`;
    
    // Consulta o recorde existente
    const checkRes = await fetch(url);
    if (checkRes.ok) {
      const data = await checkRes.json();
      const existingScore = parseInt(data.fields?.score?.integerValue || '0', 10);
      if (numScore <= existingScore) return;
    }

    const payload = {
      fields: {
        player: { stringValue: playerName },
        score: { integerValue: numScore.toString() },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
    };

    fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {}
}

// 2. OBTER PLACAR COM TODOS OS JOGADORES QUE TÊM PONTOS NO SISTEMA
export async function getTopScores(collectionName, limit = 300) {
  const isRunner = collectionName.includes('runner');
  const game = isRunner ? 'runner' : 'flappy';

  // 1. Tenta API Serverless
  try {
    const apiRes = await fetch(`/api/score?game=${game}&limit=${limit}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success && Array.isArray(data.scores) && data.scores.length > 0) {
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

    // Consulta também a coleção de usuários
    try {
      const usersUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2?pageSize=300`;
      const uRes = await fetch(usersUrl);
      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.documents && uData.documents.length > 0) {
          uData.documents.forEach(doc => {
            const rawPlayer = doc.fields?.username?.stringValue || doc.name.split('/').pop() || 'Jogador';
            const player = rawPlayer.replace(/<[^>]*>?/gm, '').trim();
            const score = parseInt(doc.fields?.[userScoreField]?.integerValue || '0', 10);
            if (score > 0 && score <= 50000) {
              const key = player.toLowerCase();
              if (!userMap.has(key) || score > userMap.get(key).score) {
                userMap.set(key, { player, score });
              }
            }
          });
        }
      }
    } catch (e) {}

    const list = Array.from(userMap.values());
    list.sort((a, b) => b.score - a.score);
    return list.slice(0, limit);
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

// 4. OBTER AVALIAÇÕES
export async function getFeedbacks(limit = 20) {
  try {
    const apiRes = await fetch(`/api/feedback?limit=${limit}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success && Array.isArray(data.feedbacks) && data.feedbacks.length > 0) {
        return data.feedbacks;
      }
    }
  } catch (e) {}

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_feedbacks?pageSize=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Firestore response error');
    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      return data.documents.map(doc => ({
        name: doc.fields?.name?.stringValue || 'Anônimo',
        stars: parseInt(doc.fields?.stars?.integerValue || '5', 10),
        comment: doc.fields?.comment?.stringValue || '',
        createdAt: doc.fields?.createdAt?.timestampValue || ''
      }));
    }
  } catch (e) {}
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
