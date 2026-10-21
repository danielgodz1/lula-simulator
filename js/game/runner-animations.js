// js/game/runner-animations.js — Clipes de Animação Mixamo Nativos (Run, Jump, Walk, Idle)
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
