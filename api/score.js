// api/score.js — Vercel Serverless Function com Validação de Token de Partida HMAC, Detecção de País/Bandeira e Cache na Edge CDN
// NOTA: Usa Firebase Admin SDK para gravações (bypassa Firestore Security Rules, igual às demais APIs)
import crypto from 'crypto';
import { applyCors } from './_cors.js';
import { db } from './_firebaseAdmin.js';

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.FIREBASE_PRIVATE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.error('🚨 ERRO CRÍTICO: Defina a variável SESSION_SECRET ou FIREBASE_PRIVATE_KEY no painel da Vercel!');
      return null;
    }
    return 'lula_dev_session_secret_local_only';
  }
  return secret;
}

const COUNTRY_NAMES_PT = {
  BR: 'Brasil', PT: 'Portugal', US: 'Estados Unidos', AR: 'Argentina', UY: 'Uruguai',
  PY: 'Paraguai', CL: 'Chile', CO: 'Colômbia', PE: 'Peru', BO: 'Bolívia',
  VE: 'Venezuela', EC: 'Equador', MX: 'México', ES: 'Espanha', FR: 'França',
  IT: 'Itália', DE: 'Alemanha', GB: 'Reino Unido', CA: 'Canadá', JP: 'Japão',
  CN: 'China', RU: 'Rússia', AU: 'Austrália', AO: 'Angola', MZ: 'Moçambique',
  CV: 'Cabo Verde', GW: 'Guiné-Bissau', ST: 'São Tomé e Príncipe', TL: 'Timor-Leste'
};

function getFlagEmoji(countryCode) {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) return '🇧🇷';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getCountryName(countryCode) {
  const code = (countryCode || 'BR').toUpperCase();
  if (COUNTRY_NAMES_PT[code]) return COUNTRY_NAMES_PT[code];
  try {
    const regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
    return regionNames.of(code) || code;
  } catch (e) {
    return code;
  }
}

function verifySessionToken(token, expectedGame) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  try {
    const [payloadStr, signature] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    const now = Date.now();

    // Validade máxima de 10 minutos (600s) e mínima de 300ms (anti-instant spam)
    if (now - payload.t > 10 * 60 * 1000 || now - payload.t < 300) {
      return false;
    }

    if (payload.game !== expectedGame) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

function getISOWeekKey(d = new Date()) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const sanitize = (str, maxLen = 30) => {
    if (!str || typeof str !== 'string') return 'Jogador';
    return str
      .replace(/<[^>]*>?/gm, '')
      .replace(/[^a-zA-Z0-9_\- .À-ÿ]/g, '')
      .trim()
      .slice(0, maxLen) || 'Jogador';
  };

  const sanitizeAvatar = (str) => {
    if (!str || typeof str !== 'string') return '';
    const trimmed = str.trim();
    if (trimmed.startsWith('data:image/') && trimmed.length <= 25000) {
      return trimmed;
    }
    if ((trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('img/')) && trimmed.length <= 500) {
      return trimmed;
    }
    return '';
  };

  // 1. GET: Consulta no documento consolidado de Leaderboard (Geral, Semanal ou Total Acumulado)
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=15');
    const { game = 'flappy', limit, page, pageSize, type = 'general' } = req.query;
    const cleanGame = game === 'runner' ? 'runner' : 'flappy';
    const isWeekly = type === 'weekly';
    const isAccumulated = type === 'accumulated';
    const currentWeekKey = getISOWeekKey();

    let docName = cleanGame;
    if (isWeekly) docName = `${cleanGame}_weekly`;
    else if (isAccumulated) docName = `${cleanGame}_accumulated`;

    try {
      const snap = await db.collection('lula_leaderboards_v2').doc(docName).get();

      if (snap.exists) {
        const data = snap.data();

        if (isWeekly) {
          const docWeek = data.weekKey || '';
          if (docWeek !== currentWeekKey) {
            return res.status(200).json({ success: true, count: 0, total: 0, scores: [], type: 'weekly', weekKey: currentWeekKey });
          }
        }

        // Admin SDK retorna objetos JS nativos — score é number, não integerValue
        let rawScores = Array.isArray(data.scores) ? data.scores : [];
        let scores = rawScores
          .filter(s => s && typeof s.score === 'number' && s.score > 0)
          .sort((a, b) => b.score - a.score);

        // AUTO-BACKFILL AUTOMÁTICO: se o documento consolidado geral ainda tiver menos de 340 jogadores
        // (devido ao antigo limite estático de 300), recupera e mescla os scores individuais restantes
        if (!isWeekly && !isAccumulated && scores.length < 340 && (cleanGame === 'flappy' || cleanGame === 'runner')) {
          try {
            const collName = cleanGame === 'runner' ? 'lula_runner_scores_v2' : 'lula_scores_v2';
            const individualSnap = await db.collection(collName).get();
            const existingMap = new Map();
            scores.forEach(s => existingMap.set((s.player || '').toLowerCase(), s));

            let addedCount = 0;
            individualSnap.forEach(doc => {
              const d = doc.data();
              if (!d.player || !d.score) return;
              const pKey = d.player.toLowerCase();
              const numSc = parseInt(d.score, 10);
              if (numSc <= 0) return;

              const existing = existingMap.get(pKey);
              if (!existing) {
                const entry = {
                  player: d.player,
                  score: numSc,
                  avatar: (d.avatar && !d.avatar.startsWith('data:')) ? d.avatar : '',
                  country: d.country || 'BR',
                  countryName: d.countryName || 'Brasil',
                  flag: d.flag || '🇧🇷',
                  prestigeLevel: parseInt(d.prestigeLevel || 0, 10),
                  updatedAt: d.updatedAt || new Date().toISOString()
                };
                existingMap.set(pKey, entry);
                scores.push(entry);
                addedCount++;
              } else if (numSc > existing.score) {
                existing.score = numSc;
                existing.updatedAt = d.updatedAt || new Date().toISOString();
                addedCount++;
              }
            });

            if (addedCount > 0) {
              scores.sort((a, b) => b.score - a.score);
              const topScores = scores.slice(0, 5000);
              await db.collection('lula_leaderboards_v2').doc(docName).set({
                game: cleanGame,
                updatedAt: new Date().toISOString(),
                scores: topScores
              }, { merge: true });
            }
          } catch (bfErr) {
            console.warn('Aviso no auto-backfill de scores:', bfErr.message);
          }
        }

        // Suporte opcional à paginação no backend (?page=X&pageSize=25)
        if (page !== undefined) {
          const pageNum = Math.max(1, parseInt(page, 10) || 1);
          const size = Math.max(1, Math.min(100, parseInt(pageSize || limit, 10) || 25));
          const totalCount = scores.length;
          const totalPages = Math.ceil(totalCount / size) || 1;
          const startIndex = (pageNum - 1) * size;
          const paginatedScores = scores.slice(startIndex, startIndex + size);

          return res.status(200).json({
            success: true,
            total: totalCount,
            count: paginatedScores.length,
            page: pageNum,
            pageSize: size,
            totalPages,
            scores: paginatedScores,
            type: isAccumulated ? 'accumulated' : (isWeekly ? 'weekly' : 'general'),
            weekKey: isWeekly ? currentWeekKey : undefined
          });
        }

        const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 5000;
        const maxLimit = Math.min(5000, Math.max(1, isNaN(parsedLimit) ? 5000 : parsedLimit));
        return res.status(200).json({
          success: true,
          total: scores.length,
          count: Math.min(scores.length, maxLimit),
          scores: scores.slice(0, maxLimit),
          type: isAccumulated ? 'accumulated' : (isWeekly ? 'weekly' : 'general'),
          weekKey: isWeekly ? currentWeekKey : undefined
        });
      }

      return res.status(200).json({
        success: true,
        total: 0,
        count: 0,
        scores: [],
        type: isAccumulated ? 'accumulated' : (isWeekly ? 'weekly' : 'general'),
        weekKey: isWeekly ? currentWeekKey : undefined
      });
    } catch (err) {
      console.error('❌ Erro ao ler leaderboard:', err);
      return res.status(200).json({ success: false, scores: [], type });
    }
  }

  // 2. POST: Gravação com Validação de Session Token HMAC e Geolocalização
  if (req.method === 'POST') {
    const {
      player,
      score,
      matchScore = 0,
      totalAccumulated = 0,
      prestigeLevel = 0,
      game = 'flappy',
      avatar = '',
      sessionToken = '',
      country: userCountry = ''
    } = req.body || {};

    const cleanPlayer = sanitize(player, 25);
    const numScore = parseInt(score, 10);
    const thisMatchScore = Math.max(1, parseInt(matchScore || score, 10));
    const numAccumulated = Math.max(0, parseInt(totalAccumulated, 10));
    const numPrestige = Math.max(0, parseInt(prestigeLevel, 10));
    const cleanGame = game === 'runner' ? 'runner' : 'flappy';
    const cleanAvatar = sanitizeAvatar(avatar);

    if (!cleanPlayer || cleanPlayer.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de jogador inválido' });
    }

    if (isNaN(numScore) || numScore <= 0 || numScore > 50000) {
      return res.status(400).json({ success: false, error: 'Pontuação fora dos limites permitidos' });
    }

    // Validação estrita do Token de Sessão assinado
    const isTokenValid = verifySessionToken(sessionToken, cleanGame);
    if (!isTokenValid) {
      return res.status(403).json({
        success: false,
        error: 'Sessão de partida inválida ou expirada. Para registrar recordes oficiais, jogue diretamente pelo navegador.'
      });
    }

    // Detecção de País e Bandeira via Headers Vercel / Cloudflare
    let detectedCountry = (
      req.headers['x-vercel-ip-country'] ||
      req.headers['cf-ipcountry'] ||
      userCountry ||
      'BR'
    ).toString().toUpperCase().slice(0, 2);

    if (!detectedCountry || detectedCountry.length !== 2) detectedCountry = 'BR';
    const detectedFlag = getFlagEmoji(detectedCountry);
    const detectedCountryName = getCountryName(detectedCountry);

    const collectionName = cleanGame === 'runner' ? 'lula_runner_scores_v2' : 'lula_scores_v2';
    const docId = cleanPlayer.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const currentWeekKey = getISOWeekKey();

    try {
      // 1. Lê documento individual do jogador via Admin SDK
      const userRef = db.collection(collectionName).doc(docId);
      const userSnap = await userRef.get();

      let isNewPersonalRecord = true;
      let existingAvatar = '';

      if (userSnap.exists) {
        const uData = userSnap.data();
        const existingScore = uData.score || 0;
        existingAvatar = sanitizeAvatar(uData.avatar || '');
        if (numScore <= existingScore) {
          isNewPersonalRecord = false;
        }
      }

      const finalAvatar = cleanAvatar || existingAvatar || '';

      // Grava / Atualiza documento individual do jogador
      if (isNewPersonalRecord || (cleanAvatar && cleanAvatar !== existingAvatar)) {
        const userFields = {
          player: cleanPlayer,
          score: numScore,
          country: detectedCountry,
          countryName: detectedCountryName,
          flag: detectedFlag,
          updatedAt: new Date().toISOString()
        };
        if (finalAvatar) userFields.avatar = finalAvatar;

        await userRef.set(userFields, { merge: true });
      }

      const MAX_LEADERBOARD_ENTRIES = 5000;

      // Função auxiliar para atualizar um documento consolidado de leaderboard (Geral, Semanal ou Acumulado)
      const updateLeaderboardDoc = async (docName, scoreToUse, isWeeklyBoard = false) => {
        const lbRef = db.collection('lula_leaderboards_v2').doc(docName);
        const lbSnap = await lbRef.get();

        let currentScores = [];
        let docWeek = '';

        if (lbSnap.exists) {
          const lbData = lbSnap.data();
          docWeek = lbData.weekKey || '';

          if (isWeeklyBoard && docWeek !== currentWeekKey) {
            // Nova semana: reseta a lista semanal iniciando na segunda-feira
            currentScores = [];
          } else {
            currentScores = Array.isArray(lbData.scores)
              ? lbData.scores.filter(s => s && typeof s.score === 'number' && s.score > 0)
              : [];
          }
        }

        const playerKey = cleanPlayer.toLowerCase();
        const existingIdx = currentScores.findIndex(s => (s.player || '').toLowerCase() === playerKey);
        let shouldUpdate = false;

        // Otimização de payload: não salvar base64 volumoso no array consolidado
        const safeAvatarForBoard = finalAvatar.startsWith('data:') ? '' : finalAvatar;

        if (existingIdx !== -1) {
          if (scoreToUse > currentScores[existingIdx].score) {
            currentScores[existingIdx].score = scoreToUse;
            currentScores[existingIdx].updatedAt = new Date().toISOString();
            currentScores[existingIdx].country = detectedCountry;
            currentScores[existingIdx].countryName = detectedCountryName;
            currentScores[existingIdx].flag = detectedFlag;
            if (numPrestige) currentScores[existingIdx].prestigeLevel = numPrestige;
            if (safeAvatarForBoard) currentScores[existingIdx].avatar = safeAvatarForBoard;
            shouldUpdate = true;
          } else if (safeAvatarForBoard && currentScores[existingIdx].avatar !== safeAvatarForBoard) {
            currentScores[existingIdx].avatar = safeAvatarForBoard;
            shouldUpdate = true;
          }
        } else {
          // Permite que todo novo jogador que marcar pontos entre no ranking (capacidade até 5000)
          const lowestScore = currentScores.length >= MAX_LEADERBOARD_ENTRIES ? currentScores[currentScores.length - 1].score : 0;
          if (currentScores.length < MAX_LEADERBOARD_ENTRIES || scoreToUse > lowestScore) {
            currentScores.push({
              player: cleanPlayer,
              score: scoreToUse,
              avatar: safeAvatarForBoard,
              country: detectedCountry,
              countryName: detectedCountryName,
              flag: detectedFlag,
              prestigeLevel: numPrestige,
              updatedAt: new Date().toISOString()
            });
            shouldUpdate = true;
          }
        }

        if (shouldUpdate || (isWeeklyBoard && docWeek !== currentWeekKey)) {
          currentScores.sort((a, b) => b.score - a.score);
          const topScores = currentScores.slice(0, MAX_LEADERBOARD_ENTRIES);

          const payload = {
            game: cleanGame,
            updatedAt: new Date().toISOString(),
            scores: topScores
          };
          if (isWeeklyBoard) payload.weekKey = currentWeekKey;

          await lbRef.set(payload);
        }
      };

      // Atualizações:
      // 1. Placar Geral: usa o maior recorde histórico (numScore)
      // 2. Placar Semanal: usa a pontuação conquistada na partida atual (thisMatchScore)
      // 3. Placar Acumulado: atualiza o total somado
      const tasks = [
        updateLeaderboardDoc(cleanGame, numScore, false),
        updateLeaderboardDoc(`${cleanGame}_weekly`, thisMatchScore, true)
      ];

      if (numAccumulated > 0) {
        tasks.push(updateLeaderboardDoc(`${cleanGame}_accumulated`, numAccumulated, false));
      }

      await Promise.all(tasks);

      return res.status(200).json({
        success: true,
        message: 'Recorde processado com sucesso',
        country: detectedCountry,
        countryName: detectedCountryName,
        flag: detectedFlag,
        weekKey: currentWeekKey
      });
    } catch (e) {
      console.error('❌ Erro no salvamento de score:', e);
      return res.status(500).json({ success: false, error: 'Erro interno ao salvar recorde.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido' });
}
