# Design

## Context

- `ci.yml` and `links-weekly.yml` use `actions/setup-node@v7` with `node-version-file: .nvmrc`. `.nvmrc` holds `22`.
- `deploy.yml` runs on `workflow_run` after CI succeeds on a push to main. It checks out the commit CI tested,
  then builds with `withastro/action@v6` and `node-version: 22`.
- `withastro/action@v6` is a composite action. Its `node-version` input defaults to `"24"`, and it has no
  version-file input. It passes the input straight to its own pinned `actions/setup-node` step. So omitting the
  input is as wrong as hard-coding it: the build silently moves to Node 24.
- `actions/setup-node` reads a version file like this: it tries JSON first, then takes the first line matching
  `^(?:node(js)?\s+)?v?(\S+)$` (a leading `v` or `node ` is dropped), and falls back to the trimmed contents.
- The design spec (6.2) says `withastro/action` builds the site. The workflows are this repo's own files; nothing
  in troupe-run/infrastructure delivers them.
- No YAML parser is in `package.json`. Unit tests are Vitest, in `tests/unit/`, run in Node.

## Goals / Non-Goals

**Goals:**
- The deploy's Node version comes from `.nvmrc`, by the same reading rule CI uses, for every value `.nvmrc` holds
  today and any single version value it could reasonably hold (`22`, `22.12.0`, `v22`, `lts/jod`).
- A test that fails when any workflow names its own Node version, or sets up Node without naming one at all.

**Non-Goals:**
- Pinning `.nvmrc` to an exact patch version. That is the owner's call and doesn't change this design.
- Making the deploy install with `npm ci` (see Open Questions).
- Upgrading Node, `withastro/action` or `actions/setup-node`.

## Decisions

### D1. Keep `withastro/action`; feed it from a step that reads `.nvmrc`

A step before `withastro/action` reads `.nvmrc` and writes `version=<value>` to `GITHUB_OUTPUT`.
`withastro/action` gets `node-version: ${{ steps.node-version.outputs.version }}`.

Alternatives:
- **Replace `withastro/action` with its parts** (`setup-node` with `node-version-file`, `npm ci`, `npm run
  build`, `upload-pages-artifact`). This gives exact parity with CI, including `npm ci`, and removes the reading
  step. Rejected for this change: it overturns design spec 6.2, drops the action's Astro cache, and means this
  repo maintains the build steps the action maintains now. It stays the natural answer if the owner wants `npm ci`
  parity too.
- **Run `actions/setup-node` with the file before `withastro/action`.** Doesn't work: the action's own
  `setup-node` step runs afterwards with its `node-version` input (default 24) and wins.

### D2. The reader is a script in `scripts/`, not inline shell

`scripts/node-version.mjs` exports a pure function that takes the file's text and returns the version or throws,
and a small entry point that reads `.nvmrc`, calls it, and writes the output (or prints the version when
`GITHUB_OUTPUT` is unset, for local runs). It runs on the runner's preinstalled Node, before any `setup-node`;
it uses only `node:fs` and needs no `npm ci`.

Why: inline shell in the workflow can't be unit tested, and the project's rule is that every behaviour has a test
that fails when it breaks. `.mjs` matches the other scripts here.

### D3. Copy setup-node's reading rule, but refuse what it would quietly skip

The script accepts exactly one non-empty value, optionally prefixed by `v`, `node ` or `nodejs ` (which it drops,
as setup-node does), with surrounding whitespace and one trailing newline allowed. It refuses:
- a missing file,
- an empty or whitespace-only file,
- more than one non-empty line, or a line with more than one value (this catches comments),
- a JSON object (setup-node would look for `volta.node` or `engines.node`; `.nvmrc` should never be one). A bare
  `22` also parses as JSON, as a number, so the check is for an object, not for "parses as JSON".

Each refusal names `.nvmrc`, quotes what it found (it isn't secret) and says a valid file is one line such as
`22`. The script exits non-zero, so the deploy fails before the build and nothing is published.

Why stricter than setup-node: where setup-node would take the first line of a two-line file, CI and the deploy
would agree, but the file means something its reader can't see. A malformed input that selects behaviour is an
error, not a fall-through. Being stricter on the deploy side can only stop a deploy, never build with a different
version.

A test feeds the same inputs to the script and to a copy of setup-node's regex, and checks they agree on every
accepted input. This is the differential check for "same rule as CI".

### D4. The wiring test parses the workflows with `yaml`

`tests/unit/workflow-node-version.test.ts` parses every file in `.github/workflows/` and, for each job, checks
each step:
- `uses: actions/setup-node@…` has `node-version-file: .nvmrc` and no `node-version`;
- `uses: withastro/action@…` has `node-version` equal to `${{ steps.<id>.outputs.version }}`, where `<id>` is an
  earlier step in the same job that runs `node scripts/node-version.mjs`;
- no other step has a `node-version` input.

Failures name the file, job and step. The test fails on today's `deploy.yml` (literal `22`) and would fail if the
input were simply deleted (default 24).

Adds `yaml` (2.9.1, exact pin like the other dependencies) as a dev dependency. Alternative: regular expressions
over the files' text. Rejected: they can't tell which step an input belongs to, so they can't check the
"earlier step in the same job" link or catch a missing input.

## Risks / Trade-offs

- [`.nvmrc` holds a range (`22`) or an alias (`lts/*`), so CI and the deploy resolve it separately, minutes
  apart] → They could get different patch releases if Node ships one in between. Accepted: that's the same
  resolution, not a different version. Pinning `.nvmrc` to an exact version removes it, if the owner wants that.
- [A future step sets up Node through an action the test doesn't know] → The test only knows `setup-node` and
  `withastro/action`, plus any `node-version` input. Accepted; the list is named in the test so it's easy to extend.
- [The reader runs on the runner image's Node, before `setup-node`] → `ubuntu-latest` always ships Node, and the
  script uses only `node:fs`. If that ever changed, the step would fail loudly, not silently.
- [`withastro/action@v6` is a moving major tag] → Unchanged by this design. If a later v6 adds a version-file
  input, D1 can switch to it and the wiring test changes with it.

## Migration Plan

1. Merge to main. CI runs as usual; the deploy follows it.
2. Verify on that deploy: the reading step logs the version, and `withastro/action`'s "Setup Node" step reports the
   same Node version as CI's "Setup Node" for the same commit. This can't be checked before merge; the owner or
   the implementer reads both run logs and records them on the issue.
3. Rollback: revert the commit. The next deploy uses the literal again.

## Open Questions

- `withastro/action` installs with `npm install`, while CI runs `npm ci`. With a committed lockfile the result is
  usually the same, but `npm install` may change resolution where `npm ci` would fail. Does the owner want a
  separate issue for install parity? If so, the replace-the-action alternative in D1 is the likely answer.
  This doesn't change the specs or tasks here.
