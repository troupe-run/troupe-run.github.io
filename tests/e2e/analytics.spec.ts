import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.route('**/gc.zgo.at/**', (r) => r.abort()); });

for (const path of ['/', '/docs/programme/what-is-troupe/']) {
  test(`${path} (production build) includes exactly one GoatCounter script for troupe-run`, async ({ page }) => {
    await page.goto(path);
    const tag = page.locator('script[data-goatcounter]');
    await expect(tag).toHaveCount(1);
    await expect(tag).toHaveAttribute('data-goatcounter', 'https://troupe-run.goatcounter.com/count');
    await expect(tag).toHaveAttribute('src', 'https://gc.zgo.at/count.js');
  });
}
