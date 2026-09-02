---
name: claude-stack-panyen
description: "Adapt responses and prompts to Mathis's Claude Lean Engineering Stack and the `panyen` repository context. Use when working in this repo or when producing instructions meant to be useful inside that stack."
---

# Claude Stack Panyen

Use this skill when collaborating on `panyen` or when writing prompts, plans, or implementation guidance that must fit Mathis's actual Claude workflow.

## Outcome

Produce answers that are directly usable in the user's stack: lean context loading, source-backed claims, explicit scope control, and respect for the repo's methodological constraints.

## Core behavior

- Prefer the smallest useful workflow for the task.
- Load targeted context before broad exploration.
- Before proposing custom infrastructure, research maintained existing solutions and
  prefer official documentation as evidence.
- Express project sequencing as verifiable increments, never as an arbitrary number
  of days.
- Verify important architectural or graph-based conclusions against source files before presenting them as facts.
- Do not invoke extra skills, agents, or research merely because they exist.
- For substantial engineering work, shape the work around `UNDERSTAND -> SCOPE -> SOURCE -> PLAN -> CHANGE -> VERIFY -> REVIEW`.

## Repo-first routing

- Read `CLAUDE.md` first when the task touches implementation, methodology, or team rules.
- Read [references/panyen-context.md](references/panyen-context.md) for the stable project frame and source-of-truth file map.
- Read [references/claude-stack.md](references/claude-stack.md) when choosing how much process, tooling, or review depth to apply.
- Go to `docs/CONTEXTE.md` and `docs/SOURCES.md` for any claim about prices, indices, fuel data, or what the project can validly assert.
- Go to `ROADMAP.md` for sequencing, current milestone intent, and frontend constraints.
- Read `SPEC.txt` for the single active increment. Keep it concise and replace it
  between increments instead of creating a growing collection of specs.

## Non-negotiables for this repo

- Reply in French unless the user asks otherwise.
- Treat any cross-territory comparison of index levels as a blocking methodological error.
- Never invent a number. Every value must come from a traced source or from a stated calculation based on traced sources.
- Keep ingestion raw-only: collectors download and store timestamped inputs; parsing and corrections belong downstream.
- Work on one topic at a time. For analysis/proposal requests, stop after evidence and 2-3 scoped options until the user asks for implementation.

## Tooling and depth choices

- For small or obvious tasks, prefer direct file reads over repo-wide scans.
- Use codebase graph tooling only when architecture, execution path, dependency reach, or blast radius is genuinely unclear.
- Use external/current research only when the repository lacks enough evidence or the answer depends on changing outside state.
- For substantial behavior changes, include a real verification pass rather than a purely descriptive answer.

## Prompt shaping

When producing a prompt for Claude or another agent:

- Put the exact question, bug, or outcome first.
- State why the active increment matters to the user, especially for Mathis's own
  understanding of the project.
- Name the smallest relevant file set to inspect.
- Require a search for maintained existing solutions before authorizing custom
  infrastructure; ask for source-backed decisions, not a generic tool list.
- Compare at most 2-3 architectures, and only when the choice is structurally important.
- Include the index-comparison guardrail if the task touches displayed numbers, charts, or methodology.
- Ask for proof from files, tests, or sources rather than generic advice.
- For implementation tasks, require a short verification pass and an explicit list of touched files.
