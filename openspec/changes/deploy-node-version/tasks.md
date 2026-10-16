# Tasks

## 1. The wiring test, failing on main first

- [x] 1.1 Add `yaml` 2.9.1 as an exact-pinned dev dependency (`npm install --save-exact -D yaml@2.9.1`) and verify `npm ci` installs it from the updated `package-lock.json`
- [x] 1.2 Write `tests/unit/workflow-node-version.test.ts` per design D4 (setup-node uses `node-version-file: .nvmrc`; `withastro/action` takes `node-version` from an earlier reader step's `outputs.version` in the same job; no other `node-version` input; failures name file, job and step). Verify it fails on the current `deploy.yml` with a message naming `deploy.yml`, job `build` and the `withastro/action` step, and passes for `ci.yml` and `links-weekly.yml`
- [x] 1.3 Verify the test also fails when `withastro/action`'s `node-version` input is deleted rather than hard-coded (edit a temporary copy, or a fixture the test can be pointed at), so the default-24 case is caught; record the output in the commit message

## 2. The .nvmrc reader

- [x] 2.1 Write `tests/unit/node-version.test.ts` for the reader's pure function: accepts `22`, `22\n`, `  22.12.0  `, `v22` (→ `22`), `node 22` and `nodejs 22` (→ `22`), `lts/jod`; refuses a missing file, empty, whitespace-only, two lines, `22 # comment`, and a JSON object, each with a message that names `.nvmrc` and quotes what it found. Verify the tests fail before the script exists
- [x] 2.2 Add the differential test from design D3: for every accepted input above, the reader's result equals what setup-node's regex (`^(?:node(js)?\s+)?v?(?<version>[^\s]+)$`, multiline, copied into the test with a link to its source) extracts. Verify it passes and that changing the reader to keep a leading `v` makes it fail
- [x] 2.3 Implement `scripts/node-version.mjs` per design D2–D3 (exported pure function; entry point that reads `.nvmrc`, writes `version=<value>` to `GITHUB_OUTPUT` or prints it when unset, and exits non-zero with the message on refusal). Verify `npm run test:unit` passes, `node scripts/node-version.mjs` prints `22` locally, and `GITHUB_OUTPUT=$(mktemp) node scripts/node-version.mjs` writes `version=22` to that file

## 3. Wire the deploy

- [x] 3.1 In `deploy.yml`, add a step `id: node-version` after checkout that runs `node scripts/node-version.mjs`, and set `withastro/action`'s `node-version: ${{ steps.node-version.outputs.version }}`. Verify the wiring test from 1.2 now passes and `npm run test:unit` is green
- [x] 3.2 Check the edited workflow is valid before pushing (`npx --yes @action-validator/cli@<exact version> .github/workflows/deploy.yml`, or `actionlint` if installed) and verify it reports no errors

## 4. Integration

- [ ] 4.1 Run CI's checks locally (`npm run check`, `npm run test:unit`, `npm run build`, `npm run assets:verify`, `npm run linkcheck`, `npm run test:e2e`) and verify all pass, showing the output
- [ ] 4.2 Open the pull request with `Closes #4`, and verify CI passes on it. Note in the PR that the deploy step itself can only be exercised after merge (see 4.3)
- [ ] 4.3 After merge, verify on the first deploy run that the reader step logged the version and that `withastro/action`'s "Setup Node" resolved the same Node version as CI's "Setup Node" for the same commit; record both versions and run links on troupe-run/website#4. The owner or the implementer does this by reading the two run logs; it can't be automated before merge

## Workflow follow-up

- After merge: confirm #4 is closed and its card on the troupe roadmap board says Done (per the board rule); close it with a comment naming the PR and the archived change if the PR didn't.
- Archive the change (`/opsx:archive`), which creates `openspec/specs/build-and-deploy/spec.md`.
- Ask the owner whether to open an issue for `npm install` vs `npm ci` parity (design, Open Questions); if yes, open it with `--project "troupe roadmap"`.
