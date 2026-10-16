# Proposal: adopt the org workflow so the website can receive the guard

## Why

troupe-run/infrastructure is about to deliver the development-workflow guard to this repository
(troupe-run/infrastructure#54, change `govern-website`). The guard needs three things from a repository before it
arrives: `openspec/changes/` to match branches against, a `scripts/check.py` its commit hook runs with `uv run`, and
`uv` on contributors' machines. Without them, the first local commit and every pull request would be refused
(`govern-website` design D1). This change puts them on `main` first, by the website's own pull request (#7).

## What Changes

- **OpenSpec.** Already on this branch (`chore(openspec)`, from `openspec init`, with the site's context). This
  change is the first one in it, and the pull request archives it before merging.
- **`scripts/check.py`.** A stdlib-only uv script that runs CI's steps in CI's order: `npm ci`, Playwright's
  Chromium, `npm run check`, `test:unit`, `build`, `assets:verify`, `linkcheck`, `test:e2e`. It stops at the first
  failure and prints `check: <gate> failed`, the line the guard quotes. If `scripts/guard.py` is present, it turns the
  git hooks on through it, as troupe's does; until the delivery, it skips that.
- **`scripts/check-paths.toml`.** `version = 1`, with a `skip` group for paths no gate reads: `openspec/**`, so
  proposing, ticking and archiving don't run the build and e2e suite, and the contributor and design documents.
  No scopes (`govern-website`: the guard's tag check has no JavaScript adapter).
- **CI.** The `test` job installs uv and runs `uv run scripts/check.py`, so local and CI checks can't diverge. The job
  keeps its name, because `test` is the required check.
- **CONTRIBUTING.md and a new CLAUDE.md.** Install uv; the workflow (issue, OpenSpec change on a branch named after
  it, pull request that closes the issue, archive, rebase merge); Conventional Commits; no sign-off. CONTRIBUTING also
  says how an outside **Improve this page** fix is taken in: its fork pull request fails the `guard` check, and a
  maintainer carries it onto a change branch, credits the author with `Co-authored-by:`, and closes the fork pull
  request when theirs merges (`govern-website` design D8).

Out of scope:
- Every path the guard delivers: `scripts/guard.py`, `scripts/guard_pytest.py`, `.githooks/*`,
  `.claude/settings.json`, `.github/workflows/guard.yml`, `.github/guard-delivery.json`. The delivery doesn't
  overwrite an existing file, so adding any of them would break it.
- DCO sign-off and a release process: there are neither (owner, 2026-10-16).
- Rewriting earlier commits to Conventional Commits (`govern-website` design D7).
- Changing the **Improve this page** link (`govern-website` design D8).
- GitHub settings (required checks, rulesets, projects): declared in troupe-run/infrastructure.

## Capabilities

### New Capabilities

- `quality-check`: the one command that runs every gate CI runs, in CI's order, locally and in CI; what it prints
  when a gate fails; which paths need no check; and turning the git hooks on.
- `contributing`: what the repository tells a contributor, person or agent, about the workflow, its tools, its commit
  rules and its licensing, and how an outside fix reaches `main`.

### Modified Capabilities

None. `openspec/specs/` is empty.

## Impact

- New: `scripts/check.py`, `scripts/check-paths.toml`, `scripts/tests/` (stdlib `unittest` for `check.py`),
  `CLAUDE.md`.
- Changed: `.github/workflows/ci.yml` (the `test` job's steps), `CONTRIBUTING.md`, `README.md` (its Development
  section points at the check).
- New tool for contributors: uv. Python comes through uv; nothing is added to `package.json`.
- The check's run time is measured on macOS and recorded in the pull request. It has to stay under the guard's
  10-minute commit limit.
- Unblocks troupe-run/infrastructure#54's plan.
