# Proposal

## Why

CI and the weekly link check read the Node version from `.nvmrc` (`node-version-file: .nvmrc`), but `deploy.yml`
hard-codes `node-version: 22` for `withastro/action@v6`. Today both say 22, so nothing is broken yet. The day
`.nvmrc` changes, CI tests one Node version and production is built with another, and nothing fails to say so
(troupe-run/website#4).

## What Changes

- The deploy reads the Node version from `.nvmrc` and passes it to `withastro/action`, so `.nvmrc` is the only
  place the site's Node version is written down for any workflow.
- A small script reads `.nvmrc` and refuses one it can't pass through unchanged: empty, more than one value, or a
  comment. The deploy fails with a message naming `.nvmrc` and the fix, rather than falling back to the action's
  default (Node 24 in `withastro/action@v6`).
- A unit test checks the wiring: no workflow names a Node version of its own, and every step that sets up Node
  takes it from `.nvmrc` (directly, or through the script's output). It fails if someone puts a literal back.
- `withastro/action` keeps building the site, as the original design says (design spec 6.2). Replacing it is
  considered in the design and not proposed.

Not in this change: `withastro/action` installs with `npm install` while CI uses `npm ci`. That is a second way
the deploy can differ from what CI tested. It is recorded in the design as an open question for the owner, not
fixed here.

## Capabilities

### New Capabilities
- `build-and-deploy`: how the site is built and published, and what the deploy must share with the CI run that
  gated it. This change adds its first requirement: one Node version, from `.nvmrc`.

### Modified Capabilities
- None. `openspec/specs/` is empty.

## Impact

- `.github/workflows/deploy.yml`: a step that reads `.nvmrc`, and `withastro/action`'s `node-version` taken from
  its output.
- `scripts/`: a new script that reads and checks `.nvmrc` and writes the version to `GITHUB_OUTPUT`.
- `tests/unit/`: tests for the script and for the workflows' wiring.
- `package.json`: possibly a `yaml` dev dependency for the wiring test (see design).
- No change to the built site, CI's checks, GitHub settings or anything delivered from troupe-run/infrastructure.
  The workflows are this repo's own files, not the guard's.
- Verified for real only on the first deploy after merge: its log must show the same Node version as CI's.
