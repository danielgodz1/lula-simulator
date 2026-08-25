// api/social.js — Gerenciamento Unificado de Recursos Sociais, Amizades, Duelos, Torneio, Notificações e Feed
import admin, { db, hasAdminCredentials } from './_firebaseAdmin.js';
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const endpoint = req.query?.endpoint || req.body?.endpoint || '';
  const action = req.body?.action || req.query?.action || '';

  const sanitizeName = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').replace(/[^a-zA-Z0-9_\- .À-ÿ]/g, '').trim().slice(0, 30);
  };

  const getFriendshipDocId = (u1, u2) => {
    const sorted = [u1.toLowerCase(), u2.toLowerCase()].sort();
    return `${sorted[0]}__${sorted[1]}`;
  };

  const getWeekId = () => {
    const d = new Date();
    const dUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dUTC.getUTCDay() || 7;
    dUTC.setUTCDate(dUTC.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dUTC.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((dUTC - yearStart) / 86400000) + 1) / 7);
    return `${dUTC.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // SUB-ENDPOINT: FEED DE ATIVIDADES PÚBLICO (/api/activity)
  // =========================================================================
  if (endpoint === 'activity' || action === 'activity') {
    if (req.method === 'GET') {
      try {
        const snap = await db.collection('lula_activity_feed')
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();

        const activities = [];
        snap.forEach(doc => {
          const d = doc.data();
          activities.push({
            id: doc.id,
            username: d.username || 'Piloto Anônimo',
            avatar: d.avatar || '',
            eventType: d.eventType || 'record',
            title: d.title || 'Novo Marco!',
            desc: d.desc || '',
            value: d.value || 0,
            createdAt: d.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
          });
        });

        if (activities.length === 0) {
          activities.push(
            {
              id: 'init_1',
              username: 'Piloto Federal',
              avatar: 'img/lula.png',
              eventType: 'record',
              title: 'Recorde Inaugural! 🥩',
              desc: 'Atingiu a incrível marca de 100 picanhas distribuídas pelo Brasil!',
              value: 100,
              createdAt: new Date().toISOString()
            },
            {
              id: 'init_2',
              username: 'Mestre dos Canos',
              avatar: 'img/moraes.png',
              eventType: 'duel_win',
              title: 'Vitória Suprema em Duelo! ⚖️',
              desc: 'Venceu um duelo acirrado e atingiu uma sequência de vitórias épica!',
              value: 3,
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          );
        }

        res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=45');
        return res.status(200).json({ success: true, activities });
      } catch (err) {
        console.error('❌ Erro no feed:', err);
        return res.status(500).json({ success: false, error: 'Falha ao obter feed.' });
      }
    }

    if (req.method === 'POST') {
      try {
        const { username, avatar = '', eventType = 'record', title, desc, value = 0 } = req.body || {};
        if (!username || !title) return res.status(400).json({ success: false, error: 'Incompleto' });

        const docRef = await db.collection('lula_activity_feed').add({
          username: username.slice(0, 30),
          avatar: (avatar || '').slice(0, 500),
          eventType,
          title: title.slice(0, 80),
          desc: (desc || '').slice(0, 200),
          value: parseInt(value || 0, 10),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({ success: true, id: docRef.id });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }
  }

  // =========================================================================
  // SUB-ENDPOINT: NOTIFICAÇÕES IN-APP (/api/notifications)
  // =========================================================================
  if (endpoint === 'notifications' || action === 'notifications') {
    if (req.method === 'GET') {
      const rawUser = req.query?.username || '';
      const cleanUser = sanitizeName(rawUser);
      if (!cleanUser) return res.status(400).json({ success: false, error: 'Usuário não especificado.' });
      const normUser = cleanUser.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      try {
        const snap = await db.collection('lula_notifications')
          .where('userId', '==', normUser)
          .limit(40)
          .get();

        const notifications = [];
        let unreadCount = 0;
        snap.forEach(doc => {
          const d = doc.data();
          const isRead = Boolean(d.read);
          if (!isRead) unreadCount++;
          notifications.push({
            id: doc.id,
            type: d.type || 'info',
            title: d.title || 'Notificação',
            message: d.message || '',
            fromUser: d.fromUser || '',
            read: isRead,
            link: d.link || 'social.html',
            createdAt: d.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
          });
        });

        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({ success: true, unreadCount, notifications: notifications.slice(0, 20) });
      } catch (err) {
        console.error('Erro ao buscar notificações:', err);
        return res.status(500).json({ success: false, error: 'Erro ao buscar notificações.' });
      }
    }

    if (req.method === 'POST') {
      const { action: notifAction = 'mark_all_read', username, notifId } = req.body || {};
      const cleanUser = sanitizeName(username);
      if (!cleanUser) return res.status(400).json({ success: false, error: 'Usuário não especificado.' });
      const normUser = cleanUser.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      try {
        if (notifAction === 'mark_read' && notifId) {
          const docRef = db.collection('lula_notifications').doc(notifId);
          const snap = await docRef.get();
          if (snap.exists && snap.data().userId === normUser) {
            await docRef.update({ read: true });
          }
          return res.status(200).json({ success: true });
        }

        if (notifAction === 'mark_all_read') {
          const unreadSnap = await db.collection('lula_notifications')
            .where('userId', '==', normUser)
            .where('read', '==', false)
            .limit(30)
            .get();

          const batch = db.batch();
          unreadSnap.forEach(doc => batch.update(doc.ref, { read: true }));
          await batch.commit();

          return res.status(200).json({ success: true, count: unreadSnap.size });
        }
      } catch (err) {
        return res.status(500).json({ success: false, error: 'Erro ao marcar lidas.' });
      }
    }
  }

  // =========================================================================
  // SUB-ENDPOINT: TORNEIO SEMANAL (/api/tournaments)
  // =========================================================================
  if (endpoint === 'tournaments' || action === 'tournaments') {
    const weekId = getWeekId();
    const tourneyRef = db.collection('lula_tournaments').doc(`tournament_${weekId}`);

    try {
      const snap = await tourneyRef.get();
      if (snap.exists) {
        return res.status(200).json({ success: true, tournament: snap.data() });
      }

      const lbRef = db.collection('lula_leaderboards_v2').doc('flappy_weekly');
      const lbSnap = await lbRef.get();
      let topPlayers = [];
      if (lbSnap.exists && Array.isArray(lbSnap.data().scores)) {
        topPlayers = lbSnap.data().scores.slice(0, 8);
      }

      const defaultRoster = [
        { player: 'Lula 13', score: 250, avatar: 'img/lula.png', flag: '🇧🇷' },
        { player: 'Capitão 22', score: 210, avatar: 'img/bolsonaro.png', flag: '🇧🇷' },
        { player: 'Xandão Supremo', score: 195, avatar: 'img/moraes.png', flag: '🇧🇷' },
        { player: 'Mindset 3X', score: 180, avatar: 'img/marcal.png', flag: '🇧🇷' },
        { player: 'Estocadora Galáctica', score: 160, avatar: 'img/dilma.png', flag: '🇧🇷' },
        { player: 'Deputado Viral', score: 140, avatar: 'img/nikolas.png', flag: '🇧🇷' },
        { player: 'Janja VIP', score: 120, avatar: 'img/janja.png', flag: '🇧🇷' },
        { player: 'Piloto Federal', score: 95, avatar: 'img/favela.png', flag: '🇧🇷' }
      ];

      const filledTop8 = [];
      for (let i = 0; i < 8; i++) {
        if (topPlayers[i]) {
          filledTop8.push({
            seed: i + 1,
            player: topPlayers[i].player || `Jogador #${i + 1}`,
            score: topPlayers[i].score || 0,
            avatar: topPlayers[i].avatar || '',
            country: topPlayers[i].country || 'BR'
          });
        } else {
          filledTop8.push({ seed: i + 1, ...defaultRoster[i] });
        }
      }

      const quarters = [
        { id: 'q1', p1: filledTop8[0], p2: filledTop8[7], winner: filledTop8[0].score >= filledTop8[7].score ? filledTop8[0] : filledTop8[7] },
        { id: 'q2', p1: filledTop8[3], p2: filledTop8[4], winner: filledTop8[3].score >= filledTop8[4].score ? filledTop8[3] : filledTop8[4] },
        { id: 'q3', p1: filledTop8[1], p2: filledTop8[6], winner: filledTop8[1].score >= filledTop8[6].score ? filledTop8[1] : filledTop8[6] },
        { id: 'q4', p1: filledTop8[2], p2: filledTop8[5], winner: filledTop8[2].score >= filledTop8[5].score ? filledTop8[2] : filledTop8[5] }
      ];

      const semis = [
        { id: 's1', p1: quarters[0].winner, p2: quarters[1].winner, winner: quarters[0].winner.score >= quarters[1].winner.score ? quarters[0].winner : quarters[1].winner },
        { id: 's2', p1: quarters[2].winner, p2: quarters[3].winner, winner: quarters[2].winner.score >= quarters[3].winner.score ? quarters[2].winner : quarters[3].winner }
      ];

      const finalMatch = {
        id: 'final',
        p1: semis[0].winner,
        p2: semis[1].winner,
        champion: semis[0].winner.score >= semis[1].winner.score ? semis[0].winner : semis[1].winner
      };

      const tournamentData = {
        weekId,
        name: `Copa Brasília · Semana ${weekId.replace('2026-W', '#')}`,
        status: 'active',
        participants: filledTop8,
        quarters,
        semis,
        final: finalMatch,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await tourneyRef.set(tournamentData);
      return res.status(200).json({ success: true, tournament: tournamentData });
    } catch (err) {
      console.error('❌ Erro no torneio:', err);
      return res.status(500).json({ success: false, error: 'Falha no torneio.' });
    }
  }

  // =========================================================================
  // SUB-ENDPOINT: TELEMETRIA DE MORTES (/api/telemetry)
  // =========================================================================
  if (endpoint === 'telemetry' || action === 'telemetry') {
    try {
      const { username = 'Anônimo', score = 0, speedMult = 1.0, characterId = 'lula', playTime = 0 } = req.body || {};
      await db.collection('lula_debug_deaths').add({
        username: (username || '').slice(0, 30),
        score: Math.max(0, parseInt(score || 0, 10)),
        speedMult: parseFloat(speedMult || 1.0),
        characterId: (characterId || 'lula').slice(0, 20),
        playTime: parseFloat(playTime || 0),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(200).json({ success: false, error: 'Ignorado' });
    }
  }

  // =========================================================================
  // SUB-ENDPOINT: AMIGOS, DUELOS E INVICTOS
  // =========================================================================
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  const { username, targetUser, duelId, game = 'flappy', score = 0 } = req.body || {};
  const cleanUser = sanitizeName(username);
  const cleanTarget = sanitizeName(targetUser);

  if (!cleanUser) {
    return res.status(400).json({ success: false, error: 'Usuário não informado.' });
  }

  const normUser = cleanUser.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const normTarget = cleanTarget ? cleanTarget.toLowerCase().replace(/[^a-z0-9_]/g, '_') : '';

  try {
    // 1. BUSCA DE JOGADORES
    if (action === 'search_users') {
      const queryStr = (req.body?.query || '').trim().toLowerCase();
      if (!queryStr || queryStr.length < 2) {
        return res.status(200).json({ success: true, users: [] });
      }

      const snap = await db.collection('lula_users_v2')
        .where('username', '>=', queryStr)
        .where('username', '<=', queryStr + '\uf8ff')
        .limit(15)
        .get();

      const users = [];
      snap.forEach(doc => {
        const data = doc.data();
        const uName = data.username || doc.id;
        // Nunca exibe o próprio usuário que está buscando
        if (doc.id !== normUser && uName.toLowerCase() !== cleanUser.toLowerCase()) {
          users.push({
            id: doc.id,
            username: uName,
            avatar: data.avatar || '',
            flappyScore: data.flappyScore || 0,
            runnerScore: data.runnerScore || 0,
            winStreak: data.winStreak || 0,
            bestWinStreak: data.bestWinStreak || 0,
            prestigeLevel: data.prestigeLevel || 0
          });
        }
      });

      return res.status(200).json({ success: true, users });
    }

    // 2. ENVIAR PEDIDO DE AMIZADE
    if (action === 'send_friend_request') {
      if (!cleanTarget || normUser === normTarget || cleanUser.toLowerCase() === cleanTarget.toLowerCase()) {
        return res.status(400).json({ success: false, error: 'Você não pode adicionar a si mesmo como amigo.' });
      }

      const docId = getFriendshipDocId(normUser, normTarget);
      const friendRef = db.collection('lula_friendships').doc(docId);
      const existing = await friendRef.get();

      if (existing.exists) {
        const data = existing.data();
        if (data.status === 'accepted') {
          return res.status(400).json({ success: false, error: `Você e ${cleanTarget} já são amigos conectados!` });
        }
        if (data.status === 'pending') {
          const isSender = data.requester === normUser || (data.requesterName && data.requesterName.toLowerCase() === cleanUser.toLowerCase());
          if (isSender) {
            return res.status(400).json({ success: false, error: `Você já enviou um pedido para ${cleanTarget}. Aguarde a confirmação.` });
          } else {
            // O outro jogador já tinha enviado pedido para o usuário atual: aceita automaticamente!
            await friendRef.update({
              status: 'accepted',
              acceptedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await db.collection('lula_notifications').add({
              userId: normTarget,
              type: 'friend_accepted',
              title: 'Amizade Aceita! 🎉',
              message: `${cleanUser} aceitou seu pedido de amizade!`,
              fromUser: cleanUser,
              read: false,
              link: 'social.html',
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return res.status(200).json({ success: true, message: `${cleanTarget} já havia enviado um pedido para você! Vocês agora são amigos!` });
          }
        }
      }

      const isFirst = normUser < normTarget;
      await friendRef.set({
        userId1: isFirst ? normUser : normTarget,
        userId2: isFirst ? normTarget : normUser,
        user1Name: isFirst ? cleanUser : cleanTarget,
        user2Name: isFirst ? cleanTarget : cleanUser,
        requester: normUser,
        requesterName: cleanUser,
        target: normTarget,
        targetName: cleanTarget,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Cria notificação para o destinatário
      await db.collection('lula_notifications').add({
        userId: normTarget,
        type: 'friend_request',
        title: 'Novo Pedido de Amizade! 🤝',
        message: `${cleanUser} enviou um pedido de amizade para você!`,
        fromUser: cleanUser,
        read: false,
        link: 'social.html',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ success: true, message: `Pedido de amizade enviado para ${cleanTarget} com sucesso!` });
    }

    // 3. ACEITAR PEDIDO DE AMIZADE
    if (action === 'accept_friend_request') {
      if (!cleanTarget) return res.status(400).json({ success: false, error: 'Usuário não especificado.' });
      const docId1 = getFriendshipDocId(normUser, normTarget);
      const docId2 = getFriendshipDocId(normTarget, normUser);
      let friendRef = db.collection('lula_friendships').doc(docId1);
      let existing = await friendRef.get();

      if (!existing.exists) {
        friendRef = db.collection('lula_friendships').doc(docId2);
        existing = await friendRef.get();
      }

      if (!existing.exists) {
        const qSnap = await db.collection('lula_friendships')
          .where('requester', '==', normTarget)
          .where('target', '==', normUser)
          .limit(1)
          .get();
        if (!qSnap.empty) {
          friendRef = qSnap.docs[0].ref;
          existing = qSnap.docs[0];
        }
      }

      if (!existing.exists) return res.status(404).json({ success: false, error: 'Pedido não encontrado.' });

      await friendRef.update({
        status: 'accepted',
        acceptedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const data = existing.data() || {};
      await db.collection('lula_notifications').add({
        userId: data.requester || normTarget,
        type: 'friend_accepted',
        title: 'Amizade Aceita! 🎉',
        message: `${cleanUser} aceitou seu pedido de amizade!`,
        fromUser: cleanUser,
        read: false,
        link: 'social.html',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({ success: true, message: `Amizade com ${cleanTarget} confirmada!` });
    }

    // 4. RECUSAR / CANCELAR AMIZADE
    if (action === 'reject_friend_request' || action === 'remove_friend') {
      if (!cleanTarget) return res.status(400).json({ success: false, error: 'Usuário não especificado.' });
      const docId1 = getFriendshipDocId(normUser, normTarget);
      const docId2 = getFriendshipDocId(normTarget, normUser);
      await db.collection('lula_friendships').doc(docId1).delete();
      await db.collection('lula_friendships').doc(docId2).delete();

      try {
        const qSnap = await db.collection('lula_friendships')
          .where('userId1', 'in', [normUser, normTarget])
          .get();
        const batch = db.batch();
        qSnap.forEach(d => {
          const data = d.data() || {};
          if ((data.userId1 === normUser && data.userId2 === normTarget) ||
              (data.userId1 === normTarget && data.userId2 === normUser) ||
              (data.requester === normUser && data.target === normTarget) ||
              (data.requester === normTarget && data.target === normUser)) {
            batch.delete(d.ref);
          }
        });
        await batch.commit();
      } catch(e) {}

      return res.status(200).json({ success: true, message: 'Solicitação cancelada/removida.' });
    }

    // 5. LISTAR AMIGOS E PEDIDOS (COM PREVENÇÃO TOTAL DE AUTO-AMIZADE)
    if (action === 'get_friends' || action === 'list_friends') {
      if (!hasAdminCredentials || !db) {
        return res.status(200).json({
          success: true,
          friends: [],
          pendingReceived: [],
          pendingIncoming: [],
          pendingSent: [],
          pendingOutgoing: []
        });
      }

      const snap1 = await db.collection('lula_friendships').where('userId1', '==', normUser).get();
      const snap2 = await db.collection('lula_friendships').where('userId2', '==', normUser).get();
      const snap3 = await db.collection('lula_friendships').where('requester', '==', normUser).get();
      const snap4 = await db.collection('lula_friendships').where('target', '==', normUser).get();

      // Compatibilidade retroativa com buscas por cleanUser
      const snap5 = await db.collection('lula_friendships').where('requester', '==', cleanUser).get();
      const snap6 = await db.collection('lula_friendships').where('target', '==', cleanUser).get();
      const snap7 = await db.collection('lula_friendships').where('userId1', '==', cleanUser).get();
      const snap8 = await db.collection('lula_friendships').where('userId2', '==', cleanUser).get();

      const acceptedFriends = [];
      const pendingReceived = [];
      const pendingSent = [];
      const processedDocIds = new Set();
      const seenFriendUsers = new Set();

      const processDoc = (doc) => {
        if (processedDocIds.has(doc.id)) return;
        processedDocIds.add(doc.id);

        const d = doc.data() || {};

        // Identifica de forma segura quem é o outro participante
        const isUser1 = (d.userId1 === normUser || d.userId1 === cleanUser || (d.user1Name && d.user1Name.toLowerCase() === cleanUser.toLowerCase()));
        const isUser2 = (d.userId2 === normUser || d.userId2 === cleanUser || (d.user2Name && d.user2Name.toLowerCase() === cleanUser.toLowerCase()));
        const isRequester = (d.requester === normUser || d.requester === cleanUser || (d.requesterName && d.requesterName.toLowerCase() === cleanUser.toLowerCase()));
        const isTarget = (d.target === normUser || d.target === cleanUser || (d.targetName && d.targetName.toLowerCase() === cleanUser.toLowerCase()));

        let otherUsername = '';
        let otherNorm = '';

        if (isRequester) {
          otherUsername = d.targetName || d.user2Name || d.target || d.userId2 || '';
          otherNorm = (d.target || d.userId2 || otherUsername).toLowerCase().replace(/[^a-z0-9_]/g, '_');
        } else if (isTarget) {
          otherUsername = d.requesterName || d.user1Name || d.requester || d.userId1 || '';
          otherNorm = (d.requester || d.userId1 || otherUsername).toLowerCase().replace(/[^a-z0-9_]/g, '_');
        } else if (isUser1) {
          otherUsername = d.user2Name || d.targetName || d.userId2 || d.target || '';
          otherNorm = (d.userId2 || d.target || otherUsername).toLowerCase().replace(/[^a-z0-9_]/g, '_');
        } else if (isUser2) {
          otherUsername = d.user1Name || d.requesterName || d.userId1 || d.requester || '';
          otherNorm = (d.userId1 || d.requester || otherUsername).toLowerCase().replace(/[^a-z0-9_]/g, '_');
        }

        // Auto-correção caso o nome obtido seja igual ao do próprio usuário solicitante
        if (!otherUsername || otherUsername.toLowerCase() === cleanUser.toLowerCase() || otherNorm === normUser) {
          if (d.user1Name && d.user1Name.toLowerCase() !== cleanUser.toLowerCase()) {
            otherUsername = d.user1Name;
            otherNorm = (d.userId1 || d.user1Name).toLowerCase().replace(/[^a-z0-9_]/g, '_');
          } else if (d.user2Name && d.user2Name.toLowerCase() !== cleanUser.toLowerCase()) {
            otherUsername = d.user2Name;
            otherNorm = (d.userId2 || d.user2Name).toLowerCase().replace(/[^a-z0-9_]/g, '_');
          } else if (d.requesterName && d.requesterName.toLowerCase() !== cleanUser.toLowerCase()) {
            otherUsername = d.requesterName;
            otherNorm = (d.requester || d.requesterName).toLowerCase().replace(/[^a-z0-9_]/g, '_');
          } else if (d.targetName && d.targetName.toLowerCase() !== cleanUser.toLowerCase()) {
            otherUsername = d.targetName;
            otherNorm = (d.target || d.targetName).toLowerCase().replace(/[^a-z0-9_]/g, '_');
          }
        }

        // Se ainda for o próprio usuário, descarta (nunca adiciona a si mesmo)
        if (!otherUsername || otherUsername.toLowerCase() === cleanUser.toLowerCase() || otherNorm === normUser) {
          return;
        }

        const createdAtStr = d.createdAt?.toDate?.()?.toISOString?.() || (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString());

        if (d.status === 'accepted') {
          if (!seenFriendUsers.has(otherNorm)) {
            seenFriendUsers.add(otherNorm);
            acceptedFriends.push({
              id: doc.id,
              username: otherUsername,
              normUser: otherNorm,
              createdAt: createdAtStr
            });
          }
        } else if (d.status === 'pending') {
          if (isTarget) {
            pendingReceived.push({
              id: doc.id,
              username: otherUsername,
              normUser: otherNorm,
              createdAt: createdAtStr
            });
          } else if (isRequester) {
            pendingSent.push({
              id: doc.id,
              username: otherUsername,
              normUser: otherNorm,
              createdAt: createdAtStr
            });
          }
        }
      };

      [snap1, snap2, snap3, snap4, snap5, snap6, snap7, snap8].forEach(snap => {
        if (snap && snap.docs) snap.docs.forEach(processDoc);
      });

      return res.status(200).json({
        success: true,
        friends: acceptedFriends,
        pendingReceived,
        pendingIncoming: pendingReceived,
        pendingSent,
        pendingOutgoing: pendingSent
      });
    }

    // 6. CRIAR DUELO ASSÍNCRONO
    if (action === 'create_duel') {
      if (!cleanTarget || normUser === normTarget || cleanUser.toLowerCase() === cleanTarget.toLowerCase()) {
        return res.status(400).json({ success: false, error: 'Você não pode desafiar a si mesmo para um duelo!' });
      }

      const challengerSnap = await db.collection('lula_users_v2').doc(normUser).get();
      const defenderSnap = await db.collection('lula_users_v2').doc(normTarget).get();

      if (!defenderSnap.exists) {
        return res.status(404).json({ success: false, error: `Adversário "${cleanTarget}" não encontrado.` });
      }

      const chData = challengerSnap.exists ? challengerSnap.data() : {};
      const defData = defenderSnap.data();

      const targetGame = game === 'runner' ? 'runner' : 'flappy';
      const challengerScore = targetGame === 'runner' ? (chData.runnerScore || 0) : (chData.flappyScore || 0);

      const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);

      const duelRef = await db.collection('lula_duels').add({
        challengerId: normUser,
        challengerName: cleanUser,
        challengerAvatar: chData.avatar || '',
        challengerScore,
        defenderId: normTarget,
        defenderName: cleanTarget,
        defenderAvatar: defData.avatar || '',
        defenderScore: null,
        game: targetGame,
        status: 'pending',
        winnerId: null,
        winnerName: null,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.collection('lula_notifications').add({
        userId: normTarget,
        type: 'duel_challenge',
        title: 'Desafio de Duelo! ⚔️',
        message: `${cleanUser} desafiou você no ${targetGame === 'runner' ? 'Empresário 3D' : 'Flappy Lula'} com ${challengerScore} pts!`,
        fromUser: cleanUser,
        read: false,
        link: 'social.html',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        success: true,
        duelId: duelRef.id,
        message: `Duelo criado com sucesso! ${cleanUser} (${challengerScore} pts) vs ${cleanTarget}. Prazo de 48h.`
      });
    }

    // 7. RESPONDER / CONCLUIR DUELO ASSÍNCRONO
    if (action === 'respond_duel') {
      if (!duelId) return res.status(400).json({ success: false, error: 'ID do duelo não fornecido.' });

      const duelRef = db.collection('lula_duels').doc(duelId);
      const duelSnap = await duelRef.get();

      if (!duelSnap.exists) return res.status(404).json({ success: false, error: 'Duelo não encontrado.' });

      const duelData = duelSnap.data();
      if (duelData.status !== 'pending') {
        return res.status(400).json({ success: false, error: 'Este duelo já foi finalizado ou expirou.' });
      }

      if (duelData.defenderId !== normUser && duelData.challengerId !== normUser) {
        return res.status(403).json({ success: false, error: 'Você não faz parte deste duelo.' });
      }

      const playedScore = Math.max(0, parseInt(score || 0, 10));
      const chScore = duelData.challengerScore || 0;
      let winnerId = null;
      let winnerName = null;
      let isDraw = false;

      if (playedScore > chScore) {
        winnerId = duelData.defenderId;
        winnerName = duelData.defenderName;
      } else if (playedScore < chScore) {
        winnerId = duelData.challengerId;
        winnerName = duelData.challengerName;
      } else {
        isDraw = true;
      }

      await duelRef.update({
        defenderScore: playedScore,
        status: isDraw ? 'draw' : 'completed',
        winnerId,
        winnerName,
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Atualiza Win Streak dos dois jogadores
      if (!isDraw && winnerId) {
        const loserId = winnerId === duelData.challengerId ? duelData.defenderId : duelData.challengerId;

        const winnerRef = db.collection('lula_users_v2').doc(winnerId);
        const loserRef = db.collection('lula_users_v2').doc(loserId);

        await db.runTransaction(async (t) => {
          const wSnap = await t.get(winnerRef);
          const lSnap = await t.get(loserRef);

          if (wSnap.exists) {
            const wData = wSnap.data();
            const curWinStreak = (wData.winStreak || 0) + 1;
            const bestWinStreak = Math.max(curWinStreak, wData.bestWinStreak || 0);
            t.update(winnerRef, { winStreak: curWinStreak, bestWinStreak });
          }

          if (lSnap.exists) {
            t.update(loserRef, { winStreak: 0 });
          }
        });

        // Notifica o perdedor e vencedor
        await db.collection('lula_notifications').add({
          userId: loserId,
          type: 'duel_result',
          title: 'Resultado do Duelo ⚔️',
          message: `${winnerName} venceu o duelo (${winnerId === duelData.challengerId ? chScore : playedScore} vs ${loserId === duelData.challengerId ? chScore : playedScore} pts)!`,
          fromUser: winnerName,
          read: false,
          link: 'social.html',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Publica no Feed de Atividades
        await db.collection('lula_activity_feed').add({
          username: winnerName,
          avatar: winnerId === duelData.challengerId ? (duelData.challengerAvatar || '') : (duelData.defenderAvatar || ''),
          eventType: 'duel_win',
          title: `Vitória em Duelo! ⚔️`,
          desc: `Venceu o duelo contra ${winnerId === duelData.challengerId ? duelData.defenderName : duelData.challengerName} (${winnerId === duelData.challengerId ? chScore : playedScore} vs ${loserId === duelData.challengerId ? chScore : playedScore} pts)!`,
          value: winnerId === duelData.challengerId ? chScore : playedScore,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return res.status(200).json({
        success: true,
        winnerName: isDraw ? 'Empate' : winnerName,
        message: isDraw ? 'Duelo empatado!' : `Duelo finalizado! Vencedor: ${winnerName}`
      });
    }

    // 8. LISTAR DUELOS DO USUÁRIO
    if (action === 'get_duels' || action === 'list_duels') {
      const snapChallenger = await db.collection('lula_duels').where('challengerId', '==', normUser).limit(20).get();
      const snapDefender = await db.collection('lula_duels').where('defenderId', '==', normUser).limit(20).get();

      const duelsMap = new Map();
      const addDuel = (doc) => {
        const d = doc.data();
        duelsMap.set(doc.id, {
          id: doc.id,
          ...d,
          challengedName: d.defenderName,
          challengedScore: d.defenderScore,
          isChallenged: d.defenderId === normUser,
          createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null,
          expiresAt: d.expiresAt?.toDate?.()?.toISOString?.() || null,
          completedAt: d.completedAt?.toDate?.()?.toISOString?.() || null
        });
      };

      snapChallenger.forEach(addDuel);
      snapDefender.forEach(addDuel);

      const allDuels = Array.from(duelsMap.values());
      allDuels.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const pendingDuels = allDuels.filter(d => d.status === 'pending');
      const completedDuels = allDuels.filter(d => d.status === 'completed' || d.status === 'draw');

      return res.status(200).json({ success: true, duels: allDuels, pendingDuels, completedDuels });
    }

    // 9. PLACAR DE INVICTOS (WIN STREAKS)
    if (action === 'win_streaks') {
      const snap = await db.collection('lula_users_v2')
        .where('bestWinStreak', '>', 0)
        .orderBy('bestWinStreak', 'desc')
        .limit(20)
        .get();

      const streaks = [];
      snap.forEach(doc => {
        const d = doc.data();
        streaks.push({
          player: d.username,
          avatar: d.avatar || '',
          winStreak: d.winStreak || 0,
          bestWinStreak: d.bestWinStreak || 0,
          prestigeLevel: d.prestigeLevel || 0,
          country: d.country || 'BR',
          countryName: d.countryName || 'Brasil',
          flag: d.flag || '🇧🇷'
        });
      });

      return res.status(200).json({ success: true, streaks });
    }

    return res.status(400).json({ success: false, error: 'Ação social não reconhecida.' });
  } catch (err) {
    console.error('❌ Erro no endpoint social:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro no servidor.' });
  }
}
