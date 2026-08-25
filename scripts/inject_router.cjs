// scripts/inject_router.cjs — Injeta o router instantâneo de segurança nos arquivos raiz

const fs = require('fs');
const files = ['index.html', 'jogo.html', 'correr.html', 'ranking.html', 'conquistas.html', 'loja.html', 'social.html', 'visitantes.html', 'feedback.html', 'contato.html'];

const scriptTag = `  <!-- Roteador Instantâneo para Domínio Internacional flappylula.com -->
  <script>
    if (window.location.hostname.toLowerCase().includes('flappylula.com') && !window.location.pathname.startsWith('/en/')) {
      var p = window.location.pathname;
      if (p === '/' || p === '') p = '/index.html';
      var clean = p.endsWith('.html') ? p : (p + '.html');
      window.location.replace('/en' + clean + window.location.search + window.location.hash);
    }
  </script>\n`;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes("window.location.hostname.toLowerCase().includes('flappylula.com')")) {
    content = content.replace('<head>\n', '<head>\n' + scriptTag);
    fs.writeFileSync(f, content, 'utf8');
    console.log('Injected router in', f);
  }
}
