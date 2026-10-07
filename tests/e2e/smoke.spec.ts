import { test, expect } from '@playwright/test';

test('landing page responds 200 with an h1', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
});

test('docs page "What is troupe?" renders under /docs/', async ({ page }) => {
  const res = await page.goto('/docs/programme/what-is-troupe/');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'What is troupe?' })).toBeVisible();
});

test('docs page edit link is labelled "Improve this page"', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  await expect(page.getByRole('link', { name: 'Improve this page' })).toBeVisible();
});
