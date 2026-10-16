# Tasks

## 1. The check

- [x] 1.1 Write `scripts/tests/test_check.py` first (design D10): gate order and labels (D2), stop at the first failure
  with `check: <label> failed (exit N)`, a missing `npm`/`npx` exits before any gate, any argument (`--scope docs`)
  is refused before any gate, `--with-deps` only when `CI` is set (D3), and hook activation with a stand-in
  `guard.py` (called in a git checkout including a worktree's `.git` file, not called without `.git`, not attempted
  without `guard.py`). Verify each test fails for the right reason before `check.py` exists:
  `uv run --no-project python -m unittest discover -s scripts/tests`.
- [x] 1.2 Write `scripts/check.py` (D1–D4): PEP 723 metadata with no dependencies, the nine gates, timed and announced,
  optional guard activation. Verify the 1.1 tests pass, and that `head -20 scripts/check.py` shows no third-party
  import.
- [x] 1.3 Run `uv run scripts/check.py` with a gate broken on purpose (a temporary failing unit test, not committed)
  and verify the last line is `check: unit tests failed (exit 1) …`, no later gate ran, and the exit code is 1.

## 2. What needs no check

- [x] 2.1 Add tests to `scripts/tests/test_check.py` for `scripts/check-paths.toml` (D5, D10): it parses with
  `tomllib`, `version = 1`, `skip` includes `openspec/**`, no `scopes`; no gate source names a skipped path; and the
  guard-backed scope test, skipped with "the guard isn't delivered yet" when `scripts/guard.py` is absent. Verify they
  fail without the file.
- [x] 2.2 Write `scripts/check-paths.toml` (D5), with a header comment saying what reads it and why each path is
  skipped. Verify the 2.1 tests pass.
- [x] 2.3 Copy troupe's `scripts/guard.py` into a temporary copy of this repository (never into this working tree) and
  run the guard-backed test there. Verify an OpenSpec-only commit needs no check and an OpenSpec-plus-`src/` commit
  needs the full check, and record the output here.
  Result (troupe's `guard.py` at fa7f74b, delivered from infrastructure df48cf5d7e94): the guard-backed test and
  all 14 others pass, none skipped. Through the real guard, `check.activate_git_hooks` set `core.hooksPath` to
  `.githooks` and printed its notice, and a second call returned `None`. That run found a loader bug the first
  stand-in hid: a module loaded from a path must be in `sys.modules` before it runs, or the guard's dataclasses fail
  under `from __future__ import annotations`. Fixed, and the stand-in now has both, so the tests catch it.

## 3. CI and the e2e server

- [ ] 3.1 Change `.github/workflows/ci.yml`'s `test` job (D6): keep checkout and `setup-node`, add `astral-sh/setup-uv`
  pinned to `1c37ad07a6a961277cf70c0d37d6f313000f5884 # v10.3.0`, replace the eight `run` steps with
  `uv run scripts/check.py`, keep the report upload on failure and the job name `test`. Verify with
  `grep -c "run: npm" .github/workflows/ci.yml` (0) and on the pull request: the `test` job's log shows check.py's
  gate lines and it passes.

- [ ] 3.2 Write `tests/unit/e2e-port.test.ts` first (design D11): an unset `E2E_PORT` gives a port that can be
  listened on and is written back to the environment; `E2E_PORT=4329` gives 4329; `abc`, empty, `80` and `70000` throw
  an error naming `E2E_PORT`, the value and the range; and the preview command carries `--ignore-lock`. Verify they
  fail before `tests/e2e/port.ts` exists.
- [ ] 3.3 Write `tests/e2e/port.ts` and use it in `playwright.config.ts`; update CONTRIBUTING's mention of port 4329.
  Verify the 3.2 tests pass.
- [ ] 3.4 In this Claude Code session (`CLAUDECODE=1`), with another `astro preview` listening on 4329, run
  `npm run test:e2e` and verify it passes on another port and that `lsof -iTCP -sTCP:LISTEN` shows no preview server
  of this worktree's left afterwards. Run it with `E2E_PORT=4339` and verify the server listened on 4339.

## 4. Contributor docs

- [x] 4.1 Update `CONTRIBUTING.md` (spec `contributing`, D8, D9): install uv and Node; `uv run scripts/check.py`
  before every commit and in CI, and that it reinstalls `node_modules`; the workflow's five steps with a rebase merge;
  Conventional Commits; no sign-off, no CLA; the licences and trademark exception (kept); how an outside
  **Improve this page** fix is carried, with `Co-authored-by:`. Verify each `contributing` scenario against the text.
- [x] 4.2 Write `CLAUDE.md` (D9): what this repository is, pointing at `openspec/config.yaml`; the workflow; the check;
  Conventional Commits with no sign-off; the guard's files come from troupe-run/infrastructure; follow a refusal's
  fix. Verify the "An agent starts a session" scenario against the text.
- [x] 4.3 Point `README.md`'s Development section at the check and CONTRIBUTING. Verify `npm run linkcheck` still
  passes (README isn't in the build, so also check its links by eye).
- [ ] 4.4 Follow CONTRIBUTING's set-up steps literally in a fresh clone of this branch and verify
  `uv run scripts/check.py` runs to completion. Then show the owner CONTRIBUTING.md and CLAUDE.md as text for review
  (copy rule) and fold in their changes.

## 5. Integration

- [ ] 5.1 Time the full check on macOS from a clean `node_modules` (`rm -rf node_modules dist && time uv run
  scripts/check.py`), with each gate's time (D7). Verify it's under 600 s; if it's over about 420 s, stop and raise the
  e2e double build with the owner before going on.
- [ ] 5.2 Verify the branch adds none of the delivered paths: `git diff --name-only main... -- scripts/guard.py
  scripts/guard_pytest.py .githooks .claude/settings.json .github/workflows/guard.yml .github/guard-delivery.json`
  prints nothing.
- [ ] 5.3 Verify every commit on the branch is a Conventional Commit with no `Signed-off-by:`:
  `git log --format=%s main..` and `git log --format=%b main.. | grep -c Signed-off-by` (0).
- [ ] 5.4 Run `openspec validate adopt-org-workflow --strict` and verify it passes.

## Workflow follow-up

- Open the pull request with `Closes #7` and `Refs troupe-run/infrastructure#54`, with 5.1's timing table in its body.
- Archive the change on the branch (`/opsx:archive`), so `openspec/specs/quality-check` and
  `openspec/specs/contributing` land with the code.
- Merge by rebase. Then check #7 is closed and its roadmap card says Done, and comment on #7 and on
  troupe-run/infrastructure#54 that the prerequisite has merged.
