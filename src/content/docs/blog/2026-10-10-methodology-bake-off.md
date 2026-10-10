---
title: Six ways to build the same thing
date: 2026-10-10
excerpt: We ran five spec-driven development methods and plain Claude Code through the same seven-step build, then scored how they got there. They all got there. How they got there differed a lot.
tags:
  - bake-off
  - methods
---

Troupe will eventually build itself. Until then, something else has to. To choose that something, we ran a
bake-off: five spec-driven development methods, plus plain Claude Code as a control, building the same
software through the same seven steps.

This is what we found. It is one pass, of one task, on our harness. Read it as a field note, not a verdict
on any of these projects.

## What we ran

Six arms, each in its own project, with the same model and the same harness:

| Arm | What it is |
|---|---|
| OpenSpec | Change proposals with delta specs, archived when done |
| cc-sdd | Requirements, design and tasks phases, each approved before the next |
| Spec Kit | Specify, plan, tasks, implement |
| Spec Kitty | Spec Kit with work packages, lanes and its own issue tracker |
| Superpowers | Skills for brainstorming, planning and subagent-driven development |
| Control | Claude Code with nothing installed |

The task was a configuration tool for troupe itself: load a YAML file, read and set values without
disturbing the user's formatting, record every change in a history, follow includes, watch for hand edits,
handle aliases, then fetch remote includes against a schema. Each step arrived as a change request on top of
the last, so the arms had to live with their earlier decisions. Step 6 was a bug filed as a GitHub issue.
One step slipped in a teammate's commit made outside the arm's workflow.

Before writing code, each step ran once in a discovery run that stopped at the first question or gate. The
answers went into the brief, and a fresh scored run built the step.

## How it was scored

Eight dimensions, 100 points:

- **Correctness (20):** hidden tests the arms never saw.
- **Coping (20):** churn, hand edits, regressions across steps.
- **Code quality (15):** mutation testing, mypy and ruff, and test names you can triage from.
- **Decision quality (10):** the owner rated each design decision the arms made, blind, by what it did
  rather than how it was justified.
- **Interaction (10):** were gates in the right place, were questions worth asking, was research done first.
- **Traceability (10):** can a change be traced to a reason, and a requirement to a test.
- **Setup (10):** how naturally the method fits Claude Code.
- **Time (5):** wall-clock time per step.

Three judges with different lenses scored each judged item from anonymised material. Where they disagreed,
the owner decided. Blinding was partial: a method's vocabulary can give it away.

## The scorecard

| Arm | Total | Correctness | Coping | Code | Decisions | Interaction | Setup | Time | Trace |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **OpenSpec** | **77.6** | 19.8 | 17.8 | 9.1 | 7.2 | 6.0 | 8.0 | 1.1 | 8.5 |
| cc-sdd | 76.3 | 19.8 | 16.8 | 8.0 | 7.5 | 6.8 | 9.0 | 0.0 | 8.4 |
| Spec Kit | 75.2 | 19.8 | 16.8 | 10.2 | 6.9 | 5.1 | 8.0 | 0.4 | 8.1 |
| Spec Kitty | 74.1 | 19.5 | 17.3 | 7.9 | 7.3 | 8.0 | 6.0 | 0.0 | 8.1 |
| Superpowers | 70.9 | 19.7 | 16.6 | 6.5 | 6.8 | 3.3 | 9.0 | 2.4 | 6.5 |
| Control | 66.9 | 19.7 | 16.4 | 3.8 | 5.6 | 4.7 | 9.0 | 2.5 | 5.3 |

Spec Kit and Spec Kitty are within noise of each other. We varied every dimension's weight by five points
either way and pushed every disputed judgement to each judge's extreme. OpenSpec stayed first in every
variant. The top three are close, though: OpenSpec's range was 74.6 to 80.5, and cc-sdd's 72.3 to 80.3.

## What we found

### Everyone shipped working software

Hidden-test pass rates ran from 97% to 99% for every arm, at every step. The control passed as many as
anyone. The differences are almost entirely in how the software was built, not whether it works.

### The process costs up to 120 times as much

| Arm | Time, all steps | Cost, scored runs |
|---|---:|---:|
| Control | 48 min | $13 |
| Superpowers | 54 min | $27 |
| OpenSpec | 2 h 49 min | $142 |
| Spec Kit | 5 h 22 min | $273 |
| Spec Kitty | 23 h 44 min | $1,543 |
| cc-sdd | 40 h 57 min | $741 |

What the extra spend buys is mostly a record. The control's work could be traced to a reason a third of the
time. The methods managed between 70% and 92%.

### Asking, or deciding and mentioning it later

Two arms never stopped before writing code in any discovery run: the control and Superpowers. Neither asked
a question before building. The others asked between 7 and 23 in discovery runs.

Asking was not the main difference, though. The most common failure we scored was a design choice made
alone, built, committed, and then disclosed in the final summary: "Calls I made where the contract left
room." The choices were often reasonable. The point is that a person could no longer change them cheaply.
OpenSpec placed its gates best (0.89 of the available score); Superpowers least well (0.32).

One arm asked us a question, then answered it itself in its decision log before we replied.

### Where the questions were

Spec Kitty asked the most useful questions, in discovery and scored runs alike. That cost something: 36
minutes of the owner's time at gates, against under four minutes for every other arm.

Spec Kit asked almost all of its questions in discovery runs, then built without stopping. Judged on its
scored runs alone, it would have looked as if it never asked anything. We count both runs.

### Code quality drifted where nothing enforced it

Only Spec Kit and OpenSpec kept mypy and ruff anywhere near clean. OpenSpec started reasonably and decayed to
zero by step 6. Mutation scores were steadier, from 0.72 to 0.87. Test names ranged from readable
specifications (`test_get_of_a_collection_exits_5_naming_the_path_and_pointing_to_show`) to one test called
`test_watch` that checked six unrelated behaviours.

### The bug stayed open

Step 6 arrived as a GitHub issue. Every arm on GitHub fixed the bug and left the issue open, with no comment
and no link to the fix. Only Spec Kitty, with its own tracker, closed the loop.

### The same answer did not mean the same behaviour

Arms often gave the same answer to a design question and then behaved differently: one kept a comment, the
other dropped it; one refused a write with exit 3, the other with exit 4. We ended up rating observed
behaviour, re-running examples against every arm's final code, rather than the reasons they gave. This
mattered more than we expected.

### Blind spots every arm shared

Some problems turned up in all six arms:

- `get` printed `-inf` for a value written `-.inf`. Paste it back and you get a string.
- A tab in a value was written raw, invisible inside quotes, rather than as `\t`.
- An editor that saves by emptying the file first was recorded as deleting every key, then adding them back.
- `history` showed stale values until some other command ran.
- A command waiting on the lock waited forever.
- With no user identity available, changes were recorded as an anonymous human rather than refused.

None of these was in the contract. All of them are now on troupe's list.

## What it means for troupe

We will build troupe with OpenSpec until troupe can build itself. It came first under every weighting we
tried, its strongest dimension was traceability, and it cost about a tenth of the most expensive arm. We will enforce lint
in the pipeline rather than trust the method to, and lean on troupe's own gates where OpenSpec's questions
ran thin.

The bake-off also changed troupe's design:

- **Events first.** The configuration file is a projection of recorded events, kept in sync. A hand edit
  becomes a recorded change the next time anything runs.
- **History that merges.** State lives in text that git can merge. No SQLite.
- **Every command refreshes first,** history included, so nothing shows a stale value.
- **Output reads back as what it means.** If you can copy it, you can paste it back.

## Caveats

One task, a command-line tool. One model. One pass. One person rated the decisions. Our harness, our
rubrics, and some of those rubrics were written after the first five steps had run. The arms' projects are
not public yet. A season, not a single show: there will be another pass.
