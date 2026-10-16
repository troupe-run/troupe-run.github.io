# contributing Specification

## Purpose

What the repository tells a contributor, person or agent, before they change it: the tools to install, the path every
change follows, the commit rules, the licensing, and how a fix from outside reaches `main`.

## Requirements

### Requirement: The contributor docs name the tools to install
CONTRIBUTING.md SHALL say to install uv and Node (at the version in `.nvmrc` or later), and that
`uv run scripts/check.py` is the check that runs before every commit and in CI.

#### Scenario: A new contributor sets up
- **WHEN** a contributor follows CONTRIBUTING.md's set-up steps on a machine with neither uv nor the repository's
  dependencies
- **THEN** `uv run scripts/check.py` runs to completion

### Requirement: The contributor docs describe the workflow
CONTRIBUTING.md and CLAUDE.md SHALL describe the path every change follows: an issue, an OpenSpec change on a branch
named exactly after the change, a pull request that closes the issue, the change archived on the branch, and a rebase
merge. They SHALL link the org's development-workflow guide rather than restate its rules.

#### Scenario: An agent starts a session
- **WHEN** a coding agent reads CLAUDE.md
- **THEN** it finds the workflow's steps in order, the check to run before each commit, and that a refused action is
  followed by the refusal's fix, not a workaround

### Requirement: Commits are Conventional and need no sign-off
CONTRIBUTING.md and CLAUDE.md SHALL say that commit messages are Conventional Commits and that this repository asks
for no DCO sign-off and no CLA. They SHALL NOT tell contributors to sign off commits.

#### Scenario: A contributor reads the commit rules
- **WHEN** a contributor reads either file
- **THEN** it says commits are Conventional, and says no sign-off is needed

### Requirement: Contributions keep the repository's licences
CONTRIBUTING.md SHALL say that contributions are accepted under MIT for code and CC BY 4.0 for content, and that the
troupe name, mark and characters are trademarks licensed under neither.

#### Scenario: A contributor checks the terms
- **WHEN** a contributor reads CONTRIBUTING.md's licensing section
- **THEN** it names both licences and the trademark exception, with no separate agreement to sign

### Requirement: An outside fix is carried by a maintainer
CONTRIBUTING.md SHALL tell an outside contributor that their **Improve this page** pull request will fail the `guard`
check and that this is expected. It SHALL say that a maintainer carries the fix onto a change branch, credits them with
a `Co-authored-by:` trailer, links their pull request, and closes it when the maintainer's pull request merges.

#### Scenario: A fork pull request's guard check fails
- **WHEN** an outside contributor opens a pull request from GitHub's web editor and sees the `guard` check fail
- **THEN** CONTRIBUTING.md tells them that's expected and what happens to their fix next
