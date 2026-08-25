// scripts/fix_all_html_img_paths.cjs — Garante caminhos absolutos /img/, /css/, /js/, /audios/ em todos os arquivos HTML

const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      processDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/src="img\//g, 'src="/img/');
      content = content.replace(/href="img\//g, 'href="/img/');
      content = content.replace(/src="css\//g, 'src="/css/');
      content = content.replace(/href="css\//g, 'href="/css/');
      content = content.replace(/src="js\//g, 'src="/js/');
      content = content.replace(/from '\.\/js\//g, "from '/js/");
      content = content.replace(/from "\.\/js\//g, 'from "/js/');
      content = content.replace(/src="audios\//g, 'src="/audios/');
      content = content.replace(/href="audios\//g, 'href="/audios/');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log('✔ Fixed HTML assets in:', fullPath);
    }
  }
}

processDir('.');
