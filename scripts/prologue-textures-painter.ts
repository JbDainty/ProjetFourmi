/** Build-time only. The native runtime uses pre-rendered PNGs, never DOM/Canvas. */
export async function paintPrologueTextures(options: { atlas: string; bounds: number[][] }) {
  const W = 2.8,
    H = 4.05;
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
    return { image: surface };
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
      c.fillText(['Papaver rhoeas', 'Centaurea cyanus', 'Leucanthemum', 'Ranunculus'][i], 512, 115);
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
  const glow = texture(64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, '#fff8d9ff');
    g.addColorStop(0.15, '#e9cf8d88');
    g.addColorStop(1, '#e9cf8d00');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
  const floorFade = texture(128, (c) => {
    const fade = c.createRadialGradient(64, 64, 12, 64, 64, 64);
    fade.addColorStop(0, '#fff');
    fade.addColorStop(0.42, '#fff');
    fade.addColorStop(1, '#000');
    c.fillStyle = fade;
    c.fillRect(0, 0, 128, 128);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = options.atlas;
  });
  for (let i = 0; i < 4; i++) {
    const c = pageTextures[i].image.getContext('2d')!;
    const [x, y, r, b] = options.bounds[i];
    const printedWidth = Math.min(700, (((650 * (r - x)) / (b - y)) * H) / W);
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.drawImage(image, x, y, r - x, b - y, (1024 - printedWidth) / 2, 170, printedWidth, 650);
    c.restore();
  }

  const leaf = texture(128, (c) => {
    c.clearRect(0, 0, 128, 128);
    const g = c.createLinearGradient(22, 0, 106, 0);
    g.addColorStop(0, '#46613a');
    g.addColorStop(0.48, '#b0c388');
    g.addColorStop(0.52, '#d1d8aa');
    g.addColorStop(1, '#6a8850');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(64, 121);
    c.bezierCurveTo(4, 94, 14, 31, 64, 5);
    c.bezierCurveTo(114, 31, 124, 94, 64, 121);
    c.fill();
    c.strokeStyle = '#e1d9a6';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(64, 119);
    c.quadraticCurveTo(57, 50, 64, 7);
    c.stroke();
    for (let y = 28; y < 105; y += 15) {
      c.strokeStyle = '#c4d09b99';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(62, y + 7);
      c.lineTo(34, y - 7);
      c.moveTo(64, y + 7);
      c.lineTo(94, y - 7);
      c.stroke();
    }
  });
  return Object.fromEntries(
    Object.entries({
      leather,
      paper,
      edge: edgeMap,
      wood,
      glow,
      floorFade,
      leaf,
      page0: pageTextures[0],
      page1: pageTextures[1],
      page2: pageTextures[2],
      page3: pageTextures[3],
    }).map(([name, { image }]) => {
      const size = name === 'leather' ? 1024 : Math.min(512, image.width);
      const final = document.createElement('canvas');
      final.width = final.height = size;
      final.getContext('2d')!.drawImage(image, 0, 0, size, size);
      return [name, final.toDataURL('image/png')];
    }),
  );
}
