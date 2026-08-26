// js/analytics-capture.js — Captura de dados de acesso no frontend (sem Cloud Functions)
// Solução gratuita usando APIs públicas e Firestore direto do cliente

import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Cache para evitar múltiplas chamadas na mesma sessão
let sessionCaptured = false;
let cachedIP = null;
let cachedGeo = null;

// Detectar dispositivo e user-agent usando UAParser (carregado via CDN)
async function getDeviceInfo() {
  if (typeof UAParser === 'undefined') {
    // Carregar UAParser dinamicamente se não estiver disponível
    await loadScript('https://cdn.jsdelivr.net/npm/ua-parser-js@1.0.37/dist/ua-parser.min.js');
  }
  
  const parser = new UAParser();
  const result = parser.getResult();
  
  return {
    dispositivo: {
      tipo: result.device.type || 'desktop',
      modelo: result.device.model || 'unknown',
      vendor: result.device.vendor || 'unknown'
    },
    sistemaOperacional: {
      nome: result.os.name || 'unknown',
      versao: result.os.version || 'unknown'
    },
    navegador: {
      nome: result.browser.name || 'unknown',
      versao: result.browser.version || 'unknown'
    }
  };
}

// Detectar se é bot
function isBot() {
  const userAgent = navigator.userAgent.toLowerCase();
  const botPatterns = [
    /bot/, /crawler/, /spider/, /scraper/, /curl/, /wget/,
    /python/, /java/, /go-http/, /headless/, /phantom/,
    /slurp/, /yahoo/, /bing/, /googlebot/, /baiduspider/
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

// Obter IP e geolocalização gratuitamente (ip-api.com - plano gratuito)
async function getIPAndGeo() {
  if (cachedIP && cachedGeo) {
    return { ip: cachedIP, geo: cachedGeo };
  }
  
  try {
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,city,lat,lon,query');
    const data = await response.json();
    
    if (data.status === 'success') {
      cachedIP = data.query;
      cachedGeo = {
        cidade: data.city || 'unknown',
        pais: data.country || 'unknown',
        codigoPais: data.countryCode || 'unknown',
        lat: data.lat || 0,
        lon: data.lon || 0
      };
      return { ip: cachedIP, geo: cachedGeo };
    }
  } catch (error) {
    console.error('Erro ao obter IP/geolocalização:', error);
  }
  
  // Fallback se falhar
  return {
    ip: 'unknown',
    geo: {
      cidade: 'unknown',
      pais: 'unknown',
      codigoPais: 'unknown',
      lat: 0,
      lon: 0
    }
  };
}

// Carregar script dinamicamente
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Registrar acesso no Firestore
export async function registrarAcesso(email) {
  // Evitar múltiplos registros na mesma sessão
  if (sessionCaptured) {
    console.log('Acesso já registrado nesta sessão');
    return;
  }
  
  try {
    // Capturar dados em paralelo para otimizar
    const [deviceInfo, ipGeo] = await Promise.all([
      getDeviceInfo(),
      getIPAndGeo()
    ]);
    
    const acessoData = {
      email: email || 'unknown@lulasimulator.com.br',
      timestamp: serverTimestamp(),
      ip: ipGeo.ip,
      geolocalizacao: ipGeo.geo,
      dispositivo: deviceInfo.dispositivo,
      sistemaOperacional: deviceInfo.sistemaOperacional,
      navegador: deviceInfo.navegador,
      tipoAcesso: isBot() ? 'bot' : 'human',
      userAgent: navigator.userAgent
    };
    
    // Salvar no Firestore
    await addDoc(collection(db, 'historico_acessos'), acessoData);
    
    sessionCaptured = true;
    console.log('Acesso registrado com sucesso:', acessoData);
  } catch (error) {
    console.error('Erro ao registrar acesso:', error);
    // Não falhar o login se o registro de acesso falhar
  }
}

// Resetar flag de sessão (útil para testes)
export function resetSessionCapture() {
  sessionCaptured = false;
}
