// api/score.js — Vercel Serverless Function com Validação de Token de Partida HMAC, Detecção de País/Bandeira e Cache na Edge CDN
import crypto from 'crypto';
import { applyCors } from './_cors.js';

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

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';

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

  const parseLeaderboardDoc = (doc) => {
    if (!doc || !doc.fields) return [];
    const rawValues = doc.fields?.scores?.arrayValue?.values || [];
    const list = rawValues.map(v => {
      const p = v.mapValue?.fields?.player?.stringValue || 'Anônimo';
      const s = parseInt(v.mapValue?.fields?.score?.integerValue || '0', 10);
      const u = v.mapValue?.fields?.updatedAt?.timestampValue || '';
      const a = v.mapValue?.fields?.avatar?.stringValue || '';
      const c = v.mapValue?.fields?.country?.stringValue || 'BR';
      const cn = v.mapValue?.fields?.countryName?.stringValue || getCountryName(c);
      const f = v.mapValue?.fields?.flag?.stringValue || getFlagEmoji(c);
      return {
        player: sanitize(p, 25),
        score: s,
        updatedAt: u,
        avatar: sanitizeAvatar(a),
        country: c,
        countryName: cn,
        flag: f
      };
    }).filter(item => !isNaN(item.score) && item.score > 0);

    list.sort((a, b) => b.score - a.score);
    return list;
  };

  const formatLeaderboardPayload = (game, scoresList) => {
    return {
      fields: {
        game: { stringValue: game },
        updatedAt: { timestampValue: new Date().toISOString() },
        scores: {
          arrayValue: {
            values: scoresList.slice(0, 300).map(s => {
              const fields = {
                player: { stringValue: sanitize(s.player, 25) },
                score: { integerValue: parseInt(s.score, 10).toString() },
                updatedAt: { timestampValue: s.updatedAt || new Date().toISOString() },
                country: { stringValue: s.country || 'BR' },
                countryName: { stringValue: s.countryName || getCountryName(s.country || 'BR') },
                flag: { stringValue: s.flag || getFlagEmoji(s.country || 'BR') }
              };
              if (s.avatar && typeof s.avatar === 'string') {
                fields.avatar = { stringValue: sanitizeAvatar(s.avatar) };
              }
              return { mapValue: { fields } };
            })
          }
        }
      }
    };
  };

  // 1. GET: Consulta no documento consolidado Top 300 com Cache na CDN
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    const { game = 'flappy', limit = 300 } = req.query;
    const cleanGame = game === 'runner' ? 'runner' : 'flappy';
    const leaderboardDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_leaderboards_v2/${cleanGame}`;

    try {
      const lbRes = await fetch(leaderboardDocUrl);
      if (lbRes.ok) {
        const doc = await lbRes.json();
        const scores = parseLeaderboardDoc(doc);
        const maxLimit = Math.min(300, Math.max(1, parseInt(limit, 10) || 300));
        return res.status(200).json({ success: true, count: scores.length, scores: scores.slice(0, maxLimit) });
      }

      // Se ainda não existir documento consolidado, retorna lista padrão vazia
      return res.status(200).json({ success: true, count: 0, scores: [] });
    } catch (err) {
      return res.status(200).json({ success: false, scores: [] });
    }
  }

  // 2. POST: Gravação com Validação de Session Token HMAC e Geolocalização
  if (req.method === 'POST') {
    const { player, score, game = 'flappy', avatar = '', sessionToken = '', country: userCountry = '' } = req.body || {};

    const cleanPlayer = sanitize(player, 25);
    const numScore = parseInt(score, 10);
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
    const docId = encodeURIComponent(cleanPlayer.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

    try {
      // 1. Grava / Atualiza documento individual do jogador
      const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${docId}`;
      const userDocRes = await fetch(userDocUrl);
      let isNewPersonalRecord = true;
      let existingAvatar = '';

      if (userDocRes.ok) {
        const uDoc = await userDocRes.json();
        const existingScore = parseInt(uDoc.fields?.score?.integerValue || '0', 10);
        existingAvatar = sanitizeAvatar(uDoc.fields?.avatar?.stringValue || '');
        if (numScore <= existingScore) {
          isNewPersonalRecord = false;
        }
      }

      const finalAvatar = cleanAvatar || existingAvatar || '';

      if (isNewPersonalRecord || (cleanAvatar && cleanAvatar !== existingAvatar)) {
        const userFields = {
          player: { stringValue: cleanPlayer },
          score: { integerValue: numScore.toString() },
          country: { stringValue: detectedCountry },
          countryName: { stringValue: detectedCountryName },
          flag: { stringValue: detectedFlag },
          updatedAt: { timestampValue: new Date().toISOString() }
        };
        if (finalAvatar) {
          userFields.avatar = { stringValue: finalAvatar };
        }

        await fetch(userDocUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: userFields })
        });
      }

      // 2. Atualiza Documento Consolidado de Líderes (Top 300)
      const leaderboardDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_leaderboards_v2/${cleanGame}`;
      const lbRes = await fetch(leaderboardDocUrl);
      let currentScores = [];

      if (lbRes.ok) {
        const lbDoc = await lbRes.json();
        currentScores = parseLeaderboardDoc(lbDoc);
      }

      const playerKey = cleanPlayer.toLowerCase();
      const existingIdx = currentScores.findIndex(s => s.player.toLowerCase() === playerKey);

      let shouldUpdateLeaderboard = false;

      if (existingIdx !== -1) {
        if (numScore > currentScores[existingIdx].score) {
          currentScores[existingIdx].score = numScore;
          currentScores[existingIdx].updatedAt = new Date().toISOString();
          currentScores[existingIdx].country = detectedCountry;
          currentScores[existingIdx].countryName = detectedCountryName;
          currentScores[existingIdx].flag = detectedFlag;
          if (finalAvatar) currentScores[existingIdx].avatar = finalAvatar;
          shouldUpdateLeaderboard = true;
        } else if (finalAvatar && currentScores[existingIdx].avatar !== finalAvatar) {
          currentScores[existingIdx].avatar = finalAvatar;
          shouldUpdateLeaderboard = true;
        }
      } else {
        const lowestScore = currentScores.length >= 300 ? currentScores[currentScores.length - 1].score : 0;
        if (currentScores.length < 300 || numScore > lowestScore) {
          currentScores.push({
            player: cleanPlayer,
            score: numScore,
            avatar: finalAvatar,
            country: detectedCountry,
            countryName: detectedCountryName,
            flag: detectedFlag,
            updatedAt: new Date().toISOString()
          });
          shouldUpdateLeaderboard = true;
        }
      }

      if (shouldUpdateLeaderboard) {
        currentScores.sort((a, b) => b.score - a.score);
        const top300 = currentScores.slice(0, 300);
        await fetch(leaderboardDocUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formatLeaderboardPayload(cleanGame, top300))
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Recorde processado com sucesso',
        country: detectedCountry,
        countryName: detectedCountryName,
        flag: detectedFlag
      });
    } catch (e) {
      console.error('❌ Erro no salvamento de score:', e);
      return res.status(200).json({ success: true, fallback: true });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido' });
}
