import { test, expect, BLOCKED_EXTERNAL } from './fixtures';

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
  await ctx.route(BLOCKED_EXTERNAL, (r) => r.abort());
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

test('principles section shows five cards, each with exactly one topic icon', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#principles .principle')).toHaveCount(5);
  const perCard = await page.locator('#principles .principle').evaluateAll((els) => els.map((e) => e.querySelectorAll('.topic-icon').length));
  expect(perCard).toEqual([1, 1, 1, 1, 1]);
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

test('problem items are a grid with no card background, border or shadow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#problem .problem-list > li')).toHaveCount(4);
  const list = page.locator('#problem .problem-list');
  expect(await list.evaluate((e) => getComputedStyle(e).display)).toBe('grid');
  const items = await list.locator('> li').evaluateAll((els) => els.map((e) => {
    const s = getComputedStyle(e);
    return { bg: s.backgroundColor, top: s.borderTopWidth, left: s.borderLeftWidth, right: s.borderRightWidth, bottom: s.borderBottomWidth, shadow: s.boxShadow };
  }));
  for (const i of items) {
    expect(i.bg).toBe('rgba(0, 0, 0, 0)');
    expect([i.top, i.left, i.right, i.bottom, i.shadow]).toEqual(['0px', '0px', '0px', '0px', 'none']);
  }
});

for (const [width, columns] of [[1280, 4], [800, 2], [390, 1]] as const) {
  test(`at ${width}px the problem illustration sits above the problems, which lay out in ${columns} column(s)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const fig = await page.locator('#problem figure').evaluate((e) => e.getBoundingClientRect().toJSON());
    const lis = await page.locator('#problem .problem-list > li').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    expect(fig.bottom).toBeLessThanOrEqual(Math.min(...lis.map((l) => l.top)));
    expect(new Set(lis.map((l) => Math.round(l.left))).size).toBe(columns);
  });
}

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

test('the hero has no eyebrow line, no status badge and the header has no status pill', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#top .eyebrow, #top .badge')).toHaveCount(0);
  await expect(page.locator('header.site-header .pill')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('pre-alpha · ');
});

test('at 1280px the hero headline sits on one line', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const lines = await page.locator('#top h1').evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)));
  expect(lines).toBe(1);
});

test('the hero buttons and the closing button centre their text, and the hero pair share a baseline', async ({ page }) => {
  await page.goto('/');
  const btns = page.locator('#top .btn, #follow .btn');
  await expect(btns).toHaveCount(3);
  const info = await btns.evaluateAll((els) => els.map((e) => {
    const s = getComputedStyle(e);
    return { display: s.display, align: s.alignItems, height: e.getBoundingClientRect().height };
  }));
  for (const i of info) {
    expect(i.display).toMatch(/flex/); // blockified to flex inside the hero's flex row
    expect(i.align).toBe('center');
  }
  expect(new Set(info.map((i) => Math.round(i.height))).size).toBe(1);
  const tops = await page.locator('#top .btn').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
});

test('the footer drops the privacy and licence lines and links hps.gd twice, in new tabs', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer.site-footer');
  await expect(footer).not.toContainText('GoatCounter');
  await expect(footer).not.toContainText('CC BY');
  await expect(footer).toContainText('© 2026 HPS.GD PTY LTD');
  const links = footer.locator('a[href="https://hps.gd"]');
  await expect(links).toHaveCount(2);
  await expect(footer.getByRole('link', { name: 'a project by hps.gd' })).toHaveAttribute('target', '_blank');
  await expect(footer.getByRole('link', { name: '© 2026 HPS.GD PTY LTD' })).toHaveAttribute('rel', /noopener/);
});

test('five principles lay out without a lone orphan row at 1280px (three then two)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const tops = await page.locator('#principles .principle').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  const rows = [...new Set(tops)].map((t) => tops.filter((x) => x === t).length);
  expect(rows).toEqual([3, 2]);
});
