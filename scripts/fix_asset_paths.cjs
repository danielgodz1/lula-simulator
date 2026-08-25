// scripts/fix_asset_paths.cjs — Garante caminhos absolutos /img/, /audios/, /3D_MeshyAI/ em todos os arquivos JS

const fs = require('fs');

function fixImgPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/(['"`])img\//g, '$1/img/');
  content = content.replace(/(['"`])audios\//g, '$1/audios/');
  content = content.replace(/(['"`])3D_MeshyAI\//g, '$1/3D_MeshyAI/');
  // Evita barras duplas se já foi substituído
  content = content.replace(/\/\/img\//g, '/img/');
  content = content.replace(/\/\/audios\//g, '/audios/');
  content = content.replace(/\/\/3D_MeshyAI\//g, '/3D_MeshyAI/');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✔ Fixed paths in:', filePath);
}

const files = [
  'js/game/characters.js',
  'js/game/skins.js',
  'js/auth.js',
  'js/social-manager.js',
  'js/audio.js',
  'js/game3d.js',
  'js/game/obstacles.js',
  'js/game/ui.js',
  'js/game/models.js',
  'js/game/textures.js'
];

for (const f of files) {
  if (fs.existsSync(f)) fixImgPaths(f);
}
