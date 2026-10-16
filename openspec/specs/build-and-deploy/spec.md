# build-and-deploy Specification

## Purpose

How troupe.run is built and published to GitHub Pages, and what the production build must share with the CI run
that gated it, so that what ships is what was tested.

## Requirements

### Requirement: One Node version, from .nvmrc

The site's Node version SHALL be written in one place, `.nvmrc`. CI, the deploy and every other workflow that runs
Node MUST take the version from `.nvmrc` and MUST NOT name a Node version of their own.

#### Scenario: The deploy builds with the version in .nvmrc
- **WHEN** a commit on main whose `.nvmrc` holds a version passes CI and the deploy runs
- **THEN** the deploy sets up that same Node version for the production build, as CI did for its run

#### Scenario: Changing .nvmrc changes every workflow
- **WHEN** `.nvmrc` is changed to a different version and nothing else is
- **THEN** CI, the deploy and the weekly link check all use the new version, with no workflow file edited

#### Scenario: A workflow that names its own Node version fails the checks
- **WHEN** a pull request adds a literal Node version to any workflow (for example `node-version: 22`)
- **THEN** CI's unit tests fail and name the workflow and step

### Requirement: A .nvmrc the deploy can't read stops the deploy

When `.nvmrc` is missing, empty, or holds anything other than one version value, the deploy MUST fail before
building, with a message that names `.nvmrc`, what it found and what a valid file looks like. It MUST NOT fall back
to a default Node version.

#### Scenario: Empty .nvmrc
- **WHEN** the deploy runs and `.nvmrc` is empty or only whitespace
- **THEN** the deploy fails before the build, saying `.nvmrc` holds no version, and nothing is published

#### Scenario: More than one value in .nvmrc
- **WHEN** the deploy runs and `.nvmrc` holds more than one value (two lines, or a value and a comment)
- **THEN** the deploy fails before the build, quoting what it found, and nothing is published

#### Scenario: Missing .nvmrc
- **WHEN** the deploy runs and `.nvmrc` does not exist
- **THEN** the deploy fails before the build, saying `.nvmrc` is missing, and nothing is published
