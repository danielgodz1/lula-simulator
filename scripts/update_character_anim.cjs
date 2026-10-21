const fs = require('fs');
const path = require('path');

const charFile = path.resolve(__dirname, '../js/game/character.js');
let code = fs.readFileSync(charFile, 'utf8');

// 1. Add mixer and currentAction in constructor
if (!code.includes('this.mixer = null;')) {
  code = code.replace(
    'this.bodyPivot = null;',
    'this.bodyPivot = null;\n    this.mixer = null;\n    this.currentAction = null;'
  );
}

// 2. Clear mixer in clearMesh()
if (!code.includes('if (this.mixer) this.mixer.stopAllAction();')) {
  code = code.replace(
    'this.bodyPivot = null;\n    this.isGLB = false;',
    'if (this.mixer) {\n      this.mixer.stopAllAction();\n      this.mixer = null;\n    }\n    this.currentAction = null;\n    this.bodyPivot = null;\n    this.isGLB = false;'
  );
}

// 3. Initialize AnimationMixer in build() when animations exist
const targetBuild = 'this.bodyPivot.add(glbModel);\n      this.mesh.add(this.bodyPivot);';
const replaceBuild = `this.bodyPivot.add(glbModel);
      this.mesh.add(this.bodyPivot);

      // Ativa AnimationMixer se o modelo GLB possuir animações esqueléticas
      if (glbModel.animations && glbModel.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(glbModel);
        const clip = glbModel.animations[0];
        this.currentAction = this.mixer.clipAction(clip);
        this.currentAction.setLoop(THREE.LoopRepeat);
        this.currentAction.play();
      } else {
        this.mixer = null;
        this.currentAction = null;
      }`;

if (!code.includes('this.mixer = new THREE.AnimationMixer(glbModel);')) {
  code = code.replace(targetBuild, replaceBuild);
}

// 4. Update animate() to advance mixer.update(dt)
const targetAnimate = 'if (this.isGLB && this.bodyPivot) {';
const replaceAnimate = `if (this.isGLB && this.bodyPivot) {
      if (this.mixer) {
        const animSpeedScale = Math.max(0.9, Math.min(2.5, (speed / 16) * 1.35));
        this.mixer.update(dt * animSpeedScale);
      }`;

if (!code.includes('this.mixer.update(dt * animSpeedScale);')) {
  code = code.replace(targetAnimate, replaceAnimate);
}

// 5. Update revive() to reset action
if (!code.includes('if (this.currentAction) this.currentAction.reset().play();')) {
  code = code.replace(
    'this.isStumbling = false;',
    'this.isStumbling = false;\n    if (this.currentAction) {\n      this.currentAction.reset().play();\n    }'
  );
}

fs.writeFileSync(charFile, code, 'utf8');
console.log('character.js updated successfully with AnimationMixer support!');
