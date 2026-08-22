// js/game/model-loader.js — Gerenciador de Pré-carregamento e Cache de Modelos 3D (.glb)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

class ModelLoaderManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.models = new Map();
    this.isLoaded = false;

    this.modelPaths = {
      empresario: 'js/game/models/empresario.glb',
      lula: 'js/game/models/lula.glb',
      bolsonaro: 'js/game/models/bolsonaro.glb',
      caminhao: 'js/game/models/caminhao.glb',
      casinha: 'js/game/models/casinha_favela.glb'
    };
  }

  async preloadAll(onProgress) {
    if (this.isLoaded) return true;

    const entries = Object.entries(this.modelPaths);
    let loadedCount = 0;
    const total = entries.length;

    const loadPromises = entries.map(([key, path]) => {
      return new Promise((resolve) => {
        this.loader.load(
          path,
          (gltf) => {
            const root = gltf.scene;

            // Configura sombras e materiais PBR em todas as malhas do modelo
            root.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                  child.material.roughness = Math.min(0.85, Math.max(0.2, child.material.roughness || 0.5));
                  child.material.metalness = Math.min(0.8, child.material.metalness || 0.1);
                  child.material.side = THREE.DoubleSide;
                }
              }
            });

            this.models.set(key, root);
            loadedCount++;
            if (typeof onProgress === 'function') onProgress(loadedCount / total);
            resolve({ key, success: true });
          },
          undefined,
          (err) => {
            console.warn(`[ModelLoader] Aviso ao carregar ${key} de ${path}:`, err);
            // Fallback: tenta carregar de 3D_MeshyAI/ caso o caminho relativo varie
            const fallbackPath = `3D_MeshyAI/${key === 'casinha' ? 'casinha_favela' : key}.glb`;
            this.loader.load(
              fallbackPath,
              (gltf) => {
                const root = gltf.scene;
                root.traverse((child) => {
                  if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                  }
                });
                this.models.set(key, root);
                loadedCount++;
                if (typeof onProgress === 'function') onProgress(loadedCount / total);
                resolve({ key, success: true });
              },
              undefined,
              () => {
                console.error(`[ModelLoader] Falha definitiva ao carregar modelo ${key}.`);
                loadedCount++;
                if (typeof onProgress === 'function') onProgress(loadedCount / total);
                resolve({ key, success: false });
              }
            );
          }
        );
      });
    });

    await Promise.all(loadPromises);
    this.isLoaded = true;
    return true;
  }

  getModel(name) {
    const template = this.models.get(name);
    if (!template) return null;
    return template.clone(true);
  }

  hasModel(name) {
    return this.models.has(name);
  }
}

export const modelLoader = new ModelLoaderManager();
