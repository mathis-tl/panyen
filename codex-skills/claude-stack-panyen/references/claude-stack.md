# Claude Lean Engineering Stack

Source read on 2026-09-01 from `/Users/mathistelle/Downloads/claude-stack-2026-08-31-v1.0.0.json`.
Stack version: `1.0.0`.
Updated at source: `2026-08-31`.

## Principles that change decisions

- Use the smallest useful workflow for the task.
- Prefer targeted context over repository-wide loading.
- Verify graph conclusions against source files.
- Do not invoke skills or subagents merely because they are available.
- Use fresh independent review only when risk justifies it.

## Default workflow

`UNDERSTAND -> SCOPE -> SOURCE -> PLAN -> CHANGE -> VERIFY -> REVIEW`

Use the sequence as a quality frame, not as a reason to add ceremony to trivial work.

## Components and when to lean on them

- `Claude Code`: primary engineering assistant for normal repo work.
- `Global CLAUDE.md`: global orchestration rules, but not a place for volatile project detail.
- `Codebase Memory`: default structural analysis tool when architecture, call paths, dependencies, or blast radius are unclear.
- `Agent Reach`: external/current research when official docs, GitHub releases, or community evidence materially help.
- `frontend-design`: substantial UI work where design quality matters.
- `mcp-builder`: only for MCP design or implementation.
- `skill-creator`: only when a workflow deserves a reusable skill.
- `tdd-adaptive`: reproducible bugs, business logic, auth, persistence, validation, risky refactors.
- `verification-loop`: final engineering quality gate before claiming significant work is done.
- `fresh-code-reviewer`: independent review for sensitive or high-blast-radius changes.
- `SkillSpector`: security gate before installing third-party agent infrastructure.
- `Headroom`: transparent wrapper optimization; do not treat it as a reasoning tool.
- `Graphify`: occasional visual or multimodal graph generation; not the default for everyday architecture questions.

## Practical implications for prompts and answers

- Prefer prompts that point to a few specific files rather than "read the whole repo".
- For architecture questions, ask first whether direct source reads are enough; escalate to graph tooling only when needed.
- For risky work, add verification and possibly independent review. For low-risk work, stay lean.
- Avoid suggesting optional stack components unless they clearly improve the current task.
