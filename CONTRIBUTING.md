# Contributing to troupe.run

Thanks for helping. This repo is the troupe.run website and docs. It has its own guide, so the org-wide one in
[troupe-run/.github](https://github.com/troupe-run/.github) doesn't apply here: in particular, there's no sign-off.

## Fixing or improving a docs page

Every docs page has an **Improve this page** link that opens its source here. If you don't have write access,
GitHub makes a fork and a pull request for you.

Your pull request's `guard` check will fail, and that's expected. The check wants every change to arrive through
the workflow below, on a branch named after an OpenSpec change, and GitHub's editor can't do that. A maintainer
carries your fix through it instead: they put it on a change branch of their own, credit you as its co-author with a
`Co-authored-by:` line, link your pull request from theirs, and close yours when theirs merges. You don't need to do
anything else.

## Setting up

- [uv](https://docs.astral.sh/uv/getting-started/installation/), which runs the check (`brew install uv` on a Mac).
- Node 22 or later (the version in `.nvmrc`), then `npm install`.

## Running it locally

- `npm run dev` serves the site at http://localhost:4321.
- `uv run scripts/check.py` runs every check CI runs, in the same order: `npm ci`, Playwright's browser,
  `astro check`, the unit tests, the build, the brand-asset check, the internal link check and the end-to-end tests.
  It stops at the first failure and says which one. `npm ci` reinstalls `node_modules`, so a dev server that's
  running at the time may need a restart.
- `npm run test:unit` and `npm run test:e2e` run the tests on their own. The e2e suite builds the site and serves it
  on its own port (4329), so it never reuses your dev server. `npm run preview` serves a build on 4321 for you.
- Brand images are rendered from `brand/`. If you change anything there, run `npm run assets:render` and commit
  the results. The check makes sure they match.

## How work flows

Every change follows one path. Git hooks and Claude Code hooks, delivered from
[troupe-run/infrastructure](https://github.com/troupe-run/infrastructure), enforce it, and
[development-workflow.md](https://github.com/troupe-run/infrastructure/blob/main/docs/development-workflow.md) lists
every rule.

1. **An issue says what and why.**
2. **An OpenSpec change says how.** It lives under `openspec/changes/<name>/`, on a branch named exactly `<name>`,
   with a proposal, spec deltas, a design and tasks. Its proposal cites the issue.
3. **A pull request delivers it.** It closes the issue (`Closes #12`). Specs, code and tests change together, and
   `uv run scripts/check.py` passes before every commit.
4. **Before the merge,** the change is archived on its branch, which updates `openspec/specs/`. The pull request is
   merged by rebase.
5. **After the merge,** the issue gets a comment linking the pull request and the change.

Commit messages are [Conventional Commits](https://www.conventionalcommits.org/): `feat(docs): ...`,
`fix(header): ...`, `ci: ...`.

## Licensing of contributions

Contributions to this repo are accepted under its own licences: MIT for code (`LICENSE`) and CC BY 4.0 for
content (`LICENSE-CONTENT`). There's no separate agreement to sign and no sign-off: no DCO, no CLA. troupe's product
repo ([troupe-run/troupe](https://github.com/troupe-run/troupe)) asks for a Developer Certificate of Origin
sign-off on each commit (`git commit -s`); this site does not.

The troupe name, logo, mark and characters are trademarks of HPS.GD PTY LTD and aren't covered by either
licence.
