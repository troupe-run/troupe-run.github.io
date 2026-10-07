import { test, expect } from '@playwright/test';

const SECTIONS = ['#top', '#problem', '#how-it-works', '#in-your-repo', '#principles', '#follow'];
const REPO = 'https://github.com/troupe-run/troupe.run';

test('renders the header, the six landing sections and the footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header.site-header')).toBeVisible();
  for (const id of SECTIONS) await expect(page.locator(id)).toBeVisible();
  await expect(page.locator('footer.site-footer')).toBeVisible();
});

test('renders all sections with JavaScript disabled', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('/');
  for (const id of SECTIONS) await expect(page.locator(id)).toBeVisible();
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(26, 24, 48)');
  await ctx.close();
});

test('both "Watch on GitHub" links point at the troupe.run repo', async ({ page }) => {
  await page.goto('/');
  const links = page.getByRole('link', { name: /Watch on GitHub/ });
  await expect(links).toHaveCount(2);
  for (const l of await links.all()) await expect(l).toHaveAttribute('href', REPO);
});

test('"Install: coming" is a disabled button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Install: coming' })).toBeDisabled();
});

test('hero cast is human, agent, troupe, agent, human', async ({ page }) => {
  await page.goto('/');
  const kinds = await page.locator('[data-cast] .character').evaluateAll((els) => els.map((e) => e.getAttribute('data-kind')));
  expect(kinds).toEqual(['human', 'agent', 'troupe', 'agent', 'human']);
});

test('principles section shows six cards, each with a topic icon', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#principles .principle')).toHaveCount(6);
  await expect(page.locator('#principles .principle .topic-icon')).toHaveCount(6);
});

test('how it works shows the four steps in order Cast, Perform, Cue, Notes', async ({ page }) => {
  await page.goto('/');
  const labels = await page.locator('#how-it-works .step .eyebrow').allInnerTexts();
  expect(labels.map((s) => s.trim().toLowerCase())).toEqual(['cast', 'perform', 'cue', 'notes']);
});

for (const width of [320, 390]) {
  test(`no page-level horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('below 480px the cast shows three characters, troupe in the middle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const visible = await page.locator('[data-cast] .character:visible').evaluateAll((els) => els.map((e) => e.getAttribute('data-kind')));
  expect(visible).toEqual(['agent', 'troupe', 'agent']);
});

test('with reduced motion, hovering a character leaves its transform at none', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const ch = page.locator('[data-cast] .character').nth(2);
  await ch.hover();
  expect(await ch.evaluate((e) => getComputedStyle(e).transform)).toBe('none');
});

test('without reduced motion, hovering a character transforms it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const ch = page.locator('[data-cast] .character').nth(2);
  await ch.hover();
  await expect.poll(() => ch.evaluate((e) => getComputedStyle(e).transform)).not.toBe('none');
});

test('page has exactly one h1, and it is the hero title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#top h1')).toHaveText('Your agents need a director.');
});

test('problem section lists four problems as a plain list, with no card grid', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#problem .problem-list > li')).toHaveCount(4);
  await expect(page.locator('#problem .cards')).toHaveCount(0);
});

test('problem section shows the queue illustration with its caption', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#problem .character')).toHaveCount(4);
  await expect(page.locator('#problem')).toContainText('Agents in single file, all waiting on one person.');
});

test('at 1280px the how-it-works steps sit around a ring with troupe in the centre', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.locator('#how-it-works .character--troupe')).toBeVisible();
  const boxes = await page.locator('#how-it-works .step').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  const [cast, perform, cue, notes] = boxes;
  expect(cast.top).toBeLessThan(perform.top);
  expect(cue.top).toBeGreaterThan(perform.top);
  expect(notes.left).toBeLessThan(cast.left);
  expect(perform.left).toBeGreaterThan(cast.left);
  const cx = (r: { left: number; width: number }) => r.left + r.width / 2;
  const cy = (r: { top: number; height: number }) => r.top + r.height / 2;
  const t = await page.locator('#how-it-works .character--troupe').evaluate((e) => e.getBoundingClientRect().toJSON());
  expect(cx(t)).toBeGreaterThan(cx(notes));
  expect(cx(t)).toBeLessThan(cx(perform));
  expect(cy(t)).toBeGreaterThan(cy(cast));
  expect(cy(t)).toBeLessThan(cy(cue));
  const track = await page.locator('#how-it-works ol.steps').evaluate((e) => getComputedStyle(e, '::before').borderTopStyle);
  expect(track).toBe('dashed');
});

test('at 390px the how-it-works steps stack vertically in order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  const rects = await page.locator('#how-it-works .step').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  for (let i = 1; i < rects.length; i++) {
    expect(rects[i].top).toBeGreaterThanOrEqual(rects[i - 1].bottom);
    expect(Math.abs(rects[i].left - rects[0].left)).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('#how-it-works .character--troupe')).toBeHidden();
});

test('"in your repo" band shows the illustrative snippet and caption', async ({ page }) => {
  await page.goto('/');
  const band = page.locator('#in-your-repo');
  await expect(band.locator('pre code')).toContainText('# .troupe/theatre.yaml (illustrative)');
  await expect(band).toContainText('Illustrative: the syntax isn’t final.');
  const colours = await band.locator('pre code').evaluate((code) => {
    const comment = code.querySelector('.comment') as HTMLElement;
    return [getComputedStyle(comment).color, getComputedStyle(code).color];
  });
  expect(colours[0]).not.toBe(colours[1]);
});

test('sections appear in the order hero, problem, how, in-your-repo, principles, follow', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['top', 'problem', 'how-it-works', 'in-your-repo', 'principles', 'follow']);
});
