---
title: Six ways to build the same thing
date: 2026-10-10
excerpt: We ran five spec-driven development methods and plain Claude Code through the same seven-step build. All six produced working software. They differed in cost, in how they handled decisions, and in what they left behind to explain the work.
tags:
  - bake-off
  - methods
---

We need a development method to build troupe with until troupe can run its own builds. To pick one, we ran
five spec-driven methods and plain Claude Code through the same seven-step build and scored the results.

It was one pass, on one task, using our own harness and rubrics. Treat the numbers as a single data point.

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

The arms built a configuration tool for troupe. It loads a YAML file, reads and sets values while keeping the
user's formatting and comments, and records every change in a history. Later steps added includes, a
watcher for hand edits, YAML aliases, and remote includes checked against a schema.

Each step arrived as a change request on top of the previous one, so earlier decisions had consequences.
Step 2 included a commit from a "teammate" made outside the arm's workflow. Step 6 was a bug reported as a
GitHub issue.

Every step ran twice. A discovery run stopped at the arm's first question or approval gate, and we answered
it. Then a fresh scored run built the step with those answers in its brief.

## Scoring

We scored eight dimensions out of 100. Correctness came from hidden tests the arms never saw. Code quality
combined mutation testing, mypy, ruff, and how readable the test names were. Coping covered churn, the hand
edit, and regressions between steps. Decision quality was my own rating of every design decision the arms
made, judged on what the software actually did. The rest covered how well the arms
used approval gates and questions, whether changes could be traced to a reason, how naturally each method
fits Claude Code, and time taken.

Three model judges with different perspectives scored each judged item from anonymised material. I settled
the items where they disagreed. The anonymising was only partial: each method's vocabulary tends to give it
away.

## Results

| Arm | Total | Code quality /15 | Interaction /10 | Traceability /10 | Cost |
|---|---:|---:|---:|---:|---:|
| **OpenSpec** | **77.6** | 9.1 | 6.0 | 8.5 | $142 |
| cc-sdd | 76.3 | 8.0 | 6.8 | 8.4 | $741 |
| Spec Kit | 75.2 | 10.2 | 5.1 | 8.1 | $273 |
| Spec Kitty | 74.1 | 7.9 | 8.0 | 8.1 | $1,543 |
| Superpowers | 70.9 | 6.5 | 3.3 | 6.5 | $27 |
| Control | 66.9 | 3.8 | 4.7 | 5.3 | $13 |

Spec Kit and Spec Kitty are within noise of each other. We moved each dimension's weight five points either
way and pushed every disputed judgement to its extremes. OpenSpec came first in every variant, but the top
three ranges overlap. OpenSpec scored between 74.6 and 80.5, and cc-sdd between 72.3 and 80.3.

## Findings

### Correctness barely varied

Every arm passed between 97% and 99% of the hidden tests at every step, the control included. The
differences in the table come from how the software was built.

### Cost varied by a factor of 120

| Arm | Time, all steps | Cost, scored runs |
|---|---:|---:|
| Control | 48 min | $13 |
| Superpowers | 54 min | $27 |
| OpenSpec | 2 h 49 min | $142 |
| Spec Kit | 5 h 22 min | $273 |
| Spec Kitty | 23 h 44 min | $1,543 |
| cc-sdd | 40 h 57 min | $741 |

Most of the extra money bought a paper trail. We could trace the control's changes to a reason about a third
of the time. The methods managed 70% to 92%.

### Most decisions were reported after the code was written

The control and Superpowers started writing code straight away in every discovery run. They asked no
questions before building. The other four asked between 7 and 23 questions across their discovery runs.

The most common problem we found was a design decision made by the arm alone, built, committed, and only
then listed in the final summary. One summary was headed "Calls I made where the contract left room." Many
of those calls were sensible, but by then they were expensive to change. OpenSpec timed its approval gates
best, at 0.89 of the available score. Superpowers scored 0.32.

In one step, an arm asked us a question and then answered it in its own decision log before we had replied.

### Spec Kitty asked the best questions

Spec Kitty's questions were the most useful, in both kinds of run. They also took the most of my time: 36
minutes at its gates, compared with under four minutes for any other arm.

Spec Kit asked nearly all its questions in discovery runs and then built without stopping. If we had only
looked at its scored runs, it would have seemed never to ask anything, so we counted both.

### Lint went unchecked

Only Spec Kit and OpenSpec kept mypy and ruff close to clean, and OpenSpec's score fell to zero by step 6.
Mutation scores held steadier, between 0.72 and 0.87. The best test names read like requirements, for
example `test_get_of_a_collection_exits_5_naming_the_path_and_pointing_to_show`. The worst was a single test
called `test_watch` that checked six unrelated behaviours.

### Nobody closed the issue

Every arm that used GitHub fixed the step 6 bug and left the issue open, with no comment and no link to the
fix. Spec Kitty, which uses its own tracker, was the only arm to close it.

### Stated design and actual behaviour often differed

Several arms described the same approach to a design question and then behaved differently in practice. One
kept a comment that another dropped. Two refused the same bad input with different exit codes. We ended up
re-running examples against every arm's final code and rating what actually happened.

### Some problems were universal

Every arm had a few blind spots that the spec never mentioned. Some printed values don't read back the same
way when you paste them into the file. The history can show an out-of-date value until another command runs.
A command waiting for a lock waits indefinitely. We've added each of these to troupe's list.

## What we're doing next

We'll build troupe with OpenSpec for now. It came first under every weighting, scored highest on
traceability, and cost about a tenth of the most expensive arm. Lint will be enforced by the pipeline. Where
OpenSpec asks too few questions, troupe's own approval gates will cover the gap.

The bake-off also changed some of troupe's design:

- The configuration file becomes a projection of recorded events. A hand edit is recorded as a change the
  next time any command runs.
- State is stored as text that git can merge, so no SQLite.
- Every command refreshes from the files first, including `history`.
- Anything troupe prints can be pasted back and means the same thing.

## Limits

This covered one task, a command-line tool, with one model and one pass. One person rated the decisions. Some
rubrics were written after the first five steps had run. The arms' projects aren't public yet. We plan a
second pass.
