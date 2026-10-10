---
title: Six ways to build the same thing
date: 2026-10-10
excerpt: We ran five spec-driven development methods and plain Claude Code through the same seven-step build. All six produced working software. They differed in cost, in how they handled decisions, and in what they left behind to explain the work.
tags:
  - bake-off
  - methods
---

Troupe needs a development method to build it until it can run its own builds. To pick one, we put five
spec-driven methods and plain Claude Code through the same seven-step build and scored what came out. This
was a single pass on a single task, with our own harness and rubrics, so the numbers are one data point.

## The arms

Each arm had its own project, the same model, and the same harness.

| Arm | How it works |
|---|---|
| OpenSpec | Change proposals with delta specs, archived when done |
| cc-sdd | Requirements, design, and tasks, each approved before the next |
| Spec Kit | Specify, plan, tasks, implement |
| Spec Kitty | Spec Kit plus work packages, lanes, and its own issue tracker |
| Superpowers | Skills for brainstorming, planning, and subagent-driven development |
| Control | Claude Code with nothing installed |

## The task

The arms built troupe's configuration tool. It loads a YAML file and lets you read and set values without
losing the file's formatting or comments, and it keeps a history of every change. Later steps added
includes, a watcher that notices hand edits, YAML aliases, and remote includes checked against a schema.

Each step was a change request on top of the last, so the arms had to live with their earlier decisions. In
step 2 we slipped in a commit from a "teammate" who had worked outside the arm's process. Step 6 was a bug
report filed as a GitHub issue.

Every step ran twice. The first run stopped at the arm's first question or approval request so we could
answer it. A fresh run then built the step with those answers in hand, and that second run is the one we
scored.

## Scoring

Each arm got a score out of 100, made up of eight weighted parts. Correctness, worth 20, came from hidden
tests the arms never saw. Code quality, worth 15, combined mutation testing, type errors, lint findings, how
much code the arm wrote, and how well the test names describe what they check. I rated every design decision
the arms made, on what the software did when we ran it, and that's worth 15. The other parts covered coping with change, approval
requests, tracing a change back to its reason, fit with Claude Code, and time and cost. Where a part compares
arms with each other, such as time, cost, or code size, it compares each arm with the median arm.

Three model judges, each told to read from a different perspective, scored the judged parts from anonymised
material, and I decided the cases where they disagreed. The anonymising only went so far, because each
method's vocabulary tends to give it away.

## Results

| Arm | Total /100 | Code quality /15 | Decisions /15 | Interaction /10 | Time and cost /10 | Cost |
|---|---:|---:|---:|---:|---:|---:|
| **OpenSpec** | **81.7** | 12.2 | 10.9 | 6.7 | 5.8 | $142 |
| cc-sdd | 77.1 | 11.6 | 11.2 | 7.4 | 1.4 | $741 |
| Spec Kit | 76.5 | 11.3 | 10.3 | 5.7 | 4.5 | $273 |
| Spec Kitty | 75.6 | 11.7 | 10.9 | 8.0 | 1.0 | $1,543 |
| Superpowers | 74.5 | 8.3 | 10.3 | 2.7 | 9.0 | $27 |
| Control | 72.4 | 6.4 | 8.5 | 4.5 | 9.3 | $13 |

OpenSpec finished clearly ahead. The other five are too close to rank against each other. We moved each
dimension's weight five points up and down and pushed every disputed judgement to its extremes, and OpenSpec
stayed first in every combination. Its score ranged from 80.4 to 83.0, and the next best range, cc-sdd's,
from 73.6 to 80.6.

## Correctness

Every arm passed 97% to 99% of the hidden tests at every step, the control included, so correctness explains
almost none of the spread in the table.

## Time and cost

| Arm | Time, all steps | Cost, scored runs |
|---|---:|---:|
| Control | 48 min | $13 |
| Superpowers | 54 min | $27 |
| OpenSpec | 2 h 49 min | $142 |
| Spec Kit | 5 h 22 min | $273 |
| Spec Kitty | 23 h 44 min | $1,543 |
| cc-sdd | 40 h 57 min | $741 |

The cheapest arm cost about a hundredth of the most expensive one. Part of what the extra money bought was a
record of why things changed. With the code, the specs, and the commit messages to go on, the judges gave
the control about 0.6 out of 1 for tracing changes to a stated reason. OpenSpec and cc-sdd scored full marks.

## Questions and approvals

The control and Superpowers went straight to writing code in every first run, without a single question.
The other four asked between 7 and 23 questions across those runs.

The bigger problem was what happened to the decisions nobody asked about. Again and again an arm made a
design choice on its own, built it, committed it, and only then mentioned it in its end-of-step summary. One
summary was headed "Calls I made where the contract left room." Plenty of those calls were reasonable, but by
the time I read them they were already built on. I'd much rather be asked, and a warning before the work is
better than a note after it. OpenSpec timed its approval requests best, scoring 0.89 of the available
points. Superpowers scored 0.32.

In one step an arm asked me a question and then answered it in its own decision log before I
had replied.

Spec Kitty asked the most useful questions, in both runs of each step. It also took the most of my time: 36
minutes at its approval gates, against under four minutes for any other arm. Spec Kit asked nearly all of
its questions in the first runs and then built without stopping, which means its
scored runs alone would make it look as if it never asked anything. We counted both runs.

## Code quality

Four of the methods finished every step with no type errors. Superpowers and the control did not: by step 7
they had 94 and 87, in about 2,000 lines of source each, and the count rose at every step.

Lint looked worse than it was. OpenSpec went from 8 findings to 34 under our ruleset, but 31 of the 34 were
unsorted imports, which the linter fixes in one command, and under OpenSpec's own lint settings it had none at
all. We now count a finding the linter can safely fix itself as a tenth of one, and measure findings per
thousand lines. Mutation scores ranged from 0.72 to 0.87. Test names ranged from
`test_get_of_a_collection_exits_5_naming_the_path_and_pointing_to_show`, which tells you exactly what broke,
to a single `test_watch` that checked six unrelated behaviours.

## Code size

Every arm built the same features and passed the same hidden tests. They wrote very different amounts of code
to get there:

| Arm | Source lines | Test lines |
|---|---:|---:|
| Control | 1,965 | 461 |
| Superpowers | 1,994 | 1,187 |
| OpenSpec | 3,382 | 4,063 |
| Spec Kit | 3,408 | 4,867 |
| Spec Kitty | 7,403 | 16,665 |
| cc-sdd | 9,773 | 34,701 |

cc-sdd wrote five times as much source as the control for the same behaviour, plus a test suite three and a
half times the size of its source. Smaller code is generally easier to reason about and usually means better
use of libraries, so we score source size against the median arm, with no extra credit below half the median.
Very terse code doesn't get rewarded for being terse. Test lines aren't counted, so thorough testing isn't
penalised.

## What got in each method's way

Most of the friction came from the methods' own tooling rather than from Claude Code.

OpenSpec drives its real work through a separate command-line tool that the model has to call and parse from
the shell, and its archive step stops to ask an interactive question, which halts an unattended run. cc-sdd
was the slowest by far, and the model had to remember its phase order and record approvals by hand. Spec Kit
expects a branch per feature, so the model kept hand-writing a feature pointer file to work on the main branch
instead. Spec Kitty's own status checks blocked it, and the model wrote and carried helper scripts through
every step to get past them. Its tracker also needed an undocumented configuration edit before it would
connect. Superpowers barely ran at all: in six of seven steps the model went straight to code without
entering its workflow, which is why it scored close to the control.

None of the GitHub-based methods has a step that writes back to the issue tracker, which is why the step 6
issue stayed open.

## The step 6 issue

Every arm that used GitHub fixed the bug in step 6 and left the issue open, without a comment or a link to the
fix. Spec Kitty, which keeps its own tracker, closed its copy of the issue.

## What the arms said versus what they did

Arms that described the same approach to a design question often behaved differently once we ran them. One
kept a comment where another dropped it, and two refused the same bad input with different exit codes. In the
end I rated the behaviour, which meant re-running examples against every arm's final code.

## Problems every arm shared

A few problems turned up in all six arms, and the spec we gave them didn't cover any of them. Some values
`get` prints don't mean the same thing when you paste them back into the file, which I'd call a bug. History
can show an old value until another command happens to run. A command waiting for a lock waits forever, and
that isn't acceptable either. All of these are on troupe's list now.

## What we're doing next

We'll build troupe with OpenSpec for now. It came first under every weighting we tried, did best on
traceability, wrote moderate amounts of code, and cost about a fifth of what cc-sdd did. We'll answer its
archive question up front so unattended runs don't stall, run the linter and type checker in the pipeline,
and let troupe's own approval gates make up for the questions OpenSpec didn't ask.

The results also changed parts of troupe's design. The configuration file will be generated from recorded
events, and a hand edit gets recorded as a change the next time any command runs, `history` included.
State will be stored as text that git can merge, so SQLite is out. Anything troupe prints should mean the
same thing when you paste it back.

## Limits

This was one task, a command-line tool, built once with one model. One person rated the decisions, and we
wrote some of the rubrics after the first five steps had run. The arms' projects aren't public yet. We'll run
a second pass.
