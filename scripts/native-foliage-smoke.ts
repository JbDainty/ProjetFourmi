import { build } from 'esbuild';
import { chromium, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

async function main() {
  const require = createRequire(import.meta.url);
  const bundle = await build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';
      import {Platform,View} from 'react-native';import {FoliageFrame} from './src/components/FoliageFrame';
      window.paintFrame=(native,w,h)=>{if(native)Object.defineProperty(Platform,'OS',{value:'android'});
        createRoot(document.getElementById('drawing')).render(<View style={{width:w,height:h,backgroundColor:'#ebe0c9'}}><FoliageFrame vitality={.8}/></View>);};`,
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
  });
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  mkdirSync('test-results', { recursive: true });
  try {
    for (const [w, h] of [
      [350, 1500],
      [700, 3200],
      [920, 600],
    ])
      for (const native of [false, true]) {
        const page = await browser.newPage({ viewport: { width: w, height: 600 } });
        await page.setContent('<body style="margin:0"><div id="drawing"></div>');
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        await page.evaluate(({ native, w, h }) => (window as any).paintFrame(native, w, h), {
          native,
          w,
          h,
        });
        await expect.poll(() => page.locator('svg').count()).toBeGreaterThan(native ? 1 : 0);
        await page
          .locator('#drawing')
          .screenshot({
            path: `test-results/foliage-${w}-${h}-${native ? 'tiles' : 'single'}.png`,
          });
        if (native) {
          const sizes = await page
            .locator('svg')
            .evaluateAll((nodes) =>
              nodes.map((n) => ({
                w: n.getBoundingClientRect().width,
                h: n.getBoundingClientRect().height,
              })),
            );
          for (const size of sizes) {
            expect(size.w).toBeLessThanOrEqual(384);
            expect(size.h).toBeLessThanOrEqual(384);
          }
        }
        await page.close();
      }
    execFileSync(
      'python3',
      [
        '-c',
        `from PIL import Image,ImageChops,ImageStat,ImageDraw
for w,h in [(350,1500),(700,3200),(920,600)]:
 a=Image.open(f'test-results/foliage-{w}-{h}-single.png').convert('RGB')
 b=Image.open(f'test-results/foliage-{w}-{h}-tiles.png').convert('RGB')
 mask=Image.new('L',(w,h));d=ImageDraw.Draw(mask)
 d.rectangle((0,0,w,48),fill=255);d.rectangle((0,h-48,w,h),fill=255)
 d.rectangle((0,0,28,h),fill=255);d.rectangle((w-28,0,w,h),fill=255)
 error=max(ImageStat.Stat(ImageChops.difference(a,b),mask).mean)
 assert error<1,(w,h,error)
 print(f'Foliage {w}x{h}: bounded native surfaces preserve painted border (error {error:.3f})')
`,
      ],
      { stdio: 'inherit' },
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
