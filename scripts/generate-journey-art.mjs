// Original, deterministic overhead botanical landscapes. Rasterized once for mobile.
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)('sharp');
import { mkdirSync } from 'node:fs';
mkdirSync('assets/journey', { recursive: true });
const themes = [
  ['prairies', '#d3d7ad', '#84966b', '#d8b788'],
  ['sous-bois', '#a0b29a', '#486e55', '#aa996c'],
  ['marais', '#b5c9b5', '#638c78', '#b1c4b5'],
  ['montagnes', '#d2d3c4', '#799083', '#a5a8a3'],
  ['garrigue', '#ddd0ae', '#8f9c77', '#c6ac85'],
];
for (let biome = 0; biome < 5; biome++) {
  let seed = 120 + biome;
  const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const [name, ground, green, rock] = themes[biome];
  const parts = [];
  const ellipse = (x, y, rx, ry, fill, extra = '') =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  const flower = (x, y, r, color) =>
    `<g transform="translate(${x} ${y})">${Array.from({ length: 6 }, (_, k) => ellipse(Math.cos((k * Math.PI) / 3) * r * 0.6, Math.sin((k * Math.PI) / 3) * r * 0.6, r * 0.52, r * 0.42, color, `transform="rotate(${k * 60} ${Math.cos((k * Math.PI) / 3) * r * 0.6} ${Math.sin((k * Math.PI) / 3) * r * 0.6})"`)).join('')}${ellipse(0, 0, r * 0.28, r * 0.28, '#b29b56')}</g>`;
  for (let i = 0; i < 65; i++) {
    const x = rand() * 360,
      y = rand() * 900;
    parts.push(
      ellipse(
        x,
        y,
        15 + rand() * 45,
        8 + rand() * 24,
        rand() > 0.5 ? '#f4e9c5' : green,
        `opacity="${0.035 + rand() * 0.08}"`,
      ),
    );
  }
  if (biome === 2)
    for (const y of [140, 510, 820])
      parts.push(
        `<path d="M-20 ${y} Q100 ${y - 110} 170 ${y - 20} T400 ${y - 20} L400 ${y + 60} Q230 ${y + 110} 140 ${y + 30} T-20 ${y + 70}Z" fill="#8db2aa" stroke="#cbd3af" stroke-width="5"/><path d="M10 ${y + 10} Q100 ${y - 50} 155 ${y} M200 ${y + 30} Q260 ${y + 75} 350 ${y + 10}" fill="none" stroke="#d8e3c9" stroke-width="1.2"/>`,
      );
  for (let i = 0; i < 95; i++) {
    const x = rand() * 360,
      y = rand() * 900;
    // Leave clearings through the middle for the engraved route.
    const row = Math.floor((900 - y) / 132),
      lane = row % 2 === 0 ? 68 : 292;
    if (Math.abs(x - lane) < 34 && i % 2 === 0) continue;
    if (biome === 1 && (x < 65 || x > 295 || i % 7 === 0)) {
      const r = 15 + rand() * 21;
      parts.push(ellipse(x + 3, y + 5, r, r * 0.75, '#3a523d', 'opacity=".18"'));
      for (let k = 0; k < 9; k++) {
        const a = k * 2.4;
        parts.push(
          ellipse(
            x + Math.cos(a) * r * 0.43,
            y + Math.sin(a) * r * 0.36,
            r * 0.58,
            r * 0.46,
            ['#53735a', '#648563', '#78916a'][k % 3],
            `stroke="#3b624e" stroke-width=".45"`,
          ),
        );
      }
      parts.push(
        `<path d="M${x - r * 0.4} ${y + r * 0.1} Q${x} ${y - r * 0.4} ${x + r * 0.4} ${y}" fill="none" stroke="#aeb58a" opacity=".45"/>`,
      );
    } else if (biome === 3 && i % 3 === 0) {
      const r = 12 + rand() * 25;
      parts.push(
        `<path d="M${x - r} ${y + 8} ${x - r * 0.6} ${y - r * 0.5} ${x + r * 0.2} ${y - r} ${x + r} ${y - r * 0.1} ${x + r * 0.8} ${y + r * 0.5} ${x - r * 0.4} ${y + r * 0.6}Z" fill="${rock}" stroke="#858f87" stroke-width=".7"/><path d="M${x - r * 0.6} ${y - r * 0.5} ${x + r * 0.2} ${y - r} ${x + r} ${y - r * 0.1} ${x} ${y - 2}Z" fill="#eee8d6" opacity=".85"/><path d="M${x} ${y - 2} ${x + r * 0.8} ${y + r * 0.5}" stroke="#858f87" stroke-width=".6"/>`,
      );
    } else {
      const color = biome === 4 ? '#8d8c68' : green;
      parts.push(
        `<g transform="translate(${x} ${y}) rotate(${rand() * 180})"><path d="M0 13 Q-5 0 2-16 M0 5 Q-15 0-12-8 Q-1-7 0 5 M0-3 Q14-8 12-16 Q1-14 0-3 M0 9 Q12 7 14 0" fill="${color}" stroke="${color}" stroke-width=".8" opacity=".75"/></g>`,
      );
      if (biome === 0 || biome === 4)
        parts.push(
          flower(
            x + 5,
            y - 9,
            2 + rand() * 3,
            biome === 4 ? ['#a28fa6', '#b1a4b7'][i % 2] : ['#cf7e65', '#e6e3c3', '#b1acc4'][i % 3],
          ),
        );
      if (biome === 2)
        parts.push(
          `<path d="M${x} ${y + 15}q6-20 3-35m-2 17q-15-12-12-20m13 22q13-12 12-24" fill="none" stroke="#64816a" stroke-width="1.2"/>`,
        );
    }
  }
  // Fine ink speckles and paper grain are part of the static artwork.
  for (let i = 0; i < 1400; i++)
    parts.push(
      ellipse(
        rand() * 360,
        rand() * 900,
        0.2 + rand() * 0.7,
        0.2 + rand() * 0.7,
        rand() > 0.5 ? '#4a5c43' : '#fff8df',
        'opacity=".11"',
      ),
    );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1800" viewBox="0 0 360 900"><defs><linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset=".065" stop-color="white"/><stop offset=".935" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="fade"><path fill="url(#edge)" d="M0 0h360v900H0z"/></mask><radialGradient id="wash"><stop stop-color="#f4e8c5" stop-opacity=".3"/><stop offset="1" stop-color="${green}" stop-opacity=".1"/></radialGradient></defs><g mask="url(#fade)"><path fill="${ground}" d="M0 0h360v900H0z"/><path fill="url(#wash)" d="M0 0h360v900H0z"/>${parts.join('')}</g></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`assets/journey/${name}.png`);
  console.log(name);
}
