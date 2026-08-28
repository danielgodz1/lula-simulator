// js/analytics-capture.js — Captura de dados de acesso no frontend (via API)
// Solução segura usando API backend em vez de escrita direta no Firestore

// Cache para evitar múltiplas chamadas na mesma sessão
let sessionCaptured = false;
let cachedIP = null;
let cachedGeo = null;

// Detectar dispositivo e user-agent usando UAParser + Client Hints API
async function getDeviceInfo() {
  if (typeof UAParser === 'undefined') {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/ua-parser-js@1.0.37/dist/ua-parser.min.js');
    } catch (e) {}
  }
  
  let result = { device: {}, os: {}, browser: {} };
  if (typeof UAParser !== 'undefined') {
    try {
      const parser = new UAParser();
      result = parser.getResult();
    } catch (e) {}
  }

  const ua = navigator.userAgent || '';
  let tipo = result.device.type || (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) ? 'tablet' : (/mobile|iphone|ipod|android|blackberry|iemobile/i.test(ua) ? 'mobile' : 'desktop'));
  let vendor = result.device.vendor || 'unknown';
  let modelo = result.device.model || 'unknown';
  let osNome = result.os.name || 'unknown';
  let osVersao = result.os.version || 'unknown';
  let browserNome = result.browser.name || 'unknown';
  let browserVersao = result.browser.version || 'unknown';

  // Tenta Client Hints API moderna (Chrome 130+ Android / Desktop para extrair o modelo real sem "K")
  if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
    try {
      const hints = await navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion']);
      if (hints.model && hints.model !== 'K' && hints.model !== '') {
        modelo = hints.model;
      }
      if (hints.platform && osNome === 'unknown') {
        osNome = hints.platform;
      }
    } catch (_) {}
  }

  // Fallbacks inteligentes de fabricante e modelo
  if (vendor === 'unknown' || vendor === '') {
    if (/iphone|ipad|ipod|macintosh/i.test(ua)) {
      vendor = 'Apple';
      if (modelo === 'unknown') {
        if (/iphone/i.test(ua)) modelo = 'iPhone';
        else if (/ipad/i.test(ua)) modelo = 'iPad';
        else if (/mac/i.test(ua)) modelo = 'Mac';
      }
    } else if (/samsung|sm-[a-z0-9]+/i.test(ua)) {
      vendor = 'Samsung';
    } else if (/xiaomi|redmi|poco/i.test(ua)) {
      vendor = 'Xiaomi';
    } else if (/motorola|moto/i.test(ua)) {
      vendor = 'Motorola';
    } else if (/huawei|honor/i.test(ua)) {
      vendor = 'Huawei';
    }
  }

  // Fallback de SO
  if (osNome === 'unknown' || osNome === '') {
    if (/android/i.test(ua)) osNome = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) osNome = 'iOS';
    else if (/windows/i.test(ua)) osNome = 'Windows';
    else if (/macintosh|mac os/i.test(ua)) osNome = 'macOS';
    else if (/linux/i.test(ua)) osNome = 'Linux';
  }

  // Fallback de Navegador
  if (browserNome === 'unknown' || browserNome === '') {
    if (/edg/i.test(ua)) browserNome = 'Edge';
    else if (/opr|opera/i.test(ua)) browserNome = 'Opera';
    else if (/chrome|crios/i.test(ua)) browserNome = 'Chrome';
    else if (/safari/i.test(ua)) browserNome = 'Safari';
    else if (/firefox|fxios/i.test(ua)) browserNome = 'Firefox';
  }
  
  return {
    dispositivo: {
      tipo,
      modelo: modelo !== 'unknown' ? modelo : (tipo === 'desktop' ? 'PC / Mac' : 'Smartphone'),
      vendor: vendor !== 'unknown' ? vendor : 'Genérico'
    },
    sistemaOperacional: {
      nome: osNome,
      versao: osVersao
    },
    navegador: {
      nome: browserNome,
      versao: browserVersao
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

// Obter IP e geolocalização com cascata resiliente HTTPS (ipapi.co -> ipwho.is -> freeipapi.com)
async function getIPAndGeo() {
  if (cachedIP && cachedGeo) {
    return { ip: cachedIP, geo: cachedGeo };
  }
  
  // 1. Tentativa: ipapi.co (HTTPS, gratuito)
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error && data.ip) {
        cachedIP = data.ip;
        cachedGeo = {
          cidade: data.city || 'unknown',
          pais: data.country_name || data.country || 'unknown',
          codigoPais: data.country_code || data.country || 'unknown',
          lat: typeof data.latitude === 'number' ? data.latitude : 0,
          lon: typeof data.longitude === 'number' ? data.longitude : 0
        };
        return { ip: cachedIP, geo: cachedGeo };
      }
    }
  } catch (_) {}

  // 2. Tentativa: ipwho.is (HTTPS, gratuito, sem chave)
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        cachedIP = data.ip;
        cachedGeo = {
          cidade: data.city || 'unknown',
          pais: data.country || 'unknown',
          codigoPais: data.country_code || 'unknown',
          lat: typeof data.latitude === 'number' ? data.latitude : 0,
          lon: typeof data.longitude === 'number' ? data.longitude : 0
        };
        return { ip: cachedIP, geo: cachedGeo };
      }
    }
  } catch (_) {}

  // 3. Tentativa: freeipapi.com (HTTPS, gratuito)
  try {
    const res = await fetch('https://freeipapi.com/api/json');
    if (res.ok) {
      const data = await res.json();
      if (data && data.ipAddress) {
        cachedIP = data.ipAddress;
        cachedGeo = {
          cidade: data.cityName || 'unknown',
          pais: data.countryName || 'unknown',
          codigoPais: data.countryCode || 'unknown',
          lat: typeof data.latitude === 'number' ? data.latitude : 0,
          lon: typeof data.longitude === 'number' ? data.longitude : 0
        };
        return { ip: cachedIP, geo: cachedGeo };
      }
    }
  } catch (_) {}
  
  // Fallback padrão se todas as redes de geo falharem
  return {
    ip: 'unknown',
    geo: {
      cidade: 'unknown',
      pais: 'Brasil',
      codigoPais: 'BR',
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

// Registrar acesso via API backend (seguro)
export async function registrarAcesso(email) {
  // Evitar múltiplos registros na mesma sessão
  if (sessionCaptured) {
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
      ip: ipGeo.ip,
      geolocalizacao: ipGeo.geo,
      dispositivo: deviceInfo.dispositivo,
      sistemaOperacional: deviceInfo.sistemaOperacional,
      navegador: deviceInfo.navegador,
      tipoAcesso: isBot() ? 'bot' : 'human',
      userAgent: navigator.userAgent
    };
    
    // Enviar para API backend (seguro)
    const response = await fetch('/api/access-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acessoData)
    });
    
    if (response.ok) {
      sessionCaptured = true;
    }
  } catch (error) {
    console.warn('Registro de acesso:', error.message);
  }
}

// Resetar flag de sessão (útil para testes)
export function resetSessionCapture() {
  sessionCaptured = false;
}
