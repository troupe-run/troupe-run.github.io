# troupe.run site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the troupe.run landing page and `/docs` (Astro + Starlight) in the Matinee brand, tested for
accessibility in light and dark, ready to deploy to GitHub Pages.

**Architecture:**
- **One Astro project.**
  - The landing page is a custom page (`src/pages/index.astro`) built from small section components. Its copy is
    in a `copy` content collection.
  - Starlight serves the docs from `src/content/docs/docs/`, which appears under `/docs/`.
- **Brand tokens** live in one `tokens.css`. Starlight's colour variables are mapped onto them.
- **The brand shapes** (characters, mark, topic icons) are inline-SVG Astro components that read the tokens.
- **Brand images** (favicons, social previews) are rendered from HTML and SVG sources by a Playwright script.

**Tech Stack:**
- Node ≥ 22.12, npm
- astro 7.3.6, @astrojs/starlight 0.42.5, @astrojs/check 0.9.10, typescript 6.0.3
- vitest 5.0.3, @playwright/test 1.63.0, @axe-core/playwright 4.13.0
- Fontsource: bricolage-grotesque, dm-sans, dm-mono
- png-to-ico 3.0.2, linkinator 8.1.0
- GitHub Actions: withastro/action v6.1.3, actions/deploy-pages v5.0.1

**Spec:** `docs/superpowers/specs/2026-10-07-troupe-run-site-design.md`. Brand rules:
`docs/brand-guide.md` (v0.2). Approved mockups (throwaway HTML, for visual reference only):
`.superpowers/brainstorm/89075-1791378489/content/brand-check.html` and `docs-and-loop.html`.

## Global Constraints

- **Repo root:** `/Users/martin/Projects/troupe/troupe-run.github.io`. All paths below are relative to it.
- **Versions:** pin every dependency to the exact versions above (no `^`).
  - If an API named in this plan differs in the pinned version, read the package's own types in `node_modules`,
    adapt, and note the deviation in your report. Don't change versions.
- **Node:** `engines.node` is `">=22.12.0"`. CI uses Node 22.
- **Colour values:** hex colours appear ONLY in `src/styles/tokens.css`, `brand/` sources and
  `scripts/`. Components and pages use `var(--token)` only. Task 2 has a test that enforces this.
- **Tokens:** values are exactly the brand guide's §3 (light and dark), plus these:
  - `--eye: #FFFFFF` in both modes;
  - `--on-accent: #1D1B2F` in both modes;
  - `--tomato-shadow: #CE3D21` in both modes;
  - `--inverse-accent: #FFC93C` (light) / `#CE3D21` (dark).
- **Theme preference:** stored in localStorage under the key `starlight-theme`.
  - The values are `'light'`, `'dark'` or `''` (empty means follow the system), the same semantics as
    Starlight's.
  - Every storage access is wrapped in `try/catch`.
- **Fonts:**
  - Bricolage Grotesque: `--font-display: 'Bricolage Grotesque Variable'`
  - DM Sans: `--font-body: 'DM Sans Variable'`
  - DM Mono: `--font-mono: 'DM Mono'`, weights 400 and 500 only
  - All self-hosted via Fontsource. No requests to Google Fonts.
- **Copy rules:**
  - "troupe" is always lowercase.
  - No exclamation marks.
  - No hype words: revolutionise, supercharge, 10x, "the future of".
  - Never mention predecessor projects.
  - Anything unbuilt is described as intent.
  - Config examples are labelled "illustrative".
- **Motion:** all animation is off under `prefers-reduced-motion: reduce`.
- **Test names** state exactly what the assertions check, and no more. Don't name a test "is accessible" if it
  only checks a role.
- **Never** push to `origin`, change GitHub repo settings or create GitHub repos. Task 10 does those things,
  and only with the owner's explicit go-ahead.
- **Write files incrementally:** save each file as soon as it's drafted.
- **Commit at the end of every task** with a message ending in:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g
  ```

## Review Focus

These failure modes are implied by the spec but aren't covered by the main tests. Each has its test in the task
named.

1. **No JavaScript** (some readers, some bots). The landing page still renders every section, and the theme
   follows the system setting through the media query. *Task 4, Step 1, test "renders all sections with
   JavaScript disabled".*
2. **localStorage throws** (Safari private mode, blocked site data). The landing page and the toggle raise no
   page errors, and the theme falls back to the system setting. *Task 2, test "landing page raises no errors
   when localStorage throws".*
3. **A garbage stored theme value** (for example `"blue"` from an old build). The landing page treats it as
   "system". *Task 2, test "an unknown stored theme value follows the system scheme".*
4. **`/docs`, `/docs/` and unknown URLs.** `/docs/` lands on "What is troupe?". An unknown path serves the
   Starlight 404 page with a way home. *Task 6, tests "/docs/ redirects to What is troupe?" and "an unknown
   URL shows the 404 page with a link home".*
5. **Wide tables at 320px** (Licensing, Glossary). The page itself never scrolls sideways; the table scrolls
   inside its own box. *Task 6, test "glossary at 320px has no page-level horizontal scroll".*

## File Structure

```
package.json, package-lock.json   scripts + pinned deps
astro.config.mjs                  Astro + Starlight config (site, sidebar, editLink, overrides, redirects)
tsconfig.json                     extends astro/tsconfigs/strict
playwright.config.ts              e2e against `astro preview` on :4321
vitest.config.ts                  unit tests (node environment)
.nvmrc                            22
src/content.config.ts             collections: docs (extended schema), i18n, copy
src/content/i18n/en.json          "Improve this page" label
src/content/copy/*.md             landing-page copy, one file per section (owner reviews these)
src/content/docs/docs/**          docs pages (served at /docs/…)
src/lib/copy.ts                   getCopy(section) typed accessor
src/styles/tokens.css             ALL colour/type tokens (light + dark)
src/styles/global.css             landing-page base styles
src/styles/starlight.css          maps --sl-* onto tokens; sidebar label style
src/layouts/Landing.astro         <html> shell for the landing page (head, theme script, analytics)
src/components/
  Analytics.astro                 GoatCounter tag, production only
  ThemeToggle.astro               System/Light/Dark select sharing Starlight's key
  CastDefs.astro                  shared SVG gradient defs for character reflections
  Character.astro                 human | agent | troupe, eyes + reflection + bow
  Mark.astro                      mark (circle, triangle, square) ± wordmark
  TopicIcon.astro                 line icons in a faint-bordered tile
  sections/Header.astro, Hero.astro, Problem.astro, HowItWorks.astro,
  sections/Principles.astro, ClosingCta.astro, Footer.astro
  docs/MarkdownContent.astro      Starlight override: status notes above page content
  docs/Head.astro                 Starlight override: default head + Analytics
src/scripts/cast-idle.ts          idle-bow controller (pure, unit-tested)
src/pages/index.astro             landing page
brand/                            asset sources (SVG + HTML templates), out/ for GitHub-only renders
scripts/render-assets.mjs         renders brand/ → public/ and brand/out/, writes manifest
scripts/verify-assets.mjs         CI check: outputs exist, sizes right, manifest matches sources
public/CNAME                      troupe.run
tests/unit/*.test.ts              vitest
tests/e2e/*.spec.ts               playwright
.github/workflows/ci.yml, deploy.yml, links-weekly.yml
CONTRIBUTING.md
```

---
### Task 1: Scaffold Astro + Starlight with test tooling

**Files:**
- Create: `package.json`, `.nvmrc`, `tsconfig.json`, `astro.config.mjs`, `src/content.config.ts`,
  `src/lib/topic-icons.ts`,
  `src/content/i18n/en.json`, `src/content/docs/docs/programme/what-is-troupe.md` (placeholder body, rewritten
  in Task 6), `src/pages/index.astro` (placeholder, replaced in Task 4), `playwright.config.ts`,
  `vitest.config.ts`, `public/CNAME`
- Modify: `.gitignore`
- Test: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces:
  - npm scripts `dev`, `build`, `preview`, `check`, `test:unit`, `test:e2e`, `assets:render`, `assets:verify`
    and `linkcheck`, used by every later task and by CI;
  - collections `docs`, with frontmatter `status: 'written' | 'planned'` (default `'planned'`),
    `prerelease: boolean` (default `true`) and `purpose?: string`;
  - collection `i18n`;
  - collection `copy`, with a schema discriminated on `section`.

- [ ] **Step 1: Write `package.json`, then install**

```json
{
  "name": "troupe-run-site",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview --port 4321",
    "check": "astro check",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "assets:render": "node scripts/render-assets.mjs",
    "assets:verify": "node scripts/verify-assets.mjs",
    "linkcheck": "linkinator dist --recurse --skip \"^https?://\""
  },
  "dependencies": {
    "astro": "7.3.6",
    "@astrojs/starlight": "0.42.5",
    "@fontsource-variable/bricolage-grotesque": "5.3.0",
    "@fontsource-variable/dm-sans": "5.3.0",
    "@fontsource/dm-mono": "5.3.0"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "typescript": "6.0.3",
    "vitest": "5.0.3",
    "@playwright/test": "1.63.0",
    "@axe-core/playwright": "4.13.0",
    "png-to-ico": "3.0.2",
    "linkinator": "8.1.0"
  }
}
```

Run: `npm install && npx playwright install chromium`
Expected: installs without peer-dependency errors; `package-lock.json` created.

- [ ] **Step 2: Write config files**

`.nvmrc`:
```
22
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`astro.config.mjs` (sidebar is completed in Task 6; overrides and customCss are added in Tasks 2, 6 and 9):
```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://troupe.run',
  trailingSlash: 'always',
  redirects: { '/docs': '/docs/programme/what-is-troupe/' },
  integrations: [
    starlight({
      title: 'troupe docs',
      editLink: { baseUrl: 'https://github.com/troupe-run/troupe-run.github.io/edit/main/' },
      lastUpdated: true,
      sidebar: [
        { label: 'Programme', items: [{ slug: 'docs/programme/what-is-troupe' }] },
      ],
    }),
  ],
});
```

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

const link = z.object({ label: z.string(), href: z.string() });
const cta = z.object({ label: z.string(), href: z.string().optional() });
import { TOPIC_ICONS } from './lib/topic-icons';

const copySchema = z.discriminatedUnion('section', [
  z.object({ section: z.literal('header'), status: z.string(), nav: z.array(link).min(1) }),
  z.object({
    section: z.literal('hero'),
    eyebrow: z.string(), title: z.string(), subtitle: z.string(),
    primary: cta.extend({ href: z.string().url() }), secondary: cta, badge: z.string(),
  }),
  z.object({
    section: z.literal('problem'),
    eyebrow: z.string(), title: z.string(),
    cards: z.array(z.object({ title: z.string(), body: z.string() })).length(4),
  }),
  z.object({
    section: z.literal('how'),
    eyebrow: z.string(), title: z.string(), intro: z.string(), loop: z.string(),
    steps: z.array(z.object({ label: z.string(), title: z.string(), body: z.string() })).length(4),
  }),
  z.object({
    section: z.literal('principles'),
    eyebrow: z.string(), title: z.string(), intro: z.string(),
    items: z.array(z.object({ icon: z.enum(TOPIC_ICONS), title: z.string(), body: z.string() })).length(6),
  }),
  z.object({
    section: z.literal('closing'),
    title: z.string(), body: z.string(), cta: cta.extend({ href: z.string().url() }),
  }),
  z.object({
    section: z.literal('footer'),
    attribution: z.string(), privacy: z.string(), licence: z.string(), copyright: z.string(),
    links: z.array(link),
  }),
]);

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        status: z.enum(['written', 'planned']).default('planned'),
        prerelease: z.boolean().default(true),
        purpose: z.string().optional(),
      }),
    }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  copy: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/copy' }), schema: copySchema }),
};
```

`src/lib/topic-icons.ts` (kept out of `content.config.ts` so unit tests can import it without `astro:content`):
```ts
export const TOPIC_ICONS = ['repo', 'role', 'research', 'record', 'edit', 'plug'] as const;
export type TopicIconName = (typeof TOPIC_ICONS)[number];
```

`src/content/i18n/en.json`:
```json
{ "page.editLink": "Improve this page" }
```

`src/content/docs/docs/programme/what-is-troupe.md` (placeholder; Task 6 writes the real page):
```md
---
title: What is troupe?
status: written
---

troupe runs your development process with agents and people in named roles.
```

`src/pages/index.astro` (placeholder; Task 4 replaces it):
```astro
---
---
<html lang="en"><head><meta charset="utf-8" /><title>troupe</title></head>
<body><h1>troupe</h1></body></html>
```

`public/CNAME`:
```
troupe.run
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4321', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

`vitest.config.ts`:
```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
```

Append to `.gitignore`:
```
node_modules/
dist/
.astro/
test-results/
playwright-report/
```

- [ ] **Step 3: Write the failing smoke test**

`tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('landing page responds 200 with an h1', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
});

test('docs page "What is troupe?" renders under /docs/', async ({ page }) => {
  const res = await page.goto('/docs/programme/what-is-troupe/');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'What is troupe?' })).toBeVisible();
});

test('docs page edit link is labelled "Improve this page"', async ({ page }) => {
  await page.goto('/docs/programme/what-is-troupe/');
  await expect(page.getByRole('link', { name: 'Improve this page' })).toBeVisible();
});
```

- [ ] **Step 4: Run the tests to verify they fail, then pass**

Before Step 2's files exist the build fails. Run once the files are in place:
`npm run check && npm run test:e2e -- smoke.spec.ts`
Expected: `astro check` reports 0 errors; 3 passed.
If the edit-link label test fails, the i18n override isn't wired: confirm `src/content/i18n/en.json` exists and
the `i18n` collection is defined, then re-read `@astrojs/starlight` types for the i18n collection shape.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Scaffold Astro 7 + Starlight 0.42 with Playwright and Vitest

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g"
```

---

### Task 2: Tokens, fonts and the shared theme preference

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/starlight.css`,
  `src/components/ThemeToggle.astro`, `src/layouts/Landing.astro`
- Modify: `astro.config.mjs` (customCss), `src/pages/index.astro` (use the layout)
- Test: `tests/unit/token-discipline.test.ts`, `tests/e2e/theme.spec.ts`

**Interfaces:**
- Consumes: Task 1 scripts.
- Produces:
  - CSS custom properties: `--bg --surface --ink --muted --line --soft --eye --on-accent --tomato
    --tomato-text --tomato-shadow --teal --teal-text --lilac --lilac-text --sunflower --inverse-accent
    --font-display --font-body --font-mono`;
  - `Landing.astro`, with props `{ title: string; description: string }` and a default slot;
  - `ThemeToggle.astro`, with no props, rendering `<select aria-label="Theme" data-theme-toggle>` with options
    `auto | light | dark`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/token-discipline.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;

describe('token discipline', () => {
  it('no hex colour literal appears in src/components, src/pages or src/layouts', () => {
    const offenders: string[] = [];
    for (const f of [...files('src/components'), ...files('src/pages'), ...files('src/layouts')]) {
      const text = readFileSync(f, 'utf8')
        .replace(/href="#[^"]*"/g, '')     // in-page anchors
        .replace(/url\(#[^)]*\)/g, '');    // SVG paint-server references
      for (const m of text.matchAll(HEX)) offenders.push(`${f}: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
  });
});
```

`tests/e2e/theme.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const theme = (page) => page.evaluate(() => document.documentElement.dataset.theme);

test('with nothing stored, the landing page follows a dark system scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  expect(await theme(page)).toBe('dark');
});

test('with nothing stored, the landing page follows a light system scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await theme(page)).toBe('light');
});

test('choosing Dark on the landing page persists across reload and into the docs', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.locator('[data-theme-toggle]').selectOption('dark');
  expect(await theme(page)).toBe('dark');
  await page.reload();
  expect(await theme(page)).toBe('dark');
  await page.goto('/docs/programme/what-is-troupe/');
  expect(await theme(page)).toBe('dark');
});

test('choosing Light in the docs theme select carries back to the landing page', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/programme/what-is-troupe/');
  await page.locator('starlight-theme-select select').first().selectOption('light');
  await page.goto('/');
  expect(await theme(page)).toBe('light');
  await expect(page.locator('[data-theme-toggle]')).toHaveValue('light');
});

test('an unknown stored theme value follows the system scheme', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('starlight-theme', 'blue'));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await theme(page)).toBe('light');
  await expect(page.locator('[data-theme-toggle]')).toHaveValue('auto');
});

test('landing page raises no errors when localStorage throws', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.locator('[data-theme-toggle]').selectOption('light');
  expect(errors).toEqual([]);
  expect(await theme(page)).toBe('light');
});

test('body background uses --bg in each theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(light).toBe('rgb(255, 248, 238)');
  await page.locator('[data-theme-toggle]').selectOption('dark');
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(dark).toBe('rgb(26, 24, 48)');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:e2e -- theme.spec.ts`
Expected: FAIL. There's no `[data-theme-toggle]`, and the theme is undefined.

- [ ] **Step 3: Implement the tokens and styles**

`src/styles/tokens.css`:
```css
:root {
  color-scheme: light;
  --bg: #FFF8EE; --surface: #FFFFFF; --ink: #1D1B2F; --muted: #4A4760;
  --line: #1D1B2F14; --soft: #1D1B2F33; --eye: #FFFFFF; --on-accent: #1D1B2F;
  --tomato: #FF5A3C; --tomato-text: #CE3D21; --tomato-shadow: #CE3D21;
  --teal: #14857D; --teal-text: #137E76;
  --lilac: #7461D9; --lilac-text: #715ED8;
  --sunflower: #FFC93C; --inverse-accent: #FFC93C;
  --font-display: 'Bricolage Grotesque Variable', system-ui, sans-serif;
  --font-body: 'DM Sans Variable', system-ui, sans-serif;
  --font-mono: 'DM Mono', ui-monospace, monospace;
}
:root[data-theme='dark'] {
  color-scheme: dark;
  --bg: #1A1830; --surface: #24213F; --ink: #FFF4E2; --muted: #C9C2D8;
  --line: #FFF4E21C; --soft: #FFF4E23D;
  --tomato-text: #FF8E76; --teal-text: #3CC7BC; --lilac-text: #A79AF0;
  --inverse-accent: #CE3D21;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    color-scheme: dark;
    --bg: #1A1830; --surface: #24213F; --ink: #FFF4E2; --muted: #C9C2D8;
    --line: #FFF4E21C; --soft: #FFF4E23D;
    --tomato-text: #FF8E76; --teal-text: #3CC7BC; --lilac-text: #A79AF0;
    --inverse-accent: #CE3D21;
  }
}
```

`src/styles/global.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font-family: var(--font-body); font-size: 16px; line-height: 1.55;
}
a { color: var(--tomato-text); }
:focus-visible { outline: 3px solid var(--tomato-text); outline-offset: 2px; }
.wrap { max-width: 1120px; margin: 0 auto; padding: 0 16px; }
.eyebrow {
  font-family: var(--font-mono); font-weight: 400; font-size: 12px; letter-spacing: .06em;
  text-transform: uppercase; color: var(--tomato-text);
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 800; letter-spacing: -.02em; line-height: 1.1; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

`src/styles/starlight.css` (unlayered, so it beats Starlight's `@layer starlight.base`):
```css
:root, :root[data-theme='light'], :root[data-theme='dark'] {
  --sl-font: var(--font-body);
  --sl-font-mono: var(--font-mono);
  --sl-color-white: var(--ink);
  --sl-color-gray-1: color-mix(in srgb, var(--ink) 90%, var(--bg));
  --sl-color-gray-2: color-mix(in srgb, var(--ink) 80%, var(--bg));
  --sl-color-gray-3: var(--muted);
  --sl-color-gray-4: color-mix(in srgb, var(--ink) 45%, var(--bg));
  --sl-color-gray-5: color-mix(in srgb, var(--ink) 18%, var(--bg));
  --sl-color-gray-6: color-mix(in srgb, var(--ink) 7%, var(--bg));
  --sl-color-gray-7: color-mix(in srgb, var(--ink) 3%, var(--bg));
  --sl-color-black: var(--bg);
  --sl-color-accent-low: color-mix(in srgb, var(--tomato) 18%, var(--bg));
  --sl-color-accent: var(--tomato-text);
  --sl-color-accent-high: var(--tomato-text);
  --sl-color-text: var(--ink);
  --sl-color-text-accent: var(--tomato-text);
  --sl-color-bg: var(--bg);
  --sl-color-bg-nav: var(--surface);
  --sl-color-bg-sidebar: var(--surface);
}
.sl-markdown-content h1, .sl-markdown-content h2, .sl-markdown-content h3, h1#_top {
  font-family: var(--font-display); font-weight: 800; letter-spacing: -.02em;
}
```

- [ ] **Step 4: Implement the layout and the toggle**

`src/layouts/Landing.astro`:
```astro
---
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import '../styles/tokens.css';
import '../styles/global.css';
interface Props { title: string; description: string }
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)} />
    <script is:inline>
      (() => {
        let stored = null;
        try { stored = localStorage.getItem('starlight-theme'); } catch {}
        const theme = stored === 'light' || stored === 'dark'
          ? stored
          : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.dataset.theme = theme;
      })();
    </script>
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

`src/components/ThemeToggle.astro`:
```astro
---
---
<label class="theme-toggle">
  <span class="visually-hidden">Theme</span>
  <select aria-label="Theme" data-theme-toggle>
    <option value="auto">System</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</label>
<script>
  const KEY = 'starlight-theme';
  const read = (): 'auto' | 'light' | 'dark' => {
    try {
      const v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : 'auto';
    } catch { return 'auto'; }
  };
  const write = (v: string) => { try { localStorage.setItem(KEY, v === 'auto' ? '' : v); } catch {} };
  const systemLight = matchMedia('(prefers-color-scheme: light)');
  const apply = (v: string) => {
    document.documentElement.dataset.theme = v === 'auto' ? (systemLight.matches ? 'light' : 'dark') : v;
  };
  for (const select of document.querySelectorAll<HTMLSelectElement>('[data-theme-toggle]')) {
    select.value = read();
    select.addEventListener('change', () => { write(select.value); apply(select.value); });
  }
  systemLight.addEventListener('change', () => { if (read() === 'auto') apply('auto'); });
</script>
<style>
  select {
    font: inherit; font-size: 14px; color: var(--ink); background: var(--surface);
    border: 2px solid var(--soft); border-radius: 10px; padding: 4px 8px;
  }
</style>
```

`src/pages/index.astro` (still a placeholder body; Task 4 builds the sections):
```astro
---
import Landing from '../layouts/Landing.astro';
import ThemeToggle from '../components/ThemeToggle.astro';
---
<Landing title="troupe" description="Agents and people in named roles, running your development process.">
  <main class="wrap"><h1>troupe</h1><ThemeToggle /></main>
</Landing>
```

In `astro.config.mjs`, inside `starlight({...})`, add:
```js
      customCss: [
        '@fontsource-variable/bricolage-grotesque',
        '@fontsource-variable/dm-sans',
        '@fontsource/dm-mono/400.css',
        '@fontsource/dm-mono/500.css',
        './src/styles/tokens.css',
        './src/styles/starlight.css',
      ],
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit && npm run test:e2e -- theme.spec.ts smoke.spec.ts`
Expected: unit 1 passed; e2e 10 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Brand tokens, fonts and a theme preference shared with Starlight

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g"
```

---
### Task 3: Brand shapes as components (characters, mark, topic icons)

**Files:**
- Create: `src/components/CastDefs.astro`, `src/components/Character.astro`, `src/components/Mark.astro`,
  `src/components/TopicIcon.astro`
- Test: `tests/unit/brand-components.test.ts`

**Interfaces:**
- Consumes: the tokens from Task 2 (`--lilac`, `--teal`, `--tomato`, `--eye`, `--soft`, `--surface`,
  `--tomato-text`, `--font-display`), and `TOPIC_ICONS` from `src/lib/topic-icons.ts`.
- Produces:
  - `CastDefs.astro`, with no props. Render it once per page that shows characters. It defines the gradients
    `#cast-fade-human`, `#cast-fade-agent` and `#cast-fade-troupe`.
  - `Character.astro`, with props `{ kind: 'human' | 'agent' | 'troupe'; size?: number /* px width, default 56 */ }`.
    It renders `<svg class="character character--{kind}" data-kind="{kind}">`. The hover bow and the
    `.is-bowing` class both apply `transform: translateY(-6px) rotate(-6deg)`.
  - `Mark.astro`, with props `{ wordmark?: boolean /* default false */; height?: number /* default 20 */ }`.
  - `TopicIcon.astro`, with props `{ name: TopicIconName }`. It throws `Error('Unknown topic icon:
    <name>')` for anything else.

- [ ] **Step 1: Write the failing tests**

`tests/unit/brand-components.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Character from '../../src/components/Character.astro';
import Mark from '../../src/components/Mark.astro';
import TopicIcon from '../../src/components/TopicIcon.astro';
import CastDefs from '../../src/components/CastDefs.astro';
import { TOPIC_ICONS } from '../../src/lib/topic-icons';

let c: AstroContainer;
beforeAll(async () => { c = await AstroContainer.create(); });
const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe('Character', () => {
  for (const [kind, headTag] of [['human', '<circle'], ['agent', '<rect'], ['troupe', '<path']] as const) {
    it(`${kind}: head and reflection use the ${headTag.slice(1)} shape, and both eyes are circles`, async () => {
      const html = await c.renderToString(Character, { props: { kind } });
      expect(html).toContain(`data-kind="${kind}"`);
      const head = html.split('class="head"')[1].split('</g>')[0];
      const refl = html.split('class="reflection"')[1].split('</g>')[0];
      expect(head).toContain(headTag);
      expect(refl).toContain(headTag);
      expect(count(html, /class="eye"/g)).toBe(2);
      expect(count(html, /<circle[^>]*class="eye"/g)).toBe(2);
    });
  }
  it('reflection is flipped below the head (scale(1,-1))', async () => {
    const html = await c.renderToString(Character, { props: { kind: 'human' } });
    expect(html).toMatch(/class="reflection"[^>]*transform="translate\(0,82\) scale\(1,-1\)"/);
  });
  it('size sets width and keeps the 56:70 aspect', async () => {
    const html = await c.renderToString(Character, { props: { kind: 'agent', size: 112 } });
    expect(html).toContain('width="112"');
    expect(html).toContain('height="140"');
  });
});

describe('CastDefs', () => {
  it('defines one fade gradient per kind, fading to opacity 0 at offset 0.75', async () => {
    const html = await c.renderToString(CastDefs);
    for (const k of ['human', 'agent', 'troupe']) expect(html).toContain(`id="cast-fade-${k}"`);
    expect(count(html, /offset="0\.75"/g)).toBe(3);
  });
});

describe('Mark', () => {
  it('draws circle, triangle, square in that order, each with two circular eyes', async () => {
    const html = await c.renderToString(Mark);
    const iCircle = html.indexOf('class="mark-human"');
    const iTri = html.indexOf('class="mark-troupe"');
    const iSq = html.indexOf('class="mark-agent"');
    expect(iCircle).toBeGreaterThan(-1);
    expect(iCircle).toBeLessThan(iTri);
    expect(iTri).toBeLessThan(iSq);
    expect(count(html, /<circle[^>]*class="eye"/g)).toBe(6);
  });
  it('shows the wordmark "troupe" only when asked', async () => {
    expect(await c.renderToString(Mark)).not.toContain('>troupe<');
    expect(await c.renderToString(Mark, { props: { wordmark: true } })).toContain('>troupe<');
  });
});

describe('TopicIcon', () => {
  for (const name of TOPIC_ICONS) {
    it(`renders "${name}" as a stroked line icon inside a tile`, async () => {
      const html = await c.renderToString(TopicIcon, { props: { name } });
      expect(html).toContain('class="topic-icon"');
      expect(html).toContain('stroke="currentColor"');
    });
  }
  it('throws for an unknown icon name', async () => {
    await expect(c.renderToString(TopicIcon, { props: { name: 'nope' } })).rejects.toThrow('Unknown topic icon: nope');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- brand-components`
Expected: FAIL, because the component imports can't be resolved.

- [ ] **Step 3: Implement**

`src/components/CastDefs.astro`:
```astro
---
const kinds = [['human', 'lilac'], ['agent', 'teal'], ['troupe', 'tomato']] as const;
---
<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
  <defs>
    {kinds.map(([kind, colour]) => (
      <linearGradient id={`cast-fade-${kind}`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" style={`stop-color: var(--${colour}); stop-opacity: .45`} />
        <stop offset="0.75" style={`stop-color: var(--${colour}); stop-opacity: 0`} />
      </linearGradient>
    ))}
  </defs>
</svg>
```

The gradient runs bottom-to-top in the shape's own coordinates. The reflection group is flipped, so on screen
it fades top-to-bottom, reaching transparent at 75% of the reflection's height.

`src/components/Character.astro`:
```astro
---
interface Props { kind: 'human' | 'agent' | 'troupe'; size?: number }
const { kind, size = 56 } = Astro.props;
const height = Math.round((size * 70) / 56);
const HEAD = {
  human: '<circle cx="28" cy="22" r="18" />',
  agent: '<rect x="10" y="4" width="36" height="36" rx="10" />',
  troupe: '<path d="M28 7.2 L44.86 36.4 L11.14 36.4 Z" stroke-width="7" stroke-linejoin="round" />',
} as const;
const EYES = {
  human: [[22, 20], [34, 20]],
  agent: [[22, 20.5], [34, 20.5]],
  troupe: [[23, 26.5], [33, 26.5]],
} as const;
---
<svg class={`character character--${kind}`} data-kind={kind} width={size} height={height}
     viewBox="0 0 56 70" aria-hidden="true" focusable="false">
  <g class="reflection" transform="translate(0,82) scale(1,-1)" set:html={HEAD[kind]} />
  <g class="head" set:html={HEAD[kind]} />
  {EYES[kind].map(([cx, cy]) => <circle class="eye" cx={cx} cy={cy} r="2.6" />)}
</svg>
<style>
  .character { overflow: visible; transition: transform .2s ease; transform-origin: 50% 60%; }
  .character:hover, .character:global(.is-bowing) { transform: translateY(-6px) rotate(-6deg); }
  .character--human { --c: var(--lilac); --g: url(#cast-fade-human); }
  .character--agent { --c: var(--teal); --g: url(#cast-fade-agent); }
  .character--troupe { --c: var(--tomato); --g: url(#cast-fade-troupe); }
  .head :global(*) { fill: var(--c); }
  .character--troupe .head :global(*) { stroke: var(--c); }
  .reflection :global(*) { fill: var(--g); }
  .character--troupe .reflection :global(*) { stroke: var(--g); }
  .eye { fill: var(--eye); }
  @media (prefers-reduced-motion: reduce) {
    .character, .character:hover, .character:global(.is-bowing) { transition: none; transform: none; }
  }
</style>
```

`src/components/Mark.astro`:
```astro
---
interface Props { wordmark?: boolean; height?: number }
const { wordmark = false, height = 20 } = Astro.props;
const width = Math.round((height * 49) / 20);
---
<span class="mark">
  <svg width={width} height={height} viewBox="0 0 49 20" aria-hidden="true" focusable="false">
    <circle class="mark-human" cx="7" cy="12" r="7" />
    <circle class="eye" cx="4.9" cy="11.2" r="1.05" /><circle class="eye" cx="9.1" cy="11.2" r="1.05" />
    <path class="mark-troupe" d="M24.5 5.6 L31.78 18.2 L17.22 18.2 Z" stroke-width="2" stroke-linejoin="round" />
    <circle class="eye" cx="22.7" cy="14.6" r="1.1" /><circle class="eye" cx="26.3" cy="14.6" r="1.1" />
    <rect class="mark-agent" x="34.8" y="5" width="14" height="14" rx="4" />
    <circle class="eye" cx="38.8" cy="11.3" r="1.1" /><circle class="eye" cx="44.8" cy="11.3" r="1.1" />
  </svg>
  {wordmark && <span class="wordmark">troupe</span>}
</span>
<style>
  .mark { display: inline-flex; align-items: center; gap: .4em; }
  .mark-human { fill: var(--lilac); }
  .mark-troupe { fill: var(--tomato); stroke: var(--tomato); }
  .mark-agent { fill: var(--teal); }
  .eye { fill: var(--eye); }
  .wordmark { font-family: var(--font-display); font-weight: 800; font-size: 1.5em; letter-spacing: -.02em; color: var(--ink); }
</style>
```

`src/components/TopicIcon.astro`:
```astro
---
import type { TopicIconName } from '../lib/topic-icons';
interface Props { name: TopicIconName | string }
const PATHS: Record<string, string> = {
  repo: '<path d="M3 7h6l2 2h10v10H3z"/><path d="M8 14h8"/>',
  role: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 17c1-2.2 6-2.2 7 0"/>',
  research: '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/>',
  record: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 16h4"/><path d="M14 17.5l1.5 1.5 3-3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  plug: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
};
const { name } = Astro.props;
if (!(name in PATHS)) throw new Error(`Unknown topic icon: ${name}`);
---
<span class="topic-icon">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" set:html={PATHS[name]} />
</span>
<style>
  .topic-icon {
    display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px;
    border-radius: 10px; background: var(--surface); border: 2px solid var(--soft); color: var(--tomato-text);
  }
</style>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:unit`
Expected: all pass (16 in brand-components, plus token discipline).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Brand shapes as components: characters, mark, topic icons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g"
```

---
### Task 4: Landing page sections and their copy

**Files:**
- Create:
  - `src/lib/copy.ts`;
  - `src/content/copy/{header,hero,problem,how,principles,closing,footer}.md`;
  - `src/components/sections/{Header,Hero,Problem,HowItWorks,Principles,ClosingCta,Footer}.astro`.
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/landing.spec.ts`

**Interfaces:**
- Consumes:
  - `Landing.astro` and `ThemeToggle.astro` (Task 2);
  - `CastDefs`, `Character`, `Mark` and `TopicIcon` (Task 3);
  - the `copy` collection (Task 1).
- Produces:
  - `getCopy(section)`, typed by section;
  - section anchors `#top`, `#problem`, `#how-it-works`, `#principles` and `#follow`;
  - the hero cast as `<div class="cast" data-cast>`, containing five `Character` elements in the order
    human, agent, troupe, agent, human. Task 5 drives this.

- [ ] **Step 1: Write the failing tests**

`tests/e2e/landing.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const SECTIONS = ['#top', '#problem', '#how-it-works', '#principles', '#follow'];
const REPO = 'https://github.com/troupe-run/troupe.run';

test('renders header, all five sections and the footer', async ({ page }) => {
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:e2e -- landing.spec.ts`
Expected: FAIL, because the sections don't exist yet.

- [ ] **Step 3: Write the copy files (drafts for the owner's review in Task 10)**

`src/content/copy/header.md`:
```md
---
section: header
status: "pre-alpha · building in the open"
nav:
  - { label: "How it works", href: "/#how-it-works" }
  - { label: "Principles", href: "/#principles" }
  - { label: "Docs", href: "/docs/" }
  - { label: "GitHub", href: "https://github.com/troupe-run/troupe.run" }
---
```

`src/content/copy/hero.md`:
```md
---
section: hero
eyebrow: "For agents and the people who run them"
title: "Your agents need a director."
subtitle: "troupe runs your development process with agents and people in named roles. Work branches and loops, decisions go to whoever owns them, and every change records who made it."
primary: { label: "★ Watch on GitHub", href: "https://github.com/troupe-run/troupe.run" }
secondary: { label: "Install: coming" }
badge: "pre-alpha · Oct 2026"
---
```

`src/content/copy/problem.md`:
```md
---
section: problem
eyebrow: "The problem"
title: "Agents work alone, in a line, and ask one person everything."
cards:
  - { title: "One agent, one line", body: "Work runs in a single thread, step after step." }
  - { title: "One bottleneck", body: "Every question goes to “the human”." }
  - { title: "No homework", body: "Questions arrive with no research done." }
  - { title: "No record", body: "Nobody can say who decided what." }
---
```

`src/content/copy/how.md`:
```md
---
section: how
eyebrow: "How the show runs"
title: "A long run, not one night."
intro: "Your process runs again and again. Each run gets better."
loop: "↺ and again, every showing"
steps:
  - { label: "Cast", title: "Assign the roles", body: "Agents and people, set in config in your repo." }
  - { label: "Perform", title: "Run the work", body: "Tasks fork, join, swarm and loop. Not one agent in a line." }
  - { label: "Cue", title: "Call the right person", body: "Decisions go to whoever owns them, with the research done." }
  - { label: "Notes", title: "Improve the next run", body: "Every run is recorded. What went wrong changes the next one." }
---
```

`src/content/copy/principles.md`:
```md
---
section: principles
eyebrow: "Principles"
title: "What we’re building toward."
intro: "These are commitments, not shipped features. troupe is pre-alpha."
items:
  - { icon: repo, title: "Local-first, everything in your repo", body: "Config, history and decisions live in git, on your machine. No hosted service required." }
  - { icon: role, title: "Humans are roles, not a loop", body: "People hold roles the same way agents do, so a question goes to the person who owns it, not whoever is watching." }
  - { icon: research, title: "Escalation that does its homework", body: "Before an agent asks, it checks the issues, reads the docs and researches the standard, then brings a decision brief." }
  - { icon: record, title: "Lineage from the first event", body: "Every change records who made it, human or agent, who approved it, and when." }
  - { icon: edit, title: "Config that survives hand-editing", body: "It’s plain YAML. Edit it by hand and troupe keeps your formatting and comments." }
  - { icon: plug, title: "Bring your own agent", body: "Swap Claude Code for another agent without rewriting the process." }
---
```

`src/content/copy/closing.md`:
```md
---
section: closing
title: "Follow the build."
body: "troupe is being built in the open. Watch the repo to see it take shape."
cta: { label: "★ Watch on GitHub", href: "https://github.com/troupe-run/troupe.run" }
---
```

`src/content/copy/footer.md`:
```md
---
section: footer
attribution: "a project by hps.gd"
privacy: "No cookies. Cookieless page counts via GoatCounter."
licence: "Site code MIT · content CC BY 4.0"
copyright: "© 2026 HPS.GD PTY LTD"
links:
  - { label: "Docs", href: "/docs/" }
  - { label: "GitHub", href: "https://github.com/troupe-run" }
  - { label: "Site source", href: "https://github.com/troupe-run/troupe-run.github.io" }
---
```

- [ ] **Step 4: Implement `getCopy` and the sections**

`src/lib/copy.ts`:
```ts
import { getEntry, type CollectionEntry } from 'astro:content';

type CopyData = CollectionEntry<'copy'>['data'];
type Section = CopyData['section'];

export async function getCopy<S extends Section>(section: S): Promise<Extract<CopyData, { section: S }>> {
  const entry = await getEntry('copy', section);
  if (!entry || entry.data.section !== section) throw new Error(`Missing copy for section: ${section}`);
  return entry.data as Extract<CopyData, { section: S }>;
}
```

`src/components/sections/Header.astro`:
```astro
---
import Mark from '../Mark.astro';
import ThemeToggle from '../ThemeToggle.astro';
import { getCopy } from '../../lib/copy';
const copy = await getCopy('header');
---
<header class="site-header">
  <div class="wrap bar">
    <a class="home" href="/" aria-label="troupe home"><Mark wordmark height={20} /></a>
    <nav aria-label="Main">
      <ul>{copy.nav.map((l) => <li><a href={l.href}>{l.label}</a></li>)}</ul>
    </nav>
    <div class="tools">
      <span class="pill">{copy.status}</span>
      <ThemeToggle />
    </div>
  </div>
</header>
<style>
  .bar { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; justify-content: space-between; padding-block: 14px; }
  .home { text-decoration: none; }
  ul { display: flex; flex-wrap: wrap; gap: 4px 16px; list-style: none; margin: 0; padding: 0; }
  nav a { color: var(--ink); text-decoration: none; font-size: 15px; }
  nav a:hover { color: var(--tomato-text); text-decoration: underline; }
  .tools { display: flex; gap: 10px; align-items: center; }
  .pill { font-family: var(--font-mono); font-size: 12px; background: var(--sunflower); color: var(--on-accent); padding: 3px 8px; border-radius: 6px; }
</style>
```

`src/components/sections/Hero.astro`:
```astro
---
import CastDefs from '../CastDefs.astro';
import Character from '../Character.astro';
import { getCopy } from '../../lib/copy';
const copy = await getCopy('hero');
const cast = ['human', 'agent', 'troupe', 'agent', 'human'] as const;
---
<section id="top" class="hero">
  <div class="wrap">
    <CastDefs />
    <div class="cast" data-cast>{cast.map((k) => <Character kind={k} />)}</div>
    <p class="eyebrow">{copy.eyebrow}</p>
    <h1>{copy.title}</h1>
    <p class="sub">{copy.subtitle}</p>
    <div class="ctas">
      <a class="btn primary" href={copy.primary.href}>{copy.primary.label}</a>
      <button class="btn secondary" type="button" disabled>{copy.secondary.label}</button>
    </div>
    <p><span class="badge">{copy.badge}</span></p>
  </div>
</section>
<style>
  .hero { text-align: center; padding: 32px 0 40px;
    background: radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb, var(--sunflower) 22%, transparent), transparent 70%); }
  .cast { display: flex; justify-content: center; align-items: flex-end; gap: 18px; margin-bottom: 8px; }
  @media (max-width: 479px) { .cast > :global(.character:first-child), .cast > :global(.character:last-child) { display: none; } }
  h1 { font-size: clamp(32px, 7vw, 56px); line-height: 1.02; letter-spacing: -.03em; margin: 8px auto 12px; max-width: 18ch; }
  .sub { max-width: 52ch; margin: 0 auto 24px; color: var(--muted); font-size: 17px; }
  .ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .btn { font: inherit; font-weight: 600; font-size: 15px; padding: 11px 18px; border-radius: 12px; text-decoration: none; }
  .primary { background: var(--tomato); color: var(--on-accent); box-shadow: 0 3px 0 var(--tomato-shadow); }
  .secondary { background: var(--surface); color: var(--ink); border: 2px solid var(--ink); opacity: .75; cursor: not-allowed; }
  .badge { display: inline-block; margin-top: 16px; font-family: var(--font-mono); font-size: 12px; background: var(--sunflower); color: var(--on-accent); padding: 3px 8px; border-radius: 6px; }
</style>
```

`src/components/sections/Problem.astro`:
```astro
---
import { getCopy } from '../../lib/copy';
const copy = await getCopy('problem');
---
<section id="problem" class="problem" aria-labelledby="problem-title">
  <div class="wrap">
    <p class="eyebrow">{copy.eyebrow}</p>
    <h2 id="problem-title">{copy.title}</h2>
    <ul class="cards">{copy.cards.map((c) => <li><strong>{c.title}</strong><span>{c.body}</span></li>)}</ul>
  </div>
</section>
<style>
  .problem { padding: 40px 0; }
  h2 { font-size: clamp(24px, 4vw, 34px); max-width: 26ch; }
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; list-style: none; padding: 0; margin: 20px 0 0; }
  @media (max-width: 900px) { .cards { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 479px) { .cards { grid-template-columns: 1fr; } }
  li { background: var(--ink); color: var(--bg); border-radius: 12px; padding: 14px 16px; }
  strong { display: block; font-family: var(--font-display); font-size: 17px; color: var(--inverse-accent); margin-bottom: 4px; }
</style>
```

`src/components/sections/HowItWorks.astro`:
```astro
---
import { getCopy } from '../../lib/copy';
const copy = await getCopy('how');
---
<section id="how-it-works" class="how" aria-labelledby="how-title">
  <div class="curtain" aria-hidden="true"></div>
  <div class="wrap inner">
    <p class="eyebrow">{copy.eyebrow}</p>
    <h2 id="how-title">{copy.title}</h2>
    <p class="intro">{copy.intro}</p>
    <ol class="steps">
      {copy.steps.map((s) => (
        <li class="step"><p class="eyebrow">{s.label}</p><h3>{s.title}</h3><p>{s.body}</p></li>
      ))}
    </ol>
    <p class="loop">{copy.loop}</p>
  </div>
</section>
<style>
  .how { padding-bottom: 40px; }
  .curtain { height: 16px; background: repeating-linear-gradient(90deg, var(--tomato) 0 14px, var(--tomato-shadow) 14px 18px); border-bottom: 3px solid var(--sunflower); }
  .inner { padding-top: 28px; }
  h2 { font-size: clamp(24px, 4vw, 34px); margin: 6px 0; }
  .intro { color: var(--muted); }
  .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; list-style: none; padding: 0; margin: 18px 0 0; }
  @media (max-width: 900px) { .steps { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 479px) { .steps { grid-template-columns: 1fr; } }
  .step { background: var(--surface); border: 2px solid var(--line); border-radius: 12px; padding: 14px 16px; }
  .step h3 { font-size: 18px; margin: 4px 0; }
  .step p:last-child { margin: 0; color: var(--muted); font-size: 15px; }
  .loop { text-align: center; font-family: var(--font-mono); font-size: 13px; color: var(--teal-text); margin-top: 14px; }
</style>
```

`src/components/sections/Principles.astro`:
```astro
---
import TopicIcon from '../TopicIcon.astro';
import { getCopy } from '../../lib/copy';
const copy = await getCopy('principles');
---
<section id="principles" class="principles" aria-labelledby="principles-title">
  <div class="wrap">
    <p class="eyebrow">{copy.eyebrow}</p>
    <h2 id="principles-title">{copy.title}</h2>
    <p class="intro">{copy.intro}</p>
    <ul class="grid">
      {copy.items.map((p) => (
        <li class="principle"><TopicIcon name={p.icon} /><h3>{p.title}</h3><p>{p.body}</p></li>
      ))}
    </ul>
  </div>
</section>
<style>
  .principles { padding: 40px 0; }
  h2 { font-size: clamp(24px, 4vw, 34px); margin: 6px 0; }
  .intro { color: var(--muted); }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; list-style: none; padding: 0; margin: 18px 0 0; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 479px) { .grid { grid-template-columns: 1fr; } }
  .principle { background: var(--surface); border: 2px solid var(--line); border-radius: 14px; padding: 16px; }
  .principle h3 { font-size: 17px; font-weight: 700; margin: 10px 0 4px; }
  .principle p { margin: 0; color: var(--muted); font-size: 15px; }
</style>
```

`src/components/sections/ClosingCta.astro`:
```astro
---
import { getCopy } from '../../lib/copy';
const copy = await getCopy('closing');
---
<section id="follow" class="closing" aria-labelledby="follow-title">
  <div class="wrap">
    <h2 id="follow-title">{copy.title}</h2>
    <p>{copy.body}</p>
    <a class="btn" href={copy.cta.href}>{copy.cta.label}</a>
  </div>
</section>
<style>
  .closing { text-align: center; padding: 48px 0; }
  h2 { font-size: clamp(24px, 4vw, 34px); margin: 0 0 8px; }
  p { color: var(--muted); margin: 0 auto 20px; max-width: 46ch; }
  .btn { display: inline-block; font-weight: 600; padding: 11px 18px; border-radius: 12px; text-decoration: none; background: var(--tomato); color: var(--on-accent); box-shadow: 0 3px 0 var(--tomato-shadow); }
</style>
```

`src/components/sections/Footer.astro`:
```astro
---
import Mark from '../Mark.astro';
import { getCopy } from '../../lib/copy';
const copy = await getCopy('footer');
---
<footer class="site-footer">
  <div class="wrap cols">
    <div><Mark height={16} /> <span>{copy.attribution}</span></div>
    <ul>{copy.links.map((l) => <li><a href={l.href}>{l.label}</a></li>)}</ul>
    <div class="small"><p>{copy.privacy}</p><p>{copy.licence} · {copy.copyright}</p></div>
  </div>
</footer>
<style>
  .site-footer { border-top: 2px solid var(--line); padding: 24px 0 32px; font-size: 14px; color: var(--muted); }
  .cols { display: flex; flex-wrap: wrap; gap: 12px 32px; justify-content: space-between; align-items: flex-start; }
  ul { display: flex; gap: 16px; list-style: none; margin: 0; padding: 0; }
  .small p { margin: 0 0 4px; }
</style>
```

`src/pages/index.astro`:
```astro
---
import Landing from '../layouts/Landing.astro';
import Header from '../components/sections/Header.astro';
import Hero from '../components/sections/Hero.astro';
import Problem from '../components/sections/Problem.astro';
import HowItWorks from '../components/sections/HowItWorks.astro';
import Principles from '../components/sections/Principles.astro';
import ClosingCta from '../components/sections/ClosingCta.astro';
import Footer from '../components/sections/Footer.astro';
---
<Landing title="troupe: agents and people in named roles"
         description="troupe runs your development process with agents and people in named roles. Pre-alpha, building in the open.">
  <Header />
  <main>
    <Hero /><Problem /><HowItWorks /><Principles /><ClosingCta />
  </main>
  <Footer />
</Landing>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run check && npm run test:unit && npm run test:e2e`
Expected: 0 check errors. All unit and e2e tests pass, including theme and smoke. The smoke test's `h1` count
still holds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Landing page sections with copy in a content collection

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g"
```

---
### Task 5: Idle bows

**Files:**
- Create: `src/scripts/cast-idle.ts`
- Modify: `src/components/sections/Hero.astro` (add a client script)
- Test: `tests/unit/cast-idle.test.ts`, `tests/e2e/idle-bows.spec.ts`

**Interfaces:**
- Consumes:
  - `[data-cast]` and its `.character` children (Task 4);
  - the `.is-bowing` class (Task 3).
- Produces: `createCastIdle(opts: { count: number; bow: (index: number) => void; random?: () => number;
  idleMs?: number; maxBows?: number }): { hover(): void; setVisible(v: boolean): void; stop(): void; readonly
  bows: number; readonly state: 'running' | 'paused' | 'done' | 'stopped' }`.
  - The default `idleMs` is 5000 and the default `maxBows` is 6.
  - `[data-cast]` gets `data-idle` set to `running`, `paused`, `done` or `off` (reduced motion).

**Behaviour (spec §3):**
- After 5s without a hover, one random character bows, never the same one twice in a row.
- A hover resets the 5s timer.
- Bows run only while the cast is on screen and the tab is visible.
- They stop for good after 6 per page view; hovers don't reset that cap.
- They're off under reduced motion.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/cast-idle.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCastIdle } from '../../src/scripts/cast-idle';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createCastIdle', () => {
  it('bows exactly once 5s after start when nothing is hovered', () => {
    const bow = vi.fn();
    createCastIdle({ count: 5, bow, random: () => 0.5 });
    vi.advanceTimersByTime(4999);
    expect(bow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(bow).toHaveBeenCalledTimes(1);
  });

  it('a hover at 4s pushes the next bow to 9s', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow, random: () => 0.5 });
    vi.advanceTimersByTime(4000);
    idle.hover();
    vi.advanceTimersByTime(4999);
    expect(bow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(bow).toHaveBeenCalledTimes(1);
  });

  it('never picks the same character twice in a row, even when random repeats', () => {
    const picks: number[] = [];
    createCastIdle({ count: 5, bow: (i) => picks.push(i), random: () => 0.5 });
    vi.advanceTimersByTime(30_000);
    for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
  });

  it('stops after 6 bows and reports state "done"', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow });
    vi.advanceTimersByTime(120_000);
    expect(bow).toHaveBeenCalledTimes(6);
    expect(idle.state).toBe('done');
  });

  it('a hover after the cap does not restart bowing', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow });
    vi.advanceTimersByTime(30_000);
    idle.hover();
    vi.advanceTimersByTime(30_000);
    expect(bow).toHaveBeenCalledTimes(6);
  });

  it('setVisible(false) pauses bowing; setVisible(true) restarts the 5s timer', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow });
    idle.setVisible(false);
    expect(idle.state).toBe('paused');
    vi.advanceTimersByTime(20_000);
    expect(bow).not.toHaveBeenCalled();
    idle.setVisible(true);
    vi.advanceTimersByTime(5000);
    expect(bow).toHaveBeenCalledTimes(1);
  });

  it('stop() cancels any pending bow and reports state "stopped"', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow });
    idle.stop();
    vi.advanceTimersByTime(20_000);
    expect(bow).not.toHaveBeenCalled();
    expect(idle.state).toBe('stopped');
  });

  it('with a single character it bows index 0 each time', () => {
    const picks: number[] = [];
    createCastIdle({ count: 1, bow: (i) => picks.push(i) });
    vi.advanceTimersByTime(15_000);
    expect(picks).toEqual([0, 0, 0]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test:unit -- cast-idle`
Expected: FAIL, because the module isn't found.

- [ ] **Step 3: Implement `src/scripts/cast-idle.ts`**

```ts
export type CastIdleState = 'running' | 'paused' | 'done' | 'stopped';

export interface CastIdleOptions {
  count: number;
  bow: (index: number) => void;
  random?: () => number;
  idleMs?: number;
  maxBows?: number;
}

export interface CastIdle {
  hover(): void;
  setVisible(visible: boolean): void;
  stop(): void;
  readonly bows: number;
  readonly state: CastIdleState;
}

export function createCastIdle(opts: CastIdleOptions): CastIdle {
  const idleMs = opts.idleMs ?? 5000;
  const maxBows = opts.maxBows ?? 6;
  const random = opts.random ?? Math.random;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let bows = 0;
  let last = -1;
  let visible = true;
  let stopped = false;

  const state = (): CastIdleState =>
    stopped ? 'stopped' : bows >= maxBows ? 'done' : visible ? 'running' : 'paused';

  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const pick = (): number => {
    if (opts.count <= 1) return 0;
    if (last < 0) return Math.floor(random() * opts.count);
    let i = Math.floor(random() * (opts.count - 1));
    if (i >= last) i += 1;
    return i;
  };

  const fire = () => {
    timer = undefined;
    const i = pick();
    last = i;
    bows += 1;
    opts.bow(i);
    schedule();
  };

  function schedule() {
    clear();
    if (state() === 'running') timer = setTimeout(fire, idleMs);
  }

  schedule();
  return {
    hover: schedule,
    setVisible(v) { visible = v; schedule(); },
    stop() { stopped = true; clear(); },
    get bows() { return bows; },
    get state() { return state(); },
  };
}
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npm run test:unit -- cast-idle`
Expected: 8 passed.

- [ ] **Step 5: Write the failing e2e tests**

`tests/e2e/idle-bows.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const bowing = (page) => page.locator('[data-cast] .character.is-bowing');

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
```

- [ ] **Step 6: Wire the script into `Hero.astro`**

Append to `src/components/sections/Hero.astro`, after the markup and before `<style>`:
```astro
<script>
  import { createCastIdle } from '../../scripts/cast-idle';

  const cast = document.querySelector<HTMLElement>('[data-cast]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (cast) {
    if (reduce.matches) {
      cast.dataset.idle = 'off';
    } else {
      const shown = () => [...cast.querySelectorAll<SVGElement>('.character')].filter((el) => el.getClientRects().length > 0);
      let onScreen = true;
      const idle = createCastIdle({
        count: shown().length,
        bow: (i) => {
          const list = shown();
          const el = list[i % list.length];
          el.classList.add('is-bowing');
          setTimeout(() => el.classList.remove('is-bowing'), 700);
          cast.dataset.idle = idle.state;
        },
      });
      const sync = () => { idle.setVisible(onScreen && !document.hidden); cast.dataset.idle = idle.state; };
      cast.dataset.idle = idle.state;
      cast.addEventListener('pointerover', (e) => {
        if ((e.target as Element).closest('.character')) idle.hover();
      });
      new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }).observe(cast);
      document.addEventListener('visibilitychange', sync);
      reduce.addEventListener('change', () => { if (reduce.matches) { idle.stop(); cast.dataset.idle = 'off'; } });
    }
  }
</script>
```

- [ ] **Step 7: Run all tests**

Run: `npm run test:unit && npm run test:e2e`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Idle bows: a random cast member bows after 5s without hover (max 6)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g"
```

---
### Task 6: Docs structure, status notes, written pages and stubs

**Files:**
- Create:
  - `src/components/docs/MarkdownContent.astro`;
  - every page under `src/content/docs/docs/`, as listed in Steps 4 and 5.
- Modify:
  - `astro.config.mjs` (full sidebar, `components` override);
  - `src/styles/starlight.css` (sidebar labels and the status-note style);
  - `src/content/docs/docs/programme/what-is-troupe.md` (real content).
- Test: `tests/e2e/docs.spec.ts`

**Interfaces:**
- Consumes:
  - the extended frontmatter fields `status`, `prerelease` and `purpose` (Task 1);
  - the tokens (Task 2).
- Produces:
  - `aside[data-doc-note="planned"]` (with a "Help write this page" link) on stubs;
  - `aside[data-doc-note="prerelease"]` on written pages with `prerelease: true`;
  - no note when `prerelease: false`.

- [ ] **Step 1: Write the failing tests**

`tests/e2e/docs.spec.ts`:
```ts
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
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test:e2e -- docs.spec.ts`
Expected: FAIL. The page count is 1, the sidebar is incomplete and there are no notes.

- [ ] **Step 3: Implement the sidebar, the override and the styles**

Replace `sidebar` in `astro.config.mjs` and add `components`:
```js
      components: {
        MarkdownContent: './src/components/docs/MarkdownContent.astro',
      },
      sidebar: [
        { label: 'Programme', items: [
          { slug: 'docs/programme/what-is-troupe' },
          { slug: 'docs/programme/status-and-roadmap' },
          { slug: 'docs/programme/principles' },
        ] },
        { label: 'Opening night', items: [
          { slug: 'docs/opening-night/install' },
          { slug: 'docs/opening-night/first-theatre' },
          { slug: 'docs/opening-night/first-performance' },
        ] },
        { label: 'The company', items: [
          { slug: 'docs/the-company/theatres' },
          { slug: 'docs/the-company/roles-and-actors' },
          { slug: 'docs/the-company/performances-and-runs' },
          { slug: 'docs/the-company/flows' },
          { slug: 'docs/the-company/gates-and-decisions' },
          { slug: 'docs/the-company/escalation' },
          { slug: 'docs/the-company/notes' },
          { slug: 'docs/the-company/lineage' },
          { slug: 'docs/the-company/guests' },
          { slug: 'docs/the-company/the-house' },
        ] },
        { label: 'Stagecraft', items: [
          { slug: 'docs/stagecraft/configure-roles' },
          { slug: 'docs/stagecraft/route-decisions' },
          { slug: 'docs/stagecraft/build-a-flow' },
          { slug: 'docs/stagecraft/bring-your-own-agent' },
          { slug: 'docs/stagecraft/hand-edit-config' },
          { slug: 'docs/stagecraft/write-a-guest' },
          { slug: 'docs/stagecraft/read-the-lineage' },
        ] },
        { label: 'Prompt book', items: [
          { slug: 'docs/prompt-book/cli' },
          { slug: 'docs/prompt-book/config-schema' },
          { slug: 'docs/prompt-book/events' },
          { slug: 'docs/prompt-book/guest-manifest' },
          { slug: 'docs/prompt-book/glossary' },
        ] },
        { label: 'Backstage', items: [
          { slug: 'docs/backstage/contributing' },
          { slug: 'docs/backstage/licensing' },
          { slug: 'docs/backstage/changelog' },
        ] },
      ],
```

`src/components/docs/MarkdownContent.astro`:
```astro
---
import Default from '@astrojs/starlight/components/MarkdownContent.astro';
const { entry, editUrl } = Astro.locals.starlightRoute;
const isDoc = entry.id.startsWith('docs/');
const { status, prerelease, purpose } = entry.data;
---
{isDoc && status === 'planned' && (
  <aside class="doc-note doc-note--planned" data-doc-note="planned">
    <p><strong>Planned: not written yet.</strong> {purpose}</p>
    {editUrl && <p><a href={editUrl.href}>Help write this page</a></p>}
  </aside>
)}
{isDoc && status === 'written' && prerelease && (
  <aside class="doc-note" data-doc-note="prerelease">
    <p>Pre-alpha: this page describes intended behaviour.</p>
  </aside>
)}
<Default><slot /></Default>
```

Append to `src/styles/starlight.css`:
```css
.sidebar-content .top-level > li + li { margin-top: 26px; padding-top: 14px; border-top: 2px solid var(--line); }
.sidebar-content .top-level > li > details > summary .large {
  font-family: var(--font-display); font-weight: 800; font-size: 17px; letter-spacing: -.01em;
  color: var(--tomato-text);
}
.doc-note {
  border-left: 4px solid var(--teal); background: color-mix(in srgb, var(--teal) 10%, var(--bg));
  border-radius: 6px; padding: 10px 14px; margin-bottom: 1.5rem; color: var(--ink);
}
.doc-note--planned { border-left-color: var(--sunflower); background: color-mix(in srgb, var(--sunflower) 14%, var(--bg)); }
.doc-note p { margin: 0; }
.doc-note p + p { margin-top: 6px; }
```

If the sidebar selectors don't match the rendered markup, inspect a built page (`dist/docs/programme/what-is-troupe/index.html`), adjust both the CSS and the test selectors to the real structure, and note it in your report.

- [ ] **Step 4: Write the six written pages**

`src/content/docs/docs/programme/what-is-troupe.md`:
```md
---
title: What is troupe?
description: troupe runs your development process with agents and people in named roles.
status: written
---

troupe runs your development process with agents and people in named roles.

## The idea

A software team has roles: product owner, engineer, reviewer, release manager. In troupe, each role is held
by an agent or a person, and your process runs through them: specify, build, test, release, and again.

## What makes it different

- **Work branches.** Tasks fork, join, swarm and loop, instead of one agent working in a line.
- **Decisions go to the right person.** When a call needs making, the agent does the research first (the
  issues, the docs, the relevant standard) and brings a decision brief to whoever holds that role.
- **Everything is recorded.** Every change carries its lineage: who made it, human or agent, who approved it,
  and when.
- **It lives in your repo.** Config is plain YAML you can edit by hand. There is no hosted service.

## Where it is now

troupe is pre-alpha. See [Status and roadmap](/docs/programme/status-and-roadmap/).
```

`src/content/docs/docs/programme/status-and-roadmap.md`:
```md
---
title: Status and roadmap
description: Where troupe is today and what comes next.
status: written
prerelease: false
---

## Status

Pre-alpha. Nothing is installable yet.

## Now

We're choosing the spec-driven development method troupe will be built with, by comparing several methods on
the same work, including how well each copes when the requirements change. We'll publish what we learn when
it's done.

## Next

1. Choose the method.
2. Build the core: the command line, the local daemon, roles and gates, and lineage.
3. The first installable release.

There are no dates on this roadmap. This page changes as things do.
```

`src/content/docs/docs/programme/principles.md`:
```md
---
title: Principles
description: What troupe is being built toward.
status: written
---

These are commitments, not shipped features.

## Local-first, everything in your repo

Config, history and decisions live in git, on your machine. troupe doesn't need a hosted service to work.

## Humans are roles, not a loop

People hold roles the same way agents do. A question goes to the person who owns that decision, not to
whoever happens to be watching.

## Escalation that does its homework

Before an agent asks anyone, it runs the research steps your config defines: check the issues, read the docs,
look up the relevant standard. Then it brings a decision brief, not a bare question.

## Lineage from the first event

Every change records who made it, human or agent, who approved it, and when. That's there from the first
event, not added later.

## Config that survives hand-editing

Config is plain YAML. Edit it by hand and troupe keeps your formatting and comments.

## Bring your own agent

The process doesn't depend on one agent. Swap Claude Code for another without rewriting it.
```

`src/content/docs/docs/prompt-book/glossary.md`:
```md
---
title: Glossary
description: The words troupe uses, and what each one means.
status: written
prerelease: false
---

| Term | Meaning |
|---|---|
| theatre | A project: a directory with troupe config |
| role | A job in your process, such as product owner, engineer or reviewer |
| actor | Whoever holds a role: an agent or a person |
| cast | The actors assigned to a performance |
| performance | One run of your process |
| notes | What a run teaches, fed into the next one |
| gate | A point where work waits for a decision from whoever owns it |
| escalation | How an agent gets a decision: research first, then a brief to the right person |
| lineage | The record of who made each change, who approved it, and when |
| guest | An installable pack that adds to troupe |
| the house | The local daemon. The name isn't final |
```

`src/content/docs/docs/backstage/licensing.md`:
```md
---
title: Licensing
description: How each part of troupe is licensed.
status: written
prerelease: false
---

Different parts of troupe are licensed differently, each to suit what it's for.

| Part | Licence |
|---|---|
| troupe itself (command line, daemon, local web UI) | Apache-2.0, with a contributor licence agreement |
| Config schema and guest manifest format | Apache-2.0 |
| Official guests | Apache-2.0 |
| This website's code | MIT |
| This website's content and the docs | CC BY 4.0 |
| The troupe name, logo and characters | Trademarks, not licensed |

troupe itself isn't published yet. When it is, it will carry the licence above.

The troupe name, logo, mark and characters are trademarks of HPS.GD PTY LTD. You're welcome to use the name to
refer to troupe, for example "works with troupe". Please don't use it, or the logo, for another product or a
fork.
```

`src/content/docs/docs/backstage/contributing.md`:
```md
---
title: Contributing
description: How to improve these docs and, later, troupe itself.
status: written
prerelease: false
---

## These docs and this website

Every page has an **Improve this page** link. It opens the page's source on GitHub. If you don't have write
access, GitHub makes a fork and a pull request for you, so you don't need to clone anything.

Contributions to the website are accepted under its own licences: MIT for code and CC BY 4.0 for content.
There's no extra agreement to sign.

## troupe itself

When troupe's source is published, contributions will need a contributor licence agreement with HPS.GD PTY LTD,
based on the Apache Software Foundation's individual and corporate agreements. You keep the copyright in your
work, and grant us a licence to use it. Details will be here when the repository opens.
```

- [ ] **Step 5: Write the 25 stubs**

Each stub uses this exact template. Substitute `TITLE`, `DESCRIPTION` and `PURPOSE` from the table:
```md
---
title: TITLE
description: DESCRIPTION
status: planned
purpose: PURPOSE
---
```

| File (under `src/content/docs/docs/`) | TITLE | DESCRIPTION | PURPOSE |
|---|---|---|---|
| `opening-night/install.md` | Install | Installing troupe. | How to install troupe once a release exists. |
| `opening-night/first-theatre.md` | Your first theatre | Setting up troupe in a repo. | Setting up troupe in an existing repo, step by step. |
| `opening-night/first-performance.md` | Your first performance | Running your process once. | Running your process end to end for the first time. |
| `the-company/theatres.md` | Theatres | What a theatre is. | What a theatre is, and what lives in its config. |
| `the-company/roles-and-actors.md` | Roles and actors | Roles, and who holds them. | Roles, actors, and how agents and people hold them the same way. |
| `the-company/performances-and-runs.md` | Performances and runs | One run of your process. | What a performance is, and what happens during one. |
| `the-company/flows.md` | Flows: fork, join, swarm, loop | How work branches. | How tasks fork, join, swarm and loop. |
| `the-company/gates-and-decisions.md` | Gates and decisions | Where work waits for a person. | Gates, and how a decision reaches whoever owns it. |
| `the-company/escalation.md` | Escalation | Research before asking. | How an agent researches before it asks, and what the decision brief contains. |
| `the-company/notes.md` | Notes: improving between runs | Learning from each run. | How what a run learns changes the next one. |
| `the-company/lineage.md` | Lineage | Who did what, and when. | What every change records, and how to read it. |
| `the-company/guests.md` | Guests (packs) | Installable packs. | Guests: installable packs that add roles, flows and checks. |
| `the-company/the-house.md` | The house (daemon, name TBC) | The local daemon. | The local daemon that runs your theatres. The name isn't final. |
| `stagecraft/configure-roles.md` | Configure roles and people | Setting up roles. | Defining roles and assigning agents and people to them. |
| `stagecraft/route-decisions.md` | Route decisions to the right person | Sending decisions to owners. | Making sure each decision reaches the person who owns it. |
| `stagecraft/build-a-flow.md` | Build a flow | Designing how work moves. | Designing a flow that forks, joins and loops. |
| `stagecraft/bring-your-own-agent.md` | Bring your own agent | Using a different agent. | Using an agent other than Claude Code. |
| `stagecraft/hand-edit-config.md` | Hand-edit config safely | Editing YAML by hand. | Editing config by hand without losing formatting or comments. |
| `stagecraft/write-a-guest.md` | Write a guest | Making your own pack. | Writing and publishing a guest. |
| `stagecraft/read-the-lineage.md` | Read the lineage | Following the record. | Answering "who decided this?" from the lineage. |
| `prompt-book/cli.md` | CLI | Command reference. | Every command and option. |
| `prompt-book/config-schema.md` | Config schema | Config reference. | The full config schema, generated from its JSON Schema. |
| `prompt-book/events.md` | Events | Event reference. | Every event troupe records, and its fields. |
| `prompt-book/guest-manifest.md` | Guest manifest | Guest manifest reference. | The guest manifest format. |
| `backstage/changelog.md` | Changelog | What changed. | Changes in each release, once there are releases. |

That's 25 stubs. Together with the 6 written pages, the sidebar has 31 pages: 3 + 3 + 10 + 7 + 5 + 3.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run check && npm run test:e2e -- docs.spec.ts smoke.spec.ts theme.spec.ts`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Docs: full sidebar, status notes, six written pages and 25 stubs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g"
```

---
### Task 7: Brand asset files, rendering and verification

**Spec deviation (record in the report):**
- Spec §5.3 names `@resvg/resvg-js` for rendering. This plan renders with Playwright's Chromium instead, because
  several assets contain the wordmark and taglines, which need the brand fonts. resvg can't load the
  Fontsource WOFF2 files, and Playwright is already in the toolchain.
- For the same reason, the lock-up and README banner ship as PNG renders, not SVG. An SVG with live text would
  fall back to a system font when GitHub displays it.
- The mark and favicon have no text, so they stay SVG.

**Files:**
- Create:
  - `brand/favicon.svg` and `brand/mark.svg`;
  - `brand/templates/{preview,github-avatar,readme-banner,lockup,icon}.html` and
    `brand/templates/base.css`;
  - `scripts/assets.config.mjs`, `scripts/assets-lib.mjs`, `scripts/render-assets.mjs`,
    `scripts/verify-assets.mjs`;
  - the generated `public/og.png`, `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`,
    `brand/out/*.png` and `brand/out/manifest.json`.
- Modify:
  - `src/layouts/Landing.astro` (favicons and Open Graph tags);
  - `astro.config.mjs` (Starlight `favicon` and `head`);
  - `README.md` (banner).
- Test: `tests/unit/assets-lib.test.ts`, `tests/e2e/meta.spec.ts`

**Interfaces:**
- Produces:
  - `scripts/assets-lib.mjs`, exporting `pngSize(buf: Buffer): { width: number; height: number }`,
    `hashFiles(paths: string[], root: string): Record<string, string>` and
    `verify(root: string, config: AssetConfig): string[]` (a list of problems; empty means OK);
  - `scripts/assets.config.mjs`, exporting `ASSETS: Array<{ template: string; query?: string; out: string;
    width: number; height: number; transparent?: boolean }>`, `SOURCES: string[]` and
    `COPIES: Array<{ from: string; to: string }>`.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/assets-lib.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pngSize, hashFiles, verify } from '../../scripts/assets-lib.mjs';

// 1×1 transparent PNG
const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'assets-'));
  mkdirSync(join(root, 'brand/out'), { recursive: true });
  writeFileSync(join(root, 'brand/a.svg'), '<svg/>');
  writeFileSync(join(root, 'brand/out/x.png'), PNG_1x1);
  const config = { SOURCES: ['brand/a.svg'], ASSETS: [{ template: 't.html', out: 'brand/out/x.png', width: 1, height: 1 }], COPIES: [] };
  writeFileSync(join(root, 'brand/out/manifest.json'), JSON.stringify({ sources: hashFiles(config.SOURCES, root) }));
  return { root, config };
}

describe('assets-lib', () => {
  it('pngSize reads width and height from the IHDR chunk', () => {
    expect(pngSize(PNG_1x1)).toEqual({ width: 1, height: 1 });
  });
  it('verify returns no problems when outputs and the manifest match', () => {
    const { root, config } = fixture();
    expect(verify(root, config)).toEqual([]);
  });
  it('verify reports a source that changed since the last render', () => {
    const { root, config } = fixture();
    writeFileSync(join(root, 'brand/a.svg'), '<svg id="changed"/>');
    expect(verify(root, config)).toEqual(['brand/a.svg changed since last render: run npm run assets:render']);
  });
  it('verify reports a missing output', () => {
    const { root, config } = fixture();
    config.ASSETS.push({ template: 't.html', out: 'brand/out/missing.png', width: 1, height: 1 });
    expect(verify(root, config)).toEqual(['brand/out/missing.png is missing']);
  });
  it('verify reports an output with the wrong size', () => {
    const { root, config } = fixture();
    config.ASSETS[0].width = 2;
    expect(verify(root, config)).toEqual(['brand/out/x.png is 1×1, expected 2×1']);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test:unit -- assets-lib`
Expected: FAIL, because the module isn't found.

- [ ] **Step 3: Implement the library and config**

`scripts/assets-lib.mjs`:
```js
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function pngSize(buf) {
  if (buf.readUInt32BE(12) !== 0x49484452) throw new Error('not a PNG (no IHDR)');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export function hashFiles(paths, root) {
  return Object.fromEntries(
    paths.map((p) => [p, createHash('sha256').update(readFileSync(join(root, p))).digest('hex')]),
  );
}

export function verify(root, config) {
  const problems = [];
  const manifestPath = join(root, 'brand/out/manifest.json');
  if (!existsSync(manifestPath)) return ['brand/out/manifest.json is missing: run npm run assets:render'];
  const recorded = JSON.parse(readFileSync(manifestPath, 'utf8')).sources ?? {};
  const current = hashFiles(config.SOURCES, root);
  for (const [p, h] of Object.entries(current)) {
    if (recorded[p] !== h) problems.push(`${p} changed since last render: run npm run assets:render`);
  }
  for (const a of config.ASSETS) {
    const out = join(root, a.out);
    if (!existsSync(out)) { problems.push(`${a.out} is missing`); continue; }
    const { width, height } = pngSize(readFileSync(out));
    if (width !== a.width || height !== a.height) problems.push(`${a.out} is ${width}×${height}, expected ${a.width}×${a.height}`);
  }
  for (const c of config.COPIES) {
    if (!existsSync(join(root, c.to))) problems.push(`${c.to} is missing`);
  }
  return problems;
}
```

`scripts/assets.config.mjs`:
```js
export const ASSETS = [
  { template: 'preview.html', query: 'tag=Your%20agents%20need%20a%20director.&size=76&measure=15', out: 'public/og.png', width: 1200, height: 630 },
  { template: 'icon.html', query: 'size=32&bg=none', out: 'brand/out/favicon-32.png', width: 32, height: 32, transparent: true },
  { template: 'icon.html', query: 'size=180&bg=cream', out: 'public/apple-touch-icon.png', width: 180, height: 180 },
  { template: 'github-avatar.html', out: 'brand/out/github-avatar.png', width: 500, height: 500 },
  { template: 'preview.html', query: 'tag=Agents%20and%20people%20in%20named%20roles%2C%20running%20your%20process.&size=64&measure=18', out: 'brand/out/repo-preview.png', width: 1280, height: 640 },
  { template: 'readme-banner.html', out: 'brand/out/readme-banner.png', width: 1280, height: 320 },
  { template: 'lockup.html', query: 'theme=light', out: 'brand/out/lockup-light.png', width: 640, height: 160, transparent: true },
  { template: 'lockup.html', query: 'theme=dark', out: 'brand/out/lockup-dark.png', width: 640, height: 160, transparent: true },
];
export const COPIES = [
  { from: 'brand/favicon.svg', to: 'public/favicon.svg' },
];
export const ICO = { from: 'brand/out/favicon-32.png', to: 'public/favicon.ico' };
export const SOURCES = [
  'brand/favicon.svg', 'brand/mark.svg', 'brand/templates/base.css',
  ...[...new Set(ASSETS.map((a) => a.template))].map((t) => `brand/templates/${t}`),
];
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npm run test:unit -- assets-lib`
Expected: 5 passed.

- [ ] **Step 5: Write the brand sources**

`brand/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <path d="M16 5.2 L28 26 L4 26 Z" fill="#FF5A3C" stroke="#FF5A3C" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="12.5" cy="19" r="2" fill="#FFFFFF"/>
  <circle cx="19.5" cy="19" r="2" fill="#FFFFFF"/>
</svg>
```

`brand/mark.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 49 20">
  <circle cx="7" cy="12" r="7" fill="#7461D9"/>
  <circle cx="4.9" cy="11.2" r="1.05" fill="#FFFFFF"/><circle cx="9.1" cy="11.2" r="1.05" fill="#FFFFFF"/>
  <path d="M24.5 5.6 L31.78 18.2 L17.22 18.2 Z" fill="#FF5A3C" stroke="#FF5A3C" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="22.7" cy="14.6" r="1.1" fill="#FFFFFF"/><circle cx="26.3" cy="14.6" r="1.1" fill="#FFFFFF"/>
  <rect x="34.8" y="5" width="14" height="14" rx="4" fill="#14857D"/>
  <circle cx="38.8" cy="11.3" r="1.1" fill="#FFFFFF"/><circle cx="44.8" cy="11.3" r="1.1" fill="#FFFFFF"/>
</svg>
```

`brand/templates/base.css`:
```css
@import url('../../node_modules/@fontsource-variable/bricolage-grotesque/index.css');
@import url('../../node_modules/@fontsource-variable/dm-sans/index.css');
@import url('../../node_modules/@fontsource/dm-mono/400.css');
html, body { margin: 0; width: 100%; height: 100%; }
body { font-family: 'DM Sans Variable', sans-serif; color: #1D1B2F; background: #FFF8EE; display: flex; align-items: center; justify-content: center; }
body.dark { color: #FFF4E2; background: #1A1830; }
body.none { background: transparent; }
.wordmark { font-family: 'Bricolage Grotesque Variable', sans-serif; font-weight: 800; letter-spacing: -.02em; }
.tag { font-family: 'Bricolage Grotesque Variable', sans-serif; font-weight: 800; letter-spacing: -.03em; line-height: 1.02; }
.url { font-family: 'DM Mono', monospace; color: #CE3D21; }
.cast { display: flex; gap: 22px; align-items: flex-end; }
.spot { background: radial-gradient(ellipse 70% 60% at 50% 0%, #FFC93C38, transparent 70%), #FFF8EE; }
```

`brand/templates/preview.html` is used for both the social preview (1200×630) and the repo preview
(1280×640). The query string sets the tagline and its size:
```html
<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="base.css">
<style>
  body { flex-direction: column; gap: 22px; }
  .tag { text-align: center; margin: 0; }
  .row { display: flex; align-items: center; gap: 14px; }
  .wordmark { font-size: 40px; }
  .url { font-size: 24px; }
</style></head>
<body class="spot">
<svg width="0" height="0" style="position:absolute"><defs>
  <linearGradient id="fh" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7461D9" stop-opacity=".45"/><stop offset=".75" stop-color="#7461D9" stop-opacity="0"/></linearGradient>
  <linearGradient id="fa" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#14857D" stop-opacity=".45"/><stop offset=".75" stop-color="#14857D" stop-opacity="0"/></linearGradient>
  <linearGradient id="ft" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF5A3C" stop-opacity=".45"/><stop offset=".75" stop-color="#FF5A3C" stop-opacity="0"/></linearGradient>
  <symbol id="human" viewBox="0 0 56 70"><g transform="translate(0,82) scale(1,-1)"><circle cx="28" cy="22" r="18" fill="url(#fh)"/></g><circle cx="28" cy="22" r="18" fill="#7461D9"/><circle cx="22" cy="20" r="2.6" fill="#FFFFFF"/><circle cx="34" cy="20" r="2.6" fill="#FFFFFF"/></symbol>
  <symbol id="agent" viewBox="0 0 56 70"><g transform="translate(0,82) scale(1,-1)"><rect x="10" y="4" width="36" height="36" rx="10" fill="url(#fa)"/></g><rect x="10" y="4" width="36" height="36" rx="10" fill="#14857D"/><circle cx="22" cy="20.5" r="2.6" fill="#FFFFFF"/><circle cx="34" cy="20.5" r="2.6" fill="#FFFFFF"/></symbol>
  <symbol id="troupe" viewBox="0 0 56 70"><g transform="translate(0,82) scale(1,-1)"><path d="M28 7.2 L44.86 36.4 L11.14 36.4 Z" fill="url(#ft)" stroke="url(#ft)" stroke-width="7" stroke-linejoin="round"/></g><path d="M28 7.2 L44.86 36.4 L11.14 36.4 Z" fill="#FF5A3C" stroke="#FF5A3C" stroke-width="7" stroke-linejoin="round"/><circle cx="23" cy="26.5" r="2.6" fill="#FFFFFF"/><circle cx="33" cy="26.5" r="2.6" fill="#FFFFFF"/></symbol>
</defs></svg>
<div class="cast">
  <svg width="84" height="105"><use href="#human"/></svg><svg width="84" height="105"><use href="#agent"/></svg>
  <svg width="84" height="105"><use href="#troupe"/></svg><svg width="84" height="105"><use href="#agent"/></svg>
  <svg width="84" height="105"><use href="#human"/></svg>
</div>
<p class="tag" id="t"></p>
<div class="row"><img src="../mark.svg" width="98" height="40" alt=""><span class="wordmark">troupe</span><span class="url">troupe.run</span></div>
<script>
  const q = new URLSearchParams(location.search);
  const t = document.getElementById('t');
  t.textContent = q.get('tag');
  t.style.fontSize = q.get('size') + 'px';
  t.style.maxWidth = q.get('measure') + 'ch';
</script>
</body></html>
```

The cast geometry and colours match `Character.astro`, with literal colours because this file is outside
`src/`.

`brand/templates/github-avatar.html` (500×500):
```html
<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="base.css"></head>
<body><img src="../favicon.svg" width="360" height="360" alt=""></body></html>
```

`brand/templates/readme-banner.html` (1280×320):
```html
<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="base.css">
<style>
  body { gap: 40px; }
  .wordmark { font-size: 96px; }
  .sub { font-size: 30px; color: #4A4760; max-width: 22ch; }
</style></head>
<body class="spot">
  <div style="display:flex;align-items:center;gap:22px"><img src="../mark.svg" width="196" height="80" alt=""><span class="wordmark">troupe</span></div>
  <p class="sub">Agents and people in named roles, running your process.</p>
</body></html>
```

`brand/templates/lockup.html` (640×160, transparent; `?theme=light|dark` sets the wordmark colour):
```html
<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="base.css">
<style>.wordmark { font-size: 104px; }</style></head>
<body class="none">
  <div style="display:flex;align-items:center;gap:24px"><img src="../mark.svg" width="245" height="100" alt=""><span class="wordmark" id="w">troupe</span></div>
  <script>if (new URLSearchParams(location.search).get('theme') === 'dark') document.getElementById('w').style.color = '#FFF4E2';</script>
</body></html>
```

`brand/templates/icon.html` (`?size=N&bg=none|cream`):
```html
<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="base.css"></head>
<body>
  <img id="i" src="../favicon.svg" alt="">
  <script>
    const q = new URLSearchParams(location.search);
    const size = Number(q.get('size'));
    const img = document.getElementById('i');
    const inset = q.get('bg') === 'cream' ? Math.round(size * 0.14) : 0;
    img.width = size - inset * 2; img.height = size - inset * 2;
    if (q.get('bg') === 'none') document.body.classList.add('none');
  </script>
</body></html>
```

- [ ] **Step 6: Implement the render and verify scripts**

`scripts/render-assets.mjs`:
```js
import { chromium } from '@playwright/test';
import { copyFileSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import pngToIco from 'png-to-ico';
import { ASSETS, COPIES, ICO, SOURCES } from './assets.config.mjs';
import { hashFiles } from './assets-lib.mjs';

const root = process.cwd();
const browser = await chromium.launch();
try {
  for (const a of ASSETS) {
    const page = await browser.newPage({ viewport: { width: a.width, height: a.height }, deviceScaleFactor: 1 });
    const url = pathToFileURL(resolve(root, 'brand/templates', a.template)).href + (a.query ? `?${a.query}` : '');
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    mkdirSync(dirname(resolve(root, a.out)), { recursive: true });
    await page.screenshot({ path: resolve(root, a.out), omitBackground: !!a.transparent });
    await page.close();
    console.log(`rendered ${a.out}`);
  }
} finally {
  await browser.close();
}
for (const c of COPIES) copyFileSync(resolve(root, c.from), resolve(root, c.to));
writeFileSync(resolve(root, ICO.to), await pngToIco([readFileSync(resolve(root, ICO.from))]));
writeFileSync(resolve(root, 'brand/out/manifest.json'),
  JSON.stringify({ sources: hashFiles(SOURCES, root) }, null, 2) + '\n');
console.log('wrote brand/out/manifest.json');
```

`scripts/verify-assets.mjs`:
```js
import * as config from './assets.config.mjs';
import { verify } from './assets-lib.mjs';
import { existsSync } from 'node:fs';

const problems = verify(process.cwd(), config);
if (!existsSync(config.ICO.to)) problems.push(`${config.ICO.to} is missing`);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('✓ brand assets match their sources');
```

Run: `npm run assets:render && npm run assets:verify`
Expected: 8 "rendered …" lines (preview.html renders twice), then "✓ brand assets match their sources".
Open `public/og.png`, `brand/out/readme-banner.png` and `brand/out/lockup-dark.png`. Check by eye that the
fonts are Bricolage (chunky, not a system sans) and the characters have reflections. Describe what you see in
your report.

- [ ] **Step 7: Write the failing meta tests, then wire favicons and Open Graph**

`tests/e2e/meta.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

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
```

Add to `src/layouts/Landing.astro`, inside `<head>` after the description meta:
```astro
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={new URL(Astro.url.pathname, Astro.site)} />
    <meta property="og:image" content="https://troupe.run/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
```

Add inside `starlight({...})` in `astro.config.mjs`:
```js
      favicon: '/favicon.svg',
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://troupe.run/og.png' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
```

Replace the first line of `README.md` (`# troupe-run.github.io`) with:
```md
![troupe](brand/out/readme-banner.png)

# troupe-run.github.io
```

Run: `npm run test:unit && npm run test:e2e -- meta.spec.ts`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Brand asset sources, Playwright renderer and drift check; favicons and Open Graph

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g"
```

---

### Task 8: Accessibility checks in light and dark

**Files:**
- Test: `tests/e2e/a11y.spec.ts`
- Modify: whatever component or style the failures point at.

**Interfaces:**
- Consumes: all pages from Tasks 4 and 6. The theme is forced through the `starlight-theme` localStorage key
  (Task 2).

- [ ] **Step 1: Write the tests**

`tests/e2e/a11y.spec.ts`:
```ts
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
```

- [ ] **Step 2: Run them**

Run: `npm run test:e2e -- a11y.spec.ts`
Expected: tests either pass or list specific violations.

- [ ] **Step 3: Fix every violation at its source**

- **Colour contrast:** use the `-text` tokens, or `--ink` / `--muted`. Never weaken the test, and never add an
  axe exclusion.
- **If a token value itself fails:** stop and report it rather than changing the brand. The token values are
  owner-approved.
- **For each fix,** the commit message names the axe rule ID it resolves.

- [ ] **Step 4: Re-run the full suite**

Run: `npm run test:unit && npm run test:e2e`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Accessibility: axe checks in light and dark, keyboard reachability

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g"
```

---

### Task 9: Analytics, CI, deploy workflow and contributor docs

**Files:**
- Create:
  - `src/components/Analytics.astro` and `src/components/docs/Head.astro`;
  - `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` and `.github/workflows/links-weekly.yml`;
  - `CONTRIBUTING.md`.
- Modify: `src/layouts/Landing.astro`, `astro.config.mjs` (the `Head` override), `README.md`
- Test: `tests/e2e/analytics.spec.ts`

**Interfaces:**
- Consumes: the npm scripts (Task 1) and `assets:verify` (Task 7).
- Produces: a GoatCounter tag with `data-goatcounter="https://troupe-run.goatcounter.com/count"` on every page
  of a production build.

- [ ] **Step 1: Write the failing test**

`tests/e2e/analytics.spec.ts`:
```ts
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
```

Run: `npm run test:e2e -- analytics.spec.ts`
Expected: FAIL, because there's no script yet.

- [ ] **Step 2: Implement analytics**

`src/components/Analytics.astro`:
```astro
---
const GOATCOUNTER = 'https://troupe-run.goatcounter.com/count';
---
{import.meta.env.PROD && <script is:inline async data-goatcounter={GOATCOUNTER} src="https://gc.zgo.at/count.js"></script>}
```

`src/components/docs/Head.astro`:
```astro
---
import Default from '@astrojs/starlight/components/Head.astro';
import Analytics from '../Analytics.astro';
---
<Default><slot /></Default>
<Analytics />
```

In `astro.config.mjs`, add to `components`:
```js
        Head: './src/components/docs/Head.astro',
```

In `src/layouts/Landing.astro`, import `Analytics` and render `<Analytics />` just before `<slot name="head" />`.

Run: `npm run test:e2e -- analytics.spec.ts`
Expected: 2 passed. Playwright serves `astro preview` of a production build, so `import.meta.env.PROD` is true.

- [ ] **Step 3: Write the workflows**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run check
      - run: npm run test:unit
      - run: npm run build
      - run: npm run assets:verify
      - run: npm run linkcheck
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v5
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

`.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    if: github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ github.event.workflow_run.head_sha }}
          fetch-depth: 0   # Starlight's "Last updated" reads git history
      - uses: withastro/action@v6
        with:
          node-version: 22
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

`.github/workflows/links-weekly.yml`:
```yaml
name: External links (weekly, warning only)
on:
  schedule:
    - cron: '17 3 * * 1'
  workflow_dispatch:
permissions:
  contents: read
jobs:
  links:
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npx linkinator dist --recurse --skip "github.com/troupe-run/troupe.run" --skip "gc.zgo.at"
```

Before writing the files, confirm the action major versions still exist:
`gh api repos/actions/upload-artifact/releases/latest --jq .tag_name`. Use that major version. The others were
confirmed on 2026-10-07: checkout v7, setup-node v7, withastro/action v6, deploy-pages v5. Also confirm that
`withastro/action@v6` accepts the `node-version` input by reading its `action.yml`:
`gh api repos/withastro/action/contents/action.yml --jq .content | base64 -d`.

Lint the workflows: `npx --yes actionlint@2.0.6 .github/workflows/*.yml`.
Expected: no output. If that package can't run on this machine, say so in your report; the final review will
read the workflows by hand.

- [ ] **Step 4: Write `CONTRIBUTING.md` and update `README.md`**

`CONTRIBUTING.md`:
```md
# Contributing to troupe.run

Thanks for helping. This repo is the troupe.run website and docs.

## Fixing or improving a docs page

Every docs page has an **Improve this page** link that opens its source here. If you don't have write access,
GitHub makes a fork and a pull request for you.

## Running it locally

- Node 22 or later, then `npm install`.
- `npm run dev` serves the site at http://localhost:4321.
- `npm run test:unit` and `npm run test:e2e` run the tests. The e2e suite builds the site first.
- Brand images are rendered from `brand/`. If you change anything there, run `npm run assets:render` and commit
  the results. CI checks they match.

## Licensing of contributions

Contributions to this repo are accepted under its own licences: MIT for code (`LICENSE`) and CC BY 4.0 for
content (`LICENSE-CONTENT`). There's no separate agreement to sign. troupe's product repo will require a
contributor licence agreement when it's published; this site does not.

The troupe name, logo, mark and characters are trademarks of HPS.GD PTY LTD and aren't covered by either
licence.
```

Append to `README.md`, before the `## Licence` heading:
```md
## Development

See [CONTRIBUTING.md](CONTRIBUTING.md). Design: `docs/superpowers/specs/2026-10-07-troupe-run-site-design.md`.
Brand: `docs/brand-guide.md`.
```

- [ ] **Step 5: Run every CI step locally, in CI order**

Run: `npm ci && npm run check && npm run test:unit && npm run build && npm run assets:verify && npm run linkcheck && npm run test:e2e`
Expected: every step succeeds. linkinator reports 0 broken links.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "GoatCounter (production only), CI and Pages deploy workflows, CONTRIBUTING

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ASzaj4mttbfmLs561Bca3g"
```

---

### Task 10: Owner review, then launch (owner-gated: no subagent runs this task)

This task is run by the controlling session, with the owner, one gate at a time. Every step that changes
something outside this machine needs the owner's explicit go-ahead at the time it's done.

- [ ] **Step 1: Copy and layout review.**
  - Run `npm run dev`.
  - The owner reviews:
    - every file in `src/content/copy/`;
    - the six written docs pages;
    - the problem section's layout in context, at desktop and phone width, in light and dark.
  - Apply the owner's edits. Commit them as "Copy: owner review".
- [ ] **Step 2: Brand output review.** The owner looks at `public/og.png` and everything in `brand/out/`. Apply
  any changes in `brand/`, run `npm run assets:render`, and commit.
- [ ] **Step 3: GoatCounter.**
  - The owner creates a GoatCounter site with the code `troupe-run`.
  - If they choose a different code, change `GOATCOUNTER` in `src/components/Analytics.astro` and the
    expectation in `tests/e2e/analytics.spec.ts`, then commit.
- [ ] **Step 4: Check DNS.** Run:
  ```bash
  for ns in $(dig +short NS troupe.run); do dig +short @$ns www.troupe.run CNAME; done
  ```
  Expected: `troupe-run.github.io.` from every nameserver. If not, tell the owner the record value is wrong
  before going any further.
- [ ] **Step 5: Check Pages settings (read-only).** Run:
  `gh api repos/troupe-run/troupe-run.github.io/pages`.
  Report `build_type`, `cname` and `https_enforced`.
- [ ] **Step 6, with the owner's go-ahead: switch Pages to Actions.**
  - If `build_type` isn't `workflow`, run:
    `gh api -X PUT repos/troupe-run/troupe-run.github.io/pages -f build_type=workflow -f cname=troupe.run`
  - If Pages isn't enabled at all (404), use `-X POST` instead.
- [ ] **Step 7, with the owner's go-ahead: push.**
  - Run `git push origin main`.
  - Then `gh run watch` the CI run, and the Deploy run that follows it.
  - Report both conclusions.
- [ ] **Step 8: Verify the live site.**
  - Run:
    ```bash
    curl -sI https://troupe.run/ | head -1
    curl -sI http://www.troupe.run/ | grep -i '^location'
    curl -s https://troupe.run/docs/programme/what-is-troupe/ | grep -c 'Improve this page'
    ```
  - Expected:
    - an HTTP 200 for the apex;
    - `www` redirects to `https://troupe.run/`;
    - a count of 1 or more.
  - If the certificate isn't issued yet, the apex check fails on TLS. Wait and retry; don't change settings to
    work around it.
- [ ] **Step 9, with the owner's go-ahead: enforce HTTPS** once the certificate exists:
  `gh api -X PUT repos/troupe-run/troupe-run.github.io/pages -F https_enforced=true`
- [ ] **Step 10: Manual uploads (the owner does these).** GitHub has no API for either:
  - the org avatar: `brand/out/github-avatar.png` → github.com/organizations/troupe-run/settings/profile;
  - the repo social preview: `brand/out/repo-preview.png` → this repo's Settings → Social preview.
- [ ] **Step 11: Before driving any traffic,** `github.com/troupe-run/troupe.run` must exist and be public (spec
  §10). Until then, leave the site unannounced.
