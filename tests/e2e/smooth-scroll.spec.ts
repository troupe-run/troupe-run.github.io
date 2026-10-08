import { test, expect } from './fixtures';

test('in-page nav scrolls smoothly: html scroll-behavior is smooth without reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
});

test('with reduced motion, html scroll-behavior is auto (in-page nav jumps)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

test('clicking "Principles" in the header is still in mid-scroll 100ms later, then lands on #principles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('header.site-header nav').getByRole('link', { name: 'Principles' }).click();
  await page.waitForTimeout(100);
  const target = await page.locator('#principles').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const mid = await page.evaluate(() => window.scrollY);
  expect(mid).toBeGreaterThan(0);
  expect(mid).toBeLessThan(target - 5);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThanOrEqual(Math.floor(target) - 2);
});
