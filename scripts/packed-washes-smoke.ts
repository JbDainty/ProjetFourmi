import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

async function main() {
  const require = createRequire(import.meta.url);
  const sources = ['early', 'early', '2', '3', '4'].map(
    (part) => `require(${JSON.stringify(resolve(`assets/botanical/plant-20-${part}.webp`))})`,
  );
  const bundle = await build({
    stdin: {
      contents: `import React from 'react';
        import {createRoot} from 'react-dom/client';
        import {Botanical} from './src/components/Botanical.native';
        import {botanicalRasters} from './src/data/botanicalRasters';
        window.renderWash = (stage) => {
          window.expectedSource = botanicalRasters[20][stage];
          window.root ||= createRoot(document.getElementById('drawing'));
          window.root.render(<Botanical index={20} stage={stage} size={250} labels={false}/>);
        };`,
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    format: 'iife',
    mainFields: ['browser', 'module', 'main'],
    define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false' },
    alias: {
      'react-native': 'react-native-web',
      'react-native-svg': require.resolve('react-native-svg/lib/module/elements.web.js'),
    },
    loader: { '.png': 'dataurl', '.webp': 'dataurl', '.ttf': 'dataurl' },
    plugins: [
      {
        name: 'one-real-native-specimen',
        setup(builder) {
          builder.onLoad({ filter: /botanicalRasters\.ts$/ }, () => ({
            contents: `export const botanicalRasters = Array.from({length: 200}, () => [${sources.join(',')}]);`,
            loader: 'ts',
          }));
        },
      },
    ],
  });
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  mkdirSync('test-results', { recursive: true });
  try {
    const page = await browser.newPage();
    await page.setContent(
      '<body style="margin:0;background:white"><div id="drawing" style="width:250px;height:340px"></div><canvas id="expected" width="250" height="340"></canvas>',
    );
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (let stage = 0; stage <= 4; stage++) {
      await page.evaluate(async (stage) => {
        const w = window as any;
        w.renderWash(stage);
        const image = new Image();
        image.src = w.expectedSource;
        await image.decode();
        const canvas = document.querySelector('canvas')!;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 250, 340);
        if (stage < 2) ctx.drawImage(image, stage * 360, 0, 360, 490, 0, 0, 250, 340);
        else {
          const width = (340 * 360) / 490;
          ctx.drawImage(image, (250 - width) / 2, 0, width, 340);
        }
      }, stage);
      await page.waitForTimeout(150);
      await page.locator('#drawing').screenshot({ path: `test-results/native-wash-${stage}.png` });
      await page
        .locator('#expected')
        .screenshot({ path: `test-results/reference-wash-${stage}.png` });
    }
    execFileSync(
      'python3',
      [
        '-c',
        `from PIL import Image,ImageChops,ImageStat
for stage in range(5):
 a=Image.open(f'test-results/native-wash-{stage}.png').convert('RGB')
 b=Image.open(f'test-results/reference-wash-{stage}.png').convert('RGB')
 mean=max(ImageStat.Stat(ImageChops.difference(a,b)).mean)
 assert mean<2,(stage,mean)
 print(f'Native wash {stage}: crop matches reference (mean error {mean:.3f})')
`,
      ],
      { stdio: 'inherit' },
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
