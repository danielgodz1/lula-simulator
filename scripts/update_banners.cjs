const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// Update loja.html and en/loja.html
['loja.html', 'en/loja.html'].forEach(relPath => {
  const file = path.join(projectRoot, relPath);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('id="adBannerLoja"')) {
    const bannerSnippet = '\n  <!-- BANNER PATROCINADO (320x50) -->\n  <div id="adBannerLoja" class="ad-banner-container-320x50" style="margin: 24px auto 14px;"></div>\n\n  <script type="module">\n    import { AdsManager } from "/js/ads-manager.js";\n    AdsManager.init();\n  </script>\n';
    content = content.replace('</body>', bannerSnippet + '</body>');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', relPath);
  }
});

// Update visitantes.html and en/visitantes.html
['visitantes.html', 'en/visitantes.html'].forEach(relPath => {
  const file = path.join(projectRoot, relPath);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('id="adBannerVisitantes"')) {
    const bannerSnippet = '\n    <!-- BANNER PATROCINADO (320x50) -->\n    <div id="adBannerVisitantes" class="ad-banner-container-320x50" style="margin: 20px auto 10px;"></div>\n';
    content = content.replace('</footer>', bannerSnippet + '</footer>');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', relPath);
  }
});

// Update social.html and en/social.html
['social.html', 'en/social.html'].forEach(relPath => {
  const file = path.join(projectRoot, relPath);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('id="adBannerSocial"')) {
    const bannerSnippet = '\n  <!-- BANNER PATROCINADO (320x50) -->\n  <div id="adBannerSocial" class="ad-banner-container-320x50" style="margin: 24px auto 14px;"></div>\n\n  <script type="module">\n    import { AdsManager } from "/js/ads-manager.js";\n    AdsManager.init();\n  </script>\n';
    content = content.replace('</body>', bannerSnippet + '</body>');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', relPath);
  }
});

console.log('All banner updates applied successfully.');
