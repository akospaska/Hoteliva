import { test, expect, type Page } from '@playwright/test';

async function enter(page: Page) {
  await page.goto('/');
  await page.getByLabel('Email-cím', { exact: true }).fill('browser@example.test');
  await page.getByLabel('Jelszó', { exact: true }).fill('Browser-test-password-849!');
  await page.getByRole('button', { name: 'Bejelentkezés', exact: true }).click();
  await page.getByRole('button', { name: 'Hotelcsoport', exact: true }).click();
  await page.getByRole('button', { name: 'Hoteliva Demo Collection', exact: true }).click();
  await page.getByRole('button', { name: 'Hotel', exact: true }).click();
  await page.getByRole('button', { name: 'Hotel Aurora Budapest', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Hotel', exact: true })).toBeHidden();
}
async function module(page: Page, id: string) {
  const url = new URL(page.url());
  url.searchParams.set('module', id);
  url.searchParams.delete('record');
  await page.goto(url.toString());
}
test('create, edit, review and persist a task; all modules and both themes render', async ({
  page,
}, info) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.text().includes('Unexpected text node')) errors.push(m.text());
  });
  await enter(page);
  await expect(page.getByRole('heading', { name: 'Áttekintés' })).toBeVisible();
  await page.screenshot({ path: `test-results/${info.project.name}-operations-light.png` });
  await module(page, 'F03');
  await page.getByRole('button', { name: '+ Feladat', exact: true }).click();
  const title = `Ellenőrzött munkalap ${info.project.name}`;
  await page.getByLabel('Megnevezés', { exact: true }).fill(title);
  await page
    .getByLabel('Leírás és utasítások', { exact: true })
    .fill('A recepción ellenőrizzük a lámpát.');
  await page.getByRole('button', { name: '+ Ellenőrzési pont' }).click();
  await page.getByLabel('1. Ellenőrzési pont', { exact: true }).fill('Világítás működik');
  await page.getByRole('button', { name: 'Mentés', exact: true }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.getByRole('button', { name: 'Szerkesztés', exact: true }).click();
  await page
    .getByLabel('Leírás és utasítások', { exact: true })
    .fill('Módosított, megőrzött leírás.');
  await page.getByRole('button', { name: 'Mentés', exact: true }).click();
  await expect(page.getByText('Módosított, megőrzött leírás.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ellenőrzés rögzítése', exact: true }).click();
  await expect(page.getByText('1/1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Munka indítása', exact: true }).click();
  await page.getByRole('button', { name: 'Ellenőrzésre küldés', exact: true }).click();
  await page.getByRole('button', { name: 'Jóváhagyás', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Újranyitás', exact: true })).toBeVisible();
  await page.getByLabel('Hozzászólás', { exact: true }).fill('A munkát ellenőriztem.');
  await page.getByRole('button', { name: 'Küldés', exact: true }).click();
  await expect(page.getByText('A munkát ellenőriztem.', { exact: true })).toBeVisible();
  for (let index = 1; index <= 30; index++) {
    await module(page, `F${String(index).padStart(2, '0')}`);
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hotel', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.screenshot({
      path: `test-results/screens/F${String(index).padStart(2, '0')}-${info.project.name}-light.png`,
    });
    await page.getByRole('button', { name: '◐', exact: true }).click();
    await page.screenshot({
      path: `test-results/screens/F${String(index).padStart(2, '0')}-${info.project.name}-dark.png`,
    });
    await page.getByRole('button', { name: '☀', exact: true }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
  }
  await module(page, 'F02');
  await page.getByRole('button', { name: '◐', exact: true }).click();
  await page.screenshot({ path: `test-results/${info.project.name}-operations-dark.png` });
  await page.reload();
  await expect(page.getByRole('button', { name: '☀', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
