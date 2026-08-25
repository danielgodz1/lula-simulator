// js/game/model-loader.js — Gerenciador de Pré-carregamento e Cache de Modelos 3D (.glb)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class ModelLoaderManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.models = new Map();
    this.loadingPromises = new Map();
    this.listeners = new Map();
    this.isLoaded = false;

    this.modelPaths = {
      empresario: '/js/game/models/empresario.glb',
      lula: '/js/game/models/lula.glb',
      bolsonaro: '/js/game/models/bolsonaro.glb'
    };
  }

  onModelLoaded(name, callback) {
    if (this.hasModel(name)) {
      try { callback(this.getModel(name)); } catch (e) {}
      return () => {};
    }
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set());
    }
    const set = this.listeners.get(name);
    set.add(callback);
    return () => set.delete(callback);
  }

  notifyListeners(name, model) {
    if (this.listeners.has(name)) {
      const set = this.listeners.get(name);
      set.forEach(cb => {
        try { cb(model.clone(true)); } catch (e) {}
      });
    }
  }

  async loadModel(key) {
    if (this.models.has(key)) {
      return this.models.get(key);
    }
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    const path = this.modelPaths[key] || `/js/game/models/${key}.glb`;
    const promise = new Promise((resolve) => {
      this.loader.load(
        path,
        (gltf) => {
          const root = gltf.scene;
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
          this.notifyListeners(key, root);
          resolve(root);
        },
        undefined,
        (err) => {
          console.warn(`[ModelLoader] Modelo ${key} não disponível via ${path}. Usando procedural.`);
          resolve(null);
        }
      );
    });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  // Carregamento Seletivo: Carrega exclusivamente o personagem equipado no boot
  async preloadAll(selectedKey = 'empresario', onProgress) {
    const key = (selectedKey && this.modelPaths[selectedKey]) ? selectedKey : 'empresario';
    await this.loadModel(key);
    if (typeof onProgress === 'function') onProgress(1.0);
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
