// js/game/environment.js — Favela Realista 3D: Casas com Portas, Janelas, Escadarias, Lajes com Vergalhões, Varais de Roupa e Fios Suspensos
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';
import { textureAtlas } from './textures.js';

export const SEGMENT_LENGTH = 85;
export const TOTAL_SEGMENTS = 4;

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];

    // Pool Otimizado de 3 PointLights Noturnos nos Postes (Zero impacto no FPS mobile, sem sombras dinâmicas)
    this.lampPointLights = [];
    if (this.scene) {
      for (let i = 0; i < 3; i++) {
        const pl = new THREE.PointLight(0xffedd5, 0, 15, 1.4);
        pl.castShadow = false;
        pl.visible = false;
        this.scene.add(pl);
        this.lampPointLights.push(pl);
      }
    }

    // Geometrias Unitárias Reutilizáveis (Zero Memory Leak / Zero GC)
    this.unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.unitTankGeo = new THREE.CylinderGeometry(1.15, 1.05, 1.4, 10);
    this.unitWindowGeo = new THREE.PlaneGeometry(1.4, 1.2);
    this.unitDoorGeo = new THREE.PlaneGeometry(1.6, 2.4);
    this.unitRebarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5);
    this.unitACGeo = new THREE.BoxGeometry(0.9, 0.65, 0.45);
    this.unitStairStepGeo = new THREE.BoxGeometry(1.8, 0.28, 0.48);
    this.unitRailingGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 4);
    this.unitMeterBoxGeo = new THREE.BoxGeometry(0.35, 0.50, 0.18);
    this.unitClothGeo = new THREE.PlaneGeometry(0.48, 0.65);

    // Cenário 2.0 (Fase A) — Geometrias Unitárias de Comércio, Toldos, Sacadas e Lajes
    this.unitAwningGeo = new THREE.BoxGeometry(4.2, 0.45, 1.5);
    this.unitSignGeo = new THREE.BoxGeometry(4.4, 1.1, 0.16);
    this.unitStorefrontGeo = new THREE.PlaneGeometry(3.6, 2.3);
    this.unitDishGeo = new THREE.CylinderGeometry(0.85, 0.12, 0.24, 12);
    this.unitDishStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
    this.unitFishboneGeo = new THREE.BoxGeometry(0.05, 1.8, 0.05);
    this.unitFishboneCrossGeo = new THREE.BoxGeometry(0.7, 0.03, 0.03);
    this.unitGasGeo = new THREE.CylinderGeometry(0.32, 0.30, 0.75, 8);
    this.unitChairGeo = new THREE.BoxGeometry(0.46, 0.72, 0.46);
    this.unitTableGeo = new THREE.BoxGeometry(0.82, 0.70, 0.82);
    this.unitPoolGeo = new THREE.BoxGeometry(2.6, 0.55, 1.8);
    this.unitWaterGeo = new THREE.PlaneGeometry(2.45, 1.65);
    this.unitBalconyGeo = new THREE.BoxGeometry(2.6, 0.85, 0.85);
    this.unitParapetGeo = new THREE.BoxGeometry(1, 0.60, 0.22);

    // Cenário 2.0 (Fase B) — Geometrias Unitárias de Vegetação Tropical e Veículos Estáticos (Escala Enriquecida)
    this.unitPalmTrunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 7.2, 6);
    this.unitPalmLeafGeo = new THREE.PlaneGeometry(2.2, 3.8);
    this.unitBananaLeafGeo = new THREE.PlaneGeometry(1.5, 3.0);
    this.unitBushGeo = new THREE.DodecahedronGeometry(1.4, 0);
    this.unitClayPotGeo = new THREE.CylinderGeometry(0.45, 0.32, 0.70, 6);
    this.unitIvyGeo = new THREE.PlaneGeometry(3.5, 1.4);

    this.unitKombiLowerGeo = new THREE.BoxGeometry(2.3, 1.25, 4.8);
    this.unitKombiUpperGeo = new THREE.BoxGeometry(2.2, 1.10, 4.5);
    this.unitFuscaBodyGeo = new THREE.BoxGeometry(2.1, 0.95, 4.0);
    this.unitFuscaCabinGeo = new THREE.BoxGeometry(1.8, 0.85, 2.2);
    this.unitCarBodyGeo = new THREE.BoxGeometry(2.1, 0.92, 4.2);
    this.unitCarCabinGeo = new THREE.BoxGeometry(1.85, 0.82, 2.5);
    this.unitVehicleWheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.32, 8);
    this.unitMotoBodyGeo = new THREE.BoxGeometry(0.50, 0.85, 2.2);
    this.unitMotoBoxGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    this.unitMotoWheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.16, 8);
    this.unitCarPlateGeo = new THREE.PlaneGeometry(0.9, 0.32);

    // Cenário 2.0 (Fase C) — Pipas, Churrasqueiras, Cachorro Caramelo e NPCs (Escala Enriquecida)
    this.unitKiteGeo = new THREE.PlaneGeometry(2.0, 2.4);
    this.unitKiteTailGeo = new THREE.PlaneGeometry(0.25, 0.85);
    this.unitDrumGrillGeo = new THREE.CylinderGeometry(0.55, 0.52, 0.90, 8);
    this.unitGrillGridGeo = new THREE.PlaneGeometry(0.95, 0.60);
    this.unitSmokeGeo = new THREE.PlaneGeometry(1.10, 1.10);
    this.unitDogBodyGeo = new THREE.BoxGeometry(0.52, 0.42, 0.90);
    this.unitDogHeadGeo = new THREE.BoxGeometry(0.34, 0.34, 0.36);
    this.unitDogSnoutGeo = new THREE.BoxGeometry(0.20, 0.16, 0.22);
    this.unitDogEarGeo = new THREE.BoxGeometry(0.08, 0.20, 0.08);
    this.unitDogLegGeo = new THREE.BoxGeometry(0.12, 0.36, 0.12);
    this.unitDogTailGeo = new THREE.BoxGeometry(0.07, 0.28, 0.07);
    this.unitNpcBodyGeo = new THREE.BoxGeometry(0.65, 0.80, 0.38);
    this.unitNpcHeadGeo = new THREE.SphereGeometry(0.26, 6, 6);
    this.unitNpcPantsGeo = new THREE.BoxGeometry(0.60, 0.55, 0.35);
    this.unitNpcLimbGeo = new THREE.BoxGeometry(0.16, 0.55, 0.16);
    this.unitNpcCupGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.18, 6);

    // Geometrias Unitárias de Pista, Guias, Trilhos e Muretas
    this.unitAsphaltGeo = new THREE.PlaneGeometry(150, SEGMENT_LENGTH);
    this.unitGravelGeo = new THREE.PlaneGeometry(10.2, SEGMENT_LENGTH);
    this.unitCurbGeo = new THREE.BoxGeometry(2.6, 0.22, SEGMENT_LENGTH);
    this.unitWallGeo = new THREE.BoxGeometry(0.4, 1.1, SEGMENT_LENGTH);
    this.unitStripeGeo = new THREE.PlaneGeometry(0.25, 4.0);
    this.unitGrafGeo = new THREE.PlaneGeometry(3.6, 0.9);
    this.unitRailTieGeo = new THREE.BoxGeometry(2.3, 0.12, 0.38);
    this.unitRailBarGeo = new THREE.BoxGeometry(0.12, 0.18, SEGMENT_LENGTH);

    // Geometrias Unitárias dos Postes e Iluminação Pública (InstancedMesh)
    this.unitPoleGeo = new THREE.CylinderGeometry(0.20, 0.24, 10.5, 8);
    this.unitCrossGeo = new THREE.BoxGeometry(2.4, 0.16, 0.16);
    this.unitInsulatorGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.25, 6);
    this.unitArmGeo = new THREE.BoxGeometry(1.6, 0.08, 0.08);
    this.unitLampGeo = new THREE.SphereGeometry(0.32, 6, 6);
    this.unitTransfGeo = new THREE.CylinderGeometry(0.55, 0.50, 1.4, 10);
    this.unitDumpsterGeo = new THREE.BoxGeometry(1.8, 1.1, 2.8);

    // Geometrias de Cabos Pré-calculadas
    this.prebuiltCableGeos = this.createPrebuiltCableGeometries();

    // Materiais Compartilhados Globais
    this.sharedMaterials = {
      asphalt: new THREE.MeshLambertMaterial({ color: 0x4b5568 }),
      gravel: new THREE.MeshLambertMaterial({
        map: textureAtlas.warmTracksGroundTexture,
        color: 0xffffff
      }),
      curb: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
      yellowStripe: new THREE.MeshBasicMaterial({ color: 0xfde047 }),
      railTie: new THREE.MeshLambertMaterial({
        map: textureAtlas.woodTieTexture,
        color: 0xffffff
      }),
      steelRail: new THREE.MeshPhongMaterial({
        color: 0xc9d3dc,
        specular: 0x7dd3fc,
        shininess: 45
      }),
      concreteWall: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      graffitiWall: new THREE.MeshLambertMaterial({ map: textureAtlas.atlasTexture }),
      waterTankBlue: new THREE.MeshLambertMaterial({ map: textureAtlas.waterTankTexture, color: 0x0284c7 }),
      waterTankGrey: new THREE.MeshLambertMaterial({ map: textureAtlas.waterTankTexture, color: 0x64748b }),
      waterTankAsbestos: new THREE.MeshLambertMaterial({ color: 0x78716c }),
      concretePole: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      dumpster: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
      rebar: new THREE.MeshLambertMaterial({ map: textureAtlas.rebarTexture, color: 0x9a3412 }),
      concreteSlab: new THREE.MeshLambertMaterial({ map: textureAtlas.concreteSlabTexture, color: 0x94a3b8 }),
      brickHouse: new THREE.MeshLambertMaterial({ map: textureAtlas.brickRedTexture, color: 0xc45c26 }),
      tileHouse: new THREE.MeshLambertMaterial({ map: textureAtlas.tileFacadeTexture }),
      houseBase: new THREE.MeshPhongMaterial({ shininess: 14, specular: 0x222222 }),
      windowMat: new THREE.MeshBasicMaterial({ map: textureAtlas.facadeWindowTexture }),
      windowGrilleMat: new THREE.MeshBasicMaterial({ map: textureAtlas.windowGrilleTexture }),
      modernWindowMat: new THREE.MeshBasicMaterial({ map: textureAtlas.modernWindowTexture }),
      doorMat: new THREE.MeshLambertMaterial({ map: textureAtlas.doorTexture }),
      rollerDoorMat: new THREE.MeshLambertMaterial({ map: textureAtlas.rollerDoorTexture }),
      corrugatedRoofMat: new THREE.MeshLambertMaterial({ map: textureAtlas.corrugatedRoofTexture }),
      transformerMat: new THREE.MeshLambertMaterial({ map: textureAtlas.transformerTexture }),
      streetLampMat: new THREE.MeshBasicMaterial({ color: 0xffedd5 }),
      cableBlack: new THREE.MeshBasicMaterial({ color: 0x090d16 }),
      insulatorBrown: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      acUnit: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      stairConcrete: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      darkRailing: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      meterBox: new THREE.MeshLambertMaterial({ color: 0x475569 }),
      // Cenário 2.0 (Fase A): Comércio, Toldos, Lajes e Cores Brasileiras
      signMats: textureAtlas.commercialSigns.map(tex => new THREE.MeshBasicMaterial({ map: tex })),
      awningMats: textureAtlas.awningTextures.map(tex => new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })),
      displayMats: textureAtlas.storefrontDisplays.map(tex => new THREE.MeshBasicMaterial({ map: tex })),
      dishMat: new THREE.MeshLambertMaterial({ map: textureAtlas.dishAntennaTexture }),
      dishStemMat: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      gasBlueMat: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
      gasSilverMat: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      plasticYellowChairMat: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      plasticWhiteChairMat: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
      plasticYellowTableMat: new THREE.MeshLambertMaterial({ color: 0xfde047 }),
      poolBlueMat: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
      poolWaterMat: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }),
      clothes: [
        new THREE.MeshLambertMaterial({ color: 0xef4444, side: THREE.DoubleSide }),
        new THREE.MeshLambertMaterial({ color: 0x3b82f6, side: THREE.DoubleSide }),
        new THREE.MeshLambertMaterial({ color: 0xfacc15, side: THREE.DoubleSide }),
        new THREE.MeshLambertMaterial({ color: 0x22c55e, side: THREE.DoubleSide }),
        new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })
      ],
      // Cenário 2.0 (Fase B): Vegetação Tropical e Veículos Estáticos
      palmTrunkMat: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      palmLeafMat: new THREE.MeshLambertMaterial({ map: textureAtlas.palmLeafTexture, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide }),
      bananaLeafMat: new THREE.MeshLambertMaterial({ map: textureAtlas.bananaLeafTexture, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide }),
      bushMat: new THREE.MeshLambertMaterial({ map: textureAtlas.bushFoliageTexture, color: 0x22c55e }),
      clayPotMat: new THREE.MeshLambertMaterial({ color: 0xc2410c }),
      ivyMat: new THREE.MeshLambertMaterial({ map: textureAtlas.ivyTexture, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide }),
      kombiUpperMat: new THREE.MeshLambertMaterial({ map: textureAtlas.kombiSideTexture }),
      kombiLowerMats: [
        new THREE.MeshLambertMaterial({ color: 0x0284c7 }), // Azul Celeste
        new THREE.MeshLambertMaterial({ color: 0xb91c1c }), // Vermelho
        new THREE.MeshLambertMaterial({ color: 0xeab308 }), // Amarelo
        new THREE.MeshLambertMaterial({ color: 0x059669 })  // Verde Menta
      ],
      fuscaMats: [
        new THREE.MeshLambertMaterial({ color: 0x1e3a8a }), // Azul Marinho
        new THREE.MeshLambertMaterial({ color: 0xfacc15 }), // Amarelo Canário
        new THREE.MeshLambertMaterial({ color: 0xf1f5f9 }), // Branco Clássico
        new THREE.MeshLambertMaterial({ color: 0x991b1b })  // Bordô
      ],
      carMats: [
        new THREE.MeshLambertMaterial({ color: 0x94a3b8 }), // Prata
        new THREE.MeshLambertMaterial({ color: 0xb91c1c }), // Vermelho
        new THREE.MeshLambertMaterial({ color: 0xf8fafc }), // Branco
        new THREE.MeshLambertMaterial({ color: 0x334155 })  // Grafite
      ],
      vehicleGlassMat: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.6 }),
      vehicleWheelMat: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      vehiclePlateMat: new THREE.MeshBasicMaterial({ map: textureAtlas.carDetailsTexture }),
      motoBodyMat: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      motoBoxMat: new THREE.MeshLambertMaterial({ map: textureAtlas.motoBoxTexture }),
      // Cenário 2.0 (Fase C): Pipas, Churrasqueiras, Cachorro Caramelo e NPCs
      kiteMats: textureAtlas.kiteTextures.map(tex => new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, alphaTest: 0.25 })),
      kiteTailMat: new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide }),
      drumGrillMat: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      grillFoodMat: new THREE.MeshBasicMaterial({ map: textureAtlas.grillTexture }),
      smokeMat: new THREE.MeshBasicMaterial({ map: textureAtlas.smokeTexture, transparent: true, opacity: 0.60, depthWrite: false }),
      dogCarameloMat: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
      dogNoseMat: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      npcSkinMats: [
        new THREE.MeshLambertMaterial({ color: 0x8d5524 }),
        new THREE.MeshLambertMaterial({ color: 0xc68642 }),
        new THREE.MeshLambertMaterial({ color: 0xe0ac69 }),
        new THREE.MeshLambertMaterial({ color: 0xf1c27d })
      ],
      npcShirtMats: [
        new THREE.MeshLambertMaterial({ color: 0xfacc15 }), // Amarela Canarinho
        new THREE.MeshLambertMaterial({ color: 0xdc2626 }), // Vermelha
        new THREE.MeshLambertMaterial({ color: 0x0284c7 }), // Azul Celeste
        new THREE.MeshLambertMaterial({ color: 0xf8fafc }), // Branca
        new THREE.MeshLambertMaterial({ color: 0x16a34a })  // Verde Tropical
      ],
      npcShortsMats: [
        new THREE.MeshLambertMaterial({ color: 0x1e3a8a }), // Jeans
        new THREE.MeshLambertMaterial({ color: 0x334155 }), // Bermuda Preta/Cinza
        new THREE.MeshLambertMaterial({ color: 0xb45309 })  // Bermuda Cáqui
      ],
      npcCupMat: new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.85 })
    };

    // Paleta Candy Favela (Pixar / Subway Surfers)
    this.houseColors = [
      0xFF6B7A, // Coral Pink
      0x4EE0C4, // Turquesa Claro
      0x2EC4B6, // Verde Menta Tropical
      0xF5C542, // Amarelo Solar Dourado
      0xB9A6FF, // Lilás Candy
      0x5AA9FF, // Azul Celeste Vibrante
      0xFFB07A, // Pêssego Quente
      0x8BD44A, // Verde Limão
      0xFF7AA2  // Rosa Carioca
    ];

    this.init();
  }

  createPrebuiltCableGeometries() {
    const geos = [];
    const cableOffsets = [
      { y: 9.8, sag: 0.45 },
      { y: 9.8, sag: 0.45 },
      { y: 9.8, sag: 0.45 },
      { y: 8.2, sag: 0.60 },
      { y: 7.9, sag: 0.65 }
    ];

    cableOffsets.forEach(co => {
      const points = [];
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        const z = -SEGMENT_LENGTH / 2 + (i / steps) * SEGMENT_LENGTH;
        const wave = Math.sin((i / steps) * Math.PI * 3);
        const y = co.y - Math.abs(wave) * co.sag;
        points.push(new THREE.Vector3(0, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      geos.push(new THREE.TubeGeometry(curve, 20, 0.032, 4, false));
    });

    return geos;
  }

  init() {
    this.buildInitialTrack();
  }

  buildInitialTrack() {
    for (const seg of this.segments) this.scene.remove(seg);
    this.segments = [];

    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const segZ = -i * SEGMENT_LENGTH;
      const seg = this.createFavelaSegment(segZ);
      this.segments.push(seg);
      this.scene.add(seg);
    }
  }

  createFavelaSegment(zPos) {
    const segment = new THREE.Group();
    segment.position.z = zPos;

    // 1. Asfalto
    const ground = new THREE.Mesh(this.unitAsphaltGeo, this.sharedMaterials.asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    segment.add(ground);

    // 2. Brita
    const gravel = new THREE.Mesh(this.unitGravelGeo, this.sharedMaterials.gravel);
    gravel.rotation.x = -Math.PI / 2;
    gravel.position.y = 0.01;
    gravel.receiveShadow = true;
    segment.add(gravel);

    // 3. Calçadas
    [-6.4, 6.4].forEach(cx => {
      const curb = new THREE.Mesh(this.unitCurbGeo, this.sharedMaterials.curb);
      curb.position.set(cx, 0.11, 0);
      curb.receiveShadow = true;
      segment.add(curb);
    });

    // 4. Faixas Amarelas Instanciadas (1 único InstancedMesh por segmento)
    const stripeConfigs = [];
    [-9.6, 9.6].forEach(sx => {
      for (let dz = -SEGMENT_LENGTH / 2 + 3; dz < SEGMENT_LENGTH / 2; dz += 8) {
        stripeConfigs.push({ x: sx, y: 0.02, z: dz });
      }
    });
    const stripeInst = new THREE.InstancedMesh(this.unitStripeGeo, this.sharedMaterials.yellowStripe, stripeConfigs.length);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < stripeConfigs.length; i++) {
      const sc = stripeConfigs[i];
      dummy.position.set(sc.x, sc.y, sc.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      stripeInst.setMatrixAt(i, dummy.matrix);
    }
    stripeInst.instanceMatrix.needsUpdate = true;
    segment.add(stripeInst);

    // 5. Trilhos Instanciados
    this.createInstancedTracks(segment);

    // 6. Muretas com Grafites Instanciados
    const grafConfigs = [];
    [-5.4, 5.4].forEach((wx, sideIdx) => {
      const wall = new THREE.Mesh(this.unitWallGeo, this.sharedMaterials.concreteWall);
      wall.position.set(wx, 0.55, 0);
      wall.receiveShadow = true;
      segment.add(wall);

      for (let gz = -SEGMENT_LENGTH / 2 + 10; gz < SEGMENT_LENGTH / 2; gz += 20) {
        grafConfigs.push({
          x: wx + (sideIdx === 0 ? 0.22 : -0.22),
          y: 0.55,
          z: gz,
          rotY: sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2
        });
      }
    });

    if (grafConfigs.length > 0) {
      const grafInst = new THREE.InstancedMesh(this.unitGrafGeo, this.sharedMaterials.graffitiWall, grafConfigs.length);
      for (let i = 0; i < grafConfigs.length; i++) {
        const gc = grafConfigs[i];
        dummy.position.set(gc.x, gc.y, gc.z);
        dummy.rotation.set(0, gc.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        grafInst.setMatrixAt(i, dummy.matrix);
      }
      grafInst.instanceMatrix.needsUpdate = true;
      segment.add(grafInst);
    }

    // 7. Favela 3D Realista: Cenário 2.0 (Comércio, Lajes Vivas, Fachadas Azulejadas, Toldos)
    this.buildFavelaHouses(segment);

    // 8. Postes com Transformadores, Lâmpadas e Fios Suspensos
    this.buildStreetPropsAndPowerLines(segment);

    // 9. Vegetação Tropical & Veículos Estáticos: Cenário 2.0 (Fase B)
    this.buildVegetationAndStaticVehicles(segment);

    // 10. NPCs, Churrasqueiras, Cachorro Caramelo & Pipas: Cenário 2.0 (Fase C)
    this.buildNpcsAndUrbanLife(segment);

    return segment;
  }

  createInstancedTracks(segment) {
    const tiesPerLane = Math.floor(SEGMENT_LENGTH / 2.5);
    const totalTies = tiesPerLane * LANES.length;

    const instancedTies = new THREE.InstancedMesh(this.unitRailTieGeo, this.sharedMaterials.railTie, totalTies);
    instancedTies.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    LANES.forEach(laneX => {
      for (let z = -SEGMENT_LENGTH / 2 + 1.25; z < SEGMENT_LENGTH / 2; z += 2.5) {
        dummy.position.set(laneX, 0.06, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        instancedTies.setMatrixAt(idx++, dummy.matrix);
      }
    });
    segment.add(instancedTies);

    LANES.forEach(laneX => {
      [-0.75, 0.75].forEach(railOffset => {
        const rail = new THREE.Mesh(this.unitRailBarGeo, this.sharedMaterials.steelRail);
        rail.position.set(laneX + railOffset, 0.15, 0);
        rail.receiveShadow = true;
        segment.add(rail);
      });
    });
  }

  /**
   * Cenário 2.0 (Fase A): Gerador Procedural de Casas, Comércio e Lajes com Personalidades Distintas
   */
  buildFavelaHouses(segment) {
    const paintedHouseConfigs = [];
    const brickHouseConfigs = [];
    const tileHouseConfigs = [];
    const slabConfigs = [];
    const windowConfigs = [];
    const windowGrilleConfigs = [];
    const modernWinConfigs = [];
    const doorConfigs = [];
    const rollerDoorConfigs = [];
    const rebarConfigs = [];
    const acConfigs = [];
    const meterBoxConfigs = [];
    const stairStepConfigs = [];
    const railingConfigs = [];
    const roofConfigs = [];

    // Arrays para os novos elementos de Comércio e Lajes
    const signConfigs = Array.from({ length: 8 }, () => []);
    const awningConfigs = Array.from({ length: 4 }, () => []);
    const displayConfigs = Array.from({ length: 4 }, () => []);
    const tankBlueConfigs = [];
    const tankGreyConfigs = [];
    const tankAsbestosConfigs = [];
    const dishConfigs = [];
    const dishStemConfigs = [];
    const fishboneConfigs = [];
    const gasBlueConfigs = [];
    const gasSilverConfigs = [];
    const chairConfigs = [];
    const tableConfigs = [];
    const poolConfigs = [];
    const poolWaterConfigs = [];
    const balconyConfigs = [];
    const clothesConfigs = Array.from({ length: 5 }, () => []);

    // Função pseudoaleatória determinística para evitar repetição monótona
    const pseudo = (seed) => {
      const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return s - Math.floor(s);
    };

    [-11.5, 11.5, -19.5, 19.5, -29.5, 29.5, -41.0, 41.0].forEach((baseX) => {
      const isLeft = baseX < 0;
      const distLayer = Math.abs(baseX);
      const isForeground = distLayer < 14;
      const isMidground = distLayer >= 14 && distLayer < 25;
      const elevationBase = (distLayer - 10) * 0.48;
      const stepZ = distLayer > 16 ? 16 : 18;

      let prevHouseY = elevationBase;
      let prevHouseZ = -SEGMENT_LENGTH / 2;

      for (let bz = -SEGMENT_LENGTH / 2 + 8; bz < SEGMENT_LENGTH / 2; bz += stepZ) {
        const seed = Math.abs(Math.floor(baseX * 31 + bz * 73));
        const p0 = pseudo(seed);
        const p1 = pseudo(seed + 1);
        const p2 = pseudo(seed + 2);
        const p3 = pseudo(seed + 3);
        const p4 = pseudo(seed + 4);
        const p5 = pseudo(seed + 5);

        // Altura em andares (2 a 4 andares)
        const floors = Math.floor(p0 * 3) + 2;
        let currentY = elevationBase;

        // Tipo predominante de fachada do edifício
        const isTileFacade = isForeground && p1 > 0.65;
        const isBrickHouse = !isTileFacade && p1 > 0.35;

        // Comércio no térreo (em 55% dos prédios do primeiro plano perto da pista)
        const hasStoreGround = isForeground && p2 > 0.45;
        const storeType = Math.floor(p3 * 8); // 0 a 7 (Mercadinho, Padaria, Bar, Barbearia, Farmácia, Lanchonete, Oficina, Bazar)

        for (let f = 0; f < floors; f++) {
          const fSeed = seed + f * 17;
          const w = 7.4 + (pseudo(fSeed) * 1.6 - 0.8);
          const h = 3.4;
          const d = 10.4 + (pseudo(fSeed + 1) * 1.6 - 0.8);
          const ox = (f > 0 ? (pseudo(fSeed + 2) * 0.8 - 0.4) : 0);
          const colIdx = Math.floor(pseudo(fSeed + 3) * this.houseColors.length);
          const color = this.houseColors[colIdx];

          const config = {
            x: baseX + ox,
            y: currentY + h / 2,
            z: bz,
            scaleX: w,
            scaleY: h,
            scaleZ: d,
            color: color
          };

          if (isTileFacade && (f === 0 || f === 1)) {
            tileHouseConfigs.push(config);
          } else if (isBrickHouse && f >= 1) {
            brickHouseConfigs.push(config);
          } else {
            paintedHouseConfigs.push(config);
          }

          // Laje de concreto com beiral
          slabConfigs.push({
            x: baseX + ox,
            y: currentY + h,
            z: bz,
            scaleX: w + 0.45,
            scaleY: 0.24,
            scaleZ: d + 0.45
          });

          const frontX = baseX + ox + (isLeft ? w / 2 + 0.08 : -w / 2 - 0.08);
          const rotFacingTrack = isLeft ? Math.PI / 2 : -Math.PI / 2;

          // ==================== TÉRREO (f === 0) ====================
          if (f === 0) {
            if (hasStoreGround) {
              // 1. COMÉRCIO BRASILEIRO NO TÉRREO
              const awningType = storeType % 4;
              const awningX = baseX + ox + (isLeft ? w / 2 + 0.75 : -w / 2 - 0.75);

              // Toldo 3D projetado sobre a calçada
              awningConfigs[awningType].push({
                x: awningX,
                y: currentY + 2.45,
                z: bz,
                rotY: rotFacingTrack
              });

              // Letreiro Grande e Legível da Loja
              signConfigs[storeType].push({
                x: frontX + (isLeft ? 0.08 : -0.08),
                y: currentY + 2.85,
                z: bz,
                rotY: rotFacingTrack
              });

              // Vitrine 2.5D ou Porta de Enrolar
              if (storeType === 6) {
                // Oficina Mecânica do Beto: Porta de enrolar fechada
                rollerDoorConfigs.push({
                  x: frontX,
                  y: currentY + 1.25,
                  z: bz,
                  rotY: rotFacingTrack
                });
              } else {
                // Vitrine interna estilizada iluminada
                const displayType = storeType % 4;
                displayConfigs[displayType].push({
                  x: frontX,
                  y: currentY + 1.20,
                  z: bz,
                  rotY: rotFacingTrack
                });
              }

              // Se for Bar do Zé ou Lanchonete, adiciona mesas e cadeiras amarelas de plástico na calçada
              if (storeType === 2 || storeType === 5) {
                const chairX = baseX + (isLeft ? 4.8 : -4.8);
                tableConfigs.push({ x: chairX, y: 0.35, z: bz });
                [-0.6, 0.6].forEach(cz => {
                  chairConfigs.push({ x: chairX + (isLeft ? 0.4 : -0.4), y: 0.36, z: bz + cz, rotY: rotFacingTrack });
                });
              }

              // Relógio de Luz lateral
              meterBoxConfigs.push({
                x: frontX + (isLeft ? 0.04 : -0.04),
                y: currentY + 1.3,
                z: bz + 2.6,
                rotY: rotFacingTrack
              });
            } else {
              // 2. RESIDÊNCIA TÉRREA
              doorConfigs.push({
                x: frontX,
                y: currentY + 1.25,
                z: bz - 1.8,
                rotY: rotFacingTrack
              });

              // Janela com Grade de Ferro Ornamental
              if (isForeground) {
                windowGrilleConfigs.push({
                  x: frontX,
                  y: currentY + 1.7,
                  z: bz + 1.8,
                  rotY: rotFacingTrack
                });
              } else {
                windowConfigs.push({
                  x: frontX,
                  y: currentY + 1.7,
                  z: bz + 1.8,
                  rotY: rotFacingTrack
                });
              }

              // Relógio de luz residencial
              meterBoxConfigs.push({
                x: frontX + (isLeft ? 0.04 : -0.04),
                y: currentY + 1.3,
                z: bz - 3.2,
                rotY: rotFacingTrack
              });
            }
          } else {
            // ==================== ANDARES SUPERIORES (f >= 1) ====================
            if (isForeground && f === 1 && p4 > 0.40) {
              // Sacada / Varanda em Balanço no 1º andar
              balconyConfigs.push({
                x: frontX + (isLeft ? 0.42 : -0.42),
                y: currentY + 0.45,
                z: bz,
                rotY: rotFacingTrack
              });
              // Porta Balcão de acesso
              doorConfigs.push({
                x: frontX,
                y: currentY + 1.25,
                z: bz,
                rotY: rotFacingTrack
              });
            } else {
              // Janelas dos andares superiores
              [-2.4, 2.4].forEach((wz, wIdx) => {
                if (isForeground && f === 2) {
                  modernWinConfigs.push({
                    x: frontX,
                    y: currentY + 1.7,
                    z: bz + wz,
                    rotY: rotFacingTrack
                  });
                } else {
                  windowConfigs.push({
                    x: frontX,
                    y: currentY + 1.7,
                    z: bz + wz,
                    rotY: rotFacingTrack
                  });
                }
              });

              // Ar Condicionado nos andares superiores
              if (f === 1 && p5 > 0.35) {
                acConfigs.push({
                  x: frontX + (isLeft ? 0.22 : -0.22),
                  y: currentY + 1.0,
                  z: bz - 1.2
                });
              }
            }
          }

          currentY += h + 0.24;
        }

        // ==================== ESCADARIA ENTRE AS CASAS ====================
        if (bz > -SEGMENT_LENGTH / 2 + 10 && (isForeground || isMidground)) {
          const stairX = baseX + (isLeft ? -3.8 : 3.8);
          const stairZ = (bz + prevHouseZ) / 2;
          const numSteps = 7;
          for (let s = 0; s < numSteps; s++) {
            const stepRatio = s / numSteps;
            const sy = prevHouseY + stepRatio * (currentY - prevHouseY) * 0.7;
            const sz = stairZ - 1.8 + s * 0.52;
            stairStepConfigs.push({ x: stairX, y: sy, z: sz });

            if (s % 3 === 0) {
              railingConfigs.push({ x: stairX + (isLeft ? 0.9 : -0.9), y: sy + 0.55, z: sz });
            }
          }
        }

        // ==================== LAJES VIVAS & COBERTURA (PERSONALIDADES) ====================
        const roofSeed = seed + 99;
        const rChoice = pseudo(roofSeed);

        // A. Caixas d'Água (Fortlev Azul, Cinza ou Amianto)
        if (rChoice > 0.15) {
          const tankType = pseudo(roofSeed + 1);
          const tankPos = {
            x: baseX + (pseudo(roofSeed + 2) * 1.4 - 0.7),
            y: currentY + 0.7,
            z: bz + (pseudo(roofSeed + 3) * 1.4 - 0.7)
          };
          if (tankType < 0.55) {
            tankBlueConfigs.push(tankPos);
          } else if (tankType < 0.85) {
            tankGreyConfigs.push(tankPos);
          } else {
            tankAsbestosConfigs.push(tankPos);
          }
        }

        // B. Antenas Parabólicas 3D BRASILSAT
        if ((isForeground || isMidground) && rChoice > 0.45 && rChoice <= 0.80) {
          const dishX = baseX + (isLeft ? 1.8 : -1.8);
          const dishZ = bz + 1.6;
          dishStemConfigs.push({ x: dishX, y: currentY + 0.6, z: dishZ });
          dishConfigs.push({ x: dishX, y: currentY + 1.2, z: dishZ, rotX: -0.35, rotY: isLeft ? 0.4 : -0.4 });
        }

        // C. Antenas Espinha de Peixe de TV
        if (isMidground && rChoice > 0.80) {
          const antX = baseX + (isLeft ? -1.6 : 1.6);
          fishboneConfigs.push({ x: antX, y: currentY + 0.9, z: bz - 1.4 });
        }

        // D. Piscina Infantil de Lona Azul de Laje
        if (isForeground && rChoice > 0.70 && rChoice <= 0.92) {
          const poolX = baseX + (isLeft ? 0.8 : -0.8);
          poolConfigs.push({ x: poolX, y: currentY + 0.28, z: bz - 1.2 });
          poolWaterConfigs.push({ x: poolX, y: currentY + 0.48, z: bz - 1.2 });
        }

        // E. Botijões de Gás na Laje / Área de Serviço
        if (isForeground && rChoice > 0.50) {
          const gasX = baseX + (isLeft ? -2.2 : 2.2);
          if (pseudo(roofSeed + 4) > 0.5) {
            gasBlueConfigs.push({ x: gasX, y: currentY + 0.38, z: bz + 2.0 });
          } else {
            gasSilverConfigs.push({ x: gasX, y: currentY + 0.38, z: bz + 2.0 });
          }
        }

        // F. Varal de Roupas Coloridas
        if ((isForeground || isMidground) && rChoice > 0.25 && rChoice <= 0.60) {
          const clothZ = bz - 1.0;
          for (let cIdx = 0; cIdx < 4; cIdx++) {
            const colorSlot = (Math.floor(pseudo(roofSeed + cIdx * 7) * 5)) % 5;
            clothesConfigs[colorSlot].push({
              x: baseX + (isLeft ? -1.8 + cIdx * 1.0 : 1.8 - cIdx * 1.0),
              y: currentY + 0.85,
              z: clothZ
            });
          }
        }

        // G. Vergalhões de Ferro ou Telhado Cerâmico Ondulado
        if (rChoice > 0.30) {
          const topW = 6.8;
          const topD = 9.8;
          [[-topW / 2 + 0.4, -topD / 2 + 0.4], [topW / 2 - 0.4, -topD / 2 + 0.4], [-topW / 2 + 0.4, topD / 2 - 0.4], [topW / 2 - 0.4, topD / 2 - 0.4]].forEach(([rx, rz]) => {
            rebarConfigs.push({
              x: baseX + rx,
              y: currentY + 0.6,
              z: bz + rz
            });
          });
        } else {
          roofConfigs.push({
            x: baseX,
            y: currentY + 0.45,
            z: bz,
            scaleX: 7.6,
            scaleY: 0.5,
            scaleZ: 10.6
          });
        }

        prevHouseY = currentY;
        prevHouseZ = bz;
      }
    });

    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    // 1. Casas Pintadas Coloridas
    if (paintedHouseConfigs.length > 0) {
      const houseInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.houseBase, paintedHouseConfigs.length);
      for (let i = 0; i < paintedHouseConfigs.length; i++) {
        const c = paintedHouseConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        houseInst.setMatrixAt(i, dummy.matrix);
        col.set(c.color);
        houseInst.setColorAt(i, col);
      }
      houseInst.instanceMatrix.needsUpdate = true;
      if (houseInst.instanceColor) houseInst.instanceColor.needsUpdate = true;
      segment.add(houseInst);
    }

    // 2. Casas de Tijolo Baiano Vermelho Cerâmico
    if (brickHouseConfigs.length > 0) {
      const brickInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.brickHouse, brickHouseConfigs.length);
      for (let i = 0; i < brickHouseConfigs.length; i++) {
        const c = brickHouseConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        brickInst.setMatrixAt(i, dummy.matrix);
      }
      brickInst.instanceMatrix.needsUpdate = true;
      segment.add(brickInst);
    }

    // 3. Fachadas com Azulejos Portugueses / Ladrilho Hidráulico
    if (tileHouseConfigs.length > 0) {
      const tileInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.tileHouse, tileHouseConfigs.length);
      for (let i = 0; i < tileHouseConfigs.length; i++) {
        const c = tileHouseConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        tileInst.setMatrixAt(i, dummy.matrix);
      }
      tileInst.instanceMatrix.needsUpdate = true;
      segment.add(tileInst);
    }

    // 4. Lajes de Concreto
    if (slabConfigs.length > 0) {
      const slabInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.concreteSlab, slabConfigs.length);
      for (let i = 0; i < slabConfigs.length; i++) {
        const c = slabConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        slabInst.setMatrixAt(i, dummy.matrix);
      }
      slabInst.instanceMatrix.needsUpdate = true;
      segment.add(slabInst);
    }

    // 5. Letreiros de Comércio (8 tipos distintos)
    signConfigs.forEach((configs, sIdx) => {
      if (configs.length > 0) {
        const mat = this.sharedMaterials.signMats[sIdx] || this.sharedMaterials.signMats[0];
        const signInst = new THREE.InstancedMesh(this.unitSignGeo, mat, configs.length);
        for (let i = 0; i < configs.length; i++) {
          const c = configs[i];
          dummy.position.set(c.x, c.y, c.z);
          dummy.rotation.set(0, c.rotY, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          signInst.setMatrixAt(i, dummy.matrix);
        }
        signInst.instanceMatrix.needsUpdate = true;
        segment.add(signInst);
      }
    });

    // 6. Toldos Listrados de Comércio (4 paletas)
    awningConfigs.forEach((configs, aIdx) => {
      if (configs.length > 0) {
        const mat = this.sharedMaterials.awningMats[aIdx] || this.sharedMaterials.awningMats[0];
        const awnInst = new THREE.InstancedMesh(this.unitAwningGeo, mat, configs.length);
        for (let i = 0; i < configs.length; i++) {
          const c = configs[i];
          dummy.position.set(c.x, c.y, c.z);
          dummy.rotation.set(0, c.rotY, 0.12);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          awnInst.setMatrixAt(i, dummy.matrix);
        }
        awnInst.instanceMatrix.needsUpdate = true;
        segment.add(awnInst);
      }
    });

    // 7. Vitrines de Comércio 2.5D
    displayConfigs.forEach((configs, dIdx) => {
      if (configs.length > 0) {
        const mat = this.sharedMaterials.displayMats[dIdx] || this.sharedMaterials.displayMats[0];
        const dispInst = new THREE.InstancedMesh(this.unitStorefrontGeo, mat, configs.length);
        for (let i = 0; i < configs.length; i++) {
          const c = configs[i];
          dummy.position.set(c.x, c.y, c.z);
          dummy.rotation.set(0, c.rotY, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          dispInst.setMatrixAt(i, dummy.matrix);
        }
        dispInst.instanceMatrix.needsUpdate = true;
        segment.add(dispInst);
      }
    });

    // 8. Portas de Enrolar Comerciais
    if (rollerDoorConfigs.length > 0) {
      const rollerInst = new THREE.InstancedMesh(this.unitDoorGeo, this.sharedMaterials.rollerDoorMat, rollerDoorConfigs.length);
      for (let i = 0; i < rollerDoorConfigs.length; i++) {
        const c = rollerDoorConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1.4, 1, 1);
        dummy.updateMatrix();
        rollerInst.setMatrixAt(i, dummy.matrix);
      }
      rollerInst.instanceMatrix.needsUpdate = true;
      segment.add(rollerInst);
    }

    // 9. Portas Residenciais de Madeira
    if (doorConfigs.length > 0) {
      const doorInst = new THREE.InstancedMesh(this.unitDoorGeo, this.sharedMaterials.doorMat, doorConfigs.length);
      for (let i = 0; i < doorConfigs.length; i++) {
        const c = doorConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        doorInst.setMatrixAt(i, dummy.matrix);
      }
      doorInst.instanceMatrix.needsUpdate = true;
      segment.add(doorInst);
    }

    // 10. Janelas com Grade Colonial
    if (windowGrilleConfigs.length > 0) {
      const grilleInst = new THREE.InstancedMesh(this.unitWindowGeo, this.sharedMaterials.windowGrilleMat, windowGrilleConfigs.length);
      for (let i = 0; i < windowGrilleConfigs.length; i++) {
        const c = windowGrilleConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        grilleInst.setMatrixAt(i, dummy.matrix);
      }
      grilleInst.instanceMatrix.needsUpdate = true;
      segment.add(grilleInst);
    }

    // 11. Janelas Modernas Basculantes
    if (modernWinConfigs.length > 0) {
      const modWinInst = new THREE.InstancedMesh(this.unitWindowGeo, this.sharedMaterials.modernWindowMat, modernWinConfigs.length);
      for (let i = 0; i < modernWinConfigs.length; i++) {
        const c = modernWinConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        modWinInst.setMatrixAt(i, dummy.matrix);
      }
      modWinInst.instanceMatrix.needsUpdate = true;
      segment.add(modWinInst);
    }

    // 12. Janelas com Venezianas
    if (windowConfigs.length > 0) {
      const winInst = new THREE.InstancedMesh(this.unitWindowGeo, this.sharedMaterials.windowMat, windowConfigs.length);
      for (let i = 0; i < windowConfigs.length; i++) {
        const c = windowConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        winInst.setMatrixAt(i, dummy.matrix);
      }
      winInst.instanceMatrix.needsUpdate = true;
      segment.add(winInst);
    }

    // 13. Sacadas em Balanço
    if (balconyConfigs.length > 0) {
      const balcInst = new THREE.InstancedMesh(this.unitBalconyGeo, this.sharedMaterials.darkRailing, balconyConfigs.length);
      for (let i = 0; i < balconyConfigs.length; i++) {
        const c = balconyConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        balcInst.setMatrixAt(i, dummy.matrix);
      }
      balcInst.instanceMatrix.needsUpdate = true;
      segment.add(balcInst);
    }

    // 14. Caixas d'Água Fortlev Azul
    if (tankBlueConfigs.length > 0) {
      const tankInst = new THREE.InstancedMesh(this.unitTankGeo, this.sharedMaterials.waterTankBlue, tankBlueConfigs.length);
      for (let i = 0; i < tankBlueConfigs.length; i++) {
        const c = tankBlueConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        tankInst.setMatrixAt(i, dummy.matrix);
      }
      tankInst.instanceMatrix.needsUpdate = true;
      segment.add(tankInst);
    }

    // 15. Caixas d'Água Cinza / Amianto
    if (tankGreyConfigs.length > 0) {
      const tankGInst = new THREE.InstancedMesh(this.unitTankGeo, this.sharedMaterials.waterTankGrey, tankGreyConfigs.length);
      for (let i = 0; i < tankGreyConfigs.length; i++) {
        const c = tankGreyConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        tankGInst.setMatrixAt(i, dummy.matrix);
      }
      tankGInst.instanceMatrix.needsUpdate = true;
      segment.add(tankGInst);
    }

    if (tankAsbestosConfigs.length > 0) {
      const tankAInst = new THREE.InstancedMesh(this.unitTankGeo, this.sharedMaterials.waterTankAsbestos, tankAsbestosConfigs.length);
      for (let i = 0; i < tankAsbestosConfigs.length; i++) {
        const c = tankAsbestosConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1.1, 0.9, 1.1);
        dummy.updateMatrix();
        tankAInst.setMatrixAt(i, dummy.matrix);
      }
      tankAInst.instanceMatrix.needsUpdate = true;
      segment.add(tankAInst);
    }

    // 16. Antenas Parabólicas 3D BRASILSAT
    if (dishConfigs.length > 0) {
      const dishInst = new THREE.InstancedMesh(this.unitDishGeo, this.sharedMaterials.dishMat, dishConfigs.length);
      const stemInst = new THREE.InstancedMesh(this.unitDishStemGeo, this.sharedMaterials.dishStemMat, dishStemConfigs.length);
      for (let i = 0; i < dishConfigs.length; i++) {
        const c = dishConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(c.rotX || -0.3, c.rotY || 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        dishInst.setMatrixAt(i, dummy.matrix);

        const sc = dishStemConfigs[i];
        dummy.position.set(sc.x, sc.y, sc.z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        stemInst.setMatrixAt(i, dummy.matrix);
      }
      dishInst.instanceMatrix.needsUpdate = true;
      stemInst.instanceMatrix.needsUpdate = true;
      segment.add(dishInst, stemInst);
    }

    // 17. Antenas Espinha de Peixe
    if (fishboneConfigs.length > 0) {
      const fishInst = new THREE.InstancedMesh(this.unitFishboneGeo, this.sharedMaterials.dishStemMat, fishboneConfigs.length);
      for (let i = 0; i < fishboneConfigs.length; i++) {
        const c = fishboneConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        fishInst.setMatrixAt(i, dummy.matrix);
      }
      fishInst.instanceMatrix.needsUpdate = true;
      segment.add(fishInst);
    }

    // 18. Botijões de Gás na Laje
    if (gasBlueConfigs.length > 0) {
      const gasInst = new THREE.InstancedMesh(this.unitGasGeo, this.sharedMaterials.gasBlueMat, gasBlueConfigs.length);
      for (let i = 0; i < gasBlueConfigs.length; i++) {
        const c = gasBlueConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        gasInst.setMatrixAt(i, dummy.matrix);
      }
      gasInst.instanceMatrix.needsUpdate = true;
      segment.add(gasInst);
    }

    if (gasSilverConfigs.length > 0) {
      const gasSInst = new THREE.InstancedMesh(this.unitGasGeo, this.sharedMaterials.gasSilverMat, gasSilverConfigs.length);
      for (let i = 0; i < gasSilverConfigs.length; i++) {
        const c = gasSilverConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        gasSInst.setMatrixAt(i, dummy.matrix);
      }
      gasSInst.instanceMatrix.needsUpdate = true;
      segment.add(gasSInst);
    }

    // 19. Mesas e Cadeiras Amarelas de Boteco
    if (chairConfigs.length > 0) {
      const chairInst = new THREE.InstancedMesh(this.unitChairGeo, this.sharedMaterials.plasticYellowChairMat, chairConfigs.length);
      for (let i = 0; i < chairConfigs.length; i++) {
        const c = chairConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY || 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        chairInst.setMatrixAt(i, dummy.matrix);
      }
      chairInst.instanceMatrix.needsUpdate = true;
      segment.add(chairInst);
    }

    if (tableConfigs.length > 0) {
      const tableInst = new THREE.InstancedMesh(this.unitTableGeo, this.sharedMaterials.plasticYellowTableMat, tableConfigs.length);
      for (let i = 0; i < tableConfigs.length; i++) {
        const c = tableConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        tableInst.setMatrixAt(i, dummy.matrix);
      }
      tableInst.instanceMatrix.needsUpdate = true;
      segment.add(tableInst);
    }

    // 20. Piscina de Lona Azul de Laje
    if (poolConfigs.length > 0) {
      const poolInst = new THREE.InstancedMesh(this.unitPoolGeo, this.sharedMaterials.poolBlueMat, poolConfigs.length);
      const waterInst = new THREE.InstancedMesh(this.unitWaterGeo, this.sharedMaterials.poolWaterMat, poolWaterConfigs.length);
      for (let i = 0; i < poolConfigs.length; i++) {
        const c = poolConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        poolInst.setMatrixAt(i, dummy.matrix);

        const wc = poolWaterConfigs[i];
        dummy.position.set(wc.x, wc.y, wc.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        waterInst.setMatrixAt(i, dummy.matrix);
      }
      poolInst.instanceMatrix.needsUpdate = true;
      waterInst.instanceMatrix.needsUpdate = true;
      segment.add(poolInst, waterInst);
    }

    // 21. Varais de Roupas Coloridas
    clothesConfigs.forEach((configs, colorIdx) => {
      if (configs.length > 0) {
        const mat = this.sharedMaterials.clothes[colorIdx] || this.sharedMaterials.clothes[0];
        const clothInst = new THREE.InstancedMesh(this.unitClothGeo, mat, configs.length);
        for (let i = 0; i < configs.length; i++) {
          const c = configs[i];
          dummy.position.set(c.x, c.y, c.z);
          dummy.rotation.set(0, 0, 0.1);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          clothInst.setMatrixAt(i, dummy.matrix);
        }
        clothInst.instanceMatrix.needsUpdate = true;
        segment.add(clothInst);
      }
    });

    // 22. Escadarias de Concreto
    if (stairStepConfigs.length > 0) {
      const stairInst = new THREE.InstancedMesh(this.unitStairStepGeo, this.sharedMaterials.stairConcrete, stairStepConfigs.length);
      for (let i = 0; i < stairStepConfigs.length; i++) {
        const c = stairStepConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        stairInst.setMatrixAt(i, dummy.matrix);
      }
      stairInst.instanceMatrix.needsUpdate = true;
      segment.add(stairInst);
    }

    // 23. Corrimão das Escadas
    if (railingConfigs.length > 0) {
      const railInst = new THREE.InstancedMesh(this.unitRailingGeo, this.sharedMaterials.darkRailing, railingConfigs.length);
      for (let i = 0; i < railingConfigs.length; i++) {
        const c = railingConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        railInst.setMatrixAt(i, dummy.matrix);
      }
      railInst.instanceMatrix.needsUpdate = true;
      segment.add(railInst);
    }

    // 24. Relógios de Luz
    if (meterBoxConfigs.length > 0) {
      const meterInst = new THREE.InstancedMesh(this.unitMeterBoxGeo, this.sharedMaterials.meterBox, meterBoxConfigs.length);
      for (let i = 0; i < meterBoxConfigs.length; i++) {
        const c = meterBoxConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meterInst.setMatrixAt(i, dummy.matrix);
      }
      meterInst.instanceMatrix.needsUpdate = true;
      segment.add(meterInst);
    }

    // 25. Vergalhões de Ferro
    if (rebarConfigs.length > 0) {
      const rebarInst = new THREE.InstancedMesh(this.unitRebarGeo, this.sharedMaterials.rebar, rebarConfigs.length);
      for (let i = 0; i < rebarConfigs.length; i++) {
        const c = rebarConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        rebarInst.setMatrixAt(i, dummy.matrix);
      }
      rebarInst.instanceMatrix.needsUpdate = true;
      segment.add(rebarInst);
    }

    // 26. Aparelhos de Ar Condicionado
    if (acConfigs.length > 0) {
      const acInst = new THREE.InstancedMesh(this.unitACGeo, this.sharedMaterials.acUnit, acConfigs.length);
      for (let i = 0; i < acConfigs.length; i++) {
        const c = acConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        acInst.setMatrixAt(i, dummy.matrix);
      }
      acInst.instanceMatrix.needsUpdate = true;
      segment.add(acInst);
    }

    // 27. Telhados Ondulados
    if (roofConfigs.length > 0) {
      const roofInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.corrugatedRoofMat, roofConfigs.length);
      for (let i = 0; i < roofConfigs.length; i++) {
        const c = roofConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        roofInst.setMatrixAt(i, dummy.matrix);
      }
      roofInst.instanceMatrix.needsUpdate = true;
      segment.add(roofInst);
    }
  }

  buildStreetPropsAndPowerLines(segment) {
    const poleConfigs = [];
    const crossConfigs = [];
    const insulatorConfigs = [];
    const armConfigs = [];
    const lampConfigs = [];
    const transfConfigs = [];
    const dumpsterConfigs = [];

    [-7.8, 7.8].forEach((px, sideIdx) => {
      const isLeft = sideIdx === 0;

      for (let pz = -SEGMENT_LENGTH / 2 + 14; pz < SEGMENT_LENGTH / 2; pz += 28) {
        // 1. Poste de Concreto Cilíndrico
        poleConfigs.push({ x: px, y: 5.25, z: pz });

        // 2. Cruzeta Superior com 3 Isoladores
        crossConfigs.push({ x: px + (isLeft ? 0.7 : -0.7), y: 9.6, z: pz });

        [-0.9, 0.0, 0.9].forEach(ix => {
          insulatorConfigs.push({ x: px + (isLeft ? 0.7 : -0.7) + ix, y: 9.8, z: pz });
        });

        // 3. Luminária Pública
        armConfigs.push({
          x: px + (isLeft ? 1.0 : -1.0),
          y: 9.0,
          z: pz,
          rotZ: isLeft ? -0.15 : 0.15
        });

        lampConfigs.push({ x: px + (isLeft ? 1.7 : -1.7), y: 8.8, z: pz });

        // 4. Transformador
        if (pz > -10 && pz < 20) {
          transfConfigs.push({ x: px + (isLeft ? -0.55 : 0.55), y: 7.8, z: pz });
        }

        // 5. Caçamba
        if (Math.random() > 0.55) {
          dumpsterConfigs.push({ x: px + (isLeft ? -1.5 : 1.5), y: 0.55, z: pz + 6 });
        }
      }

      // 6. Fios Elétricos Suspensos (Reutiliza Geometrias Pré-compiladas)
      const xOffsets = isLeft ? [0.2, 0.7, 1.2, -0.2, 0.0] : [-0.2, -0.7, -1.2, 0.2, 0.0];
      for (let i = 0; i < this.prebuiltCableGeos.length; i++) {
        const cable = new THREE.Mesh(this.prebuiltCableGeos[i], this.sharedMaterials.cableBlack);
        cable.position.set(px + xOffsets[i], 0, 0);
        segment.add(cable);
      }
    });

    const dummy = new THREE.Object3D();

    // 1. Postes Instanciados
    if (poleConfigs.length > 0) {
      const poleInst = new THREE.InstancedMesh(this.unitPoleGeo, this.sharedMaterials.concretePole, poleConfigs.length);
      for (let i = 0; i < poleConfigs.length; i++) {
        const c = poleConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        poleInst.setMatrixAt(i, dummy.matrix);
      }
      poleInst.instanceMatrix.needsUpdate = true;
      segment.add(poleInst);
    }

    // 2. Cruzetas Instanciadas
    if (crossConfigs.length > 0) {
      const crossInst = new THREE.InstancedMesh(this.unitCrossGeo, this.sharedMaterials.railTie, crossConfigs.length);
      for (let i = 0; i < crossConfigs.length; i++) {
        const c = crossConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        crossInst.setMatrixAt(i, dummy.matrix);
      }
      crossInst.instanceMatrix.needsUpdate = true;
      segment.add(crossInst);
    }

    // 3. Isoladores Instanciados
    if (insulatorConfigs.length > 0) {
      const insInst = new THREE.InstancedMesh(this.unitInsulatorGeo, this.sharedMaterials.insulatorBrown, insulatorConfigs.length);
      for (let i = 0; i < insulatorConfigs.length; i++) {
        const c = insulatorConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        insInst.setMatrixAt(i, dummy.matrix);
      }
      insInst.instanceMatrix.needsUpdate = true;
      segment.add(insInst);
    }

    // 4. Braços de Luminária Instanciados
    if (armConfigs.length > 0) {
      const armInst = new THREE.InstancedMesh(this.unitArmGeo, this.sharedMaterials.concretePole, armConfigs.length);
      for (let i = 0; i < armConfigs.length; i++) {
        const c = armConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, c.rotZ || 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        armInst.setMatrixAt(i, dummy.matrix);
      }
      armInst.instanceMatrix.needsUpdate = true;
      segment.add(armInst);
    }

    // 5. Lâmpadas Instanciadas
    if (lampConfigs.length > 0) {
      const lampInst = new THREE.InstancedMesh(this.unitLampGeo, this.sharedMaterials.streetLampMat, lampConfigs.length);
      for (let i = 0; i < lampConfigs.length; i++) {
        const c = lampConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        lampInst.setMatrixAt(i, dummy.matrix);
      }
      lampInst.instanceMatrix.needsUpdate = true;
      segment.add(lampInst);
    }

    // 6. Transformadores Instanciados
    if (transfConfigs.length > 0) {
      const transfInst = new THREE.InstancedMesh(this.unitTransfGeo, this.sharedMaterials.transformerMat, transfConfigs.length);
      for (let i = 0; i < transfConfigs.length; i++) {
        const c = transfConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        transfInst.setMatrixAt(i, dummy.matrix);
      }
      transfInst.instanceMatrix.needsUpdate = true;
      segment.add(transfInst);
    }

    // 7. Caçambas Instanciadas
    if (dumpsterConfigs.length > 0) {
      const dumpInst = new THREE.InstancedMesh(this.unitDumpsterGeo, this.sharedMaterials.dumpster, dumpsterConfigs.length);
      for (let i = 0; i < dumpsterConfigs.length; i++) {
        const c = dumpsterConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        dumpInst.setMatrixAt(i, dummy.matrix);
      }
      dumpInst.instanceMatrix.needsUpdate = true;
      segment.add(dumpInst);
    }
  }

  buildVegetationAndStaticVehicles(segment) {
    const dummy = new THREE.Object3D();
    const colHelper = new THREE.Color();

    // Arrays de configuração para InstancedMesh de Vegetação
    const palmTrunkConfigs = [];
    const palmLeafConfigs = [];
    const bananaLeafConfigs = [];
    const bushConfigs = [];
    const potConfigs = [];
    const potPlantConfigs = [];
    const ivyConfigs = [];

    // Arrays de configuração para InstancedMesh de Veículos (Unificados por tipo)
    const kombiConfigs = [];
    const fuscaConfigs = [];
    const carConfigs = [];
    const vehicleWheelConfigs = [];
    const plateConfigs = [];
    const motoConfigs = [];

    // Cores de Veículos Brasileiros Clássicos
    const kombiPalette = [0x0284c7, 0xb91c1c, 0xeab308, 0x059669]; // Azul Celeste, Vermelho, Amarelo, Verde Menta
    const fuscaPalette = [0x1e3a8a, 0xfacc15, 0xf1f5f9, 0x991b1b]; // Azul, Amarelo, Branco, Bordô
    const carPalette = [0x94a3b8, 0xb91c1c, 0xf8fafc, 0x334155];   // Prata, Vermelho, Branco, Grafite

    // Gerador pseudoaleatório determinístico por coordenada
    const hash = (x, z) => {
      let v = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453123;
      return v - Math.floor(v);
    };

    // 1. Trepadeiras de Hera nas Muretas de Concreto
    [-5.18, 5.18].forEach((wx, sideIdx) => {
      for (let gz = -SEGMENT_LENGTH / 2 + 6; gz < SEGMENT_LENGTH / 2; gz += 16) {
        if (hash(wx, gz) > 0.32) {
          ivyConfigs.push({
            x: wx + (sideIdx === 0 ? 0.22 : -0.22),
            y: 0.55,
            z: gz,
            rotY: sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2
          });
        }
      }
    });

    // 2. Vegetação Tropical Exuberante: Coqueiros, Bananeiras e Arbustos
    [-9.2, 9.2, -15.5, 15.5, -26.0, 26.0, -38.0, 38.0].forEach((vx, colIdx) => {
      const isNearTrack = Math.abs(vx) < 11.0;

      for (let vz = -SEGMENT_LENGTH / 2 + 8; vz < SEGMENT_LENGTH / 2; vz += 18) {
        const h = hash(vx, vz);

        // Coqueiros Tropicais Grandes (Tronco de 7.2m + Copa com 6 folhas em leque 3D)
        if (h > 0.55) {
          const trunkY = 3.6;
          palmTrunkConfigs.push({ x: vx, y: trunkY, z: vz, rotZ: (h - 0.75) * 0.15 });

          const crownY = 7.1;
          for (let l = 0; l < 6; l++) {
            const angle = (l / 6) * Math.PI * 2 + h * 3;
            palmLeafConfigs.push({
              x: vx + Math.cos(angle) * 0.9,
              y: crownY,
              z: vz + Math.sin(angle) * 0.9,
              rotX: -0.45,
              rotY: angle,
              rotZ: 0
            });
          }
        }
        // Bananeiras Tropicais com Folhas Largas
        else if (h > 0.30 && !isNearTrack) {
          for (let b = 0; b < 4; b++) {
            const angle = (b / 4) * Math.PI * 2 + h * 2;
            bananaLeafConfigs.push({
              x: vx + Math.cos(angle) * 0.6,
              y: 1.5,
              z: vz + Math.sin(angle) * 0.6,
              rotX: -0.35,
              rotY: angle,
              scale: 1.1 + (h * 0.3)
            });
          }
        }
        // Arbustos & Canteiros Verdes
        else if (h < 0.30) {
          bushConfigs.push({
            x: vx + (h - 0.2) * 1.5,
            y: 0.9,
            z: vz,
            scale: 1.0 + h * 0.6
          });
        }
      }
    });

    // 3. Vasos de Barro com Plantas nas Calçadas e Entradas das Lojas
    [-6.8, 6.8].forEach(px => {
      for (let pz = -SEGMENT_LENGTH / 2 + 10; pz < SEGMENT_LENGTH / 2; pz += 16) {
        const h = hash(px, pz);
        if (h > 0.45) {
          potConfigs.push({ x: px, y: 0.35, z: pz });
          potPlantConfigs.push({ x: px, y: 0.85, z: pz });
        }
      }
    });

    // 4. Veículos Estáticos Estilizados
    // Posicionados estrategicamente no acostamento da pista (x = +/- 8.6), totalmente fora das casas!
    [-8.6, 8.6].forEach((vehX, sideIdx) => {
      const isLeft = sideIdx === 0;

      for (let vz = -SEGMENT_LENGTH / 2 + 14; vz < SEGMENT_LENGTH / 2; vz += 28) {
        const vHash = hash(vehX + 1.2, vz);
        const rotY = (vHash > 0.5) ? (isLeft ? 0.05 : -0.05) : (isLeft ? Math.PI - 0.05 : Math.PI + 0.05);

        // Kombi Bicolor Brasileira (Saia e Blusa)
        if (vHash > 0.65) {
          const colorHex = kombiPalette[Math.floor(vHash * 4) % 4];
          kombiConfigs.push({ x: vehX, y: 0.75, z: vz, rotY, color: colorHex });

          // 4 Rodas
          const wheelOffsets = [
            { x: -1.05, z: 1.4 }, { x: 1.05, z: 1.4 },
            { x: -1.05, z: -1.4 }, { x: 1.05, z: -1.4 }
          ];
          wheelOffsets.forEach(wo => {
            const rx = vehX + wo.x;
            const rz = vz + wo.z;
            vehicleWheelConfigs.push({ x: rx, y: 0.45, z: rz, rotY });
          });

          // Placas
          plateConfigs.push({
            x: vehX,
            y: 0.55,
            z: vz + (rotY > Math.PI / 2 ? -2.45 : 2.45),
            rotY
          });
        }
        // Fusca Clássico Low-Poly
        else if (vHash > 0.35) {
          const colorHex = fuscaPalette[Math.floor(vHash * 4) % 4];
          fuscaConfigs.push({ x: vehX, y: 0.65, z: vz, rotY, color: colorHex });

          const wheelOffsets = [
            { x: -0.95, z: 1.2 }, { x: 0.95, z: 1.2 },
            { x: -0.95, z: -1.2 }, { x: 0.95, z: -1.2 }
          ];
          wheelOffsets.forEach(wo => {
            vehicleWheelConfigs.push({ x: vehX + wo.x, y: 0.45, z: vz + wo.z, rotY });
          });

          plateConfigs.push({
            x: vehX,
            y: 0.48,
            z: vz + (rotY > Math.PI / 2 ? -2.05 : 2.05),
            rotY
          });
        }
        // Carro Popular 90s
        else if (vHash > 0.12) {
          const colorHex = carPalette[Math.floor(vHash * 4) % 4];
          carConfigs.push({ x: vehX, y: 0.62, z: vz, rotY, color: colorHex });

          const wheelOffsets = [
            { x: -0.95, z: 1.3 }, { x: 0.95, z: 1.3 },
            { x: -0.95, z: -1.3 }, { x: 0.95, z: -1.3 }
          ];
          wheelOffsets.forEach(wo => {
            vehicleWheelConfigs.push({ x: vehX + wo.x, y: 0.45, z: vz + wo.z, rotY });
          });
        }
      }
    });

    // Motos de Entrega (Motoboy com baú vermelho na calçada em frente às lojas)
    [-7.2, 7.2].forEach((mx, mSide) => {
      for (let mz = -SEGMENT_LENGTH / 2 + 18; mz < SEGMENT_LENGTH / 2; mz += 32) {
        const mHash = hash(mx + 3.3, mz);
        if (mHash > 0.35) {
          const rotY = mSide === 0 ? 0.35 : -0.35;
          motoConfigs.push({ x: mx, y: 0.55, z: mz, rotY });
        }
      }
    });

    // ==========================================
    // CRIAÇÃO DOS INSTANCED MESHES DA FASE B
    // ==========================================

    // 1. Trepadeiras de Hera
    if (ivyConfigs.length > 0) {
      const ivyInst = new THREE.InstancedMesh(this.unitIvyGeo, this.sharedMaterials.ivyMat, ivyConfigs.length);
      for (let i = 0; i < ivyConfigs.length; i++) {
        const c = ivyConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        ivyInst.setMatrixAt(i, dummy.matrix);
      }
      ivyInst.instanceMatrix.needsUpdate = true;
      segment.add(ivyInst);
    }

    // 2. Troncos de Palmeiras
    if (palmTrunkConfigs.length > 0) {
      const trunkInst = new THREE.InstancedMesh(this.unitPalmTrunkGeo, this.sharedMaterials.palmTrunkMat, palmTrunkConfigs.length);
      for (let i = 0; i < palmTrunkConfigs.length; i++) {
        const c = palmTrunkConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, c.rotZ || 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        trunkInst.setMatrixAt(i, dummy.matrix);
      }
      trunkInst.instanceMatrix.needsUpdate = true;
      segment.add(trunkInst);
    }

    // 3. Folhas de Palmeiras
    if (palmLeafConfigs.length > 0) {
      const leafInst = new THREE.InstancedMesh(this.unitPalmLeafGeo, this.sharedMaterials.palmLeafMat, palmLeafConfigs.length);
      for (let i = 0; i < palmLeafConfigs.length; i++) {
        const c = palmLeafConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(c.rotX, c.rotY, c.rotZ || 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        leafInst.setMatrixAt(i, dummy.matrix);
      }
      leafInst.instanceMatrix.needsUpdate = true;
      segment.add(leafInst);
    }

    // 4. Bananeiras Tropicais
    if (bananaLeafConfigs.length > 0) {
      const bLeafInst = new THREE.InstancedMesh(this.unitBananaLeafGeo, this.sharedMaterials.bananaLeafMat, bananaLeafConfigs.length);
      for (let i = 0; i < bananaLeafConfigs.length; i++) {
        const c = bananaLeafConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(c.rotX, c.rotY, 0);
        dummy.scale.set(c.scale, c.scale, c.scale);
        dummy.updateMatrix();
        bLeafInst.setMatrixAt(i, dummy.matrix);
      }
      bLeafInst.instanceMatrix.needsUpdate = true;
      segment.add(bLeafInst);
    }

    // 5. Arbustos & Moitas
    if (bushConfigs.length > 0) {
      const bushInst = new THREE.InstancedMesh(this.unitBushGeo, this.sharedMaterials.bushMat, bushConfigs.length);
      for (let i = 0; i < bushConfigs.length; i++) {
        const c = bushConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(c.scale, c.scale, c.scale);
        dummy.updateMatrix();
        bushInst.setMatrixAt(i, dummy.matrix);
      }
      bushInst.instanceMatrix.needsUpdate = true;
      segment.add(bushInst);
    }

    // 6. Vasos de Planta
    if (potConfigs.length > 0) {
      const potInst = new THREE.InstancedMesh(this.unitClayPotGeo, this.sharedMaterials.clayPotMat, potConfigs.length);
      const potPInst = new THREE.InstancedMesh(this.unitBushGeo, this.sharedMaterials.bushMat, potPlantConfigs.length);
      for (let i = 0; i < potConfigs.length; i++) {
        const c = potConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        potInst.setMatrixAt(i, dummy.matrix);

        const pc = potPlantConfigs[i];
        dummy.position.set(pc.x, pc.y, pc.z);
        dummy.scale.set(0.55, 0.55, 0.55);
        dummy.updateMatrix();
        potPInst.setMatrixAt(i, dummy.matrix);
      }
      potInst.instanceMatrix.needsUpdate = true;
      potPInst.instanceMatrix.needsUpdate = true;
      segment.add(potInst, potPInst);
    }

    // 7. Kombis Bicolores (1 Único InstancedMesh com setColorAt)
    if (kombiConfigs.length > 0) {
      const kLowInst = new THREE.InstancedMesh(this.unitKombiLowerGeo, this.sharedMaterials.houseBase, kombiConfigs.length);
      const kUpInst = new THREE.InstancedMesh(this.unitKombiUpperGeo, this.sharedMaterials.kombiUpperMat, kombiConfigs.length);

      for (let i = 0; i < kombiConfigs.length; i++) {
        const c = kombiConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        kLowInst.setMatrixAt(i, dummy.matrix);
        colHelper.setHex(c.color);
        kLowInst.setColorAt(i, colHelper);

        dummy.position.set(c.x, c.y + 1.15, c.z);
        dummy.updateMatrix();
        kUpInst.setMatrixAt(i, dummy.matrix);
      }
      kLowInst.instanceMatrix.needsUpdate = true;
      kLowInst.instanceColor.needsUpdate = true;
      kUpInst.instanceMatrix.needsUpdate = true;
      segment.add(kLowInst, kUpInst);
    }

    // 8. Fuscas (1 Único InstancedMesh com setColorAt)
    if (fuscaConfigs.length > 0) {
      const fBodyInst = new THREE.InstancedMesh(this.unitFuscaBodyGeo, this.sharedMaterials.houseBase, fuscaConfigs.length);
      const fCabInst = new THREE.InstancedMesh(this.unitFuscaCabinGeo, this.sharedMaterials.vehicleGlassMat, fuscaConfigs.length);

      for (let i = 0; i < fuscaConfigs.length; i++) {
        const c = fuscaConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        fBodyInst.setMatrixAt(i, dummy.matrix);
        colHelper.setHex(c.color);
        fBodyInst.setColorAt(i, colHelper);

        dummy.position.set(c.x, c.y + 0.85, c.z);
        dummy.updateMatrix();
        fCabInst.setMatrixAt(i, dummy.matrix);
      }
      fBodyInst.instanceMatrix.needsUpdate = true;
      fBodyInst.instanceColor.needsUpdate = true;
      fCabInst.instanceMatrix.needsUpdate = true;
      segment.add(fBodyInst, fCabInst);
    }

    // 9. Carros Populares (1 Único InstancedMesh com setColorAt)
    if (carConfigs.length > 0) {
      const cBodyInst = new THREE.InstancedMesh(this.unitCarBodyGeo, this.sharedMaterials.houseBase, carConfigs.length);
      const cCabInst = new THREE.InstancedMesh(this.unitCarCabinGeo, this.sharedMaterials.vehicleGlassMat, carConfigs.length);

      for (let i = 0; i < carConfigs.length; i++) {
        const c = carConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        cBodyInst.setMatrixAt(i, dummy.matrix);
        colHelper.setHex(c.color);
        cBodyInst.setColorAt(i, colHelper);

        dummy.position.set(c.x, c.y + 0.82, c.z);
        dummy.updateMatrix();
        cCabInst.setMatrixAt(i, dummy.matrix);
      }
      cBodyInst.instanceMatrix.needsUpdate = true;
      cBodyInst.instanceColor.needsUpdate = true;
      cCabInst.instanceMatrix.needsUpdate = true;
      segment.add(cBodyInst, cCabInst);
    }

    // 10. Rodas dos Veículos
    if (vehicleWheelConfigs.length > 0) {
      const wheelInst = new THREE.InstancedMesh(this.unitVehicleWheelGeo, this.sharedMaterials.vehicleWheelMat, vehicleWheelConfigs.length);
      for (let i = 0; i < vehicleWheelConfigs.length; i++) {
        const c = vehicleWheelConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY || 0, Math.PI / 2);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        wheelInst.setMatrixAt(i, dummy.matrix);
      }
      wheelInst.instanceMatrix.needsUpdate = true;
      segment.add(wheelInst);
    }

    // 11. Placas & Detalhes
    if (plateConfigs.length > 0) {
      const plateInst = new THREE.InstancedMesh(this.unitCarPlateGeo, this.sharedMaterials.vehiclePlateMat, plateConfigs.length);
      for (let i = 0; i < plateConfigs.length; i++) {
        const c = plateConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        plateInst.setMatrixAt(i, dummy.matrix);
      }
      plateInst.instanceMatrix.needsUpdate = true;
      segment.add(plateInst);
    }

    // 12. Motos de Entrega
    if (motoConfigs.length > 0) {
      const mBodyInst = new THREE.InstancedMesh(this.unitMotoBodyGeo, this.sharedMaterials.motoBodyMat, motoConfigs.length);
      const mBoxInst = new THREE.InstancedMesh(this.unitMotoBoxGeo, this.sharedMaterials.motoBoxMat, motoConfigs.length);
      const mWheelInst = new THREE.InstancedMesh(this.unitMotoWheelGeo, this.sharedMaterials.vehicleWheelMat, motoConfigs.length * 2);

      let wIdx = 0;
      for (let i = 0; i < motoConfigs.length; i++) {
        const c = motoConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mBodyInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(c.x - Math.sin(c.rotY) * 0.5, c.y + 0.65, c.z - Math.cos(c.rotY) * 0.5);
        dummy.updateMatrix();
        mBoxInst.setMatrixAt(i, dummy.matrix);

        // Rodas dianteira e traseira
        dummy.position.set(c.x + Math.sin(c.rotY) * 0.8, c.y - 0.2, c.z + Math.cos(c.rotY) * 0.8);
        dummy.rotation.set(0, c.rotY, Math.PI / 2);
        dummy.updateMatrix();
        mWheelInst.setMatrixAt(wIdx++, dummy.matrix);

        dummy.position.set(c.x - Math.sin(c.rotY) * 0.8, c.y - 0.2, c.z - Math.cos(c.rotY) * 0.8);
        dummy.updateMatrix();
        mWheelInst.setMatrixAt(wIdx++, dummy.matrix);
      }

      mBodyInst.instanceMatrix.needsUpdate = true;
      mBoxInst.instanceMatrix.needsUpdate = true;
      mWheelInst.instanceMatrix.needsUpdate = true;
      segment.add(mBodyInst, mBoxInst, mWheelInst);
    }
  }

  buildNpcsAndUrbanLife(segment) {
    const dummy = new THREE.Object3D();
    const colHelper = new THREE.Color();

    // Arrays de configuração para InstancedMesh da Fase C
    const kiteConfigs = [];
    const kiteTailConfigs = [];
    const drumGrillConfigs = [];
    const grillGridConfigs = [];
    const smokeConfigs = [];

    const dogBodyConfigs = [];
    const dogHeadConfigs = [];
    const dogSnoutConfigs = [];
    const dogEarConfigs = [];
    const dogLegConfigs = [];
    const dogTailConfigs = [];

    const npcConfigs = [];
    const npcLimbConfigs = [];
    const npcCupConfigs = [];

    const npcShirtColors = [0xfacc15, 0xdc2626, 0x0284c7, 0xf8fafc, 0x16a34a]; // Canarinho, Vermelha, Azul, Branca, Verde
    const npcShortsColors = [0x1e3a8a, 0x334155, 0xb45309]; // Jeans, Preto, Cáqui

    const hash = (x, z) => {
      let v = Math.sin(x * 17.135 + z * 91.713) * 31415.9265;
      return v - Math.floor(v);
    };

    // 1. Pipas Coloridas Flutuando no Alto do Morro (Mais Baixas, Maiores e Mais Perto da Pista)
    [-16.0, 16.0, -26.0, 26.0].forEach((kx, kSide) => {
      for (let kz = -SEGMENT_LENGTH / 2 + 12; kz < SEGMENT_LENGTH / 2; kz += 26) {
        const kHash = hash(kx, kz);
        if (kHash > 0.35) {
          const kiteY = 12.0 + kHash * 5.0; // Altitude 12m a 17m (bem visível)

          kiteConfigs.push({
            x: kx,
            y: kiteY,
            z: kz,
            rotX: -0.35 + Math.sin(kHash * 10) * 0.15,
            rotY: kSide === 0 ? 0.35 : -0.35,
            rotZ: Math.sin(kHash * 20) * 0.20,
            texIdx: Math.floor(kHash * 4) % 4
          });

          // Rabiola da Pipa (4 fitinhas)
          for (let t = 1; t <= 4; t++) {
            kiteTailConfigs.push({
              x: kx - (kSide === 0 ? 0.35 : -0.35) * t,
              y: kiteY - t * 0.85,
              z: kz - t * 0.45,
              rotX: -0.2,
              rotY: kSide === 0 ? 0.35 : -0.35
            });
          }
        }
      }
    });

    // 2. Cachorro Caramelo (Ícone Brasileiro, Grande e Destacado na Calçada ao lado do Jogador)
    [-6.6, 6.6, -11.5, 11.5].forEach((dx, dSide) => {
      for (let dz = -SEGMENT_LENGTH / 2 + 16; dz < SEGMENT_LENGTH / 2; dz += 32) {
        const dHash = hash(dx, dz);
        if (dHash > 0.40) {
          const rotY = dSide === 0 ? 0.5 : -0.5;
          const dogY = Math.abs(dx) > 10.0 ? 3.85 : 0.38; // na laje ou calçada

          dogBodyConfigs.push({ x: dx, y: dogY, z: dz, rotY });
          dogHeadConfigs.push({ x: dx, y: dogY + 0.32, z: dz + 0.45, rotY });
          dogSnoutConfigs.push({ x: dx, y: dogY + 0.26, z: dz + 0.65, rotY });

          // Orelhas
          dogEarConfigs.push({ x: dx - 0.14, y: dogY + 0.42, z: dz + 0.42, rotY });
          dogEarConfigs.push({ x: dx + 0.14, y: dogY + 0.42, z: dz + 0.42, rotY });

          // 4 Patas
          const legOffsets = [
            { x: -0.16, z: 0.28 }, { x: 0.16, z: 0.28 },
            { x: -0.16, z: -0.28 }, { x: 0.16, z: -0.28 }
          ];
          legOffsets.forEach(lo => {
            dogLegConfigs.push({ x: dx + lo.x, y: dogY - 0.16, z: dz + lo.z, rotY });
          });

          // Rabo levantado abanando
          dogTailConfigs.push({ x: dx, y: dogY + 0.25, z: dz - 0.48, rotX: 0.45, rotY });
        }
      }
    });

    // 3. Churrasqueiras Fumegantes com Fumaça Densa
    [-7.8, 7.8, -14.5, 14.5].forEach((gx, gSide) => {
      for (let gz = -SEGMENT_LENGTH / 2 + 14; gz < SEGMENT_LENGTH / 2; gz += 36) {
        const gHash = hash(gx + 2.5, gz);
        if (gHash > 0.42) {
          const isLaje = Math.abs(gx) > 10.0;
          const grillY = isLaje ? 3.85 : 0.52;

          drumGrillConfigs.push({ x: gx, y: grillY, z: gz });
          grillGridConfigs.push({ x: gx, y: grillY + 0.48, z: gz });

          // Fumaça subindo (4 puffs volumétricos)
          for (let s = 1; s <= 4; s++) {
            smokeConfigs.push({
              x: gx + (s * 0.15),
              y: grillY + 0.75 + s * 0.55,
              z: gz - (s * 0.10),
              scale: 0.8 + s * 0.35
            });
          }

          // Morador Churrasqueiro ao lado da grelha
          const shirtColor = npcShirtColors[Math.floor(gHash * 5) % 5];
          const shortsColor = npcShortsColors[Math.floor(gHash * 3) % 3];
          const npcX = gx + (gSide === 0 ? 0.95 : -0.95);
          const npcZ = gz;
          const npcY = isLaje ? 3.85 : 0.55;
          const rotY = gSide === 0 ? -Math.PI / 2 : Math.PI / 2;

          npcConfigs.push({
            x: npcX,
            y: npcY,
            z: npcZ,
            rotY,
            shirtColor,
            shortsColor
          });

          // Braço segurando copo americano
          npcLimbConfigs.push({ x: npcX + (gSide === 0 ? 0.35 : -0.35), y: npcY + 0.75, z: npcZ + 0.18, rotY });
          npcCupConfigs.push({ x: npcX + (gSide === 0 ? 0.40 : -0.40), y: npcY + 0.62, z: npcZ + 0.26 });
        }
      }
    });

    // 4. Moradores nas Lajes e Calçadas (Acenando, Torcendo e Conversando)
    [-6.8, 6.8, -12.5, 12.5].forEach((nx, nSide) => {
      for (let nz = -SEGMENT_LENGTH / 2 + 8; nz < SEGMENT_LENGTH / 2; nz += 20) {
        const nHash = hash(nx + 5.7, nz);
        if (nHash > 0.45) {
          const isLaje = Math.abs(nx) > 9.0;
          const npcY = isLaje ? 3.85 : 0.55;
          const shirtColor = npcShirtColors[Math.floor(nHash * 5) % 5];
          const shortsColor = npcShortsColors[Math.floor(nHash * 3) % 3];
          const rotY = nSide === 0 ? Math.PI / 2 : -Math.PI / 2;

          npcConfigs.push({
            x: nx,
            y: npcY,
            z: nz,
            rotY,
            shirtColor,
            shortsColor
          });

          // Braços acenando no ar
          npcLimbConfigs.push({ x: nx, y: npcY + 0.95, z: nz + 0.35, rotY, rotZ: 0.6 });
          npcLimbConfigs.push({ x: nx, y: npcY + 0.95, z: nz - 0.35, rotY, rotZ: -0.6 });

          // Pernas
          npcLimbConfigs.push({ x: nx, y: npcY - 0.16, z: nz + 0.15, rotY });
          npcLimbConfigs.push({ x: nx, y: npcY - 0.16, z: nz - 0.15, rotY });
        }
      }
    });

    // ==========================================
    // CRIAÇÃO DOS INSTANCED MESHES DA FASE C
    // ==========================================

    // 1. Pipas no Céu
    if (kiteConfigs.length > 0) {
      const kiteInst = new THREE.InstancedMesh(this.unitKiteGeo, this.sharedMaterials.kiteMats[0], kiteConfigs.length);
      for (let i = 0; i < kiteConfigs.length; i++) {
        const c = kiteConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(c.rotX, c.rotY, c.rotZ);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        kiteInst.setMatrixAt(i, dummy.matrix);
      }
      kiteInst.instanceMatrix.needsUpdate = true;
      segment.add(kiteInst);
    }

    if (kiteTailConfigs.length > 0) {
      const tailInst = new THREE.InstancedMesh(this.unitKiteTailGeo, this.sharedMaterials.kiteTailMat, kiteTailConfigs.length);
      for (let i = 0; i < kiteTailConfigs.length; i++) {
        const c = kiteTailConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(c.rotX, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        tailInst.setMatrixAt(i, dummy.matrix);
      }
      tailInst.instanceMatrix.needsUpdate = true;
      segment.add(tailInst);
    }

    // 2. Churrasqueiras & Fumaça
    if (drumGrillConfigs.length > 0) {
      const drumInst = new THREE.InstancedMesh(this.unitDrumGrillGeo, this.sharedMaterials.drumGrillMat, drumGrillConfigs.length);
      const gridInst = new THREE.InstancedMesh(this.unitGrillGridGeo, this.sharedMaterials.grillFoodMat, grillGridConfigs.length);
      for (let i = 0; i < drumGrillConfigs.length; i++) {
        const c = drumGrillConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        drumInst.setMatrixAt(i, dummy.matrix);

        const gc = grillGridConfigs[i];
        dummy.position.set(gc.x, gc.y, gc.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        gridInst.setMatrixAt(i, dummy.matrix);
      }
      drumInst.instanceMatrix.needsUpdate = true;
      gridInst.instanceMatrix.needsUpdate = true;
      segment.add(drumInst, gridInst);
    }

    if (smokeConfigs.length > 0) {
      const smokeInst = new THREE.InstancedMesh(this.unitSmokeGeo, this.sharedMaterials.smokeMat, smokeConfigs.length);
      for (let i = 0; i < smokeConfigs.length; i++) {
        const c = smokeConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(c.scale, c.scale, c.scale);
        dummy.updateMatrix();
        smokeInst.setMatrixAt(i, dummy.matrix);
      }
      smokeInst.instanceMatrix.needsUpdate = true;
      segment.add(smokeInst);
    }

    // 3. Cachorro Caramelo
    if (dogBodyConfigs.length > 0) {
      const dBodyInst = new THREE.InstancedMesh(this.unitDogBodyGeo, this.sharedMaterials.dogCarameloMat, dogBodyConfigs.length);
      const dHeadInst = new THREE.InstancedMesh(this.unitDogHeadGeo, this.sharedMaterials.dogCarameloMat, dogHeadConfigs.length);
      const dSnoutInst = new THREE.InstancedMesh(this.unitDogSnoutGeo, this.sharedMaterials.dogNoseMat, dogSnoutConfigs.length);
      const dEarInst = new THREE.InstancedMesh(this.unitDogEarGeo, this.sharedMaterials.dogCarameloMat, dogEarConfigs.length);
      const dLegInst = new THREE.InstancedMesh(this.unitDogLegGeo, this.sharedMaterials.dogCarameloMat, dogLegConfigs.length);
      const dTailInst = new THREE.InstancedMesh(this.unitDogTailGeo, this.sharedMaterials.dogCarameloMat, dogTailConfigs.length);

      for (let i = 0; i < dogBodyConfigs.length; i++) {
        const c = dogBodyConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        dBodyInst.setMatrixAt(i, dummy.matrix);

        const hc = dogHeadConfigs[i];
        dummy.position.set(hc.x, hc.y, hc.z);
        dummy.rotation.set(0, hc.rotY, 0);
        dummy.updateMatrix();
        dHeadInst.setMatrixAt(i, dummy.matrix);

        const sc = dogSnoutConfigs[i];
        dummy.position.set(sc.x, sc.y, sc.z);
        dummy.rotation.set(0, sc.rotY, 0);
        dummy.updateMatrix();
        dSnoutInst.setMatrixAt(i, dummy.matrix);

        const tc = dogTailConfigs[i];
        dummy.position.set(tc.x, tc.y, tc.z);
        dummy.rotation.set(tc.rotX || 0.45, tc.rotY, 0);
        dummy.updateMatrix();
        dTailInst.setMatrixAt(i, dummy.matrix);
      }

      for (let i = 0; i < dogEarConfigs.length; i++) {
        const c = dogEarConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        dEarInst.setMatrixAt(i, dummy.matrix);
      }

      for (let i = 0; i < dogLegConfigs.length; i++) {
        const c = dogLegConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        dLegInst.setMatrixAt(i, dummy.matrix);
      }

      dBodyInst.instanceMatrix.needsUpdate = true;
      dHeadInst.instanceMatrix.needsUpdate = true;
      dSnoutInst.instanceMatrix.needsUpdate = true;
      dEarInst.instanceMatrix.needsUpdate = true;
      dLegInst.instanceMatrix.needsUpdate = true;
      dTailInst.instanceMatrix.needsUpdate = true;
      segment.add(dBodyInst, dHeadInst, dSnoutInst, dEarInst, dLegInst, dTailInst);
    }

    // 4. Moradores / NPCs (1 Único InstancedMesh para Tronco e 1 para Shorts com setColorAt)
    if (npcConfigs.length > 0) {
      const nBodyInst = new THREE.InstancedMesh(this.unitNpcBodyGeo, this.sharedMaterials.houseBase, npcConfigs.length);
      const nHeadInst = new THREE.InstancedMesh(this.unitNpcHeadGeo, this.sharedMaterials.npcSkinMats[1], npcConfigs.length);
      const nShortsInst = new THREE.InstancedMesh(this.unitNpcPantsGeo, this.sharedMaterials.houseBase, npcConfigs.length);

      for (let i = 0; i < npcConfigs.length; i++) {
        const c = npcConfigs[i];
        dummy.position.set(c.x, c.y + 0.75, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        nBodyInst.setMatrixAt(i, dummy.matrix);
        colHelper.setHex(c.shirtColor);
        nBodyInst.setColorAt(i, colHelper);

        dummy.position.set(c.x, c.y + 1.25, c.z);
        dummy.updateMatrix();
        nHeadInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(c.x, c.y + 0.28, c.z);
        dummy.updateMatrix();
        nShortsInst.setMatrixAt(i, dummy.matrix);
        colHelper.setHex(c.shortsColor);
        nShortsInst.setColorAt(i, colHelper);
      }

      nBodyInst.instanceMatrix.needsUpdate = true;
      nBodyInst.instanceColor.needsUpdate = true;
      nHeadInst.instanceMatrix.needsUpdate = true;
      nShortsInst.instanceMatrix.needsUpdate = true;
      nShortsInst.instanceColor.needsUpdate = true;
      segment.add(nBodyInst, nHeadInst, nShortsInst);
    }

    if (npcLimbConfigs.length > 0) {
      const nLimbInst = new THREE.InstancedMesh(this.unitNpcLimbGeo, this.sharedMaterials.npcSkinMats[1], npcLimbConfigs.length);
      for (let i = 0; i < npcLimbConfigs.length; i++) {
        const c = npcLimbConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, c.rotZ || 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        nLimbInst.setMatrixAt(i, dummy.matrix);
      }
      nLimbInst.instanceMatrix.needsUpdate = true;
      segment.add(nLimbInst);
    }

    if (npcCupConfigs.length > 0) {
      const nCupInst = new THREE.InstancedMesh(this.unitNpcCupGeo, this.sharedMaterials.npcCupMat, npcCupConfigs.length);
      for (let i = 0; i < npcCupConfigs.length; i++) {
        const c = npcCupConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        nCupInst.setMatrixAt(i, dummy.matrix);
      }
      nCupInst.instanceMatrix.needsUpdate = true;
      segment.add(nCupInst);
    }
  }

  update(speed, dt, onRecycleSegment) {
    const moveZ = speed * dt;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      seg.position.z += moveZ;

      if (seg.position.z > SEGMENT_LENGTH) {
        let minZ = 0;
        for (let j = 0; j < this.segments.length; j++) {
          if (this.segments[j].position.z < minZ) {
            minZ = this.segments[j].position.z;
          }
        }

        const newZ = minZ - SEGMENT_LENGTH;
        seg.position.z = newZ;

        if (typeof onRecycleSegment === 'function') {
          onRecycleSegment(seg, newZ);
        }
      }
    }
  }

  updateNightLights(isNight, timeOfDay, playerZ = 0) {
    if (this.sharedMaterials.streetLampMat) {
      this.sharedMaterials.streetLampMat.color.setHex(isNight ? 0xffedd5 : 0x94a3b8);
    }

    if (!isNight) {
      for (let i = 0; i < this.lampPointLights.length; i++) {
        this.lampPointLights[i].intensity = 0;
        this.lampPointLights[i].visible = false;
      }
      return;
    }

    // Coleta posições mundiais das luminárias de postes nos segmentos ativos
    const lampPositions = [];
    const stepZ = 28;
    for (let s = 0; s < this.segments.length; s++) {
      const segZ = this.segments[s].position.z;
      [-7.8, 7.8].forEach((px, sideIdx) => {
        const lx = px + (sideIdx === 0 ? 1.7 : -1.7);
        for (let pz = -SEGMENT_LENGTH / 2 + 14; pz < SEGMENT_LENGTH / 2; pz += stepZ) {
          const worldZ = segZ + pz;
          // Pega postes na faixa em frente e ao redor do jogador
          const dist = Math.abs(worldZ - (playerZ - 10));
          lampPositions.push({ x: lx, y: 8.5, z: worldZ, dist });
        }
      });
    }

    // Ordena pelas luminárias mais próximas à frente do jogador
    lampPositions.sort((a, b) => a.dist - b.dist);

    for (let i = 0; i < this.lampPointLights.length; i++) {
      const light = this.lampPointLights[i];
      if (i < lampPositions.length) {
        const pos = lampPositions[i];
        light.position.set(pos.x, pos.y, pos.z);
        light.intensity = 1.35;
        light.visible = true;
      } else {
        light.visible = false;
      }
    }
  }

  reset() {
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].position.z = -i * SEGMENT_LENGTH;
    }
  }
}
