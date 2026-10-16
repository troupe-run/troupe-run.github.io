# Proposal

## Why

The weekly external-link check (`.github/workflows/links-weekly.yml`) runs with `continue-on-error: true`, so when
it finds a broken link the run still shows green and nobody hears about it. A broken external link would be found by
a reader before anyone on the project (troupe-run/website#5). The check also still skips
`github.com/troupe-run/troupe`, the link behind the site's main GitHub call to action. Design spec §10 excluded it
while that repository was private. It has been public since at least 2026-10-16, so the link the site most needs
working is the one link nobody checks.

## What Changes

- The weekly check **fails its run** when it finds a broken external link. It is still scheduled (and can be run by
  hand), so it never blocks a pull request, and it stays out of the required checks. External sites go down.
- When the check finds broken links, it **opens one issue** in troupe-run/website listing them. If that issue is
  already open, it **comments on it** with the current list rather than opening another. When a later run is clean,
  it **closes the issue** with a comment, so an open issue always means a link is broken now.
- The broken list (URL, status, page it was found on) also goes to the run's **job summary**, so the red run
  explains itself.
- The check **refuses to pass when it scanned no external links**, as the internal check already does (a bad
  `--skip` pattern once made a gate pass on 0 links).
- Transient failures are **retried** before a link counts as broken, so one slow response from a site doesn't open
  an issue.
- The **`github.com/troupe-run/troupe` skip is removed.** The GoatCounter script host (`gc.zgo.at`) stays skipped,
  with the reason written next to the skip.
- The site design's lines that say external links "only warn" (§6.1) and that the checker excludes the product
  repo (§10) are updated to point at this change.

Not in this change:

- **Putting the auto-opened issue on the troupe roadmap board.** The workflow's `GITHUB_TOKEN` can't write to an
  org project. That needs a GitHub App token, and the website repo's secrets are declared in troupe-run/infrastructure.
  This change opens a follow-up issue there (and puts it on the board). Until it lands, whoever triages the
  auto-opened issue adds it to the board by hand, as the board rule already asks.
- **Noticing that the check has stopped running.** GitHub turns off a public repository's scheduled workflows after
  60 days with no repository activity. A disabled check opens no issue and fails no run. The website can't watch its
  own schedule, because a watcher here would be turned off along with the check. The watcher belongs in
  troupe-run/infrastructure, which runs the org's workflows. It would be a scheduled check that `links-weekly.yml` is
  enabled and has run in the last 8 days, and it would open an issue when either isn't true. This change opens that
  follow-up issue and puts it on the board. It doesn't use a self-keepalive, where the weekly run calls
  `gh workflow enable` on itself: no source confirms that resets the 60-day clock.
- No new label. Labels are declared in infrastructure, so the issue is found by its exact title and uses the
  existing `bug` label.

## Capabilities

### New Capabilities

- `link-checking`: how the built site's links are checked. The weekly external check and how it reports broken
  links: failing the run, the single tracking issue, the job summary, retries, skips, and refusing to pass on an
  empty scan. The internal check in CI is described in the design spec and isn't changed here; it can move into this
  capability later.

### Modified Capabilities

None. `openspec/specs/` is empty.

## Impact

- `.github/workflows/links-weekly.yml`: drop `continue-on-error`, add `issues: write`, run the new script, write the
  job summary, and keep the job out of any required checks (it already is, because it's scheduled).
- `scripts/`: a script for the external check that parses linkinator's JSON and decides whether to open, comment on
  or close the issue. The decision is a pure function with unit tests in `tests/unit/`. The linkinator-JSON
  parsing in `scripts/linkcheck.mjs` is shared rather than duplicated.
- `docs/superpowers/specs/2026-10-07-troupe-run-site-design.md`: §6.1 item 4 and §10.
- troupe-run/infrastructure: two follow-up issues. One is an App token so the workflow can add its issue to the
  board. The other is a watcher that notices if the weekly check stops running. Nothing in infrastructure changes in
  this change.
- No change to the site's pages, copy or the PR's required checks.
