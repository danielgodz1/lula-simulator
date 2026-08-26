// js/device-id.js — Geração e persistência de ID único por dispositivo
// Usa localStorage + fingerprint básico para identificar o dispositivo

const DEVICE_ID_KEY = 'lula_device_id_v2';

/**
 * Gera um ID único persistente para este dispositivo
 * Combina timestamp + random string para garantir unicidade
 */
export function getDeviceId() {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Gera novo ID se não existir
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 15);
      deviceId = `${timestamp}_${randomStr}`;
      
      try {
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
      } catch (e) {
        // Fallback se localStorage falhar
        console.warn('[device-id] localStorage falhou, usando ID temporário');
      }
    }
    
    return deviceId;
  } catch (e) {
    // Fallback em caso de erro crítico
    console.error('[device-id] Erro ao gerar deviceId:', e);
    return `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}

/**
 * Reseta o ID do dispositivo (útil para testes)
 */
export function resetDeviceId() {
  try {
    localStorage.removeItem(DEVICE_ID_KEY);
  } catch (e) {
    console.warn('[device-id] Erro ao resetar deviceId:', e);
  }
}
