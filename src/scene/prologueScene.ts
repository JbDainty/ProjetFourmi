import * as THREE from 'three';
import { clamp01, ease, prologueFrame, prologueDuration } from '../animation/prologue';
import type { PrologueTextures } from './prologueTextures';
const W = 2.8,
  H = 4.05;

/** The production scene. No browser, React, filesystem or platform APIs. */
export function createPrologueScene(renderer: THREE.WebGLRenderer, maps: PrologueTextures) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);
  const { leather, paper: localPaper, edge: edgeMap, wood, glow, floorFade, leaf: leafMap } = maps;
  const pageTextures = [maps.page0, maps.page1, maps.page2, maps.page3];
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(4, 4);
  scene.add(new THREE.HemisphereLight(0xaebf9c, 0x142318, 2));
  const key = new THREE.SpotLight(0xffe4ad, 125, 35, Math.PI / 4, 0.8, 1.5);
  key.position.set(-4, 9, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  key.shadow.bias = -0.001;
  scene.add(key);
  scene.add(key.target);
  const rim = new THREE.DirectionalLight(0xb0cfbd, 2.5);
  rim.position.set(4, 5, -6);
  scene.add(rim);
  const magic = new THREE.PointLight(0xf0d28a, 0, 10, 2);
  magic.position.set(0, 1.1, 0);
  scene.add(magic);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(23, 23),
    new THREE.MeshStandardMaterial({
      map: wood,
      alphaMap: floorFade,
      transparent: true,
      depthWrite: false,
      roughness: 0.94,
      color: 0x968468,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.35;
  floor.receiveShadow = true;
  scene.add(floor);
  const book = new THREE.Group();
  scene.add(book);
  const hide = new THREE.MeshStandardMaterial({
    map: leather,
    bumpMap: leather,
    bumpScale: 0.035,
    roughness: 0.88,
    color: 0xe1dbbf,
  });
  const paperMat = new THREE.MeshStandardMaterial({
    map: localPaper,
    roughness: 0.96,
    color: 0xf0d8a1,
  });
  const edges = new THREE.MeshStandardMaterial({
    map: edgeMap,
    roughness: 0.92,
    color: 0xf0dfba,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xab8745,
    metalness: 0.72,
    roughness: 0.42,
  });
  function box(
    w: number,
    h: number,
    d: number,
    material: THREE.Material | THREE.Material[],
    parent: THREE.Group,
    x: number,
    y: number,
    z = 0,
  ) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  box(3.02, 0.12, 4.3, hide, book, 1.48, -0.16);
  box(2.88, 0.32, 4.12, [edges, edges, paperMat, paperMat, edges, edges], book, 1.48, 0.06);
  const cover = new THREE.Group();
  cover.position.set(0, 0.25, 0);
  book.add(cover);
  box(3.02, 0.12, 4.3, [hide, hide, hide, paperMat, hide, hide], cover, 1.48, 0.03);
  // Small brass corners and five raised binding bands give the cover a physical edge.
  for (const x of [0.12, 2.8])
    for (const z of [-1.98, 1.98]) {
      box(0.24, 0.025, 0.035, gold, cover, x, 0.106, z);
      box(
        0.035,
        0.025,
        0.24,
        gold,
        cover,
        x + (x < 1 ? -0.1 : 0.1),
        0.106,
        z + (z < 0 ? 0.1 : -0.1),
      );
    }
  const spine = box(0.19, 0.5, 4.3, hide, book, -0.02, 0.01);
  for (const z of [-1.75, -0.88, 0, 0.88, 1.75]) box(0.22, 0.04, 0.06, gold, book, -0.03, 0.28, z);
  const clasp = new THREE.Group();
  clasp.position.set(2.93, 0.14, 0);
  cover.add(clasp);
  box(0.34, 0.045, 0.36, gold, clasp, 0.08, 0);
  box(0.055, 0.1, 0.16, gold, book, 3.03, 0.06);
  for (const z of [-1.97, 1.97]) box(2.68, 0.008, 0.012, gold, cover, 1.47, 0.096, z);
  for (const x of [0.13, 2.81]) box(0.012, 0.008, 3.94, gold, cover, x, 0.096);
  function pageGeometry() {
    const g = new THREE.PlaneGeometry(W, H, 28, 24);
    g.rotateX(-Math.PI / 2);
    g.translate(W / 2, 0, 0);
    return g;
  }
  const pageMaterial = (map: THREE.Texture) =>
    new THREE.MeshStandardMaterial({
      map,
      side: THREE.DoubleSide,
      roughness: 0.93,
      color: 0xfff2d0,
    });
  const right = new THREE.Mesh(pageGeometry(), pageMaterial(pageTextures[0]));
  right.position.y = 0.235;
  right.receiveShadow = true;
  book.add(right);
  const left = new THREE.Mesh(pageGeometry(), pageMaterial(pageTextures[1]));
  left.rotation.z = Math.PI;
  left.position.y = 0.287;
  const leftUV = left.geometry.attributes.uv;
  for (let i = 0; i < leftUV.count; i++) leftUV.setX(i, 1 - leftUV.getX(i));
  left.visible = false;
  book.add(left);
  const sheets = Array.from({ length: 14 }, (_, i) => {
    const geometry = pageGeometry(),
      mesh = new THREE.Mesh(geometry, pageMaterial(pageTextures[i % 4]));
    mesh.position.y = 0.245 + i * 0.003;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    book.add(mesh);
    const original = (geometry.attributes.position.array as Float32Array).slice();
    return { mesh, original };
  });
  const flying = Array.from({ length: 12 }, (_, i) => {
    const geometry = new THREE.PlaneGeometry(1, 1.4, 10, 12),
      mesh = new THREE.Mesh(geometry, pageMaterial(pageTextures[i % 4]));
    scene.add(mesh);
    mesh.castShadow = false;
    return { mesh, original: (geometry.attributes.position.array as Float32Array).slice() };
  });
  const leafGeometry = new THREE.PlaneGeometry(0.35, 0.6, 8, 12);
  const leafPosition = leafGeometry.attributes.position;
  for (let i = 0; i < leafPosition.count; i++) {
    const x = leafPosition.getX(i),
      y = leafPosition.getY(i);
    leafPosition.setZ(i, 0.065 * Math.cos(x * 8) * Math.sin(y * 6));
  }
  leafGeometry.computeVertexNormals();
  const leafMaterial = new THREE.MeshStandardMaterial({
    map: leafMap,
    side: THREE.DoubleSide,
    alphaTest: 0.35,
    roughness: 0.86,
  });
  const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, 56);
  scene.add(leaves);
  leaves.frustumCulled = false;
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < 56; i++) leaves.setColorAt(i, new THREE.Color(i % 3 ? 0xd4dfb3 : 0xe0c485));
  const transform = new THREE.Object3D();
  // Living stems grow out of the binding and open into small, softly lit flowers.
  const garden = new THREE.Group();
  book.add(garden);
  for (const side of [-1, 1])
    for (let k = 0; k < 4; k++) {
      const stem = new THREE.Group();
      stem.position.set(side * (0.2 + k * 0.48), 0.2, (k - 1.5) * 1.0);
      garden.add(stem);
      const points = Array.from(
        { length: 18 },
        (_, j) =>
          new THREE.Vector3(
            Math.sin(j * 0.17 + k) * 0.2 * side,
            j * 0.082,
            Math.cos(j * 0.2 + k) * 0.12,
          ),
      );
      const curve = new THREE.CatmullRomCurve3(points);
      const twig = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 24, 0.016, 5, false),
        new THREE.MeshStandardMaterial({ color: 0x688555, roughness: 0.9 }),
      );
      stem.add(twig);
      for (let j = 3; j < 16; j += 3) {
        const pos = curve.getPoint(j / 18),
          leaf = new THREE.Mesh(
            leafGeometry,
            new THREE.MeshStandardMaterial({
              map: leafMap,
              alphaTest: 0.35,
              color: 0xc9d5ae,
              side: THREE.DoubleSide,
              roughness: 0.9,
            }),
          );
        leaf.position.copy(pos);
        leaf.rotation.set(0.7, j, side * 0.8);
        leaf.scale.setScalar(0.55);
        stem.add(leaf);
      }
      const tip = curve.getPoint(1),
        flower = new THREE.Group();
      flower.position.copy(tip);
      stem.add(flower);
      const petals = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1, 12, 8),
        new THREE.MeshStandardMaterial({
          color: [0xe6dbc1, 0xdb9c8c, 0xc3c8df, 0xe5d4a6][k],
          roughness: 0.8,
        }),
        8,
      );
      petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      flower.add(petals);
      petals.frustumCulled = false;
      flower.userData.petals = petals;
      const heart = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 7), gold);
      heart.position.y = 0.05;
      flower.add(heart);
      stem.userData.delay = k * 0.13;
      flower.userData.flower = true;
    }
  const pollenGeometry = new THREE.BufferGeometry();
  pollenGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(160 * 3), 3));
  const particles = new THREE.Points(
    pollenGeometry,
    new THREE.PointsMaterial({
      map: glow,
      color: 0xffdfa2,
      size: 0.085,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.7,
    }),
  );
  scene.add(particles);
  particles.frustumCulled = false;
  const aura = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xe4cf8e,
      opacity: 0,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  aura.scale.set(6, 4, 1);
  aura.position.set(0, 0.7, 0);
  scene.add(aura);

  let disposed = false;
  return {
    scene,
    camera,
    resize(width: number, height: number) {
      if (disposed) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = camera.aspect < 0.8 ? 53 : 40;
      camera.updateProjectionMatrix();
    },
    update(p: number) {
      if (disposed) return;
      const f = prologueFrame(p),
        time = (p * prologueDuration) / 1000;
      const portrait = camera.aspect < 0.8;
      const distance = portrait ? 1.55 : 1;
      camera.position.set(
        (3.1 - 4.2 * ease(p)) * distance,
        (7.0 + f.opening * 1.7) * distance,
        (7.8 - f.opening * 0.4) * distance,
      );
      camera.lookAt(1.25 * (1 - f.opening), 0.1 + f.growth * 0.35, 0);
      camera.zoom = 1 + (portrait ? (1 - f.opening) * 0.15 : 0) + f.arrival * 1.8;
      camera.updateProjectionMatrix();
      book.position.set(-0.35 * (1 - f.opening), Math.sin(p * Math.PI) * 0.18, 0);
      book.rotation.y = -0.18 + ease(p) * 0.12;
      clasp.rotation.z = -ease((p - 0.07) / 0.1) * 1.3;
      cover.rotation.z = f.opening * Math.PI;
      left.visible = f.opening > 0.995;
      magic.intensity = f.growth * 2.5 + f.wind * 1.6;
      (aura.material as THREE.SpriteMaterial).opacity = f.wind * 0.13 + f.growth * 0.08;
      for (let i = 0; i < sheets.length; i++) {
        const { mesh, original } = sheets[i],
          turn = ease((p - 0.27 - i * 0.017) / 0.23);
        const a = mesh.geometry.attributes.position;
        for (let j = 0; j < a.count; j++) {
          const x = original[j * 3],
            z = original[j * 3 + 2],
            u = x / W;
          const angle = turn * Math.PI;
          a.setXYZ(
            j,
            x * Math.cos(angle) + Math.sin(u * Math.PI) * Math.sin(angle) * 0.28,
            Math.sin(angle) * x + Math.sin(u * Math.PI) * Math.sin(angle) * 0.48,
            z + 0.08 * Math.sin(u * Math.PI + time + i) * Math.sin(angle),
          );
        }
        a.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.visible = p > 0.23 && turn < 0.999;
      }
      flying.forEach(({ mesh, original }, i) => {
        const t = clamp01((p - 0.37 - i * 0.019) / 0.43),
          angle = t * 5.7 + i * 0.82;
        mesh.visible = t > 0 && t < 1;
        mesh.position.set(
          Math.sin(angle) * (1.1 + t * 3.8),
          0.4 + Math.sin(t * Math.PI) * 3.8,
          Math.cos(angle) * 1.8 * (1 + t * 0.55),
        );
        mesh.rotation.set(-0.6 + t * 2 + i * 0.3, angle * 0.45, Math.sin(time + i) * 0.3 + i * 0.4);
        mesh.scale.setScalar(0.42 + Math.sin(t * Math.PI) * 0.52);
        const a = mesh.geometry.attributes.position;
        for (let j = 0; j < a.count; j++)
          a.setZ(
            j,
            Math.sin(original[j * 3] * 3 + time * 2 + i) * 0.12 +
              Math.cos(original[j * 3 + 1] * 2 + time) * 0.1,
          );
        a.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
      });
      for (let i = 0; i < 56; i++) {
        const t = clamp01((p - 0.36 - (i % 9) * 0.012) / 0.49),
          angle = t * 7 + i * 2.399;
        transform.position.set(
          Math.cos(angle) * (1 + t * 4.4),
          0.25 + Math.sin(t * Math.PI) * (1.5 + (i % 5) * 0.45),
          Math.sin(angle) * (1 + t * 2.6),
        );
        transform.rotation.set(time * (i % 2 ? 1 : -1) + i, angle, time * 0.7 + i);
        transform.scale.setScalar(t > 0 && t < 1 ? 0.35 + (i % 4) * 0.18 : 0);
        transform.updateMatrix();
        leaves.setMatrixAt(i, transform.matrix);
      }
      leaves.instanceMatrix.needsUpdate = true;
      garden.children.forEach((stem) => {
        const g = ease((f.growth - stem.userData.delay) / 0.65);
        stem.scale.set(g, Math.max(0.001, g), g);
        stem.visible = g > 0.001;
        const flower = stem.children.find((child) => child.userData.flower)!;
        const blossom = ease((g - 0.4) / 0.6);
        const petals = flower.userData.petals as THREE.InstancedMesh;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          transform.position.set(
            Math.cos(angle) * 0.105 * blossom,
            0.02 + (1 - blossom) * 0.09,
            Math.sin(angle) * 0.105 * blossom,
          );
          transform.rotation.set(0, -angle, (1 - blossom) * 1.15);
          transform.scale.set(0.095, 0.03, 0.17);
          transform.updateMatrix();
          petals.setMatrixAt(i, transform.matrix);
        }
        petals.instanceMatrix.needsUpdate = true;
      });
      const pollen = particles.geometry.attributes.position;
      for (let i = 0; i < pollen.count; i++) {
        const angle = i * 2.399 + time * 0.55,
          radius = 0.4 + (i % 13) * 0.28;
        pollen.setXYZ(
          i,
          Math.sin(angle) * radius,
          -0.1 + ((i * 0.217 + time * 0.23) % 4.7),
          Math.cos(angle) * radius,
        );
      }
      pollen.needsUpdate = true;
      (particles.material as THREE.PointsMaterial).opacity = 0.2 + f.wind * 0.55 + f.growth * 0.2;
      renderer.render(scene, camera);
      return { pages: flying.length, draws: renderer.info.render.calls };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          geometries.add(object.geometry);
          const m = object.material;
          (Array.isArray(m) ? m : [m]).forEach((item) => materials.add(item));
        } else if (object instanceof THREE.Sprite) materials.add(object.material);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      Object.values(maps).forEach((t) => t.dispose());
    },
  };
}
