import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const CAROUSEL = '#how-it-works [data-carousel]';
const current = (page: Page) => page.locator(`${CAROUSEL} .slide.is-current .eyebrow`);

// The carousel only runs while on screen, so every test scrolls it into view first and parks the mouse away from it.
async function open(page: Page) {
  await page.goto('/');
  await page.locator(CAROUSEL).scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
}

test('initially the Cast step is shown and the other three are hidden', async ({ page }) => {
  await open(page);
  await expect(page.locator(`${CAROUSEL} .slide:visible`)).toHaveCount(1);
  await expect(current(page)).toHaveText('Cast');
});

test('clicking the CUE tab shows Cue and makes the dial’s third dot the current one', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Cue' }).click();
  await expect(current(page)).toHaveText('Cue');
  await expect(page.getByRole('tab', { name: 'Cue' })).toHaveAttribute('aria-selected', 'true');
  const dots = page.locator(`${CAROUSEL} .dot`);
  await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator(`${CAROUSEL} .dot[aria-current]`)).toHaveCount(1);
});

test('after 6.1s on screen the shown step advances from Cast to Perform', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.clock.runFor(5000);
  await expect(current(page)).toHaveText('Cast');
  await page.clock.runFor(1100);
  await expect(current(page)).toHaveText('Perform');
});

test('the carousel has no previous, next, pause or play buttons', async ({ page }) => {
  await open(page);
  await expect(page.locator(`${CAROUSEL} button`).filter({ hasText: /pause|play|previous|next|‹|›/i })).toHaveCount(0);
  await expect(page.locator(`${CAROUSEL} [aria-label="Pause"], ${CAROUSEL} [aria-label="Play"], ${CAROUSEL} [aria-label="Next step"], ${CAROUSEL} [aria-label="Previous step"]`)).toHaveCount(0);
});

test('activating a tab shows that step and stops auto-advance: no change after 20s', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.getByRole('tab', { name: 'Perform' }).click();
  await page.mouse.move(0, 0);
  await page.locator('h1').evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(current(page)).toHaveText('Perform');
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Perform');
});

test('clicking a loop-dial dot shows that step and stops auto-advance: no change after 20s', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.locator(`${CAROUSEL} .dot`).nth(3).click();
  await page.mouse.move(0, 0);
  await page.locator('h1').evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(current(page)).toHaveText('Notes');
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Notes');
});

test('left alone, the steps wrap from Notes back to Cast', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.clock.runFor(6100 * 4);
  await expect(current(page)).toHaveText('Cast');
});

test('hovering the carousel stops the steps advancing', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.locator(`${CAROUSEL} .slides`).hover();
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Cast');
});

test('keyboard focus on a control stops the steps advancing', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.getByRole('tab', { name: 'Cast' }).focus();
  await page.keyboard.press('Tab'); // moves to the next control with keyboard focus, still inside the carousel
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Cast');
});

test('with prefers-reduced-motion the carousel does not advance in 20s', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await open(page);
  await page.clock.runFor(20000);
  await expect(current(page)).toHaveText('Cast');
});

test('with prefers-reduced-motion the slide change has no animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  expect(await page.locator(`${CAROUSEL} .slide.is-current`).evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
});

test('the live region is off while rotating and polite once the user has stopped it', async ({ page }) => {
  await open(page);
  const slides = page.locator(`${CAROUSEL} [data-slides]`);
  await expect(slides).toHaveAttribute('aria-live', 'off');
  await page.getByRole('tab', { name: 'Cue' }).click();
  await expect(slides).toHaveAttribute('aria-live', 'polite');
});

test('with JavaScript disabled all four steps are visible and the controls are hidden', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator(`${CAROUSEL} .slide:visible`)).toHaveCount(4);
  await expect(page.locator(`${CAROUSEL} [data-controls]`)).toBeHidden();
  await ctx.close();
});

test('each slide’s scene places the troupe triangle at a different position: left, right, centre, top', async ({ page }) => {
  await page.goto('/');
  const positions = await page.locator(`${CAROUSEL} .scene`).evaluateAll((els) => els.map((e) => e.getAttribute('data-troupe-pos')));
  expect(positions).toEqual(['left', 'right', 'centre', 'top']);
  const troupe = await page.locator(`${CAROUSEL} .scene`).evaluateAll((els) => els.map((e) => e.querySelectorAll('.character--troupe').length));
  expect(troupe).toEqual([1, 1, 1, 1]);
});

test('the scenes are not part of the hero cast, so they never idle-bow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(`${CAROUSEL} [data-cast]`)).toHaveCount(0);
  await expect(page.locator(`${CAROUSEL} .scene`).first().locator('xpath=ancestor::*[@data-cast]')).toHaveCount(0);
});

test('the troupe triangle sits left in Cast, right in Perform, centre in Cue and at the top in Notes', async ({ page }) => {
  await open(page);
  const where: string[] = [];
  for (let i = 0; i < 4; i++) {
    await page.locator(`${CAROUSEL} [data-tab="${i}"]`).click();
    const r = await page.locator(`${CAROUSEL} [data-slide="${i}"] .scene`).evaluate((scene) => {
      const s = scene.getBoundingClientRect();
      const t = scene.querySelector('.character--troupe')!.getBoundingClientRect();
      return { x: (t.left + t.width / 2 - s.left) / s.width, y: (t.top - s.top) / s.height };
    });
    where.push(i === 0 ? (r.x < 0.35 ? 'left' : '?') : i === 1 ? (r.x > 0.65 ? 'right' : '?') : i === 2 ? (r.x > 0.35 && r.x < 0.8 ? 'centre' : '?') : (r.y < 0.15 ? 'top' : '?'));
  }
  expect(where).toEqual(['left', 'right', 'centre', 'top']);
});

test('ArrowRight on the tablist moves to the next tab, and Home, End and ArrowLeft jump or wrap as expected', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Cast' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Perform' })).toBeFocused();
  await expect(current(page)).toHaveText('Perform');
  await page.keyboard.press('End');
  await expect(current(page)).toHaveText('Notes');
  await page.keyboard.press('Home');
  await expect(current(page)).toHaveText('Cast');
  await page.keyboard.press('ArrowLeft');
  await expect(current(page)).toHaveText('Notes');
});

test('only the selected tab is in the tab order (roving tabindex)', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Cue' }).click();
  const idx = await page.locator(`${CAROUSEL} [role="tab"]`).evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex));
  expect(idx).toEqual([-1, -1, 0, -1]);
});

for (const width of [320, 390]) {
  test(`the carousel causes no page-level horizontal scroll at ${width}px, on any step`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(page);
    for (let i = 0; i < 4; i++) {
      await page.locator(`${CAROUSEL} [data-tab="${i}"]`).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });
}
