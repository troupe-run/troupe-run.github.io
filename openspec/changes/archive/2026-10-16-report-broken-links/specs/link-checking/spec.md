# Spec Delta

## Purpose

Checks that the links on the built site still lead somewhere, and makes sure a broken external link reaches a
person rather than passing silently, without letting other sites' outages block the project's own pull requests.

## ADDED Requirements

### Requirement: External links are checked on a schedule, outside pull requests
The external-link check SHALL run weekly and when started by hand. It SHALL NOT run on pull requests and SHALL NOT
be a required check, so a third-party outage never blocks a merge.

#### Scenario: A pull request does not run the external check
- **WHEN** a pull request is opened or updated
- **THEN** the external-link check does not run, and no required check depends on it

#### Scenario: The check can be started by hand
- **WHEN** a maintainer starts the external-link check by hand
- **THEN** it runs the same check and reporting as the weekly run

### Requirement: A broken external link fails the run
The external-link check SHALL finish with a failed status when any external link on the built site is broken after
retries.

#### Scenario: One broken link turns the run red
- **WHEN** the built site links to an external URL that returns an HTTP error or can't be reached after retries
- **THEN** the run's status is failed, not passed or "passed with errors"

#### Scenario: All links working leaves the run green
- **WHEN** every external link checked responds successfully
- **THEN** the run's status is passed

### Requirement: Transient failures are retried before a link counts as broken
The check SHALL retry a link that fails with a rate-limit response, a timeout or a connection error before
reporting it as broken.

#### Scenario: A link that recovers on retry is not reported
- **WHEN** an external URL fails on the first request and succeeds on a retry within the same run
- **THEN** it is not reported as broken and does not fail the run

### Requirement: An empty scan never passes
The check SHALL fail when it checked no external links, so a misconfigured skip or an empty build can't report
success.

#### Scenario: Every external link skipped
- **WHEN** the skip patterns exclude every external link on the built site
- **THEN** the run fails with a message saying the check checked no external links

### Requirement: Broken links are listed in the run's summary
A failed run SHALL list each broken link in its job summary with the URL, the status or error, and the page it was
found on.

#### Scenario: The red run explains itself
- **WHEN** a run finds a broken link
- **THEN** the run's summary shows that link's URL, its status, and the site page that links to it

### Requirement: One open issue tracks broken external links
When a run finds broken links and no tracking issue is open, the check SHALL open one issue in troupe-run/website
with a fixed title, listing each broken link, its status, the page linking to it, and the run.

#### Scenario: First failure opens the issue
- **WHEN** a run finds broken links and no open issue has the tracking title
- **THEN** exactly one issue is opened with that title, listing every broken link and linking to the run

### Requirement: Repeat failures update the open issue rather than opening another
When a run finds broken links and the tracking issue is already open, the check SHALL comment on that issue with the
current list and SHALL NOT open a second issue.

#### Scenario: Second failing week
- **WHEN** a run finds broken links and the tracking issue is already open
- **THEN** a comment with the current list and the run link is added to that issue, and no new issue is opened

### Requirement: A clean run closes the tracking issue
When a run finds no broken links and the tracking issue is open, the check SHALL close it with a comment linking to
the clean run, so an open tracking issue always means a link is broken now.

#### Scenario: Links fixed or the site recovered
- **WHEN** a run finds no broken links and the tracking issue is open
- **THEN** the issue is closed with a comment linking to the clean run

#### Scenario: Clean run with no open issue
- **WHEN** a run finds no broken links and no tracking issue is open
- **THEN** no issue is opened, commented on or closed

### Requirement: Skipped external URLs are few and each one has a reason
The check SHALL skip only URLs listed with a written reason next to them. The product repository,
github.com/troupe-run/troupe, SHALL be checked.

#### Scenario: The product repository link is checked
- **WHEN** the built site links to https://github.com/troupe-run/troupe
- **THEN** that link is requested and its result counts toward the run's outcome

#### Scenario: Every skip carries a reason
- **WHEN** the external check's skip list is read
- **THEN** every entry has a URL pattern and a non-empty reason, and the check takes its skips from that list alone
