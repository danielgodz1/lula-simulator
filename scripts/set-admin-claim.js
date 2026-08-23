// scripts/set-admin-claim.js — Atribui a Custom Claim { admin: true } para a conta do Administrador via Firebase Admin SDK
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Carrega variáveis do .env.local se existir
const envPath = path.join(rootDir, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

const targetEmail = process.argv[2] || 'insanodanieldoublegaming@gmail.com';

const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!clientEmail || !privateKey) {
  console.error('❌ ERRO: Para executar este script, defina FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no seu arquivo .env.local ou variáveis de ambiente.');
  console.log('Exemplo no .env.local:');
  console.log('FIREBASE_PROJECT_ID="motoai-43ed4"');
  console.log('FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@motoai-43ed4.iam.gserviceaccount.com"');
  console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
} catch (e) {
  console.error('❌ Erro ao inicializar Firebase Admin SDK:', e.message);
  process.exit(1);
}

async function setAdminClaim() {
  console.log(`🔍 Buscando usuário Firebase Auth com e-mail: ${targetEmail}...`);
  try {
    const user = await admin.auth().getUserByEmail(targetEmail);
    console.log(`✅ Usuário encontrado! UID: ${user.uid} (${user.displayName || 'Sem Nome'})`);

    console.log(`⚙️ Atribuindo custom claim { admin: true }...`);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // Verifica se a claim foi gravada com sucesso
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('🎉 Sucesso! Claims atuais do usuário:', updatedUser.customClaims);
    console.log('');
    console.log('⚠️ IMPORTANTE: No navegador, o usuário precisa deslogar e logar novamente (ou chamar auth.currentUser.getIdToken(true)) para atualizar o token JWT com a nova claim!');
  } catch (err) {
    console.error(`❌ Erro ao atribuir custom claim:`, err.message);
  }
}

setAdminClaim();
