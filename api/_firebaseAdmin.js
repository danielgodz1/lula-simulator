// api/_firebaseAdmin.js — Inicialização Centralizada e Segura do Firebase Admin SDK
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

// Formata quebras de linha da chave privada vindas de variáveis de ambiente da Vercel
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

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
      console.warn('⚠️ Firebase Admin SDK: FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY não configuradas. Inicializando com Project ID.');
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
