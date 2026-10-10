---
title: Six ways to build the same thing
date: 2026-10-10
excerpt: We ran five spec-driven development methods and plain Claude Code through the same seven-step build. All six ended up with working software. They differed most in cost and in how they handled decisions.
tags:
  - bake-off
  - methods
---

Troupe needs a development method to build it until it can run its own builds. To pick one, we put five
spec-driven methods and plain Claude Code through the same seven-step build and scored what came out. It was
a single pass on a single task, with our own harness and rubrics, so treat the numbers as one data point.

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

The arms built troupe's configuration tool. It loads a YAML file, lets you read and set values without
losing the file's formatting or comments, and keeps a history of every change. Later steps added includes, a
watcher that notices hand edits, YAML aliases, and remote includes checked against a schema.

Each step was a change request on top of the last, so the arms had to live with their earlier decisions. In
step 2 we slipped in a commit from a "teammate" who had worked outside the arm's process. Step 6 was a bug
report filed as a GitHub issue.

Every step ran twice. The first run stopped at the arm's first question or approval request so we could
answer it. A fresh run then built the step with those answers in hand, and that's the run we scored.

## Scoring

Each arm got a score out of 100. Correctness (20 points) came from hidden tests the arms never saw. Code
quality (15) combined mutation testing, type errors, lint findings, how much code the arm wrote, and how well
the test names describe what they check. I rated every design decision the arms made by what the software
did when we ran it (15). The rest covered coping with change, approval requests, time and cost, fit with
Claude Code, and whether a change could be traced back to its reason. Time, cost, and code size are each
measured against the median arm.

Three model judges, each told to read from a different perspective, scored the judged parts from anonymised
material, and I decided the cases where they disagreed. The anonymising only went so far, since each
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

OpenSpec came out ahead, and the other five are too close to rank against each other. We checked how fragile
that was by moving each dimension's weight five points up and down and pushing every disputed judgement to
its extremes. OpenSpec stayed first in every combination, scoring between 80.4 and 83.0. The next best range
was cc-sdd's, from 73.6 to 80.6.

## Correctness

Every arm passed 97% to 99% of the hidden tests at every step, the control included. Correctness explains
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

The cheapest arm cost about a hundredth of the most expensive one. The methods did leave a much better record
of why things changed. With the code, the specs, and the commit messages to go on, the judges gave the control
about 0.6 out of 1 for tracing changes to a stated reason, and gave OpenSpec and cc-sdd full marks.

## Questions and approvals

The control and Superpowers went straight to writing code in every first run and asked nothing. The other
four asked between 7 and 23 questions across those runs.

More often, an arm made a design choice on its own, built it, committed it, and only mentioned it in its
end-of-step summary. One summary was headed "Calls I made where the contract left room."
Plenty of those calls were reasonable, but by the time I read them, other work was already built on top. I'd
rather have been asked first. In one step an arm did ask me a question, then answered it in its own decision
log before I'd replied. OpenSpec timed its approval requests best, scoring 0.89 of the available points, and
Superpowers scored 0.32.

Spec Kitty asked the most useful questions, in both runs of each step. It also took the most of my time: 36
minutes at its approval gates, against under four minutes for any other arm. Spec Kit asked nearly all of
its questions in the first runs and then built without stopping. Looking only at its scored runs, you'd think
it never asked anything, so we counted both.

## Code quality

Four of the methods finished every step with no type errors. Superpowers and the control had 94 and 87 by
step 7, in about 2,000 lines of source each, and the count went up at every step.

OpenSpec's lint count rose from 8 to 34 under our ruleset, but 31 of those were unsorted imports, which the
linter fixes in one command. Under OpenSpec's own lint settings it had none. We now count a finding the linter
can safely fix by itself as a tenth of one, and measure findings per thousand lines.

Mutation scores ranged from 0.72 to 0.87. The test names ranged from
`test_get_of_a_collection_exits_5_naming_the_path_and_pointing_to_show`, which tells you exactly what broke,
to a single `test_watch` that checked six unrelated behaviours.

## Code size

Every arm built the same features and passed the same hidden tests, with very different amounts of code:

| Arm | Source lines | Test lines |
|---|---:|---:|
| Control | 1,965 | 461 |
| Superpowers | 1,994 | 1,187 |
| OpenSpec | 3,382 | 4,063 |
| Spec Kit | 3,408 | 4,867 |
| Spec Kitty | 7,403 | 16,665 |
| cc-sdd | 9,773 | 34,701 |

cc-sdd wrote five times as much source as the control for the same behaviour, and its tests ran to three and
a half times the size of its source. I'd generally rather have less code. It's easier to reason about, and it
usually means the arm leaned on libraries instead of writing its own. So source size now counts against the
median arm, with no extra credit below half the median, because code can also be too terse. Test lines aren't
counted.

## What got in each method's way

OpenSpec does its real work through a separate command-line tool, which the model had to call and parse from
the shell. Its archive step also stops to ask an interactive question, which halts an unattended run. cc-sdd
was the slowest by far, and the model had to remember its phase order and record approvals by hand. Spec Kit
expects a branch per feature, so the model kept hand-writing a pointer file to work on the main branch.
Spec Kitty's own status checks blocked it, and the model wrote helper scripts to get past them and carried
them through every step. Its tracker also needed an undocumented configuration edit before it would connect.
Superpowers entered its workflow in only one of the seven steps. In the others the model went straight to
code, which is why it scored close to the control. Claude Code itself caused very little of this friction.

## The step 6 issue

Every arm that used GitHub fixed the step 6 bug and left the issue open, with no comment and no link to the
fix. None of those methods has a step that writes back to the tracker. Spec Kitty, which keeps its own
tracker, closed its copy.

## Same design, different behaviour

Arms that described the same approach to a design question often behaved differently once we ran them. One
kept a comment where another dropped it, and two refused the same bad input with different exit codes. I
ended up rating the behaviour, which meant re-running examples against every arm's final code.

## Problems every arm shared

A few problems turned up in all six arms, and the spec we gave them didn't cover any of them. Some values that
`get` prints don't mean the same thing when you paste them back into the file, and I'd call that a bug.
History can show an old value until another command happens to run. A command waiting for a lock waits
forever, which isn't acceptable either. We'll fix all three in troupe.

## What we're doing next

We'll build troupe with OpenSpec for now. It came first under every weighting we tried, did best on
traceability, wrote a moderate amount of code, and cost about a fifth of what cc-sdd did. We'll answer its
archive question up front so unattended runs don't stall, run the linter and type checker in the pipeline,
and rely on troupe's own approval gates for the questions OpenSpec didn't ask.

Some of troupe's design changed too. The configuration file will be generated from recorded events, and a
hand edit is recorded as a change the next time any command runs, `history` included. State will be stored as
text that git can merge, which rules out SQLite. And anything troupe prints should mean the same thing when
you paste it back.

## Limits

This was one command-line tool, built once, with one model. One person rated the decisions, and we wrote some
of the rubrics after the first five steps had run. The arms' projects aren't public yet. We'll run a second
pass.
