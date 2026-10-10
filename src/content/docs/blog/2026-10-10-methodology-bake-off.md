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
tests the arms never saw. Code quality, worth 15, combined mutation testing, type checking, linting, and how
well the test names describe what they check. I rated every design decision the arms made, on what the
software did when we ran it. The other parts covered coping with change, approval requests, tracing a
change back to its reason, fit with Claude Code, and time taken.

Three model judges, each told to read from a different perspective, scored the judged parts from anonymised
material, and I decided the cases where they disagreed. The anonymising only went so far, because each
method's vocabulary tends to give it away.

## Results

| Arm | Total /100 | Code quality /15 | Interaction /10 | Traceability /10 | Cost |
|---|---:|---:|---:|---:|---:|
| **OpenSpec** | **77.6** | 9.1 | 6.0 | 8.5 | $142 |
| cc-sdd | 76.3 | 8.0 | 6.8 | 8.4 | $741 |
| Spec Kit | 75.2 | 10.2 | 5.1 | 8.1 | $273 |
| Spec Kitty | 74.1 | 7.9 | 8.0 | 8.1 | $1,543 |
| Superpowers | 70.9 | 6.5 | 3.3 | 6.5 | $27 |
| Control | 66.9 | 3.8 | 4.7 | 5.3 | $13 |

Spec Kit and Spec Kitty are too close to separate. We also moved each part's weight five points up and down
and pushed every disputed judgement to its extremes. OpenSpec stayed first throughout, though its range
(74.6 to 80.5) overlaps cc-sdd's (72.3 to 80.3).

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

The cheapest arm cost about a hundredth of the most expensive one. Most of that money bought a record of why
things changed. We could trace the control's changes to a stated reason about a third of the time, and the
methods managed between 70% and 92%.

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

Only Spec Kit and OpenSpec kept type-checker and linter errors low enough to earn points there. OpenSpec
earned fewer at each step as errors built up, and from step 6 it earned none. Mutation scores were steadier,
from 0.72 to 0.87. Test names ranged from
`test_get_of_a_collection_exits_5_naming_the_path_and_pointing_to_show`, which tells you exactly what broke,
to a single `test_watch` that checked six unrelated behaviours.

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
traceability, and cost about a tenth of the most expensive arm. We'll enforce linting in the pipeline
instead of relying on the method, and troupe's own approval gates can make up for the questions OpenSpec
didn't ask.

The results also changed parts of troupe's design. The configuration file will be generated from recorded
events, and a hand edit gets recorded as a change the next time any command runs, `history` included.
State will be stored as text that git can merge, so SQLite is out. Anything troupe prints should mean the
same thing when you paste it back.

## Limits

This was one task, a command-line tool, built once with one model. One person rated the decisions, and we
wrote some of the rubrics after the first five steps had run. The arms' projects aren't public yet. We'll run
a second pass.
