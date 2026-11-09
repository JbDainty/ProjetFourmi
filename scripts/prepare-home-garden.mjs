// Offline packaging only. The original generated illustration is kept under art/home.
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)('sharp');
await sharp('art/home/garden-source.png')
  .resize(900, 1600, { fit: 'cover' })
  .png({ palette: true, colours: 256, dither: 0.5 })
  .toFile('assets/home/garden.png');
