import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const bowing = (page: Page) => page.locator('[data-cast] .character.is-bowing');

test('after 5s with no hover, exactly one character is bowing', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('[data-cast]')).toHaveAttribute('data-idle', 'running');
  await page.clock.runFor(5100);
  await expect(bowing(page)).toHaveCount(1);
});

test('with reduced motion, idle bowing is off and nothing bows after 6s', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-cast]')).toHaveAttribute('data-idle', 'off');
  await page.clock.runFor(6000);
  await expect(bowing(page)).toHaveCount(0);
});

test('with the hero scrolled out of view, no bow fires', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('footer.site-footer').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-cast]')).toHaveAttribute('data-idle', 'paused');
  await page.clock.runFor(6000);
  await expect(bowing(page)).toHaveCount(0);
});

test('idle bowing reaches state "done" within 40s', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.clock.runFor(40_000);
  await expect(page.locator('[data-cast]')).toHaveAttribute('data-idle', 'done');
});
