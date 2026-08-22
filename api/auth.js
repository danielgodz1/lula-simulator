// api/auth.js — Autenticação de Alta Segurança com Firebase Admin SDK Real
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

        if (credSnap.exists || (userSnap.exists && userSnap.data()?.hasPassword === true)) {
          return res.status(409).json({
            success: false,
            error: 'Este nome já está cadastrado com senha. Escolha outro nome ou faça login.'
          });
        }

        // Gera salt criptográfico e hash estritamente no servidor (nunca confia no cliente)
        const salt = generateRandomSalt();
        const finalHash = hashWithSalt(cleanPass, salt);

        const batch = db.batch();

        // 1. Grava credenciais na subcoleção privada (acessível exclusivamente pelo Admin SDK)
        batch.set(credRef, {
          passwordHash: finalHash,
          passwordSalt: salt,
          hasPassword: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Grava ou mescla perfil público (sem vazar hashes nem salts)
        const existingData = userSnap.exists ? userSnap.data() : {};
        const safeTotalPicanhas = Math.max(existingData.totalPicanhas || 0, parseInt(req.body.totalPicanhas || 0, 10));
        const safeFlappy = Math.max(existingData.flappyScore || 0, parseInt(req.body.flappyScore || 0, 10));
        const safeRunner = Math.max(existingData.runnerScore || 0, parseInt(req.body.runnerScore || 0, 10));

        batch.set(userRef, {
          username: cleanName,
          hasPassword: true,
          totalPicanhas: safeTotalPicanhas,
          flappyScore: safeFlappy,
          runnerScore: safeRunner,
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
            runnerScore: safeRunner
          }
        });
      } catch (err) {
        console.error('❌ Erro no registro de usuário no Firestore via Admin SDK:', err);
        return res.status(500).json({ success: false, error: 'Erro ao registrar credenciais no servidor.' });
      }
    }

    // =========================================================================
    // 2. LOGIN SEGURO (COM BUSCA VIA ADMIN SDK E MIGRAÇÃO AUTOMÁTICA DE SALT)
    // =========================================================================
    if (action === 'login') {
      if (!cleanPass) {
        return res.status(400).json({ success: false, error: 'Palavra-chave é obrigatória.' });
      }

      try {
        // Busca perfil público e subcoleção privada via Admin SDK (ignora regras restritivas do cliente)
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
        if (!credData && userData && userData.hasPassword === false) {
          return res.status(400).json({
            success: false,
            error: `O jogador "${cleanName}" ainda não possui senha cadastrada. Você pode criar uma senha na aba "Criar Conta".`
          });
        }

        let isMatch = false;
        let needsMigration = false;

        if (credData && credData.passwordSalt && credData.passwordHash) {
          // 1. Conta Moderna: Hash SHA-256 com Salt Individual
          const calculatedHash = hashWithSalt(cleanPass, credData.passwordSalt);
          if (calculatedHash === credData.passwordHash) {
            isMatch = true;
          }
        } else if (credData && credData.passwordHash) {
          // 2. Conta Legada: Salt Fixo
          const legacyHash = hashWithSalt(cleanPass, 'lula_simulator_sec_salt_2026_');
          if (legacyHash === credData.passwordHash || cleanPass === credData.passwordHash) {
            isMatch = true;
            needsMigration = true;
          }
        } else if (credData && credData.password) {
          // 3. Conta Legada: Texto Puro
          if (cleanPass === credData.password) {
            isMatch = true;
            needsMigration = true;
          }
        }

        if (!isMatch) {
          return res.status(401).json({ success: false, error: 'Palavra-chave incorreta!' });
        }

        // Migração automática de contas antigas para Salt Criptográfico Individual
        if (needsMigration) {
          try {
            const newSalt = generateRandomSalt();
            const newHash = hashWithSalt(cleanPass, newSalt);
            await credRef.set({
              passwordHash: newHash,
              passwordSalt: newSalt,
              hasPassword: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`🔒 Conta "${cleanName}" migrada automaticamente para Salt Criptográfico Individual.`);
          } catch (migErr) {
            console.error('⚠️ Falha não-bloqueante na migração de salt:', migErr);
          }
        }

        return res.status(200).json({
          success: true,
          user: {
            username: userData?.username || cleanName,
            hasPassword: true,
            totalPicanhas: userData?.totalPicanhas || 0,
            flappyScore: userData?.flappyScore || 0,
            runnerScore: userData?.runnerScore || 0
          }
        });
      } catch (err) {
        console.error('❌ Erro no login de usuário no Firestore via Admin SDK:', err);
        return res.status(500).json({ success: false, error: 'Erro durante autenticação no servidor.' });
      }
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
}
