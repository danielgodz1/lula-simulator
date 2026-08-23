// api/auth.js — Autenticação Segura com Firebase Admin SDK, Migração Automática de Contas Legadas e Limpeza de Documentos Públicos
import crypto from 'crypto';
import admin, { db } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const sanitizeName = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').replace(/[^a-zA-Z0-9_\- .À-ÿ]/g, '').trim().slice(0, 30);
  };

  const hashWithSalt = (password, salt) => {
    const effectiveSalt = salt || 'lula_simulator_sec_salt_2026_';
    return crypto.createHash('sha256').update(effectiveSalt + password).digest('hex');
  };

  const generateRandomSalt = () => {
    return crypto.randomBytes(16).toString('hex');
  };

  if (req.method === 'POST') {
    const { action, username, password } = req.body || {};
    const cleanName = sanitizeName(username);
    const cleanPass = (password || '').trim();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de usuário inválido.' });
    }

    const userRef = db.collection('lula_users_v2').doc(normalizedName);
    const credRef = userRef.collection('private').doc('credentials');

    // =========================================================================
    // 1. REGISTRO SEGURO (COM VERIFICAÇÃO ANTI-SOBRESCRITA E SALT NO SERVIDOR)
    // =========================================================================
    if (action === 'register') {
      if (!cleanPass) {
        return res.status(400).json({ success: false, error: 'Senha é obrigatória.' });
      }

      try {
        // Verifica se a conta já existe e já possui senha cadastrada
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
          return res.status(409).json({
            success: false,
            error: 'Este nome já está cadastrado com senha. Escolha outro nome ou faça login.'
          });
        }

        // Gera salt criptográfico e hash estritamente no servidor
        const salt = generateRandomSalt();
        const finalHash = hashWithSalt(cleanPass, salt);

        const batch = db.batch();

        // 1. Grava credenciais na subcoleção privada (acessível apenas pelo Admin SDK)
        batch.set(credRef, {
          passwordHash: finalHash,
          passwordSalt: salt,
          hasPassword: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Grava ou mescla perfil público (garantindo que NENHUM hash ou salt fique no doc público)
        const existingData = userSnap.exists ? userSnap.data() : {};
        const safeTotalPicanhas = Math.max(existingData.totalPicanhas || 0, parseInt(req.body.totalPicanhas || 0, 10));
        const safeFlappy = Math.max(existingData.flappyScore || 0, parseInt(req.body.flappyScore || 0, 10));
        const safeRunner = Math.max(existingData.runnerScore || 0, parseInt(req.body.runnerScore || 0, 10));
        const safeDilma = Math.max(existingData.dilmaScore || 0, parseInt(req.body.dilmaScore || 0, 10));
        const safeRunnerCoins = Math.max(existingData.runnerCoins || 0, parseInt(req.body.runnerCoins || 0, 10));

        batch.set(userRef, {
          username: cleanName,
          hasPassword: true,
          totalPicanhas: safeTotalPicanhas,
          flappyScore: safeFlappy,
          runnerScore: safeRunner,
          dilmaScore: safeDilma,
          runnerCoins: safeRunnerCoins,
          createdAt: existingData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await batch.commit();

        return res.status(200).json({
          success: true,
          user: {
            username: cleanName,
            hasPassword: true,
            totalPicanhas: safeTotalPicanhas,
            flappyScore: safeFlappy,
            runnerScore: safeRunner,
            dilmaScore: safeDilma,
            runnerCoins: safeRunnerCoins
          }
        });
      } catch (err) {
        console.error('❌ Erro no registro de usuário no Firestore via Admin SDK:', err);
        const errMsg = err.message || '';
        if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) {
          return res.status(503).json({
            success: false,
            error: 'Limite diário gratuito do Firebase atingido. Tente novamente mais tarde.'
          });
        }
        if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
          return res.status(500).json({
            success: false,
            error: 'Servidor em configuração: Variáveis FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY não cadastradas na Vercel.'
          });
        }
        return res.status(500).json({ success: false, error: 'Erro ao registrar credenciais no servidor.' });
      }
    }

    // =========================================================================
    // 2. LOGIN SEGURO (COM SUPORTE A CONTAS MODERNAS, LEGADAS E LIMPEZA AUTOMÁTICA)
    // =========================================================================
    if (action === 'login') {
      if (!cleanPass) {
        return res.status(400).json({ success: false, error: 'Palavra-chave é obrigatória.' });
      }

      try {
        // Busca perfil público e subcoleção privada via Admin SDK
        const [userSnap, credSnap] = await Promise.all([
          userRef.get(),
          credRef.get()
        ]);

        if (!userSnap.exists && !credSnap.exists) {
          return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
        }

        const userData = userSnap.exists ? userSnap.data() : null;
        const credData = credSnap.exists ? credSnap.data() : null;

        // Se o usuário existir mas não possuir credenciais cadastradas
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

        // 1. Extrai credenciais da subcoleção privada OU do documento principal legado
        const effectiveSalt = credData?.passwordSalt || userData?.passwordSalt || '';
        const effectiveHash = credData?.passwordHash || userData?.passwordHash || '';
        const effectivePlain = credData?.password || userData?.password || '';

        // Se existirem credenciais antigas no documento principal, marca para limpeza automática
        if (userData?.passwordHash || userData?.passwordSalt || userData?.password) {
          cleanupUserDataFields = true;
          needsMigration = true;
        }

        if (effectiveSalt && effectiveHash) {
          // A. Conta Moderna: Hash SHA-256 com Salt Individual
          const calculatedHash = hashWithSalt(cleanPass, effectiveSalt);
          if (calculatedHash === effectiveHash) {
            isMatch = true;
          }
        } else if (effectiveHash) {
          // B. Conta Legada: Salt Fixo
          const legacyHash = hashWithSalt(cleanPass, 'lula_simulator_sec_salt_2026_');
          if (legacyHash === effectiveHash || cleanPass === effectiveHash) {
            isMatch = true;
            needsMigration = true;
          }
        } else if (effectivePlain) {
          // C. Conta Legada: Texto Puro
          if (cleanPass === effectivePlain) {
            isMatch = true;
            needsMigration = true;
          }
        }

        if (!isMatch) {
          return res.status(401).json({ success: false, error: 'Palavra-chave incorreta!' });
        }

        // Migração automática e limpeza de campos confidenciais do documento público
        if (needsMigration || cleanupUserDataFields || !credSnap.exists) {
          try {
            const newSalt = generateRandomSalt();
            const newHash = hashWithSalt(cleanPass, newSalt);

            const batch = db.batch();

            // Grava na subcoleção privada protegida
            batch.set(credRef, {
              passwordHash: newHash,
              passwordSalt: newSalt,
              hasPassword: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Se haviam hashes/senhas no documento público, remove-os definitivamente
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
            console.log(`🔒 Conta "${cleanName}" migrada com sucesso: Salt Individual gerado e campos limpos do documento público.`);
          } catch (migErr) {
            console.error('⚠️ Falha não-bloqueante na migração/limpeza:', migErr);
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
            runnerCoins: userData?.runnerCoins || 0
          }
        });
      } catch (err) {
        console.error('❌ Erro no login de usuário no Firestore via Admin SDK:', err);
        const errMsg = (err.message || '') + ' ' + (err.details || '') + ' ' + (err.code || '');

        if (err.code === 8 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded') || errMsg.includes('quota')) {
          return res.status(503).json({
            success: false,
            error: 'O banco de dados atingiu a cota diária gratuita de 50.000 leituras do Firebase (Quota Exceeded). O Google Cloud reinicia a cota às 04:00 da manhã (horário de Brasília).'
          });
        }
        if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
          return res.status(500).json({
            success: false,
            error: 'Servidor em configuração: Variáveis FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY não foram cadastradas na Vercel.'
          });
        }
        return res.status(500).json({
          success: false,
          error: `Erro ao conectar com o banco de dados: ${err.message || 'Falha no servidor.'}`
        });
      }
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
}
