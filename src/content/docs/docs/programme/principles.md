---
title: Principles
description: What troupe is being built toward.
status: written
---

These are commitments, not shipped features.

## Local-first, everything in your repo

Config, history and decisions live in git, on your machine. troupe doesn't need a hosted service to work.

## Humans are roles, not a loop

People hold roles the same way agents do. A question goes to the person who owns that decision, not to
whoever happens to be watching.

## Escalation that does its homework

Before an agent asks anyone, it runs the research steps your config defines: check the issues, read the docs,
look up the relevant standard. Then it brings a decision brief, not a bare question.

## Lineage from the first event

Every change records who made it, human or agent, who approved it, and when. That's there from the first
event, not added later.

## Config that survives hand-editing

Config is plain YAML. Edit it by hand and troupe keeps your formatting and comments.

## Bring your own agent

The process doesn't depend on one agent. Swap Claude Code for another without rewriting it.
