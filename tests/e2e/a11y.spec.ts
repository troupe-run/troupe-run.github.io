import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  ['landing page', '/'],
  ['written docs page', '/docs/programme/what-is-troupe/'],
  ['stub docs page', '/docs/the-company/roles-and-actors/'],
  ['licensing (tables)', '/docs/backstage/licensing/'],
] as const;

for (const theme of ['light', 'dark'] as const) {
  for (const [name, path] of PAGES) {
    test(`axe reports no serious or critical violations (WCAG 2.2 AA rule tags) on the ${name} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('starlight-theme', t), theme);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}

test('every interactive element on the landing page is reachable by Tab', async ({ page }) => {
  await page.goto('/');
  // Mark each visible, non-tabindex=-1 interactive element with a stable identity.
  const expected = await page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>('a[href], select, button:not([disabled])')].filter(
      (el) => el.getAttribute('tabindex') !== '-1' && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
    );
    els.forEach((el, i) => el.setAttribute('data-tab-id', String(i)));
    return els.map((el, i) => `${i}|${el.tagName}|${el.getAttribute('href') ?? ''}|${el.textContent?.trim().slice(0, 30)}`);
  });
  expect(expected.length).toBeGreaterThan(0);
  const focused = new Set<number>();
  for (let i = 0; i < expected.length + 5; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-tab-id') ?? null);
    if (id !== null) focused.add(Number(id));
  }
  const missed = expected.filter((_, i) => !focused.has(i));
  expect(missed).toEqual([]);
});
