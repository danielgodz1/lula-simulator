import { db } from './_firebaseAdmin.js';
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const {
      email,
      ip,
      geolocalizacao,
      dispositivo,
      sistemaOperacional,
      navegador,
      tipoAcesso,
      userAgent
    } = req.body || {};

    // Validação básica dos campos obrigatórios
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email inválido' });
    }

    // Sanitização do email
    const cleanEmail = email.trim().slice(0, 100);

    // Sanitização do IP
    const cleanIP = (ip || 'unknown').toString().slice(0, 45);

    // Sanitização do user-agent
    const cleanUserAgent = (userAgent || navigator.userAgent || 'unknown').toString().slice(0, 500);

    // Estrutura dos dados de geolocalização
    const geoData = geolocalizacao || {};
    const cleanGeo = {
      cidade: (geoData.cidade || 'unknown').toString().slice(0, 60),
      pais: (geoData.pais || 'unknown').toString().slice(0, 60),
      codigoPais: (geoData.codigoPais || 'unknown').toString().slice(0, 10),
      lat: typeof geoData.lat === 'number' ? geoData.lat : 0,
      lon: typeof geoData.lon === 'number' ? geoData.lon : 0
    };

    // Estrutura do dispositivo
    const deviceData = dispositivo || {};
    const cleanDevice = {
      tipo: (deviceData.tipo || 'desktop').toString().slice(0, 20),
      modelo: (deviceData.modelo || 'unknown').toString().slice(0, 60),
      vendor: (deviceData.vendor || 'unknown').toString().slice(0, 60)
    };

    // Estrutura do sistema operacional
    const osData = sistemaOperacional || {};
    const cleanOS = {
      nome: (osData.nome || 'unknown').toString().slice(0, 30),
      versao: (osData.versao || 'unknown').toString().slice(0, 30)
    };

    // Estrutura do navegador
    const browserData = navegador || {};
    const cleanBrowser = {
      nome: (browserData.nome || 'unknown').toString().slice(0, 30),
      versao: (browserData.versao || 'unknown').toString().slice(0, 30)
    };

    // Validação do tipo de acesso
    const cleanTipoAcesso = (tipoAcesso === 'bot' || tipoAcesso === 'human') ? tipoAcesso : 'human';

    const acessoData = {
      email: cleanEmail,
      timestamp: new Date().toISOString(),
      ip: cleanIP,
      geolocalizacao: cleanGeo,
      dispositivo: cleanDevice,
      sistemaOperacional: cleanOS,
      navegador: cleanBrowser,
      tipoAcesso: cleanTipoAcesso,
      userAgent: cleanUserAgent
    };

    // Salvar no Firestore usando Admin SDK
    if (db) {
      try {
        await db.collection('historico_acessos').add(acessoData);
        console.log('Acesso registrado no Firestore:', cleanEmail);
      } catch (firestoreError) {
        console.error('Erro ao salvar no Firestore Admin:', firestoreError);
        // Fallback para REST API se Admin SDK falhar
        await saveViaRESTAPI(acessoData);
      }
    } else {
      // Fallback para REST API se Admin SDK não estiver configurado
      await saveViaRESTAPI(acessoData);
    }

    return res.status(200).json({ success: true, message: 'Acesso registrado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar access-log:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Fallback para salvar via Firestore REST API
async function saveViaRESTAPI(data) {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/historico_acessos?documentId=${Date.now()}`;

  const payload = {
    fields: {
      email: { stringValue: data.email },
      timestamp: { timestampValue: data.timestamp },
      ip: { stringValue: data.ip },
      geolocalizacao: {
        mapValue: {
          fields: {
            cidade: { stringValue: data.geolocalizacao.cidade },
            pais: { stringValue: data.geolocalizacao.pais },
            codigoPais: { stringValue: data.geolocalizacao.codigoPais },
            lat: { doubleValue: data.geolocalizacao.lat },
            lon: { doubleValue: data.geolocalizacao.lon }
          }
        }
      },
      dispositivo: {
        mapValue: {
          fields: {
            tipo: { stringValue: data.dispositivo.tipo },
            modelo: { stringValue: data.dispositivo.modelo },
            vendor: { stringValue: data.dispositivo.vendor }
          }
        }
      },
      sistemaOperacional: {
        mapValue: {
          fields: {
            nome: { stringValue: data.sistemaOperacional.nome },
            versao: { stringValue: data.sistemaOperacional.versao }
          }
        }
      },
      navegador: {
        mapValue: {
          fields: {
            nome: { stringValue: data.navegador.nome },
            versao: { stringValue: data.navegador.versao }
          }
        }
      },
      tipoAcesso: { stringValue: data.tipoAcesso },
      userAgent: { stringValue: data.userAgent }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`REST API falhou: ${response.status}`);
  }

  console.log('Acesso registrado via REST API fallback');
}
