// js/firebase-config.js — Integração Firebase Firestore com Fallback LocalStorage

// Configuração do Firebase motoai-43ed4
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForFirestoreWebFallback-2026",
  authDomain: "motoai-43ed4.firebaseapp.com",
  projectId: "motoai-43ed4",
  storageBucket: "motoai-43ed4.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Salvar pontuação do jogador
export async function savePlayerScore(gameType, score) {
  const playerName = localStorage.getItem('lula_player') || 'Jogador_BR';
  const collectionName = gameType === 'runner' ? 'lula_runner_scores' : 'lula_scores';
  
  // Salva no LocalStorage primeiro
  const localKey = gameType === 'runner' ? 'run_best' : 'lula_best';
  const currentBest = parseInt(localStorage.getItem(localKey) || '0', 10);
  if (score > currentBest) {
    localStorage.setItem(localKey, score.toString());
  }

  // Tenta salvar no Firebase REST Firestore (sem necessitar do SDK pesado)
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collectionName}`;
    const payload = {
      fields: {
        player: { stringValue: playerName },
        score: { integerValue: score.toString() },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {
    // Silently continue
  }
}

// Obter melhores pontuações do ranking
export async function getTopScores(collectionName, limit = 15) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collectionName}?pageSize=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Firestore response error');
    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      const list = data.documents.map(doc => ({
        player: doc.fields?.player?.stringValue || 'Anônimo',
        score: parseInt(doc.fields?.score?.integerValue || '0', 10)
      }));
      list.sort((a, b) => b.score - a.score);
      return list;
    }
  } catch (e) {
    // Retorna vazio para o fallback local
  }
  return [];
}

// Enviar avaliação / feedback
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

// Obter avaliações
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
