// api/auth.js — Autenticação Segura com Bcrypt, Rate Limiting (5 tentativas / 10 min -> Bloqueio 15 min), Migração Automática e CORS Restrito
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import admin, { db } from './_firebaseAdmin.js';
import { applyCors } from './_cors.js';

// Memória local volátil para fast-path no mesmo container serverless
const memoryRateLimits = new Map();

/**
 * Obtém o IP do cliente através dos cabeçalhos do proxy Vercel
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Gerenciador de Rate Limiting (Upstash Redis + Fallback Firestore/Memória)
 * Regra: 5 tentativas falhas em 10 minutos -> Bloqueio por 15 minutos (HTTP 429)
 */
const RateLimiter = {
  getLimitKey(ip, username) {
    const raw = `${ip}_${(username || 'anonymous').toLowerCase()}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
  },

  async checkRateLimit(key) {
    const now = Date.now();

    // 1. Checagem rápida em memória
    const mem = memoryRateLimits.get(key);
    if (mem && mem.blockedUntil && mem.blockedUntil > now) {
      const remainingSec = Math.ceil((mem.blockedUntil - now) / 1000);
      return { blocked: true, remainingSec };
    }

    // 2. Se houver Upstash Redis configurado
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        const blockRes = await fetch(`${redisUrl}/get/blocked_${key}`, {
          headers: { Authorization: `Bearer ${redisToken}` }
        });
        if (blockRes.ok) {
          const data = await blockRes.json();
          if (data.result) {
            const ttlRes = await fetch(`${redisUrl}/ttl/blocked_${key}`, {
              headers: { Authorization: `Bearer ${redisToken}` }
            });
            const ttlData = await ttlRes.json();
            return { blocked: true, remainingSec: Math.max(1, ttlData.result || 900) };
          }
        }
      } catch (e) {
        console.warn('⚠️ Falha na checagem Upstash Redis, utilizando Firestore:', e.message);
      }
    }

    // 3. Fallback persistente no Firestore
    try {
      const limitRef = db.collection('_auth_rate_limits').doc(key);
      const snap = await limitRef.get();
      if (snap.exists) {
        const data = snap.data();
        if (data.blockedUntil && data.blockedUntil.toMillis() > now) {
          const remainingSec = Math.ceil((data.blockedUntil.toMillis() - now) / 1000);
          memoryRateLimits.set(key, { blockedUntil: data.blockedUntil.toMillis() });
          return { blocked: true, remainingSec };
        }
      }
    } catch (err) {
      // Falha não-bloqueante no Firestore
    }

    return { blocked: false, remainingSec: 0 };
  },

  async recordFailedAttempt(key) {
    const now = Date.now();
    const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
    const BLOCK_MS = 15 * 60 * 1000;  // 15 minutos de bloqueio
    const MAX_ATTEMPTS = 5;

    // 1. Atualiza memória
    let mem = memoryRateLimits.get(key) || { count: 0, firstAttempt: now };
    if (now - mem.firstAttempt > WINDOW_MS) {
      mem = { count: 1, firstAttempt: now };
    } else {
      mem.count += 1;
    }

    if (mem.count >= MAX_ATTEMPTS) {
      mem.blockedUntil = now + BLOCK_MS;
    }
    memoryRateLimits.set(key, mem);

    // 2. Se Upstash Redis estiver disponível
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        const incrRes = await fetch(`${redisUrl}/incr/attempts_${key}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${redisToken}` }
        });
        const incrData = await incrRes.json();
        const attempts = incrData.result || 1;

        if (attempts === 1) {
          await fetch(`${redisUrl}/expire/attempts_${key}/600`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${redisToken}` }
          });
        }

        if (attempts >= MAX_ATTEMPTS) {
          await fetch(`${redisUrl}/set/blocked_${key}/1/ex/900`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${redisToken}` }
          });
        }
        return;
      } catch (e) {
        console.warn('⚠️ Falha ao registrar falha no Upstash Redis:', e.message);
      }
    }

    // 3. Fallback no Firestore
    try {
      const limitRef = db.collection('_auth_rate_limits').doc(key);
      const snap = await limitRef.get();
      let currentCount = 1;
      let firstAttemptTime = admin.firestore.Timestamp.now();

      if (snap.exists) {
        const data = snap.data();
        const diffMs = now - (data.firstAttempt ? data.firstAttempt.toMillis() : now);
        if (diffMs < WINDOW_MS) {
          currentCount = (data.count || 0) + 1;
          firstAttemptTime = data.firstAttempt;
        }
      }

      const updatePayload = {
        count: currentCount,
        firstAttempt: firstAttemptTime,
        lastAttempt: admin.firestore.Timestamp.now()
      };

      if (currentCount >= MAX_ATTEMPTS) {
        updatePayload.blockedUntil = admin.firestore.Timestamp.fromMillis(now + BLOCK_MS);
      }

      await limitRef.set(updatePayload, { merge: true });
    } catch (err) {
      console.warn('⚠️ Falha ao gravar rate limit no Firestore:', err.message);
    }
  },

  async clearRateLimit(key) {
    memoryRateLimits.delete(key);

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        await fetch(`${redisUrl}/del/attempts_${key}/blocked_${key}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${redisToken}` }
        }).catch(() => {});
      } catch (e) {}
    }

    try {
      await db.collection('_auth_rate_limits').doc(key).delete();
    } catch (err) {}
  }
};

export default async function handler(req, res) {
  // Aplica CORS restrito
  if (applyCors(req, res)) return;

  const sanitizeName = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').replace(/[^a-zA-Z0-9_\- .À-ÿ]/g, '').trim().slice(0, 30);
  };

  // Função legado SHA-256 para compatibilidade e migração transparente
  const hashWithSaltLegacy = (password, salt) => {
    const effectiveSalt = salt || 'lula_simulator_sec_salt_2026_';
    return crypto.createHash('sha256').update(effectiveSalt + password).digest('hex');
  };

  if (req.method === 'POST') {
    const { action, username, password } = req.body || {};
    const cleanName = sanitizeName(username);
    const cleanPass = (password || '').trim();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de usuário inválido.' });
    }

    // Rate Limiting baseado em IP + Nome de Usuário
    const clientIp = getClientIp(req);
    const rateLimitKey = RateLimiter.getLimitKey(clientIp, normalizedName);
    const rateStatus = await RateLimiter.checkRateLimit(rateLimitKey);

    if (rateStatus.blocked) {
      const minutesRemaining = Math.ceil(rateStatus.remainingSec / 60);
      return res.status(429).json({
        success: false,
        error: `Muitas tentativas incorretas. Conta bloqueada por segurança. Tente novamente em ${minutesRemaining} minuto(s).`
      });
    }

    const userRef = db.collection('lula_users_v2').doc(normalizedName);
    const credRef = userRef.collection('private').doc('credentials');

    // =========================================================================
    // 1. REGISTRO SEGURO COM BCRYPT E PROTEÇÃO ANTI-SOBREPOSIÇÃO
    // =========================================================================
    if (action === 'register') {
      if (!cleanPass) {
        return res.status(400).json({ success: false, error: 'Senha é obrigatória.' });
      }

      if (cleanPass.length < 3) {
        return res.status(400).json({ success: false, error: 'A senha deve ter no mínimo 3 caracteres.' });
      }

      try {
        const [userSnap, credSnap] = await Promise.all([
          userRef.get(),
          credRef.get()
        ]);

        const hasCredsInSubcollection = credSnap.exists;
        const hasLegacyPasswordInMainDoc = userSnap.exists && (
          userSnap.data()?.hasPassword === true ||
          !!userSnap.data()?.passwordHash ||
          !!userSnap.data()?.password
        );

        if (hasCredsInSubcollection || hasLegacyPasswordInMainDoc) {
          await RateLimiter.recordFailedAttempt(rateLimitKey);
          return res.status(409).json({
            success: false,
            error: 'Este nome já está cadastrado com senha. Escolha outro nome ou faça login.'
          });
        }

        // Gera hash Bcrypt com fator de custo 10
        const bcryptHash = await bcrypt.hash(cleanPass, 10);

        const batch = db.batch();

        // 1. Salva credenciais criptografadas na subcoleção privada
        batch.set(credRef, {
          passwordHash: bcryptHash,
          hasPassword: true,
          authType: 'bcrypt',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Grava/mescla perfil público sem nenhum hash ou salt
        const existingData = userSnap.exists ? userSnap.data() : {};
        const safeTotalPicanhas = Math.max(existingData.totalPicanhas || 0, parseInt(req.body.totalPicanhas || 0, 10));
        const safeFlappy = Math.max(existingData.flappyScore || 0, parseInt(req.body.flappyScore || 0, 10));
        const safeRunner = Math.max(existingData.runnerScore || 0, parseInt(req.body.runnerScore || 0, 10));
        const safeDilma = Math.max(existingData.dilmaScore || 0, parseInt(req.body.dilmaScore || 0, 10));
        const safeRunnerCoins = Math.max(existingData.runnerCoins || 0, parseInt(req.body.runnerCoins || 0, 10));
        const safeAvatar = typeof req.body.avatar === 'string' && req.body.avatar.length <= 25000 ? req.body.avatar : (existingData.avatar || '');
        const safeUnlocked = Array.isArray(req.body.unlockedCharacters) ? req.body.unlockedCharacters : (existingData.unlockedCharacters || []);

        batch.set(userRef, {
          username: cleanName,
          hasPassword: true,
          totalPicanhas: safeTotalPicanhas,
          flappyScore: safeFlappy,
          runnerScore: safeRunner,
          dilmaScore: safeDilma,
          runnerCoins: safeRunnerCoins,
          avatar: safeAvatar,
          unlockedCharacters: safeUnlocked,
          createdAt: existingData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await batch.commit();
        await RateLimiter.clearRateLimit(rateLimitKey);

        return res.status(200).json({
          success: true,
          user: {
            username: cleanName,
            hasPassword: true,
            totalPicanhas: safeTotalPicanhas,
            flappyScore: safeFlappy,
            runnerScore: safeRunner,
            dilmaScore: safeDilma,
            runnerCoins: safeRunnerCoins,
            avatar: safeAvatar,
            unlockedCharacters: safeUnlocked
          }
        });
      } catch (err) {
        console.error('❌ Erro no registro de usuário no Firestore:', err);
        return res.status(500).json({ success: false, error: 'Erro ao registrar credenciais no servidor.' });
      }
    }

    // =========================================================================
    // 2. LOGIN SEGURO (BCRYPT + MIGRAÇÃO TRANSPARENTE DE CONTAS SHA-256)
    // =========================================================================
    if (action === 'login') {
      if (!cleanPass) {
        return res.status(400).json({ success: false, error: 'Palavra-chave é obrigatória.' });
      }

      try {
        const [userSnap, credSnap] = await Promise.all([
          userRef.get(),
          credRef.get()
        ]);

        if (!userSnap.exists && !credSnap.exists) {
          await RateLimiter.recordFailedAttempt(rateLimitKey);
          return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
        }

        const userData = userSnap.exists ? userSnap.data() : null;
        const credData = credSnap.exists ? credSnap.data() : null;

        const hasAnyPassword = credData?.hasPassword || userData?.hasPassword || userData?.passwordHash || userData?.password;
        if (!hasAnyPassword) {
          return res.status(400).json({
            success: false,
            error: `O jogador "${cleanName}" ainda não possui senha cadastrada. Você pode criar uma senha na aba "Criar Conta".`
          });
        }

        let isMatch = false;
        let needsMigration = false;
        let cleanupUserDataFields = false;

        const effectiveSalt = credData?.passwordSalt || userData?.passwordSalt || '';
        const effectiveHash = credData?.passwordHash || userData?.passwordHash || '';
        const effectivePlain = credData?.password || userData?.password || '';

        if (userData?.passwordHash || userData?.passwordSalt || userData?.password) {
          cleanupUserDataFields = true;
          needsMigration = true;
        }

        // A. Checagem Bcrypt
        if (effectiveHash && (effectiveHash.startsWith('$2a$') || effectiveHash.startsWith('$2b$') || effectiveHash.startsWith('$2y$'))) {
          isMatch = await bcrypt.compare(cleanPass, effectiveHash);
        } else if (effectiveSalt && effectiveHash) {
          // B. Conta Legada: Hash SHA-256 com Salt Individual
          const calculatedHash = hashWithSaltLegacy(cleanPass, effectiveSalt);
          if (calculatedHash === effectiveHash) {
            isMatch = true;
            needsMigration = true;
          }
        } else if (effectiveHash) {
          // C. Conta Legada: Salt Fixo
          const legacyHash = hashWithSaltLegacy(cleanPass, 'lula_simulator_sec_salt_2026_');
          if (legacyHash === effectiveHash || cleanPass === effectiveHash) {
            isMatch = true;
            needsMigration = true;
          }
        } else if (effectivePlain) {
          // D. Conta Legada: Texto Puro
          if (cleanPass === effectivePlain) {
            isMatch = true;
            needsMigration = true;
          }
        }

        if (!isMatch) {
          await RateLimiter.recordFailedAttempt(rateLimitKey);
          return res.status(401).json({ success: false, error: 'Palavra-chave incorreta!' });
        }

        // Login bem-sucedido: limpa o contador de falhas do rate limiter
        await RateLimiter.clearRateLimit(rateLimitKey);

        // Migração automática e transparente para Bcrypt
        if (needsMigration || cleanupUserDataFields || !credSnap.exists || !effectiveHash.startsWith('$2')) {
          try {
            const newBcryptHash = await bcrypt.hash(cleanPass, 10);
            const batch = db.batch();

            batch.set(credRef, {
              passwordHash: newBcryptHash,
              passwordSalt: admin.firestore.FieldValue.delete(),
              hasPassword: true,
              authType: 'bcrypt',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            if (cleanupUserDataFields) {
              batch.update(userRef, {
                password: admin.firestore.FieldValue.delete(),
                passwordHash: admin.firestore.FieldValue.delete(),
                passwordSalt: admin.firestore.FieldValue.delete(),
                hasPassword: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }

            await batch.commit();
            console.log(`🔒 Conta "${cleanName}" migrada automaticamente para Bcrypt e dados confidenciais limpos.`);
          } catch (migErr) {
            console.error('⚠️ Falha não-bloqueante na migração Bcrypt:', migErr);
          }
        }

        return res.status(200).json({
          success: true,
          user: {
            username: userData?.username || cleanName,
            hasPassword: true,
            totalPicanhas: userData?.totalPicanhas || 0,
            flappyScore: userData?.flappyScore || 0,
            runnerScore: userData?.runnerScore || 0,
            dilmaScore: userData?.dilmaScore || 0,
            runnerCoins: userData?.runnerCoins || 0,
            avatar: userData?.avatar || '',
            unlockedCharacters: Array.isArray(userData?.unlockedCharacters) ? userData.unlockedCharacters : []
          }
        });
      } catch (err) {
        console.error('❌ Erro no login de usuário no Firestore:', err);
        return res.status(500).json({
          success: false,
          error: `Erro ao conectar com o banco de dados: ${err.message || 'Falha no servidor.'}`
        });
      }
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
}
