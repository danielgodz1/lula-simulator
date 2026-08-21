// api/auth.js — Vercel Serverless Function para Autenticação Segura (sem expor hashes/salts ao cliente)
import crypto from 'crypto';

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

  const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';

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
    const { action, username, password, passwordHash, passwordSalt } = req.body || {};
    const cleanName = sanitizeName(username);
    const cleanPass = (password || '').trim();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de usuário inválido.' });
    }

    // 1. REGISTRO SEGURO COM SALT ÚNICO
    if (action === 'register') {
      if (!cleanPass && !passwordHash) {
        return res.status(400).json({ success: false, error: 'Senha é obrigatória.' });
      }

      const salt = passwordSalt || generateRandomSalt();
      const finalHash = passwordHash || hashWithSalt(cleanPass, salt);

      try {
        // Grava o documento de credenciais na subcoleção privada
        const credUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}/private/credentials`;
        const credPayload = {
          fields: {
            passwordHash: { stringValue: finalHash },
            passwordSalt: { stringValue: salt },
            hasPassword: { booleanValue: true },
            createdAt: { timestampValue: new Date().toISOString() }
          }
        };

        await fetch(credUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credPayload)
        });

        // Grava o documento público sem hash/salt
        const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
        const userPayload = {
          fields: {
            username: { stringValue: cleanName },
            hasPassword: { booleanValue: true },
            totalPicanhas: { integerValue: (req.body.totalPicanhas || 0).toString() },
            flappyScore: { integerValue: (req.body.flappyScore || 0).toString() },
            runnerScore: { integerValue: (req.body.runnerScore || 0).toString() },
            createdAt: { timestampValue: new Date().toISOString() }
          }
        };

        await fetch(userUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userPayload)
        });

        return res.status(200).json({
          success: true,
          user: {
            username: cleanName,
            hasPassword: true,
            totalPicanhas: req.body.totalPicanhas || 0,
            flappyScore: req.body.flappyScore || 0,
            runnerScore: req.body.runnerScore || 0
          }
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: 'Erro ao registrar credenciais.' });
      }
    }

    // 2. LOGIN SEGURO COM MIGRAÇÃO AUTOMÁTICA DE SALT
    if (action === 'login') {
      if (!cleanPass) {
        return res.status(400).json({ success: false, error: 'Palavra-chave é obrigatória.' });
      }

      try {
        // Busca o documento público
        const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
        const userRes = await fetch(userUrl);
        let userData = null;
        if (userRes.ok) {
          const uDoc = await userRes.json();
          userData = {
            username: uDoc.fields?.username?.stringValue || cleanName,
            hasPassword: uDoc.fields?.hasPassword?.booleanValue ?? true,
            totalPicanhas: parseInt(uDoc.fields?.totalPicanhas?.integerValue || '0', 10),
            flappyScore: parseInt(uDoc.fields?.flappyScore?.integerValue || '0', 10),
            runnerScore: parseInt(uDoc.fields?.runnerScore?.integerValue || '0', 10),
            createdAt: uDoc.fields?.createdAt?.timestampValue || new Date().toISOString()
          };
        }

        // Busca a subcoleção privada
        const credUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}/private/credentials`;
        const credRes = await fetch(credUrl);
        let credData = null;

        if (credRes.ok) {
          const cDoc = await credRes.json();
          credData = {
            passwordHash: cDoc.fields?.passwordHash?.stringValue || '',
            passwordSalt: cDoc.fields?.passwordSalt?.stringValue || '',
            passwordLegacy: cDoc.fields?.password?.stringValue || ''
          };
        }

        if (!credData && !userData) {
          return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
        }

        let isMatch = false;
        let needsMigration = false;

        if (credData && credData.passwordSalt) {
          // Conta moderna com salt individual
          const calculatedHash = hashWithSalt(cleanPass, credData.passwordSalt);
          if (calculatedHash === credData.passwordHash) {
            isMatch = true;
          }
        } else if (credData && credData.passwordHash) {
          // Conta legada (salt fixo)
          const legacyHash = hashWithSalt(cleanPass, 'lula_simulator_sec_salt_2026_');
          if (legacyHash === credData.passwordHash || cleanPass === credData.passwordHash) {
            isMatch = true;
            needsMigration = true;
          }
        } else if (credData && credData.passwordLegacy) {
          // Conta legada com texto puro
          if (cleanPass === credData.passwordLegacy) {
            isMatch = true;
            needsMigration = true;
          }
        }

        if (!isMatch) {
          return res.status(401).json({ success: false, error: 'Palavra-chave incorreta!' });
        }

        // Se a conta era legada, faz a migração automática gerando salt individual
        if (needsMigration) {
          const newSalt = generateRandomSalt();
          const newHash = hashWithSalt(cleanPass, newSalt);

          const updateCredUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}/private/credentials`;
          const updatePayload = {
            fields: {
              passwordHash: { stringValue: newHash },
              passwordSalt: { stringValue: newSalt },
              hasPassword: { booleanValue: true },
              updatedAt: { timestampValue: new Date().toISOString() }
            }
          };

          fetch(updateCredUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
          }).catch(() => {});
        }

        // Retorna apenas dados públicos seguros (sem vazar hash nem salt)
        return res.status(200).json({
          success: true,
          user: userData || { username: cleanName, hasPassword: true, totalPicanhas: 0, flappyScore: 0, runnerScore: 0 }
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: 'Erro durante autenticação no servidor.' });
      }
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
