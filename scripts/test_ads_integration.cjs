const fs = require('fs');
const path = require('path');
const https = require('https');

const projectRoot = path.resolve(__dirname, '..');

async function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      resolve({ url, statusCode: res.statusCode });
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ url, error: 'TIMEOUT' });
    });
  });
}

async function run() {
  console.log('=== TESTE DE LINKS E SCRIPTS DE ANÚNCIOS ===');
  const urls = [
    'https://bicea.org/22/66d34c9bfbb1a19bb44210de393265f9', // 320x50
    'https://bicea.org/22/ed07225cb34a228aede2dbebc0ca00ef', // 160x600
    'https://bicea.org/22/9a20b8895b4fb04fd16d972ead80b4e0', // 160x300
    'https://bicea.org/14/a3d3dc0b773b28035faa72b2af635754', // Social Bar
    'https://arwf.org/4/513c68ca4f57b334e0bce004c067ea2b'    // Smartlink
  ];

  for (const u of urls) {
    const res = await testUrl(u);
    console.log(`[HTTP ${res.statusCode || 'ERR'}] ${res.url} ${res.error ? '(' + res.error + ')' : '✅ OK'}`);
  }

  console.log('\n=== AUDITORIA DE ANÚNCIOS NAS TELAS ===');
  const htmlFiles = [
    'index.html', 'en/index.html',
    'jogo.html', 'en/jogo.html',
    'correr.html', 'en/correr.html',
    'ranking.html', 'en/ranking.html',
    'conquistas.html', 'en/conquistas.html',
    'feedback.html', 'en/feedback.html',
    'contato.html', 'en/contato.html',
    'loja.html', 'en/loja.html',
    'visitantes.html', 'en/visitantes.html',
    'social.html', 'en/social.html'
  ];

  let allOk = true;
  for (const rel of htmlFiles) {
    const full = path.join(projectRoot, rel);
    if (!fs.existsSync(full)) {
      console.log(`❌ Arquivo não encontrado: ${rel}`);
      allOk = false;
      continue;
    }
    const txt = fs.readFileSync(full, 'utf8');
    const hasAdsManager = txt.includes('ads-manager.js');
    const hasAdContainer = txt.includes('class="ad-') || txt.includes('id="ad');
    const hasReviveBtn = txt.includes('btnRevive') || txt.includes('goRevive');

    console.log(`- ${rel.padEnd(20)} | AdsManager: ${hasAdsManager ? '✅' : '❌'} | Banner Containers: ${hasAdContainer ? '✅' : '❌'} ${hasReviveBtn ? '| Botão Revive: 💖' : ''}`);
    if (!hasAdsManager || !hasAdContainer) allOk = false;
  }

  console.log(`\nStatus Geral: ${allOk ? '✅ TODAS AS TELAS ESTÃO CONFIGURADAS COM ANÚNCIOS' : '⚠️ ATENÇÃO NECESSÁRIA'}`);
}

run();
