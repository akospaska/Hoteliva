import { test, expect } from '@playwright/test';

test('HU/EN login, dashboard, persistent session and logout', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.text().includes('Unexpected text node')) runtimeErrors.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Jó újra látni.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Google/ })).toBeDisabled();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Good to see you again.' })).toBeVisible();
  await page.getByLabel('Email address', { exact: true }).fill('browser@example.test');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Incorrect email address or password.');
  await page.getByLabel('Password', { exact: true }).fill('Browser-test-password-849!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Üdv, Platform admin.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByText('Select a hotel group to start working.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Welcome, Platform admin.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'HU', exact: true }).click();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-dashboard.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Kilépés', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Jó újra látni.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Jó újra látni.' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${test.info().project.name}-login.png`,
    fullPage: true,
  });
  expect(runtimeErrors).toEqual([]);
});
