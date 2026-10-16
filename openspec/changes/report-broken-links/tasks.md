# Tasks

## 1. Shared linkinator parsing (D6)

- [x] 1.1 Before touching anything, run `npm ci && npm run build && npm run linkcheck` on this branch and save the
  stdout and exit code (scratchpad) as the baseline. Verify: file saved, exit code 0.
- [x] 1.2 Move run-and-parse into `scripts/linkinator-lib.mjs`: `runLinkinator(dir, skips, extraArgs)` and a pure
  `summarise(result)` that returns `{ scanned, skipped, broken }`. Add `tests/unit/linkinator-lib.test.ts`, with
  fixtures copied from a real `linkinator --format json` run (not hand-written). Cover: broken links are counted,
  skipped links are excluded from `scanned`, and a result with no `links` gives zero scanned. Verify: `npm run
  test:unit` passes.
- [x] 1.3 Change `scripts/linkcheck.mjs` to use the library, keeping its skip, thresholds and messages. Verify: rerun
  build + `npm run linkcheck`. The stdout and exit code match the 1.1 baseline line for line, apart from link counts
  if the build changed. Then point it at an empty directory and confirm it still exits 1 with the "not checking
  anything" message.
- [x] 1.4 Commit ("share linkinator parsing so the weekly check reuses CI's empty-scan guard").

## 2. Skip list (D7)

- [x] 2.1 Settle the `gc.zgo.at` question: `curl -sI https://gc.zgo.at/count.js` and a local
  `npx linkinator https://gc.zgo.at/count.js`. Record the result in the skip's reason, or drop the entry if it
  answers 200 and no reason holds. Verify: the outcome is written in the commit message.
- [x] 2.2 Create `scripts/external-skips.mjs` exporting `[{ pattern, reason }]`, with no `troupe-run/troupe` entry.
  Add `tests/unit/external-skips.test.ts`, testing that every entry has a non-empty pattern and reason, that each
  pattern compiles as a RegExp, and that `https://github.com/troupe-run/troupe` matches no skip. Verify: `npm run
  test:unit` passes. Temporarily re-add the troupe skip and confirm the last test fails, then revert.
- [x] 2.3 Commit.

## 3. Report formatting and issue decision (D3, D4, D8)

- [x] 3.1 In `scripts/linkcheck-external-lib.mjs`, write a pure `decide({ broken, scanned, crashed, openIssues })`
  that returns `{ action: 'open' | 'comment' | 'close' | 'none', issue? }`. Add `tests/unit/linkcheck-external.test.ts`
  with one test per spec scenario, each named for what it asserts:
  - broken and no open issue → `open`
  - broken and an open issue → `comment` on it
  - broken and two matching issues → `comment` on the oldest, never `open`
  - clean and an open issue → `close`
  - clean and no issue → `none`
  - zero scanned → `none`
  - crashed → `none`

  Verify: `npm run test:unit` passes.
- [x] 3.2 Add a pure `matchTrackingIssues(issues)`: exact title `Broken external links`, author
  `app/github-actions`, open, sorted oldest first. Test that a near-miss title ("Broken external links (old)") and
  an issue by a person are excluded. Verify: unit tests pass.
- [x] 3.3 Add a pure `formatReport({ broken, runUrl })` that returns Markdown: a table of URL | status | found on, a
  run link, the "closes itself after a clean weekly run" line, and the note that triage adds the issue to the roadmap
  board by hand. Cap it at 100 rows with "+N more". Test the table rows against fixture links, that a `|` in a URL is
  escaped, and the cap with 101 links. Verify: unit tests pass.
- [x] 3.4 Add a pure `exitCode({ broken, scanned, crashed, reportFailed })`: 1 when any input is bad, 0 otherwise.
  Test each case. Verify: unit tests pass.
- [x] 3.5 Commit.

## 4. The external check script and workflow (D2, D4, D5)

- [x] 4.1 Confirm linkinator 8.1.0 supports `--retry`, `--retry-errors`, `--retry-errors-count`,
  `--retry-errors-jitter` and `--timeout` (`npx linkinator --help`). If any is missing, note it in design D5 and use
  the nearest supported flag. Verify: `--help` output pasted into the commit message.
- [x] 4.2 Write `scripts/linkcheck-external.mjs` to wire it together:
  - run linkinator over `dist` with the skips and retry flags, then summarise;
  - write `formatReport` to `$GITHUB_STEP_SUMMARY` when it's set;
  - list issues with `gh issue list --state open --author app/github-actions --json number,title,createdAt,author`,
    then `decide`, then carry out the action with `gh issue create --label bug`, `gh issue comment` or
    `gh issue close --comment`;
  - exit with `exitCode`.

  Without `GITHUB_ACTIONS`, skip the issue step and print the decision instead. Verify: run it locally on a built
  `dist`. It prints the scanned count, the decision (`none`) and exits 0. Point it at a dist with a link to
  `https://troupe.run/definitely-not-here-404` added, and it reports the link, prints decision `open` and exits 1.
- [x] 4.3 Add `"linkcheck:external": "node scripts/linkcheck-external.mjs"` to `package.json`. Update
  `links-weekly.yml`:
  - rename it to "External links (weekly)";
  - remove `continue-on-error`;
  - set `permissions: { contents: read, issues: write }`;
  - give the step `GH_TOKEN: ${{ github.token }}` and run `npm run linkcheck:external`;
  - keep the `schedule` and `workflow_dispatch` triggers and add no `pull_request` trigger.

  Verify: `gh workflow view` lists both triggers. `git grep -n continue-on-error .github` is empty.
- [x] 4.4 Commit.

## 5. Follow-ups, design spec and docs

- [x] 5.1 Open two follow-up issues in troupe-run/infrastructure, each with `--project "troupe roadmap"`:
  - a GitHub App token, declared there, so `links-weekly.yml` can add its issue to the troupe roadmap board;
  - a scheduled watcher that checks troupe-run/website's `links-weekly.yml` is enabled and has a run under 8 days
    old, and opens an issue when either isn't true. Explain why it can't live in website (60-day schedule rule) and
    why the self-keepalive was rejected.

  Link both from troupe-run/website#5. Verify: `gh issue view <n> -R troupe-run/infrastructure --json projectItems`
  shows the board for each.
- [x] 5.2 Update `docs/superpowers/specs/2026-10-07-troupe-run-site-design.md`:
  - §6.1 item 4: external links are checked weekly; a broken one fails that run and opens or updates one issue, and
    a clean run closes it. Point at `openspec/specs/link-checking`. Note that GitHub turns the schedule off after 60
    days without repository activity, and that the watcher for that lives in troupe-run/infrastructure (link the
    issue from 5.1).
  - §10: strike the product-repo exclusion, noting it was public by 2026-10-16 and is checked from this change.

  Verify: `git grep -n "only warn\|excludes that one URL" docs` is empty.
- [x] 5.3 Mention the weekly check and its issue in `CONTRIBUTING.md` only if CONTRIBUTING already describes CI's
  checks. Otherwise leave it. Verify: decision noted in the commit.
- [x] 5.4 Commit.

## 6. End-to-end check on the branch (integration)

- [ ] 6.1 Run CI's full set locally (`npm run check && npm run test:unit && npm run build && npm run assets:verify
  && npm run linkcheck && npm run test:e2e`). Verify: all pass, output shown.
- [ ] 6.2 Tell the owner this step opens a real issue in troupe-run/website, then go ahead. Push the branch. On a
  throwaway commit, add a link to `https://troupe.run/definitely-not-here-404` on one docs page. Run `gh workflow run
  links-weekly.yml --ref report-broken-links`. Verify: the run is red, its summary lists the link, and one
  `Broken external links` issue is opened with the table and run link.
- [ ] 6.3 Run it again. Verify: a comment is added to the same issue, and `gh issue list --search "Broken external
  links in:title" --state open` shows exactly one.
- [ ] 6.4 Drop the throwaway commit, push, and run it again. Verify: the run is green, the issue is closed with a
  comment linking to the clean run, and the run actually requested `github.com/troupe-run/troupe` (seen in the run's
  log or summary).
- [ ] 6.5 Comment on the test issue that it was this change's end-to-end test.

## Workflow follow-up

- Open the PR with `Closes #5`. After merge, check that #5 is closed and its board card says Done, per the
  board-sync rule. Comment on #5 with the PR and the archived change.
- Archive the change with `/opsx:archive` once merged.
