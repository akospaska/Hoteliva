import { test, expect } from '@playwright/test';

test('daily planning, poll votes, handbook publication and saved reports persist', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('Email-cím', { exact: true }).fill('browser@example.test');
  await page.getByLabel('Jelszó', { exact: true }).fill('Browser-test-password-849!');
  await page.getByRole('button', { name: 'Bejelentkezés', exact: true }).click();
  await page.getByRole('button', { name: 'Hotelcsoport', exact: true }).click();
  await page.getByRole('button', { name: 'Hoteliva Demo Collection', exact: true }).click();
  await page.getByRole('button', { name: 'Hotel', exact: true }).click();
  await page.getByRole('button', { name: 'Hotel Aurora Budapest', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Hotel', exact: true })).toBeHidden();
  await expect(page).toHaveURL(/hotel=/);
  const base = new URL(page.url());
  async function module(id: string) {
    base.searchParams.set('module', id);
    base.searchParams.delete('record');
    await page.goto(base.toString());
  }
  await module('F04');
  await page.getByRole('button', { name: '+ Napi takarítási terv', exact: true }).click();
  await page
    .getByLabel('Tervezés napja (ÉÉÉÉ-HH-NN)', { exact: true })
    .fill(info.project.name === 'desktop' ? '2026-11-02' : '2026-11-03');
  await page.getByRole('button', { name: 'Napi terv összeállítása', exact: true }).click();
  await expect(page.getByText('8 munkalap a napi tervben.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Napi terv összeállítása', exact: true }).click();
  await expect(page.getByText('8 munkalap a napi tervben.', { exact: true })).toBeVisible();

  await module('F27');
  await page.getByRole('button', { name: 'Szavazás', exact: true }).click();
  await page.getByRole('button', { name: '+ Szavazás', exact: true }).click();
  await page.getByLabel('Megnevezés', { exact: true }).fill(`Csapatprogram ${info.project.name}`);
  await page.getByLabel('Válaszok (soronként egy)', { exact: true }).fill('Séta\nVacsora');
  await page.getByRole('button', { name: 'Mentés', exact: true }).click();
  await page.getByRole('button', { name: 'Közzététel', exact: true }).click();
  await page.getByRole('button', { name: 'Séta · 0', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Séta · 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Vacsora · 0', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Séta · 0', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vacsora · 1', exact: true })).toBeVisible();

  await module('F17');
  await page.getByRole('button', { name: '+ Útmutató', exact: true }).click();
  const title = `Takarítási útmutató ${info.project.name}`;
  await page.getByLabel('Megnevezés', { exact: true }).fill(title);
  await page
    .getByLabel('Leírás és utasítások', { exact: true })
    .fill('Ellenőrizd az ablakot és a világítást.');
  await page.getByRole('button', { name: 'Mentés', exact: true }).click();
  await page.getByRole('button', { name: 'Közzététel', exact: true }).click();
  await page.getByRole('button', { name: 'Elolvastam / átvettem', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByText('Visszaigazolások: 1', { exact: true })).toBeVisible();

  await module('F18');
  await page.getByLabel('Ettől (ÉÉÉÉ-HH-NN)', { exact: true }).fill('2026-10-01');
  await page.getByRole('button', { name: 'Saját alapnézet mentése', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Saját alapnézet mentése', exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel('Ettől (ÉÉÉÉ-HH-NN)', { exact: true })).toHaveValue('2026-10-01');
  expect(errors).toEqual([]);
});
