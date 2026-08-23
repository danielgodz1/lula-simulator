// scripts/backup-database.js — Script de Backup Completo e Extração de Schemas do Firestore
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

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';

console.log(`🚀 Iniciando backup do banco de dados Firestore [Projeto: ${PROJECT_ID}]...`);

const COLLECTIONS = [
  'lula_leaderboards_v2',
  'lula_scores_v2',
  'lula_runner_scores_v2',
  'lula_users_v2',
  'lula_feedbacks',
  'lula_analytics_v2',
  'lula_contatos'
];

function parseFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(v => parseFirestoreValue(v));
  }
  if ('mapValue' in val) {
    const res = {};
    const fields = val.mapValue?.fields || {};
    for (const k of Object.keys(fields)) {
      res[k] = parseFirestoreValue(fields[k]);
    }
    return res;
  }
  return val;
}

function parseFirestoreDoc(doc) {
  if (!doc) return null;
  const docId = doc.name ? doc.name.split('/').pop() : 'unknown';
  const data = {};
  const fields = doc.fields || {};
  for (const k of Object.keys(fields)) {
    data[k] = parseFirestoreValue(fields[k]);
  }
  return {
    _id: docId,
    _createTime: doc.createTime,
    _updateTime: doc.updateTime,
    ...data
  };
}

async function fetchCollectionREST(collName) {
  console.log(`📦 Baixando coleção: ${collName}...`);
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collName}?pageSize=300`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) {
        console.log(`ℹ️ Coleção ${collName} está vazia ou não existe.`);
        return [];
      }
      console.warn(`⚠️ Aviso ao consultar ${collName} (HTTP ${res.status}): ${res.statusText}`);
      return [];
    }
    const json = await res.json();
    const docs = json.documents || [];
    const parsed = docs.map(d => parseFirestoreDoc(d));
    console.log(`✅ Coleção ${collName}: ${parsed.length} documento(s) exportado(s).`);
    return parsed;
  } catch (err) {
    console.warn(`❌ Erro ao baixar coleção ${collName}:`, err.message);
    return [];
  }
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(rootDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupData = {
    metadata: {
      projectId: PROJECT_ID,
      exportedAt: new Date().toISOString(),
      version: '2.0',
      totalCollections: COLLECTIONS.length
    },
    collections: {}
  };

  let totalDocs = 0;
  let useAdminSDK = false;

  // Tenta usar Firebase Admin SDK se configurado
  try {
    const adminModule = await import('../api/_firebaseAdmin.js');
    const db = adminModule.db;
    if (db && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      useAdminSDK = true;
      console.log(`🔐 Autenticação Admin SDK ativa. Baixando todas as coleções com privilégio total...`);
      for (const coll of COLLECTIONS) {
        console.log(`📦 Baixando coleção via Admin SDK: ${coll}...`);
        try {
          const snapshot = await db.collection(coll).get();
          const docs = snapshot.docs.map(doc => {
            const data = doc.data();
            // Formata timestamps do Firestore
            for (const key of Object.keys(data)) {
              if (data[key] && typeof data[key].toDate === 'function') {
                data[key] = data[key].toDate().toISOString();
              }
            }
            return { _id: doc.id, ...data };
          });
          backupData.collections[coll] = docs;
          totalDocs += docs.length;
          console.log(`✅ Coleção ${coll}: ${docs.length} documento(s) exportado(s).`);
        } catch (colErr) {
          console.warn(`⚠️ Falha ao baixar ${coll} via Admin SDK, tentando REST:`, colErr.message);
          const docs = await fetchCollectionREST(coll);
          backupData.collections[coll] = docs;
          totalDocs += docs.length;
        }
      }
    }
  } catch (e) {
    useAdminSDK = false;
  }

  if (!useAdminSDK) {
    console.log(`🌐 Baixando coleções públicas via Firestore REST API...`);
    for (const coll of COLLECTIONS) {
      const docs = await fetchCollectionREST(coll);
      backupData.collections[coll] = docs;
      totalDocs += docs.length;
    }
  }

  backupData.metadata.totalDocuments = totalDocs;
  backupData.metadata.exportMode = useAdminSDK ? 'Admin_SDK_Full' : 'Firestore_REST_Public';

  // 1. Salva arquivo JSON completo com carimbo de data/hora
  const backupFileName = `firestore_backup_${timestamp}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');

  // 2. Salva também como backup_latest.json
  const latestFilePath = path.join(backupDir, 'backup_latest.json');
  fs.writeFileSync(latestFilePath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`\n🎉 Backup concluído com sucesso!`);
  console.log(`📁 Arquivo salvo em: ${backupFilePath}`);
  console.log(`📊 Total de documentos exportados: ${totalDocs}`);

  return { backupFilePath, totalDocs, backupData };
}

runBackup().catch(err => {
  console.error('❌ Falha fatal no backup:', err);
  process.exit(1);
});
