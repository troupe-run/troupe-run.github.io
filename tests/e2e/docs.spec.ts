import { test, expect } from '@playwright/test';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/content/docs/docs';
const EDIT_BASE = 'https://github.com/troupe-run/troupe-run.github.io/edit/main/';
function mdFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? mdFiles(p) : p.endsWith('.md') ? [p] : [];
  });
}
const pages = mdFiles(ROOT).map((file) => ({
  file,
  url: '/' + file.replace('src/content/docs/', '').replace(/\.md$/, '') + '/',
  status: /^status:\s*written/m.test(readFileSync(file, 'utf8')) ? 'written' : 'planned',
}));

test('the docs tree has 31 pages: 6 written, 25 planned', () => {
  expect(pages).toHaveLength(31);
  expect(pages.filter((p) => p.status === 'written')).toHaveLength(6);
});

for (const p of pages) {
  test(`${p.url} has an "Improve this page" link to ${p.file}`, async ({ page }) => {
    await page.goto(p.url);
    await expect(page.getByRole('link', { name: 'Improve this page' })).toHaveAttribute('href', EDIT_BASE + p.file);
  });
}

test('every docs page appears in the sidebar', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  const hrefs = await page.locator('nav[aria-label="Main"] a, .sidebar-content a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  for (const p of pages) expect(hrefs, p.url).toContain(p.url);
});

test('sidebar shows the six section labels in order', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  const labels = await page.locator('.sidebar-content .top-level > li > details > summary .large').allInnerTexts();
  expect(labels).toEqual(['Programme', 'Opening night', 'The company', 'Stagecraft', 'Prompt book', 'Backstage']);
});

test('sidebar section labels use the display face in --tomato-text (light)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/docs/programme/what-is-troupe/');
  const label = page.locator('.sidebar-content .top-level > li > details > summary .large').first();
  expect(await label.evaluate((e) => getComputedStyle(e).fontFamily)).toContain('Bricolage Grotesque');
  expect(await label.evaluate((e) => getComputedStyle(e).color)).toBe('rgb(206, 61, 33)');
});

test('a stub shows the Planned note with a "Help write this page" link to its own source', async ({ page }) => {
  await page.goto('/docs/the-company/roles-and-actors/');
  const note = page.locator('aside[data-doc-note="planned"]');
  await expect(note).toContainText('Planned: not written yet.');
  await expect(note.getByRole('link', { name: 'Help write this page' }))
    .toHaveAttribute('href', EDIT_BASE + 'src/content/docs/docs/the-company/roles-and-actors.md');
});

test('a written pre-release page shows the pre-alpha note and no Planned note', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  await expect(page.locator('aside[data-doc-note="prerelease"]')).toContainText('Pre-alpha: this page describes intended behaviour.');
  await expect(page.locator('aside[data-doc-note="planned"]')).toHaveCount(0);
});

test('a written page shows a "Last updated" date', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  await expect(page.getByText('Last updated:')).toBeVisible();
});

test('a written page with prerelease: false shows no status note', async ({ page }) => {
  await page.goto('/docs/backstage/licensing/');
  await expect(page.locator('aside[data-doc-note]')).toHaveCount(0);
});

test('/docs/ redirects to What is troupe?', async ({ page }) => {
  await page.goto('/docs/');
  await expect(page).toHaveURL(/\/docs\/programme\/what-is-troupe\/$/);
});

test('an unknown URL shows the 404 page with a link home', async ({ page }) => {
  const res = await page.goto('/no-such-page/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
  await expect(page.locator('aside[data-doc-note]')).toHaveCount(0);
});

test('glossary at 320px has no page-level horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/docs/prompt-book/glossary/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
