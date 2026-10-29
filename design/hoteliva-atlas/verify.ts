import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, expect } = require('@playwright/test');
const base = dirname(fileURLToPath(import.meta.url));
const evidence = resolve(base, 'qa');
mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
const checks: string[] = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error: Error) => errors.push(error.message));
  page.on('response', (response: { status: () => number; url: () => string }) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('http://127.0.0.1:4193/');
  await expect(page.locator('#feature-nav a')).toHaveCount(30);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.desktop-shot img').evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({ path: resolve(evidence, 'overview-desktop.png'), fullPage: true });
  await page.locator('[data-scope="mvp"]').click();
  await expect(page.locator('#feature-nav a')).toHaveCount(12);
  await page.locator('[data-scope="later"]').click();
  await expect(page.locator('#feature-nav a')).toHaveCount(18);
  await page.locator('[data-scope="all"]').click();
  await page.locator('#feature-search').fill('deepseek');
  await expect(page.locator('#feature-nav a[href="#F09"]')).toBeVisible();
  await page.locator('#feature-search').fill('nincsenilyenfunkcio');
  await expect(page.locator('.empty-result')).toBeVisible();
  await page.locator('#feature-search').fill('');
  checks.push('30 funkció; 12 MVP és 18 további; ékezetfüggetlen keresés és üres találat.');
  for (let i = 1; i <= 30; i++) {
    const id = `F${String(i).padStart(2, '0')}`;
    await page.goto(`http://127.0.0.1:4193/#${id}`);
    await expect(page.locator('.feature-breadcrumb b')).toHaveText(id);
    await page.locator('#active-mockup').evaluate((img: HTMLImageElement) => img.decode());
    await page.locator('[data-tab="requirements"]').click();
    if ((await page.locator('.requirements li').count()) < 3)
      throw new Error(`${id}: missing requirements`);
    await page.locator('[data-tab="flow"]').click();
    await expect(page.locator('.flow-steps li')).toHaveCount(4);
    await page.locator('[data-tab="preview"]').click();
  }
  checks.push(
    'Mind a 30 funkció képe, négylépéses folyamata és részletes követelményei elérhetők.',
  );
  await page.goto('http://127.0.0.1:4193/#F02');
  await page.locator('[data-theme-choice="dark"]').click();
  await page.locator('[data-device="mobile"]').click();
  await expect(page.locator('#active-mockup')).toHaveAttribute(
    'src',
    'assets/screens/F02-dark-mobile.png',
  );
  await page.locator('#active-mockup').click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await expect(page.locator('#dialog-download')).toHaveAttribute(
    'href',
    'assets/screens/F02-dark-mobile.png',
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).not.toBeVisible();
  await page.locator('#compare-button').click();
  await expect(page.locator('.comparison img')).toHaveCount(4);
  await page.locator('#atlas-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-atlas-theme', 'dark');
  await page.screenshot({ path: resolve(evidence, 'comparison-desktop-dark.png'), fullPage: true });
  checks.push(
    'Téma/eszközváltás, négyes összehasonlítás, nagyítás, Escape és PNG-letöltési hivatkozás.',
  );
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://127.0.0.1:4193/');
    await page.locator('#menu-button').click();
    await page.locator('#feature-nav a[href="#F05"]').click();
    await expect(page.locator('#menu-button')).toHaveAttribute('aria-expanded', 'false');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
      throw new Error(`Atlas horizontal overflow at ${width}px`);
    }
    await page.screenshot({ path: resolve(evidence, `atlas-mobile-${width}.png`), fullPage: true });
  }
  checks.push('390 és 768 px: mobilmenü, navigáció és túlcsordulás ellenőrizve.');
  const imageCount = readdirSync(resolve(base, 'dist/assets/screens')).filter((name) =>
    name.endsWith('.png'),
  ).length;
  if (imageCount !== 120) throw new Error(`Expected 120 images, got ${imageCount}`);
  if (errors.length) throw new Error(errors.join('\n'));
  checks.push('120 PNG-fájl; nincs JavaScript- vagy HTTP-hiba a vizsgált felületen.');
  writeFileSync(
    resolve(evidence, 'report.json'),
    JSON.stringify({ status: 'passed', checks }, null, 2),
  );
  console.log(checks.join('\n'));
} finally {
  await browser.close();
}
