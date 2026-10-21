const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}

const CORE_BONES = new Set([
  'mixamorig:Hips', 'mixamorig:Spine', 'mixamorig:Spine1', 'mixamorig:Spine2',
  'mixamorig:Neck', 'mixamorig:Head', 'mixamorig:HeadTop_End',
  'mixamorig:LeftShoulder', 'mixamorig:LeftArm', 'mixamorig:LeftForeArm', 'mixamorig:LeftHand',
  'mixamorig:RightShoulder', 'mixamorig:RightArm', 'mixamorig:RightForeArm', 'mixamorig:RightHand',
  'mixamorig:LeftUpLeg', 'mixamorig:LeftLeg', 'mixamorig:LeftFoot', 'mixamorig:LeftToeBase', 'mixamorig:LeftToe_End',
  'mixamorig:RightUpLeg', 'mixamorig:RightLeg', 'mixamorig:RightFoot', 'mixamorig:RightToeBase', 'mixamorig:RightToe_End'
]);

function extractClips(buf, filterNames) {
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  const binOffset = 20 + jsonLen + 8;

  function readAccessor(accIndex) {
    const acc = gltf.accessors[accIndex];
    const bv = gltf.bufferViews[acc.bufferView];
    const offset = binOffset + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const count = acc.count;
    let n = count * (acc.type === 'VEC4' ? 4 : acc.type === 'VEC3' ? 3 : 1);
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push(Math.round(buf.readFloatLE(offset + i * 4) * 1000) / 1000);
    }
    return arr;
  }

  const clips = [];
  gltf.animations.forEach(a => {
    if (filterNames && !filterNames.includes(a.name)) return;
    const tracks = [];
    let maxT = 0;
    a.channels.forEach(ch => {
      const nodeName = gltf.nodes[ch.target.node].name;
      if (!CORE_BONES.has(nodeName)) return;

      const sampler = a.samplers[ch.sampler];
      const times = readAccessor(sampler.input);
      const values = readAccessor(sampler.output);
      const tEnd = times[times.length - 1] || 0;
      if (tEnd > maxT) maxT = tEnd;

      if (ch.target.path === 'rotation') {
        tracks.push({
          name: nodeName + '.quaternion',
          type: 'quaternion',
          times,
          values
        });
      }
    });

    clips.push({
      name: a.name,
      duration: Math.round(maxT * 1000) / 1000,
      tracks
    });
  });

  return clips;
}

async function build() {
  console.log('Fetching Xbot.glb...');
  const xbotBuf = await fetchBuffer('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb');
  console.log('Fetching model_all.glb...');
  const modelAllBuf = await fetchBuffer('https://raw.githubusercontent.com/Creolestudios/walk-run-jump-with-threejs/main/public/model_all.glb');

  const xbotClips = extractClips(xbotBuf, ['run', 'idle', 'walk']);
  const jumpClips = extractClips(modelAllBuf, ['jump']);
  const allClips = [...xbotClips, ...jumpClips];

  const jsonDest = path.join(__dirname, '..', 'js', 'game', 'runner-animations-data.json');
  console.log('Writing', jsonDest, '...');
  fs.writeFileSync(jsonDest, JSON.stringify(allClips));

  const jsDest = path.join(__dirname, '..', 'js', 'game', 'runner-animations.js');
  console.log('Writing', jsDest, '...');
  const jsContent = `// js/game/runner-animations.js — Clipes de Animação Mixamo Nativos (Run, Jump, Walk, Idle)
import * as THREE from 'three';

let cachedClips = null;
let loadPromise = null;

export async function getRunnerAnimationClips() {
  if (cachedClips) return cachedClips;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const resp = await fetch('/js/game/runner-animations-data.json');
      if (!resp.ok) throw new Error('Status ' + resp.status);
      const data = await resp.json();

      cachedClips = data.map(clipData => {
        const tracks = clipData.tracks.map(t => {
          if (t.type === 'quaternion') {
            return new THREE.QuaternionKeyframeTrack(t.name, t.times, t.values);
          } else {
            return new THREE.VectorKeyframeTrack(t.name, t.times, t.values);
          }
        });
        return new THREE.AnimationClip(clipData.name, clipData.duration, tracks);
      });
      return cachedClips;
    } catch (err) {
      console.warn('[RunnerAnimations] Falha ao carregar animações Mixamo:', err);
      return [];
    }
  })();

  return loadPromise;
}
`;

  fs.writeFileSync(jsDest, jsContent, 'utf8');
  console.log('Done! Files created successfully. Total JSON size:', Math.round(fs.statSync(jsonDest).size / 1024), 'KB');
}

build().catch(console.error);
