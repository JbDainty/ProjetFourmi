// Package the original generated illustration atlas for the mobile map.
// Cropping, resizing and edge masks only; no image generation at runtime.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const sharp = createRequire(import.meta.url)('sharp');
const source = 'art/journey/biomes-atlas.png';
const names = ['prairies', 'sous-bois', 'marais', 'montagnes', 'garrigue'];
const { width, height } = await sharp(source).metadata();
const outWidth = 720,
  outHeight = 1800;
mkdirSync('assets/journey', { recursive: true });
// The overlapping 1000-unit tiles retain the existing 880-unit biome spacing.
// Complementary soft edges avoid a visible horizontal cut through the scenery.
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}"><defs><linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset="0.065" stop-color="white"/><stop offset="0.935" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#edge)"/></svg>`,
);
for (let biome = 0; biome < names.length; biome++) {
  const left = Math.round((biome * width) / names.length);
  const right = Math.round(((biome + 1) * width) / names.length);
  // An inset avoids mixing a neighbouring panel into an edge pixel on resize.
  const cropped = await sharp(source)
    .extract({ left: left + 2, top: 0, width: right - left - 4, height })
    .resize(outWidth, outHeight, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  await sharp(cropped, { raw: { width: outWidth, height: outHeight, channels: 4 } })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png({ palette: true, colours: 256, dither: 0.6 })
    .toFile(`assets/journey/${names[biome]}.png`);
  console.log(names[biome]);
}
