// Firebase Cloud Functions - Registro de Acessos
// Captura dados de login e salva no Firestore

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const UAParser = require('ua-parser-js');
const axios = require('axios');

admin.initializeApp();

// Coleção Firestore para histórico de acessos
const COLLECTION_NAME = 'historico_acessos';

/**
 * Cloud Function: registrarAcessoLogin
 * Disparada quando um usuário faz login com Nome e E-mail
 * Captura: email, timestamp, IP, geolocalização, user-agent
 */
exports.registrarAcessoLogin = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário não autenticado'
      );
    }

    const { email } = data;
    const uid = context.auth.uid;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Capturar IP do usuário
    const ip = context.rawRequest?.headers?.['x-forwarded-for']?.split(',')[0] ||
               context.rawRequest?.headers?.['x-real-ip'] ||
               context.rawRequest?.connection?.remoteAddress ||
               'unknown';

    // Capturar User-Agent
    const userAgent = context.rawRequest?.headers?.['user-agent'] || 'unknown';

    // Parsear User-Agent para extrair informações do dispositivo
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    // Geolocalização por IP (usando ip-api gratuito)
    let geoData = {
      cidade: 'unknown',
      pais: 'unknown',
      codigoPais: 'unknown',
      lat: 0,
      lon: 0
    };

    try {
      const geoResponse = await axios.get(`http://ip-api.com/json/${ip}`);
      if (geoResponse.data && geoResponse.data.status === 'success') {
        geoData = {
          cidade: geoResponse.data.city || 'unknown',
          pais: geoResponse.data.country || 'unknown',
          codigoPais: geoResponse.data.countryCode || 'unknown',
          lat: geoResponse.data.lat || 0,
          lon: geoResponse.data.lon || 0
        };
      }
    } catch (geoError) {
      console.error('Erro na geolocalização:', geoError.message);
      // Continua sem geolocalização
    }

    // Detectar tipo de acesso (Humano vs Robô)
    const isBot = detectBot(userAgent, uaResult);

    // Estruturar dados para salvar
    const acessoData = {
      uid,
      email: email || context.auth.token.email || 'unknown',
      timestamp,
      ip,
      geolocalizacao: geoData,
      dispositivo: {
        tipo: detectDeviceType(uaResult), // Desktop, Mobile, Tablet
        modelo: uaResult.device.model || 'unknown',
        vendor: uaResult.device.vendor || 'unknown'
      },
      sistemaOperacional: {
        nome: uaResult.os.name || 'unknown',
        versao: uaResult.os.version || 'unknown'
      },
      navegador: {
        nome: uaResult.browser.name || 'unknown',
        versao: uaResult.browser.version || 'unknown',
        engine: uaResult.engine.name || 'unknown'
      },
      tipoAcesso: isBot ? 'bot' : 'human',
      userAgent: userAgent.substring(0, 500) // Limitar tamanho
    };

    // Salvar no Firestore
    const docRef = await admin.firestore()
      .collection(COLLECTION_NAME)
      .add(acessoData);

    console.log(`Acesso registrado: ${docRef.id} para usuário ${uid}`);

    return {
      success: true,
      acessoId: docRef.id,
      message: 'Acesso registrado com sucesso'
    };

  } catch (error) {
    console.error('Erro ao registrar acesso:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao registrar acesso: ' + error.message
    );
  }
});

/**
 * Detecta tipo de dispositivo baseado no UA
 */
function detectDeviceType(uaResult) {
  const deviceType = uaResult.device.type;
  
  if (deviceType === 'mobile') return 'mobile';
  if (deviceType === 'tablet') return 'tablet';
  if (deviceType === 'smarttv') return 'tv';
  if (deviceType === 'wearable') return 'wearable';
  if (deviceType === 'console') return 'console';
  
  // Se não especificado, tenta inferir
  if (uaResult.os.name === 'Android' || uaResult.os.name === 'iOS') {
    return 'mobile';
  }
  
  return 'desktop'; // Padrão
}

/**
 * Detecta se o acesso é de um bot/automatizado
 */
function detectBot(userAgent, uaResult) {
  const botKeywords = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
    'python', 'java', 'node', 'ruby', 'php', 'perl',
    'headless', 'phantom', 'selenium', 'puppeteer',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandexbot', 'facebookexternalhit',
    'twitterbot', 'linkedinbot', 'whatsapp', 'telegram'
  ];

  const uaLower = userAgent.toLowerCase();
  
  // Verificar palavras-chave de bot
  for (const keyword of botKeywords) {
    if (uaLower.includes(keyword)) {
      return true;
    }
  }

  // Verificar se o UA é muito curto (suspeito)
  if (userAgent.length < 20) {
    return true;
  }

  // Verificar se não tem informações de navegador
  if (!uaResult.browser.name && !uaResult.os.name) {
    return true;
  }

  return false;
}

/**
 * Cloud Function: obterHistoricoAcessos
 * Retorna histórico de acessos com filtros opcionais
 */
exports.obterHistoricoAcessos = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação (opcional - pode ser público com rate limiting)
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário não autenticado'
      );
    }

    const {
      dispositivo,
      sistemaOperacional,
      navegador,
      tipoAcesso,
      pais,
      limite = 100
    } = data;

    let query = admin.firestore()
      .collection(COLLECTION_NAME)
      .orderBy('timestamp', 'desc')
      .limit(limite);

    // Aplicar filtros
    if (dispositivo) {
      query = query.where('dispositivo.tipo', '==', dispositivo);
    }
    if (sistemaOperacional) {
      query = query.where('sistemaOperacional.nome', '==', sistemaOperacional);
    }
    if (navegador) {
      query = query.where('navegador.nome', '==', navegador);
    }
    if (tipoAcesso) {
      query = query.where('tipoAcesso', '==', tipoAcesso);
    }
    if (pais) {
      query = query.where('geolocalizacao.codigoPais', '==', pais);
    }

    const snapshot = await query.get();
    const acessos = [];

    snapshot.forEach(doc => {
      acessos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      acessos,
      total: acessos.length
    };

  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao obter histórico: ' + error.message
    );
  }
});

/**
 * Cloud Function: obterEstatisticasAcessos
 * Retorna estatísticas agregadas dos acessos
 */
exports.obterEstatisticasAcessos = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário não autenticado'
      );
    }

    const { dias = 30 } = data;
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    let query = admin.firestore()
      .collection(COLLECTION_NAME)
      .where('timestamp', '>=', dataInicio);

    const snapshot = await query.get();

    const estatisticas = {
      totalAcessos: snapshot.size,
      porDispositivo: {},
      porSistemaOperacional: {},
      porNavegador: {},
      porPais: {},
      porTipoAcesso: {
        human: 0,
        bot: 0
      },
      acessosPorDia: {}
    };

    snapshot.forEach(doc => {
      const data = doc.data();

      // Por dispositivo
      const dispositivo = data.dispositivo?.tipo || 'unknown';
      estatisticas.porDispositivo[dispositivo] = (estatisticas.porDispositivo[dispositivo] || 0) + 1;

      // Por SO
      const so = data.sistemaOperacional?.nome || 'unknown';
      estatisticas.porSistemaOperacional[so] = (estatisticas.porSistemaOperacional[so] || 0) + 1;

      // Por navegador
      const nav = data.navegador?.nome || 'unknown';
      estatisticas.porNavegador[nav] = (estatisticas.porNavegador[nav] || 0) + 1;

      // Por país
      const pais = data.geolocalizacao?.codigoPais || 'unknown';
      estatisticas.porPais[pais] = (estatisticas.porPais[pais] || 0) + 1;

      // Por tipo de acesso
      const tipo = data.tipoAcesso || 'unknown';
      if (tipo === 'human' || tipo === 'bot') {
        estatisticas.porTipoAcesso[tipo]++;
      }

      // Por dia
      if (data.timestamp) {
        const dia = new Date(data.timestamp._seconds * 1000).toISOString().split('T')[0];
        estatisticas.acessosPorDia[dia] = (estatisticas.acessosPorDia[dia] || 0) + 1;
      }
    });

    return {
      success: true,
      estatisticas
    };

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao obter estatísticas: ' + error.message
    );
  }
});
