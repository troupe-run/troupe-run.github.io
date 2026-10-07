import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  ['landing page', '/'],
  ['written docs page', '/docs/programme/what-is-troupe/'],
  ['stub docs page', '/docs/the-company/roles-and-actors/'],
  ['licensing (tables)', '/docs/backstage/licensing/'],
] as const;

for (const theme of ['light', 'dark'] as const) {
  for (const [name, path] of PAGES) {
    test(`axe finds no serious or critical WCAG 2.2 AA violations on the ${name} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('starlight-theme', t), theme);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
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
  const expected = await page.locator('a[href], select, button:not([disabled])').count();
  const seen = new Set<string>();
  for (let i = 0; i < expected + 5; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? `${el.tagName}|${el.getAttribute('href') ?? ''}|${el.textContent?.trim().slice(0, 30)}|${[...document.querySelectorAll('*')].indexOf(el)}` : '';
    });
    if (id) seen.add(id);
  }
  expect(seen.size).toBeGreaterThanOrEqual(expected);
});
