import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');
const base = dirname(fileURLToPath(import.meta.url));
const output = resolve(base, 'dist/assets/screens');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures: string[] = [];
let captured = 0;
try {
  for (const device of ['desktop', 'mobile']) {
    const page = await browser.newPage({
      viewport: device === 'desktop' ? { width: 1360, height: 900 } : { width: 390, height: 844 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (error: Error) => failures.push(error.message));
    for (let i = 1; i <= 30; i++) {
      const id = `F${String(i).padStart(2, '0')}`;
      for (const theme of ['light', 'dark']) {
        await page.goto(`http://127.0.0.1:4193/screen.html?id=${id}&theme=${theme}`);
        await page.locator('.page-heading h1').waitFor();
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        if (overflow) failures.push(`${id} ${theme} ${device}: horizontal overflow`);
        if (device === 'mobile') {
          // A teljes képen az alsó navigáció ne takarja el a lejjebb fekvő tartalmat.
          await page.addStyleTag({
            content: '.app-shell .mobile-nav{position:static}.app-shell main{padding-bottom:22px}',
          });
        }
        await page.screenshot({
          path: resolve(output, `${id}-${theme}-${device}.png`),
          fullPage: true,
          animations: 'disabled',
        });
        captured++;
      }
    }
    await page.close();
    console.log(`${device}: 60 PNG elkészült.`);
  }
} finally {
  await browser.close();
}
if (failures.length) throw new Error(failures.join('\n'));
console.log(`${captured} képernyőterv, nincs JavaScript-hiba vagy vízszintes túlcsordulás.`);
