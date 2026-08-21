// js/firebase-config.js — Integração Firebase Firestore com Recorde Único por Usuário (v2)

export const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForFirestoreWebFallback-2026",
  authDomain: "motoai-43ed4.firebaseapp.com",
  projectId: "motoai-43ed4",
  storageBucket: "motoai-43ed4.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// 1. SALVAR RECORDE MÁXIMO DO JOGADOR (1 ENTRADA ÚNICA POR USUÁRIO)
// Se a nova pontuação for maior que o recorde anterior, atualiza. Se for menor, NUNCA degrada nem sobrescreve!
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

  const collectionName = gameType === 'runner' ? 'lula_runner_scores_v2' : 'lula_scores_v2';
  
  // Salva no LocalStorage apenas se superar o recorde anterior
  const localKey = gameType === 'runner' ? 'run_best' : 'lula_best';
  const currentBest = parseInt(localStorage.getItem(localKey) || '0', 10);
  if (score > currentBest) {
    localStorage.setItem(localKey, score.toString());
  }

  // Identificador único do documento do jogador
  const docId = encodeURIComponent(playerName.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collectionName}/${docId}`;
    
    // 1. Consulta o recorde existente do jogador no Firestore
    const checkRes = await fetch(url);
    if (checkRes.ok) {
      const data = await checkRes.json();
      const existingScore = parseInt(data.fields?.score?.integerValue || '0', 10);
      // Se a pontuação obtida agora for menor ou igual ao recorde máximo já salvo, NÃO substitui!
      if (score <= existingScore) {
        return;
      }
    }

    // 2. Grava/Atualiza com o novo recorde máximo
    const payload = {
      fields: {
        player: { stringValue: playerName },
        score: { integerValue: Math.max(score, currentBest).toString() },
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

// 2. OBTER PLACAR ZERADO COM APENAS 1 RECORDE POR USUÁRIO
export async function getTopScores(collectionName, limit = 15) {
  try {
    const targetColl = collectionName.endsWith('_v2') ? collectionName : `${collectionName}_v2`;
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${targetColl}?pageSize=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Firestore response error');
    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      const userMap = new Map();
      data.documents.forEach(doc => {
        const player = doc.fields?.player?.stringValue || 'Anônimo';
        const score = parseInt(doc.fields?.score?.integerValue || '0', 10);
        if (!userMap.has(player) || score > userMap.get(player)) {
          userMap.set(player, score);
        }
      });

      const list = Array.from(userMap.entries()).map(([player, score]) => ({ player, score }));
      list.sort((a, b) => b.score - a.score);
      return list.slice(0, limit);
    }
  } catch (e) {}
  return [];
}

// 3. ENVIAR AVALIAÇÃO / FEEDBACK
export async function sendFeedback(feedbackData) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_feedbacks`;
    const payload = {
      fields: {
        name: { stringValue: feedbackData.name || 'Anônimo' },
        stars: { integerValue: (feedbackData.stars || 5).toString() },
        comment: { stringValue: feedbackData.comment || '' },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.name ? data.name.split('/').pop() : 'doc_id' };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
  return { success: false, error: 'Offline fallback' };
}

// 4. OBTER AVALIAÇÕES
export async function getFeedbacks(limit = 20) {
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
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_contatos`;
    const payload = {
      fields: {
        name: { stringValue: msgData.name || 'Anônimo' },
        email: { stringValue: msgData.email || '' },
        subject: { stringValue: msgData.subject || '' },
        message: { stringValue: msgData.message || '' },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.name ? data.name.split('/').pop() : 'doc_id' };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
  return { success: false, error: 'Offline fallback' };
}

// 6. OBTER MENSAGENS DE CONTATO
export async function getContactMessages(limit = 20) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_contatos?pageSize=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Firestore response error');
    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      return data.documents.map(doc => ({
        name: doc.fields?.name?.stringValue || 'Anônimo',
        email: doc.fields?.email?.stringValue || '',
        subject: doc.fields?.subject?.stringValue || '',
        message: doc.fields?.message?.stringValue || '',
        createdAt: doc.fields?.createdAt?.timestampValue || ''
      }));
    }
  } catch (e) {}
  return [];
}
