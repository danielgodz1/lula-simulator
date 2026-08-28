import { db } from './_firebaseAdmin.js';
import { applyCors } from './_cors.js';

// Mapeamento de nomes de países em Português
const COUNTRY_NAMES = {
  BR: 'Brasil',
  PT: 'Portugal',
  US: 'Estados Unidos',
  AR: 'Argentina',
  UY: 'Uruguai',
  PY: 'Paraguai',
  CL: 'Chile',
  CO: 'Colômbia',
  PE: 'Peru',
  MX: 'México',
  ES: 'Espanha',
  FR: 'França',
  DE: 'Alemanha',
  IT: 'Itália',
  GB: 'Reino Unido',
  CA: 'Canadá',
  JP: 'Japão',
  CN: 'China',
  RU: 'Rússia',
  AU: 'Austrália',
  AO: 'Angola',
  MZ: 'Moçambique',
  CV: 'Cabo Verde',
  IN: 'Índia',
  KR: 'Coreia do Sul',
  NL: 'Holanda',
  BE: 'Bélgica',
  CH: 'Suíça',
  SE: 'Suécia',
  NO: 'Noruega',
  IE: 'Irlanda',
  BO: 'Bolívia',
  VE: 'Venezuela',
  EC: 'Equador',
  CU: 'Cuba'
};

// Converte código ISO 2 letras em bandeira Emoji (ex: 'BR' -> 🇧🇷)
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';
  const hasAdminCreds = Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
  const analyticsDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_analytics_v2/summary`;

  // 1. GET: Retorna dados consolidados de visitas e países
  if (req.method === 'GET') {
    try {
      let analyticsData = null;

      // Tentativa 1: Firebase Admin SDK (somente se credenciais completas existirem)
      if (hasAdminCreds && db) {
        try {
          const docSnap = await db.collection('lula_analytics_v2').doc('summary').get();
          if (docSnap.exists) {
            analyticsData = docSnap.data();
          }

          // Enriquece com dados detalhados recentes de historico_acessos
          try {
            const histSnap = await db.collection('historico_acessos').orderBy('timestamp', 'desc').limit(60).get();
            if (!histSnap.empty) {
              const histVisits = histSnap.docs.map(d => {
                const item = d.data();
                let code = (item.geolocalizacao?.codigoPais || '').toUpperCase();
                if (!code || code === 'UNKNOWN' || code.length !== 2) code = 'BR';
                let pais = item.geolocalizacao?.pais || '';
                if (!pais || pais.toLowerCase() === 'unknown') pais = COUNTRY_NAMES[code] || 'Brasil';
                let cidade = item.geolocalizacao?.cidade || '';
                if (!cidade || cidade.toLowerCase() === 'unknown') cidade = (code === 'BR' ? 'Brasil' : 'Global');

                return {
                  country: code,
                  countryName: pais,
                  flag: getFlagEmoji(code),
                  city: cidade,
                  device: item.dispositivo?.modelo || '',
                  deviceType: item.dispositivo?.tipo || 'desktop',
                  os: item.sistemaOperacional?.nome || '',
                  browser: item.navegador?.nome || '',
                  timestamp: item.timestamp || new Date().toISOString()
                };
              });

              const existing = analyticsData?.recentVisits || [];
              const combined = [...histVisits, ...existing];
              const seen = new Set();
              const uniqueVisits = combined.filter(x => {
                const key = `${x.country}_${x.city}_${x.timestamp}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              }).slice(0, 200);

              if (analyticsData) {
                analyticsData.recentVisits = uniqueVisits;
              } else {
                analyticsData = {
                  totalVisits: Math.max(1, uniqueVisits.length),
                  countries: { BR: 1 },
                  recentVisits: uniqueVisits,
                  updatedAt: new Date().toISOString()
                };
              }
            }
          } catch (_) {}
        } catch (adminErr) {
          console.warn('Fallback para Firestore REST API no GET:', adminErr.message);
        }
      }

      // Tentativa 2: Firestore REST API Direto e Ultra-rápido
      if (!analyticsData) {
        const fireRes = await fetch(analyticsDocUrl);
        if (fireRes.ok) {
          const doc = await fireRes.json();
          const fields = doc.fields || {};
          
          const totalVisits = parseInt(fields.totalVisits?.integerValue || '0', 10);
          const countriesMap = {};
          if (fields.countries?.mapValue?.fields) {
            for (const [code, val] of Object.entries(fields.countries.mapValue.fields)) {
              countriesMap[code] = parseInt(val.integerValue || '0', 10);
            }
          }

          const recentVisits = (fields.recentVisits?.arrayValue?.values || []).map(v => {
            const f = v.mapValue?.fields || {};
            let c = (f.country?.stringValue || '').toUpperCase();
            if (!c || c === 'UNKNOWN' || c.length !== 2) c = 'BR';
            let cName = f.countryName?.stringValue || '';
            if (!cName || cName.toLowerCase() === 'unknown') cName = COUNTRY_NAMES[c] || 'Brasil';
            let city = f.city?.stringValue || '';
            if (!city || city.toLowerCase() === 'unknown' || city === 'Desconhecida') city = (c === 'BR' ? 'Brasil' : 'Global');

            return {
              country: c,
              countryName: cName,
              flag: f.flag?.stringValue || getFlagEmoji(c),
              city: city,
              device: f.device?.stringValue || f.dispositivo?.stringValue || '',
              deviceType: f.deviceType?.stringValue || f.dispositivoTipo?.stringValue || 'desktop',
              os: f.os?.stringValue || f.sistemaOperacional?.stringValue || '',
              browser: f.browser?.stringValue || f.navegador?.stringValue || '',
              timestamp: f.timestamp?.stringValue || new Date().toISOString()
            };
          });

          analyticsData = {
            totalVisits,
            countries: countriesMap,
            recentVisits,
            updatedAt: fields.updatedAt?.timestampValue || new Date().toISOString()
          };
        }
      }

      // Se ainda não existirem dados (primeiro acesso), cria estrutura padrão com Brasil líder
      if (!analyticsData) {
        analyticsData = {
          totalVisits: 1,
          countries: { BR: 1 },
          recentVisits: [
            {
              country: 'BR',
              countryName: 'Brasil',
              flag: '🇧🇷',
              city: 'Brasília',
              timestamp: new Date().toISOString()
            }
          ],
          updatedAt: new Date().toISOString()
        };
      }

      const totalVisits = Math.max(1, analyticsData.totalVisits || 0);
      const countriesRaw = analyticsData.countries || { BR: 1 };

      // Constrói lista ordenada de países com métricas e porcentagens
      const countriesList = Object.entries(countriesRaw)
        .map(([code, count]) => {
          const cCode = (code || 'BR').toUpperCase();
          const cCount = Math.max(0, parseInt(count, 10) || 0);
          const percentage = ((cCount / totalVisits) * 100).toFixed(1);
          return {
            code: cCode,
            name: COUNTRY_NAMES[cCode] || cCode,
            flag: getFlagEmoji(cCode),
            count: cCount,
            percentage: parseFloat(percentage)
          };
        })
        .filter(c => c.count > 0)
        .sort((a, b) => b.count - a.count);

      return res.status(200).json({
        success: true,
        totalVisits,
        totalCountries: countriesList.length,
        topCountry: countriesList[0] || { code: 'BR', name: 'Brasil', flag: '🇧🇷', count: totalVisits, percentage: 100 },
        countries: countriesList,
        recentVisits: (analyticsData.recentVisits || []).slice(0, 200),
        updatedAt: analyticsData.updatedAt || new Date().toISOString()
      });
    } catch (e) {
      console.error('Erro ao consultar analytics:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // 2. POST: Registra uma nova visita detectando o país com validação de dispositivo único
  if (req.method === 'POST') {
    try {
      const { deviceId, isNewDevice } = req.body || {};
      const cleanDeviceId = (deviceId && typeof deviceId === 'string')
        ? deviceId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64)
        : null;

      // Detecção de País e Cidade via Headers da Vercel / Cloudflare
      let countryCode = (
        req.headers['x-vercel-ip-country'] ||
        req.headers['cf-ipcountry'] ||
        req.headers['x-country-code'] ||
        req.body?.country ||
        'BR'
      ).toUpperCase().trim().slice(0, 2);

      // Validação básica do código de país
      if (!/^[A-Z]{2}$/.test(countryCode)) {
        countryCode = 'BR';
      }

      let city = (
        req.headers['x-vercel-ip-city'] ||
        req.body?.city ||
        ''
      ).trim().slice(0, 40);

      // Decodifica possíveis caracteres especiais da Vercel na cidade
      try {
        city = decodeURIComponent(city);
      } catch (_) {}

      if (!city) {
        city = countryCode === 'BR' ? 'Brasil' : 'Global';
      }

      const countryName = COUNTRY_NAMES[countryCode] || countryCode;
      const flag = getFlagEmoji(countryCode);

      const alreadyRegisteredResponse = {
        success: true,
        alreadyRegistered: true,
        country: countryCode,
        countryName,
        flag,
        city
      };

      // 1. Se o dispositivo já foi computado pelo cliente, não contabiliza novamente
      if (isNewDevice === false) {
        return res.status(200).json(alreadyRegisteredResponse);
      }

      // 2. Verificação no Firebase Admin SDK de dispositivo único existente
      if (hasAdminCreds && db && cleanDeviceId) {
        try {
          const devRef = db.collection('lula_devices_v2').doc(cleanDeviceId);
          const devSnap = await devRef.get();

          if (devSnap.exists) {
            // Computador/Celular já conhecido! Não duplica a contagem
            return res.status(200).json(alreadyRegisteredResponse);
          }

          // Registra o novo dispositivo único
          await devRef.set({
            firstSeen: new Date().toISOString(),
            country: countryCode,
            city
          });
        } catch (devErr) {
          console.warn('⚠️ Falha ao consultar lula_devices_v2 no Firestore Admin:', devErr.message);
        }
      }

      // 3. Verificação no Fallback REST de dispositivo único existente
      if (!hasAdminCreds && cleanDeviceId) {
        try {
          const devDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_devices_v2/${cleanDeviceId}`;
          const devCheckRes = await fetch(devDocUrl);
          if (devCheckRes.ok) {
            return res.status(200).json(alreadyRegisteredResponse);
          }

          await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_devices_v2?documentId=${cleanDeviceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                firstSeen: { timestampValue: new Date().toISOString() },
                country: { stringValue: countryCode },
                city: { stringValue: city }
              }
            })
          });
        } catch (restDevErr) {
          console.warn('⚠️ Falha ao registrar dispositivo no fallback REST:', restDevErr.message);
        }
      }

      const ua = req.headers['user-agent'] || '';
      let detectedDeviceType = req.body?.deviceType || 'desktop';
      let detectedOS = req.body?.os || '';
      let detectedBrowser = req.body?.browser || '';
      let detectedDevice = req.body?.device || '';

      if (!detectedOS) {
        if (/android/i.test(ua)) detectedOS = 'Android';
        else if (/iphone|ipad|ipod/i.test(ua)) detectedOS = 'iOS';
        else if (/windows/i.test(ua)) detectedOS = 'Windows';
        else if (/macintosh|mac os/i.test(ua)) detectedOS = 'macOS';
        else if (/linux/i.test(ua)) detectedOS = 'Linux';
      }

      if (!detectedBrowser) {
        if (/edg/i.test(ua)) detectedBrowser = 'Edge';
        else if (/opr|opera/i.test(ua)) detectedBrowser = 'Opera';
        else if (/firefox|fxios/i.test(ua)) detectedBrowser = 'Firefox';
        else if (/chrome|crios/i.test(ua)) detectedBrowser = 'Chrome';
        else if (/safari/i.test(ua)) detectedBrowser = 'Safari';
      }

      if (!detectedDeviceType || detectedDeviceType === 'desktop') {
        if (/mobile|iphone|ipod|android/i.test(ua)) detectedDeviceType = 'mobile';
        else if (/tablet|ipad/i.test(ua)) detectedDeviceType = 'tablet';
      }

      const visitRecord = {
        country: countryCode,
        countryName,
        flag,
        city,
        device: detectedDevice,
        deviceType: detectedDeviceType,
        os: detectedOS,
        browser: detectedBrowser,
        timestamp: new Date().toISOString()
      };

      // Atualização no Firestore via Admin SDK (se configurado)
      if (hasAdminCreds && db) {
        try {
          const docRef = db.collection('lula_analytics_v2').doc('summary');
          const docSnap = await docRef.get();

          if (docSnap.exists) {
            const data = docSnap.data();
            const currentTotal = (data.totalVisits || 0) + 1;
            const countries = data.countries || {};
            countries[countryCode] = (countries[countryCode] || 0) + 1;

            const recentVisits = [visitRecord, ...(data.recentVisits || [])].slice(0, 200);

            await docRef.set({
              totalVisits: currentTotal,
              countries,
              recentVisits,
              updatedAt: new Date().toISOString()
            }, { merge: true });

            return res.status(200).json({
              success: true,
              registered: true,
              country: countryCode,
              countryName,
              flag,
              city
            });
          } else {
            await docRef.set({
              totalVisits: 1,
              countries: { [countryCode]: 1 },
              recentVisits: [visitRecord],
              updatedAt: new Date().toISOString()
            });

            return res.status(200).json({
              success: true,
              registered: true,
              country: countryCode,
              countryName,
              flag,
              city
            });
          }
        } catch (adminWriteErr) {
          console.warn('Erro com Firebase Admin SDK no POST, tentando REST API:', adminWriteErr.message);
        }
      }

      // Fallback: Firestore REST API
      try {
        const getRes = await fetch(analyticsDocUrl);
        let currentTotal = 0;
        let countriesMap = {};
        let recentVisits = [];

        if (getRes.ok) {
          const doc = await getRes.json();
          const f = doc.fields || {};
          currentTotal = parseInt(f.totalVisits?.integerValue || '0', 10);
          if (f.countries?.mapValue?.fields) {
            for (const [k, v] of Object.entries(f.countries.mapValue.fields)) {
              countriesMap[k] = parseInt(v.integerValue || '0', 10);
            }
          }
          recentVisits = (f.recentVisits?.arrayValue?.values || []).map(v => {
            const rf = v.mapValue?.fields || {};
            return {
              country: rf.country?.stringValue || 'BR',
              countryName: rf.countryName?.stringValue || 'Brasil',
              flag: rf.flag?.stringValue || '🇧🇷',
              city: rf.city?.stringValue || 'Desconhecida',
              device: rf.device?.stringValue || '',
              deviceType: rf.deviceType?.stringValue || 'desktop',
              os: rf.os?.stringValue || '',
              browser: rf.browser?.stringValue || '',
              timestamp: rf.timestamp?.stringValue || new Date().toISOString()
            };
          });
        }

        currentTotal += 1;
        countriesMap[countryCode] = (countriesMap[countryCode] || 0) + 1;
        recentVisits = [visitRecord, ...recentVisits].slice(0, 200);

        // Constrói payload REST
        const countryFields = {};
        for (const [k, v] of Object.entries(countriesMap)) {
          countryFields[k] = { integerValue: v.toString() };
        }

        const recentValues = recentVisits.map(r => ({
          mapValue: {
            fields: {
              country: { stringValue: r.country || 'BR' },
              countryName: { stringValue: r.countryName || 'Brasil' },
              flag: { stringValue: r.flag || '🇧🇷' },
              city: { stringValue: r.city || 'Desconhecida' },
              device: { stringValue: r.device || '' },
              deviceType: { stringValue: r.deviceType || 'desktop' },
              os: { stringValue: r.os || '' },
              browser: { stringValue: r.browser || '' },
              timestamp: { stringValue: r.timestamp || new Date().toISOString() }
            }
          }
        }));

        const patchPayload = {
          fields: {
            totalVisits: { integerValue: currentTotal.toString() },
            countries: { mapValue: { fields: countryFields } },
            recentVisits: { arrayValue: { values: recentValues } },
            updatedAt: { timestampValue: new Date().toISOString() }
          }
        };

        const patchRes = await fetch(analyticsDocUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchPayload)
        });

        if (!patchRes.ok) {
          const createUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_analytics_v2?documentId=summary`;
          await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchPayload)
          });
        }

        return res.status(200).json({
          success: true,
          registered: true,
          country: countryCode,
          countryName,
          flag,
          city
        });
      } catch (restErr) {
        console.error('Erro no fallback REST de analytics:', restErr);
      }

      return res.status(200).json({
        success: true,
        registered: true,
        country: countryCode,
        countryName,
        flag,
        city
      });
    } catch (err) {
      console.error('Erro ao processar POST analytics:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
