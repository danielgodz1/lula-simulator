// api/shop.js — Compra Segura de Skins Cosméticas com Validação Estrita de Preços no Backend
import admin, { db } from './_firebaseAdmin.js';
import { applyCors } from './_cors.js';

const FIXED_SKIN_PRICES = {
  'lula_presidencial': { price: 500, currency: 'picanhas', charId: 'lula' },
  'lula_cyber': { price: 1500, currency: 'picanhas', charId: 'lula' },
  'lula_praia': { price: 300, currency: 'picanhas', charId: 'lula' },
  'bolsonaro_moto': { price: 800, currency: 'picanhas', charId: 'bolsonaro' },
  'bolsonaro_patriota': { price: 1800, currency: 'picanhas', charId: 'bolsonaro' },
  'nikolas_gamer': { price: 600, currency: 'picanhas', charId: 'nikolas' },
  'nikolas_chupetinha': { price: 1200, currency: 'picanhas', charId: 'nikolas' },
  'janja_gala': { price: 700, currency: 'picanhas', charId: 'janja' },
  'janja_neon': { price: 1400, currency: 'picanhas', charId: 'janja' },
  'moraes_gold': { price: 1000, currency: 'picanhas', charId: 'moraes' },
  'moraes_cosmico': { price: 2000, currency: 'picanhas', charId: 'moraes' },
  'dilma_mandioca_gold': { price: 900, currency: 'picanhas', charId: 'dilma' },
  'dilma_vento': { price: 1600, currency: 'picanhas', charId: 'dilma' },
  'marcal_black': { price: 1500, currency: 'picanhas', charId: 'marcal' },
  'marcal_quantico': { price: 2500, currency: 'picanhas', charId: 'marcal' },
  'empresario_faria_lima': { price: 1000, currency: 'coins', charId: 'empresario' },
  'empresario_cyberpunk': { price: 2500, currency: 'coins', charId: 'empresario' }
};

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  const { username, skinId, action = 'buy' } = req.body || {};

  const cleanName = (username || '').replace(/<[^>]*>?/gm, '').replace(/[^a-zA-Z0-9_\- .À-ÿ]/g, '').trim().slice(0, 30);
  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ success: false, error: 'Nome de usuário inválido.' });
  }

  const skinConfig = FIXED_SKIN_PRICES[skinId];
  if (!skinConfig) {
    return res.status(400).json({ success: false, error: 'Skin inexistente no catálogo oficial.' });
  }

  const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const userRef = db.collection('lula_users_v2').doc(normalizedName);

  try {
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ success: false, error: 'Conta de usuário não encontrada.' });
    }

    const userData = userSnap.data();
    const unlockedSkins = Array.isArray(userData.unlockedSkins) ? userData.unlockedSkins : [];
    const equippedSkins = (userData.equippedSkins && typeof userData.equippedSkins === 'object') ? userData.equippedSkins : {};

    // Ação 1: EQUIPAR / DESEQUIPAR skin
    if (action === 'equip' || action === 'unequip') {
      if (skinId === 'default' || skinId === 'padrao' || action === 'unequip') {
        const targetChar = req.body.charId || (skinConfig ? skinConfig.charId : null);
        if (targetChar) {
          delete equippedSkins[targetChar];
        }
        await userRef.set({
          equippedSkins,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return res.status(200).json({
          success: true,
          message: 'Skin padrão equipada!',
          equippedSkins,
          unlockedSkins
        });
      }

      if (!unlockedSkins.includes(skinId)) {
        return res.status(400).json({ success: false, error: 'Você ainda não possui esta skin.' });
      }
      equippedSkins[skinConfig.charId] = skinId;
      await userRef.set({
        equippedSkins,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return res.status(200).json({
        success: true,
        message: 'Skin equipada com sucesso!',
        equippedSkins,
        unlockedSkins
      });
    }

    // Ação 2: COMPRAR skin (APENAS DESBLOQUEIA, NÃO EQUIPA AUTOMATICAMENTE)
    if (unlockedSkins.includes(skinId)) {
      return res.status(400).json({ success: false, error: 'Você já possui esta skin desbloqueada.' });
    }

    let totalPicanhas = parseInt(userData.totalPicanhas || 0, 10);
    let runnerCoins = parseInt(userData.runnerCoins || 0, 10);

    if (skinConfig.currency === 'picanhas') {
      if (totalPicanhas < skinConfig.price) {
        return res.status(400).json({
          success: false,
          error: `Picanhas insuficientes. Você possui ${totalPicanhas} 🥩, necessário: ${skinConfig.price} 🥩.`
        });
      }
      totalPicanhas -= skinConfig.price;
    } else if (skinConfig.currency === 'coins') {
      if (runnerCoins < skinConfig.price) {
        return res.status(400).json({
          success: false,
          error: `Moedas insuficientes. Você possui ${runnerCoins} 💰, necessário: ${skinConfig.price} 💰.`
        });
      }
      runnerCoins -= skinConfig.price;
    }

    unlockedSkins.push(skinId);

    await userRef.set({
      totalPicanhas,
      runnerCoins,
      unlockedSkins,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({
      success: true,
      message: 'Skin desbloqueada com sucesso! Selecione "Equipar" para utilizá-la.',
      totalPicanhas,
      runnerCoins,
      unlockedSkins,
      equippedSkins
    });
  } catch (err) {
    console.error('❌ Erro na compra de skin /api/shop:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao processar compra.' });
  }
}
