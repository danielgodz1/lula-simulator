// api/_firebaseAdmin.js — Inicialização Centralizada e Segura do Firebase Admin SDK com Tratamento de Chaves
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

// Tratamento robusto para a chave privada (remove aspas externas se houver e formata quebras de linha)
let privateKey = rawPrivateKey ? rawPrivateKey.trim() : undefined;
if (privateKey) {
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  try {
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      console.log('✅ Firebase Admin SDK inicializado com sucesso via Credential Cert.');
    } else {
      console.warn('⚠️ Firebase Admin SDK: FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY não configuradas. Inicializando apenas com Project ID.');
      admin.initializeApp({
        projectId
      });
    }
  } catch (initErr) {
    console.error('❌ Erro crítico ao inicializar o Firebase Admin SDK:', initErr);
  }
}

export const db = admin.firestore();
export default admin;
