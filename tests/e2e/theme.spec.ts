import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme);

test('with nothing stored, the landing page follows a dark system scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  expect(await theme(page)).toBe('dark');
});

test('with nothing stored, the landing page follows a light system scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await theme(page)).toBe('light');
});

test('choosing Dark on the landing page persists across reload and into the docs', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.locator('[data-theme-toggle]').selectOption('dark');
  expect(await theme(page)).toBe('dark');
  await page.reload();
  expect(await theme(page)).toBe('dark');
  await page.goto('/docs/programme/what-is-troupe/');
  expect(await theme(page)).toBe('dark');
});

test('choosing Light in the docs theme select carries back to the landing page', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/programme/what-is-troupe/');
  await page.locator('starlight-theme-select select').first().selectOption('light');
  await page.goto('/');
  expect(await theme(page)).toBe('light');
  await expect(page.locator('[data-theme-toggle]')).toHaveValue('light');
});

test('an unknown stored theme value follows the system scheme', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('starlight-theme', 'blue'));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await theme(page)).toBe('light');
  await expect(page.locator('[data-theme-toggle]')).toHaveValue('auto');
});

test('landing page raises no errors when localStorage throws', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.locator('[data-theme-toggle]').selectOption('light');
  expect(errors).toEqual([]);
  expect(await theme(page)).toBe('light');
});

test('body background uses --bg in each theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(light).toBe('rgb(255, 248, 238)');
  await page.locator('[data-theme-toggle]').selectOption('dark');
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(dark).toBe('rgb(26, 24, 48)');
});
