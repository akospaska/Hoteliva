import { test, expect } from '@playwright/test';

test('room QR printing, minibar and cleaning approval work through the UI', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.print = () => {
      document.body.dataset.printed = 'yes';
    };
  });
  await page.goto('/');
  await page.getByLabel('Email-cím', { exact: true }).fill('browser@example.test');
  await page.getByLabel('Jelszó', { exact: true }).fill('Browser-test-password-849!');
  await page.getByRole('button', { name: 'Bejelentkezés', exact: true }).click();
  await page.getByRole('button', { name: 'Hotelcsoport', exact: true }).click();
  await page.getByRole('button', { name: 'Hoteliva Demo Collection', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hotel', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/group=/);
  const url = new URL(page.url());
  url.searchParams.set('module', 'F02');
  await page.goto(url.toString());
  await page.getByRole('button', { name: '204 · Deluxe', exact: true }).click();
  await page.getByRole('button', { name: 'QR-címke nyomtatása', exact: true }).click();
  const printed = page.frameLocator('iframe[title="Hoteliva QR labels"]');
  await expect(printed.getByRole('heading', { name: '204 · Deluxe' })).toBeVisible();
  await expect(printed.locator('body')).toHaveAttribute('data-printed', 'yes');
  await expect(printed.locator('img')).toHaveAttribute('src', /^data:image\/png;base64,/);
  await page.getByRole('button', { name: 'Ásványvíz 0,5 l +', exact: true }).click();
  await page
    .getByLabel('Tartózkodás / elszámolás azonosítója', { exact: true })
    .fill(`stay-${info.project.name}`);
  await page.getByRole('button', { name: 'Fogyasztás mentése', exact: true }).click();
  await expect(page.getByText('Fogyasztás rögzítve.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: '204 · Deluxe · Ásványvíz 0,5 l · Új', exact: true }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: '+ Takarítás', exact: true }).click();
  await page.getByLabel('Megnevezés', { exact: true }).fill(`Szobaellenőrzés ${info.project.name}`);
  await page.getByRole('button', { name: 'Mentés', exact: true }).click();
  await page.getByRole('button', { name: 'Munka indítása', exact: true }).click();
  await page.getByRole('button', { name: 'Ellenőrzésre küldés', exact: true }).click();
  await page.getByRole('button', { name: 'Jóváhagyás', exact: true }).click();
  const current = new URL(page.url());
  current.searchParams.set('module', 'F02');
  current.searchParams.delete('record');
  await page.goto(current.toString());
  await page.getByRole('button', { name: '204 · Deluxe', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tisztaság', exact: true })).toHaveText('Tiszta ▾');
  expect(errors).toEqual([]);
});
