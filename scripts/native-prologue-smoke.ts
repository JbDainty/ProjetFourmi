import { build } from 'esbuild';
import { chromium, expect } from '@playwright/test';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
async function main() {
  const compiled = await build({
    entryPoints: ['scripts/native-prologue-contract.ts'],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'NativeBook',
    platform: 'browser',
    target: 'es2020',
  });
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--use-gl=angle',
    ],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setContent(
      '<style>body{margin:0;background:#14291f}canvas{width:390px;height:844px}</style><canvas width="390" height="844"></canvas>',
    );
    await page.addScriptTag({ content: compiled.outputFiles[0].text });
    const files = Object.fromEntries(
      readdirSync('assets/prologue').map((file) => [
        file.slice(0, -4),
        Array.from(readFileSync('assets/prologue/' + file)),
      ]),
    );
    await page.evaluate((files) => {
      (window as any).nativeBook = (window as any).NativeBook.start(
        document.querySelector('canvas'),
        files,
      );
    }, files);
    let peak = 0;
    for (const p of [0, 0.13, 0.35, 0.6, 0.83, 0.95]) {
      const frame = await page.evaluate((p) => (window as any).nativeBook.advance(p), p);
      expect(frame.error).toBe(0);
      expect(frame.pages).toBe(12);
      expect(frame.submitted).toBeGreaterThan(0);
      peak = Math.max(peak, frame.draws);
      if (p === 0.6) {
        mkdirSync('test-results', { recursive: true });
        await page.screenshot({ path: 'test-results/native-gl-contract-vortex.png' });
      }
    }
    expect(peak).toBeLessThan(180);
    await page.evaluate(() => (window as any).nativeBook.dispose());
    expect(errors).toEqual([]);
    console.log(
      'Native adapter contract passed on real GL2: native canvas shim, packed RGBA textures, no image/Canvas2D loader, 12 flying pages, clean GL errors, frame submission and disposal; peak',
      peak,
      'draw calls. This does not replace Android/iOS device tests.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
