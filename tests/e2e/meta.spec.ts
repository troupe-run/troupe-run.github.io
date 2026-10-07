import { test, expect } from './fixtures';

test('landing page declares og:image as https://troupe.run/og.png', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://troupe.run/og.png');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
});

for (const path of ['/', '/docs/programme/what-is-troupe/']) {
  test(`${path} makes no request to Google Fonts`, async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (r) => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) hits.push(r.url()); });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    expect(hits).toEqual([]);
  });
}

for (const path of ['/', '/docs/programme/what-is-troupe/']) {
  test(`${path} links favicon.svg, favicon.ico and apple-touch-icon, and each returns 200`, async ({ page, request }) => {
    await page.goto(path);
    for (const sel of ['link[rel="icon"][href="/favicon.svg"]', 'link[rel="icon"][href="/favicon.ico"]', 'link[rel="apple-touch-icon"]']) {
      const href = await page.locator(sel).getAttribute('href');
      expect(href, sel).toBeTruthy();
      expect((await request.get(href!)).status(), href!).toBe(200);
    }
  });
}
