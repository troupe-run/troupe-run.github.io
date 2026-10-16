# Design: adopt-org-workflow

## Context

See proposal.md for why, and the `quality-check` and `contributing` specs for what. What exists today:

- CI's `test` job (`.github/workflows/ci.yml`, ubuntu only) runs `npm ci`, `npx playwright install --with-deps
  chromium`, then `npm run check`, `test:unit`, `build`, `assets:verify`, `linkcheck` and `test:e2e`, and uploads
  `playwright-report/` on failure. `deploy.yml` runs after a successful CI run on a push to `main`.
- Playwright's `webServer` runs `npm run build && astro preview --port 4329`, so a full run builds the site twice.
- The repository has no Python. troupe's and infrastructure's `scripts/check.py` are the model: a list of
  `(label, command)` gates, each announced, timed, and stopped at the first failure with
  `check: <label> failed (exit N) after T s`. Both `import guard` unconditionally, for scopes and hook activation.
- The guard runs `uv run --quiet scripts/check.py [--scope ...]` before a commit, gives up after 600 s, and passes
  `--scope` only for scopes the repository declares. Its CI workflow installs uv with `astral-sh/setup-uv`, pinned by
  SHA (`1c37ad07…`, v10.3.0).
- The org's `CONTRIBUTING.md` (troupe-run/.github) asks for a DCO sign-off and says the website has its own guide.
- `openspec/` is already on this branch, with the site's context.
- No gate reads `openspec/`, `.claude/`, `docs/` (the brand guide and the original design), `README.md`,
  `CONTRIBUTING.md` or `CLAUDE.md`: a search of `src/`, `tests/`, `scripts/`, `astro.config.mjs` and the test configs
  finds none of them. Starlight's content is `src/content/docs/`, not `docs/`.

## Goals / Non-Goals

**Goals:**
- `check.py` works today, with no guard, and keeps working unchanged once the guard is delivered.
- CI has no gate of its own: every gate is in `check.py`.

**Non-Goals:**
- Windows. CI is ubuntu-only and so is the site's toolchain today. `check.py` finds tools with `shutil.which`, so it
  isn't knowingly Linux-only, but nothing tests it on Windows.
- Scopes (`govern-website` non-goal: no JavaScript adapter for the guard's tag check).
- Making the check faster. It's measured first (D7).

## Decisions

### D1. A stdlib uv script with no project environment

`scripts/check.py` carries PEP 723 inline metadata: `requires-python = ">=3.12"` and `dependencies = []`. `uv run
scripts/check.py` then needs no `pyproject.toml` and no lockfile; uv finds or downloads a matching Python. The guard
runs it exactly that way.

*Why not a `pyproject.toml` with ruff and mypy, as troupe has?* The site's code is TypeScript. A Python project would
exist only to lint one script, and every contributor would sync it. If the Python grows, that's the time.

### D2. The gates and their labels

| # | Label | Command |
|---|---|---|
| 1 | `check.py tests` | `python -m unittest discover -s scripts/tests` (this interpreter) |
| 2 | `npm ci` | `npm ci` |
| 3 | `playwright chromium` | `npx playwright install chromium` (plus `--with-deps` in CI, D3) |
| 4 | `astro check` | `npm run check` |
| 5 | `unit tests` | `npm run test:unit` |
| 6 | `build` | `npm run build` |
| 7 | `assets verify` | `npm run assets:verify` |
| 8 | `link check` | `npm run linkcheck` |
| 9 | `e2e tests` | `npm run test:e2e` |

The labels are what `check: <label> failed` prints and the guard quotes, so they're plain words a reader can map to a
command. The check's own tests come first: they take about a second, and a broken runner shouldn't cost a full build
before it shows. `npm` and `npx` are resolved with `shutil.which` before any gate runs; a missing one exits with
`check: npm isn't on the PATH. Fix: install Node <.nvmrc> or later (https://nodejs.org).`

### D3. OS packages for Chromium only in CI

`--with-deps` installs the OS libraries Chromium needs, which on Linux needs root. On a contributor's Mac it's a no-op
and on a contributor's Linux box it would prompt for `sudo` inside a commit hook. So `check.py` adds `--with-deps`
only when the `CI` environment variable is set (GitHub Actions sets `CI=true`), as `playwright.config.ts` already
branches on `CI`.

*Alternative:* a separate CI step before `check.py`. Rejected: it would run `npx playwright` before `npm ci`, so
against whatever version `npx` fetches, and it puts a step back in CI that the check doesn't have.

### D4. The guard is optional until it's delivered

`check.py` doesn't `import guard` at the top. When `scripts/guard.py` exists and the root has a `.git` (a directory,
or a file in a worktree), it loads the module and calls `guard.activate_hooks(root)`, printing a non-`None` notice as
`check: <notice>`. Otherwise it does nothing. No `--scope` handling: the declaration has no scopes, so the guard never
passes one, and `argparse` with no options refuses any argument with a usage error (exit 2) before a gate runs. If
scopes are added later, that change adds `--scope` with them.

*Why not import troupe's `check.py` structure as is?* It needs `guard.py` to import, and the guard can't arrive before
the check works (`govern-website` D1).

### D5. `check-paths.toml` skips what no gate reads

```toml
version = 1

[skip]
paths = ["openspec/**", ".claude/**", "docs/**", "CLAUDE.md", "CONTRIBUTING.md", "README.md"]
```

Each listed path is read by no gate today (Context). Unlike troupe, nothing here enforces that at test time, so two
things back it up: a `check.py` test fails if any gate source (`src/`, `tests/`, `scripts/*.mjs`, `astro.config.mjs`,
`playwright.config.ts`, `vitest.config.ts`, `package.json`) names a skipped path, and CI ignores the declaration and
runs the full check on every pull request. The worst case of a wrong entry is a commit whose check is skipped and a
pull request whose CI fails.

*Alternative:* `openspec/**` only, the issue's minimum. Rejected: brand-guide and contributor-doc commits would run a
full build and e2e suite that can't be affected by them.

### D6. CI runs the check and nothing else

The `test` job keeps checkout (`fetch-depth: 0`), `setup-node` (with the npm cache), adds `astral-sh/setup-uv` pinned
to the same SHA the guard's workflow uses, runs `uv run scripts/check.py`, and keeps the `playwright-report/` upload on
failure. The job's name stays `test`. The weekly external-link workflow and `deploy.yml` don't change.

### D7. Measure, then decide

The guard stops a commit's check after 600 s. The full check is run on macOS from a clean `node_modules`, timed per
gate, and the totals go in the pull request. If it's over about 7 minutes (leaving headroom for slower machines), the
first lever is the e2e suite's second build: Playwright's `webServer` can serve the `dist/` the build gate just made.
That would be a change to the e2e set-up and is decided then, not now.

### D8. `npm ci` on every full check

`npm ci` deletes `node_modules` and reinstalls from the lockfile. That's what CI does, so it's what the check does: a
check that passes on a stale `node_modules` and fails in CI is the divergence the check exists to stop. The cost is a
few seconds per commit (measured on macOS while proposing: about 5 s from empty, 7 s over an existing
`node_modules`) and a dev server that loses its modules while the check runs; CONTRIBUTING says so.

*Alternative:* `npm install`. Rejected: it can rewrite `package-lock.json` and tests something CI doesn't.

*Deferred:* skip `npm ci` locally when a fingerprint of `package-lock.json` and the Node version, saved after the last
`npm ci`, still matches. CI would be unchanged, since it always starts with no `node_modules`. Not done for now (owner,
2026-10-16: keep it simple). Raise it if losing a running dev server becomes a real annoyance.

### D9. The contributor docs stand alone

The website's CONTRIBUTING.md doesn't link the org's guide, because that guide asks for a DCO sign-off. It states the
workflow itself, in the org guide's five steps without sign-off, and links infrastructure's
`docs/development-workflow.md` for the guard's rules. CLAUDE.md follows troupe's: what the repository is, the
workflow, Conventional Commits with no sign-off, the check, and how to respond to a guardrail. It says the guard's
files are delivered from troupe-run/infrastructure and changed there. Both are reviewed by the owner as text.

### D10. Tests for `check.py` use the standard library

`scripts/tests/test_check.py` uses `unittest` and temporary directories and repositories. It checks: the gate order and
labels against D2; that a failing gate stops the run and prints the failure line with its exit code; that a missing
tool exits before any gate; that an argument is refused before any gate; hook activation with a stand-in `guard.py`
(called in a git checkout, not called without `.git`, and not attempted without `guard.py`); that
`check-paths.toml` parses with `tomllib`, has `version = 1`, skips `openspec/**`, and declares no scopes; and D5's
gate-source scan. Gates are injected, so no test runs npm.

One more test runs only once `scripts/guard.py` exists: it asks `guard.check_scope` what an OpenSpec-only commit and a
mixed commit need. Until the delivery it's skipped with the reason "the guard isn't delivered yet", and during apply
it's run once against troupe's `guard.py` copied into a temporary directory, with the result recorded in the task.

### D11. The e2e server stays in the foreground, on a free port

Found while verifying task 4.4. Astro 7's `astro preview` moves itself into the background when it detects a coding
agent (`CLAUDECODE`, `AI_AGENT`). Playwright's `webServer` then sees its process exit, fails with "exited early", and
the server is left running, holding its port. Every agent commit runs the check through the guard, so every one would
be refused. A server left behind this way by another session was found holding 4329.

- **`--ignore-lock`** on the `webServer` command. Astro turns off agent backgrounding when it's set, and it starts
  without checking for another preview server, so Playwright owns the process and stops it. Chosen over setting
  `ASTRO_PREVIEW_BACKGROUND` in `check.py`, which would fix only runs made through the check.
- **A free port per run** (owner, 2026-10-16). Every commit now runs e2e, so two worktrees running it at once is
  ordinary. `tests/e2e/port.ts` resolves the port once: `E2E_PORT` if it's set, otherwise a port the OS reports free,
  which it writes back to `E2E_PORT`. Playwright loads the config again in each worker, and the workers inherit that
  environment, so they all get the same port. A set but malformed `E2E_PORT` is an error, never a fall-through to a
  free port. The free port is found by a short `node` child process, because Playwright loads its config synchronously.
  Between that process freeing the port and Astro binding it, another process could take it. Then Playwright's
  `reuseExistingServer: false` refuses to start ("already used"), so the run fails loudly and never tests another site.

## Risks / Trade-offs

- [The full check is over the guard's limit on a slow machine] → D7 measures and records it; the e2e double build is
  the known lever.
- [A contributor has no uv] → CONTRIBUTING's first step installs it; the guard's refusal names it once it arrives.
- [The guard's activation API changes] → the guard and `check.py` meet only at `activate_hooks(root)`. troupe and
  infrastructure call the same function, so a change there breaks all three visibly.
- [A skipped path becomes a gate input] → D5's test and CI's full run.
- [This change adds a delivered path by accident] → a task checks the branch's diff for each of the six delivered
  paths before the pull request.

## Migration Plan

1. This branch: the change's commits, each Conventional, ending with the archive.
2. The pull request (`Closes #7`) passes `test`, which is now `uv run scripts/check.py`. Its body records D7's timing.
3. Rebase merge. troupe-run/infrastructure#54's plan can then be applied.

Rollback: revert the pull request. CI's old steps come back with `ci.yml`.
