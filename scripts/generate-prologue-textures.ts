import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { paintPrologueTextures } from './prologue-textures-painter';
const data = (file: string, mime: string) =>
  `data:${mime};base64,${readFileSync(file).toString('base64')}`;
async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.addStyleTag({
      content: `@font-face{font-family:HerbariumDisplay;src:url(${data('node_modules/@expo-google-fonts/almendra/400Regular/Almendra_400Regular.ttf', 'font/ttf')})} @font-face{font-family:HerbariumScientific;src:url(${data('node_modules/@expo-google-fonts/alegreya/500Medium_Italic/Alegreya_500Medium_Italic.ttf', 'font/ttf')})}`,
    });
    await page.evaluate(async () => {
      await document.fonts.load('46px HerbariumDisplay');
      await document.fonts.load('23px HerbariumScientific');
    });
    const result = await page.evaluate(
      async ({ source, options }) => {
        const painter = new Function('__name', `return (${source})`)((fn: unknown) => fn);
        return (await painter(options)) as Record<string, string>;
      },
      {
        source: paintPrologueTextures.toString(),
        options: {
          atlas: data('assets/illustrations/prairies.png', 'image/png'),
          bounds: [
            [26, 17, 497, 754],
            [558, 16, 993, 754],
            [29, 777, 490, 1522],
            [520, 779, 994, 1521],
          ],
        },
      },
    );
    mkdirSync('assets/prologue', { recursive: true });
    for (const [name, url] of Object.entries(result)) {
      const bytes = Buffer.from(url.split(',')[1], 'base64');
      writeFileSync(`assets/prologue/${name}.png`, bytes);
      console.log(name, bytes.length);
    }
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
