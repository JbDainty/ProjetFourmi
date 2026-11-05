import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Asset } from 'expo-asset';
import { OpeningScene as Fallback } from './OpeningSceneFallback';
import { clamp01, ease, prologueFrame } from '../animation/prologue';
import { illustrationAtlases } from '../data/illustrations';

type Props = { progress: number };
const W = 2.8,
  H = 4.05;

/** Finite, disposable WebGL scene. All textures are local or drawn for this book. */
export function OpeningScene({ progress }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef(progress);
  clock.current = progress;
  const [mode, setMode] = useState<'loading' | 'webgl' | 'fallback'>('loading');
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: element,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      setMode('fallback');
      return;
    }
    let disposed = false,
      frame = 0,
      previous = -1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);
    const textures = new Set<THREE.Texture>();
    const rng = (() => {
      let n = 1279;
      return () => {
        n = (n * 1664525 + 1013904223) >>> 0;
        return n / 4294967296;
      };
    })();
    function texture(size: number, draw: (c: CanvasRenderingContext2D) => void) {
      const surface = document.createElement('canvas');
      surface.width = surface.height = size;
      const c = surface.getContext('2d')!;
      draw(c);
      const t = new THREE.CanvasTexture(surface);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      textures.add(t);
      return t;
    }
    const leather = texture(1024, (c) => {
      c.fillStyle = '#253e31';
      c.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 70000; i++) {
        const v = rng();
        c.fillStyle = v > 0.5 ? 'rgba(230,207,151,.055)' : 'rgba(1,12,8,.13)';
        c.fillRect(rng() * 1024, rng() * 1024, rng() * 2.2 + 0.4, rng() * 1.5 + 0.4);
      }
      for (let i = 0; i < 130; i++) {
        const x = rng() * 1024,
          y = rng() * 1024;
        c.strokeStyle = 'rgba(205,180,113,.08)';
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + 30, y - 4, x + 80, y + 8);
        c.stroke();
      }
      const edge = c.createRadialGradient(512, 512, 210, 512, 512, 700);
      edge.addColorStop(0, '#00000000');
      edge.addColorStop(1, '#a58b5355');
      c.fillStyle = edge;
      c.fillRect(0, 0, 1024, 1024);
      c.strokeStyle = '#c3a868';
      c.lineWidth = 3;
      c.strokeRect(43, 38, 938, 948);
      c.lineWidth = 1;
      c.strokeRect(57, 52, 910, 920);
      c.font = '46px HerbariumDisplay';
      c.textAlign = 'center';
      c.fillStyle = '#d4bd80';
      c.fillText('HERBIER', 512, 210);
      c.font = '23px HerbariumScientific';
      c.fillText('des couleurs', 512, 253);
      c.save();
      c.translate(512, 530);
      botanical(c, 1, '#bdab72');
      c.restore();
      c.font = '18px HerbariumScientific';
      c.fillText('Flora · Memoria · Vitae', 512, 865);
    });
    function botanical(c: CanvasRenderingContext2D, scale: number, color: string) {
      c.save();
      c.scale(scale, scale);
      c.lineWidth = 2;
      c.strokeStyle = color;
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, 177);
      c.bezierCurveTo(-36, 70, 38, -20, 0, -135);
      c.stroke();
      for (let i = 0; i < 7; i++) {
        const y = 125 - i * 35,
          side = i % 2 ? 1 : -1;
        c.beginPath();
        c.moveTo(Math.sin(i) * 10, y);
        c.bezierCurveTo(side * 72, y + 10, side * 83, y - 26, side * 63, y - 42);
        c.bezierCurveTo(side * 20, y - 42, side * 19, y - 9, Math.sin(i) * 10, y);
        c.stroke();
      }
      for (let j = 0; j < 7; j++) {
        c.save();
        c.translate(0, -145);
        c.rotate((j * Math.PI * 2) / 7);
        c.beginPath();
        c.ellipse(0, -25, 11, 27, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      c.beginPath();
      c.arc(0, -145, 10, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    const paper = texture(1024, (c) => {
      c.fillStyle = '#e9d8af';
      c.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 42000; i++) {
        c.fillStyle = rng() > 0.55 ? '#fff4dc24' : '#927e4414';
        c.fillRect(rng() * 1024, rng() * 1024, 1 + rng() * 2, 0.6 + rng());
      }
      const edge = c.createRadialGradient(512, 512, 260, 512, 512, 720);
      edge.addColorStop(0, '#a77e2b00');
      edge.addColorStop(1, '#8d602765');
      c.fillStyle = edge;
      c.fillRect(0, 0, 1024, 1024);
    });
    const pageTextures = [0, 1, 2, 3].map((i) =>
      texture(1024, (c) => {
        c.drawImage(paper.image as HTMLCanvasElement, 0, 0);
        c.strokeStyle = '#9b8b5a77';
        c.lineWidth = 1;
        c.strokeRect(49, 46, 926, 932);
        c.font = '26px HerbariumDisplay';
        c.textAlign = 'center';
        c.fillStyle = '#596747';
        c.fillText(
          ['Papaver rhoeas', 'Centaurea cyanus', 'Leucanthemum', 'Ranunculus'][i],
          512,
          115,
        );
        c.save();
        c.translate(512, 508);
        botanical(c, 1.3, '#697754');
        c.restore();
        c.font = '17px HerbariumScientific';
        c.fillText('Études du vivant · Planche ' + String(i + 1).padStart(2, '0'), 512, 930);
        for (let j = 0; j < 4; j++) {
          c.fillStyle = '#9c8b5d66';
          c.fillRect(170, 805 + j * 14, 450 - (j % 3) * 60, 1);
        }
      }),
    );
    const loader = new THREE.TextureLoader();
    const localPaper = loader.load(
      Asset.fromModule(require('../../assets/illustrations/papier.png')).uri,
      (t) => {
        if (disposed) {
          t.dispose();
          return;
        }
        t.colorSpace = THREE.SRGBColorSpace;
      },
    );
    textures.add(localPaper);
    // Botanical atlases are used as printed page illustrations, without modifying the source files.
    const atlasImage = new window.Image();
    atlasImage.onload = () => {
      if (disposed) return;
      for (let i = 0; i < 4; i++) {
        const c = (pageTextures[i].image as HTMLCanvasElement).getContext('2d')!;
        const [x, y, r, b] = illustrationAtlases[0].bounds[i];
        c.save();
        c.globalCompositeOperation = 'multiply';
        const printedWidth = Math.min(700, (((650 * (r - x)) / (b - y)) * H) / W);
        c.drawImage(
          atlasImage,
          x,
          y,
          r - x,
          b - y,
          (1024 - printedWidth) / 2,
          170,
          printedWidth,
          650,
        );
        c.restore();
        pageTextures[i].needsUpdate = true;
      }
    };
    atlasImage.src = Asset.fromModule(illustrationAtlases[0].source).uri;
    const edgeMap = texture(512, (c) => {
      c.fillStyle = '#cab98f';
      c.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 2) {
        c.strokeStyle = y % 6 ? '#f0dfb7' : '#8c7955';
        c.lineWidth = 0.5 + rng();
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(512, y + (rng() - 0.5) * 2);
        c.stroke();
      }
    });
    const wood = texture(512, (c) => {
      c.fillStyle = '#28342a';
      c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 800; i++) {
        c.strokeStyle = i % 2 ? '#89724616' : '#0b1a1233';
        c.lineWidth = rng() * 2;
        c.beginPath();
        c.moveTo(0, i * 0.65);
        c.bezierCurveTo(180, i * 0.65 + rng() * 10, 300, i * 0.65 - rng() * 7, 512, i * 0.65);
        c.stroke();
      }
    });
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
    const floorFade = texture(128, (c) => {
      const fade = c.createRadialGradient(64, 64, 12, 64, 64, 64);
      fade.addColorStop(0, '#fff');
      fade.addColorStop(0.42, '#fff');
      fade.addColorStop(1, '#000');
      c.fillStyle = fade;
      c.fillRect(0, 0, 128, 128);
    });
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
    for (const z of [-1.75, -0.88, 0, 0.88, 1.75])
      box(0.22, 0.04, 0.06, gold, book, -0.03, 0.28, z);
    function pageGeometry() {
      const g = new THREE.PlaneGeometry(W, H, 20, 22);
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
    const sheets = Array.from({ length: 9 }, (_, i) => {
      const geometry = pageGeometry(),
        mesh = new THREE.Mesh(geometry, pageMaterial(pageTextures[i % 4]));
      mesh.position.y = 0.245 + i * 0.003;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      book.add(mesh);
      const original = (geometry.attributes.position.array as Float32Array).slice();
      return { mesh, original };
    });
    const flying = Array.from({ length: 7 }, (_, i) => {
      const geometry = new THREE.PlaneGeometry(1, 1.4, 10, 12),
        mesh = new THREE.Mesh(geometry, pageMaterial(pageTextures[i % 4]));
      scene.add(mesh);
      mesh.castShadow = false;
      return { mesh, original: (geometry.attributes.position.array as Float32Array).slice() };
    });
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.24);
    leafShape.bezierCurveTo(-0.2, -0.12, -0.16, 0.15, 0, 0.29);
    leafShape.bezierCurveTo(0.17, 0.14, 0.19, -0.11, 0, -0.24);
    const leafGeometry = new THREE.ShapeGeometry(leafShape, 8);
    const leaves = Array.from({ length: 42 }, (_, i) => {
      const mesh = new THREE.Mesh(
        leafGeometry,
        new THREE.MeshStandardMaterial({
          color: i % 3 ? 0x7d9a59 : 0xbc9f5b,
          side: THREE.DoubleSide,
          roughness: 0.75,
        }),
      );
      scene.add(mesh);
      return mesh;
    });
    // Living stems grow out of the binding and open into small, softly lit flowers.
    const garden = new THREE.Group();
    book.add(garden);
    for (const side of [-1, 1])
      for (let k = 0; k < 3; k++) {
        const stem = new THREE.Group();
        stem.position.set(side * (0.2 + k * 0.48), 0.2, (k - 1) * 1.1);
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
                color: 0x8fa56a,
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
        for (let j = 0; j < 6; j++) {
          const angle = (j * Math.PI) / 3,
            petal = new THREE.Mesh(
              new THREE.SphereGeometry(1, 10, 7),
              new THREE.MeshStandardMaterial({
                color: k % 2 ? 0xe4ce9c : 0xdfd9ba,
                roughness: 0.78,
              }),
            );
          petal.position.set(Math.cos(angle) * 0.105, 0.02, Math.sin(angle) * 0.105);
          petal.scale.set(0.095, 0.03, 0.17);
          petal.rotation.y = -angle;
          flower.add(petal);
        }
        const heart = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 7), gold);
        heart.position.y = 0.05;
        flower.add(heart);
        stem.userData.delay = k * 0.13;
        flower.userData.flower = true;
      }
    const glow = texture(64, (c) => {
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, '#fff8d9ff');
      g.addColorStop(0.15, '#e9cf8d88');
      g.addColorStop(1, '#e9cf8d00');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    });
    const particles = Array.from({ length: 75 }, (_, i) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glow,
          color: 0xffdfa2,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      scene.add(sprite);
      return sprite;
    });
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
    const resize = () => {
      const width = element.clientWidth || 390,
        height = element.clientHeight || 844;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = camera.aspect < 0.8 ? 53 : 40;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const contextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      if (!disposed) setMode('fallback');
    };
    element.addEventListener('webglcontextlost', contextLost);
    let announced = false;
    const render = () => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      const p = clock.current;
      if (document.hidden || p === previous) return;
      previous = p;
      const f = prologueFrame(p),
        time = p * 11.6;
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
      cover.rotation.z = f.opening * Math.PI;
      left.visible = f.opening > 0.995;
      magic.intensity = f.growth * 2.5 + f.wind * 1.6;
      (aura.material as THREE.SpriteMaterial).opacity = f.wind * 0.13 + f.growth * 0.08;
      for (let i = 0; i < sheets.length; i++) {
        const { mesh, original } = sheets[i],
          turn = ease((p - 0.27 - i * 0.025) / 0.23);
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
      leaves.forEach((mesh, i) => {
        const t = clamp01((p - 0.36 - (i % 9) * 0.012) / 0.49),
          angle = t * 7 + i * 2.399;
        mesh.visible = t > 0 && t < 1;
        mesh.position.set(
          Math.cos(angle) * (1 + t * 4.4),
          0.25 + Math.sin(t * Math.PI) * (1.5 + (i % 5) * 0.45),
          Math.sin(angle) * (1 + t * 2.6),
        );
        mesh.rotation.set(time * (i % 2 ? 1 : -1) + i, angle, time * 0.7 + i);
        mesh.scale.setScalar(0.35 + (i % 4) * 0.18);
      });
      garden.children.forEach((stem) => {
        const g = ease((f.growth - stem.userData.delay) / 0.65);
        stem.scale.set(g, Math.max(0.001, g), g);
        stem.visible = g > 0.001;
      });
      particles.forEach((sprite, i) => {
        const angle = i * 2.399 + time * 0.22,
          radius = 0.4 + (i % 11) * 0.38;
        sprite.position.set(
          Math.sin(angle) * radius,
          -0.1 + ((i * 0.217 + time * 0.23) % 4.7),
          Math.cos(angle) * radius,
        );
        const size = 0.025 + (i % 4) * 0.015;
        sprite.scale.setScalar(size);
        (sprite.material as THREE.SpriteMaterial).opacity =
          (0.14 + f.wind * 0.55 + f.growth * 0.28) * (0.55 + Math.sin(i + time) * 0.22);
      });
      renderer.render(scene, camera);
      // Small counters expose the rendered scene to automated checks, never to the player.
      element.dataset.progress = p.toFixed(3);
      element.dataset.pages = String(flying.length);
      element.dataset.draws = String(renderer.info.render.calls);
      if (!announced) {
        announced = true;
        setMode('webgl');
      }
    };
    render();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener('webglcontextlost', contextLost);
      atlasImage.onload = null;
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          const m = object.material;
          (Array.isArray(m) ? m : [m]).forEach((item) => materials.add(item));
        } else if (object instanceof THREE.Sprite) materials.add(object.material);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);
  return React.createElement(
    'div',
    {
      'data-testid': 'opening-film-art',
      style: { position: 'relative', width: '100%', height: '100%' },
    },
    mode !== 'webgl' && React.createElement(Fallback, { progress }),
    React.createElement('canvas', {
      ref: canvas,
      'data-testid': 'opening-webgl-book',
      'data-renderer': mode,
      'aria-hidden': true,
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: mode === 'fallback' ? 'none' : 'block',
      },
    }),
  );
}
