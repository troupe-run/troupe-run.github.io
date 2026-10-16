# Design

## Context

- `links-weekly.yml` builds the site and runs `npx linkinator dist --recurse` with two `--skip` patterns
  (`github.com/troupe-run/troupe` and `gc.zgo.at`). The job has `continue-on-error: true` and `contents: read`.
- `scripts/linkcheck.mjs` is CI's internal check. It runs linkinator with `--format json`, skips every external URL,
  counts scanned and broken links, and refuses to pass on fewer than 2 scanned links. Its parsing is the part worth
  sharing.
- linkinator 8.1.0 is a dev dependency. `gh` is preinstalled on GitHub's Ubuntu runners.
- Labels and secrets for this repo are declared in troupe-run/infrastructure. Nothing here may create a label or a
  secret by hand. infrastructure doesn't manage `links-weekly.yml` (checked with `git grep`), so this repo owns it.
- The production build includes the GoatCounter tag (`src/components/Analytics.astro`, `import.meta.env.PROD`), so
  `https://gc.zgo.at/count.js` is in `dist`.

## Goals / Non-Goals

**Goals:**

- The issue-reconciliation decision (open, comment, close, nothing) is a pure function with unit tests. The
  workflow only wires it up.
- CI's internal check behaves exactly as before after the parsing moves into a shared module.

**Non-Goals:**

- Adding the auto-opened issue to the roadmap board (needs an App token from infrastructure; follow-up issue).
- Checking anchors (`#fragment`) on external pages, or checking links in the README or docs sources. Only links in
  the built site are checked, as now.
- Running the external check on pull requests, even as a non-blocking check.
- Keeping the schedule alive, or noticing that it stopped. See Risks.

## Decisions

### D1. Fail the run and keep one tracking issue (owner, 2026-10-16)

The run goes red, and one issue holds the current state. Each signal covers the other's gap:

- **Failing alone** is weak. GitHub sends a scheduled workflow's failure notice only to the person who last edited
  the cron line, and only if their notification settings allow it.
- **An issue alone, with a green run,** hides the failure from anyone looking at Actions, and a bug in the issue step
  would go unnoticed.

The owner chose this option over "fail only" and "issue only" when asked during this proposal.

### D2. Reconcile the issue from a Node script that calls `gh`, not a marketplace action

`scripts/linkcheck-external.mjs` runs the check, then calls a pure `decide({ broken, openIssue })`. It returns one of
`open`, `comment`, `close` or `none`, and the script carries that out with `gh issue create|comment|close`.

- *Alternatives:* `peter-evans/create-issue-from-file` or `JasonEtco/create-an-issue`. Each adds a third-party action
  with `issues: write`. Neither closes the issue on a clean run, and the logic would sit in YAML where it can't be
  unit tested. `actions/github-script` avoids the third party, but its logic is equally untestable inline.
- `gh` reads `GH_TOKEN` from the job's `GITHUB_TOKEN`. The job gets `permissions: { contents: read, issues: write }`.

### D3. Find the tracking issue by exact title among open issues opened by the workflow

The title is fixed as `Broken external links` and the issue carries the existing `bug` label. The script lists open
issues by `app/github-actions` and filters for an exact title match in code. GitHub search's `in:title` is fuzzy, so
the script doesn't rely on it for the match.

- *Alternative:* a dedicated label such as `links:broken`. That's cleaner to query, but labels are declared in
  infrastructure, so it would need a change there first. Matching on the exact title and the author is enough for a
  single tracking issue.
- If more than one open issue matches (only possible if someone opened one by hand with that title and the same
  author), the script comments on the oldest and logs a warning. It never opens another.

### D4. One script decides the outcome; the run's status follows the links, not the issue step

The order is: run linkinator → summarise → write the job summary → reconcile the issue → exit.

The exit code is 1 when anything is broken, when nothing was scanned, or when linkinator produced no JSON. It is also
1 when the issue step itself fails, so a reporting fault is never silent. Only broken links cause `open` or
`comment`. An empty scan or a linkinator crash fails the run but leaves the issue alone (`none`): that is a fault in
the check, not a broken link, and the red run and its summary say so.

### D5. Retry transient failures in linkinator, not in our code

The script passes `--retry` (honours `retry-after` on 429), `--retry-errors --retry-errors-count 3
--retry-errors-jitter 3000` (5xx and network errors), and `--timeout 15000`. Retries happen within one run. A site
that is down for the whole run still counts as broken. We accept that: it then opens or updates the issue, and the
next clean run closes it.

- *Alternative:* report a link only after it fails two weekly runs in a row. That needs state carried between runs,
  for example parsed back out of the issue body. It halves the noise but doubles the time to notice. We can revisit
  it if the issue churns.

### D6. Share linkinator parsing between the internal and external checks

The run-and-parse code moves into `scripts/linkinator-lib.mjs`: run linkinator with a set of skips, parse its JSON,
and return `{ scanned, skipped, broken }`. `scripts/linkcheck.mjs` keeps its behaviour, output and thresholds. To
prove that, compare its stdout and exit code on the same `dist` before and after the refactor. Both checks use one
summarise function, so a parsing fix reaches both.

### D7. One skip list, each entry with a reason

`scripts/external-skips.mjs` exports `[{ pattern, reason }]`, and the script builds `--skip` arguments from it alone.
A unit test checks that every entry has a non-empty reason. The `troupe-run/troupe` entry is removed. The `gc.zgo.at`
entry stays only if the apply step confirms a reason (for example, the host refuses linkinator's requests, or a
request would be counted as a visit). If `https://gc.zgo.at/count.js` answers a plain GET with 200 and nothing
argues for the skip, the entry is dropped.

### D8. The issue body is generated from the same summary as the job summary

One formatter turns `broken` into a Markdown table (URL, status, page found on). It feeds the job summary, the issue
body and the comment, so the three never disagree. Each also links the run (`$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/
actions/runs/$GITHUB_RUN_ID`) and says how the issue closes ("closes itself after a clean weekly run"). The table is
capped at 100 rows with a "+N more, see the run" line, to stay under GitHub's body limit.

## Risks / Trade-offs

- [A site that is down all Monday opens an issue that closes a week later] → Accepted (D5). Starting the workflow by
  hand once the site is back closes the issue sooner.
- [Some sites (LinkedIn, some CDNs) answer bots with 403 or 999] → No such links are on the site now. If one
  appears, it goes into the skip list with its reason (D7), not into a status allow-list.
- [GitHub turns the schedule off after 60 days without repository activity, and then nothing runs, fails or opens
  an issue] → This can't be solved inside this repo, because a watcher here is turned off with the check it watches.
  A follow-up in troupe-run/infrastructure adds a scheduled check that the workflow is still enabled and its last
  run is under 8 days old. Rejected: calling `gh workflow enable` from the weekly run, because nothing confirms it
  resets the clock and it can't be tested in under 60 days. Also rejected: keepalive commits, which fill the history
  with noise. What's left: if infrastructure also goes 60 days without activity, its watcher stops too.
- [The auto-opened issue isn't on the roadmap board] → A follow-up issue in infrastructure, for an App token. Until
  then, whoever triages adds it by hand (the board rule already requires this). The issue body says so.
- [Testing the real issue flow creates real issues in troupe-run/website] → Done once on the branch, by hand: a
  temporary broken link, two runs (open, then comment), the link removed, a third run (close). The issues it leaves
  are closed and say they were a test.

## Migration Plan

Merging to main is the deploy. The next Monday 03:17 UTC run, or a run started by hand, uses the new behaviour. To
roll back, revert the commit. Any open tracking issue can be closed by hand.

## Open Questions

- Does `gc.zgo.at` still need skipping? Settled during apply by requesting it (D7). Neither answer changes the
  approach.
