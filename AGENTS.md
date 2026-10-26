# Agent Instructions

## Project Purpose

This repository contains an intentionally insecure authentication API used for security scanning and AI-remediation experiments.

The primary workflow is:

Application
→ security finding
→ LLM remediation
→ security validation

## Source of Truth

Product requirements live under:

specs/

Read the relevant specification files before implementing changes.

### Scanner-driven remediation exception

When the user explicitly invokes `deterministic-security-remediation`, do not
read files under `specs/`. The authoritative Scanbridge finding is the work
order and grants permission to remediate that finding only. Read only the
normalized finding, directly affected code, direct dependencies, and focused
tests.

## Implementation Rules

- Implement only the requested scope.
- Preserve previously implemented requirements.
- Do not proactively fix intentional vulnerabilities.
- Keep the architecture simple.
- Prefer maintainability over abstraction.
- Do not introduce external infrastructure unless explicitly requested.
- Keep security findings easy to map back to source code.
- Update tests when behavior changes.
- Update documentation when public behavior changes.

## Security Experiment Rules

Some vulnerabilities are intentional.

Before changing security-sensitive behavior, check:

specs/05-intentional-vulnerability-requirements.md

Do not remove an intentional vulnerability unless the current task explicitly asks for remediation.

The scanner-driven remediation exception above counts as an explicit request
to remediate its single selected finding. It does not authorize any other
security change.

## Completion Expectations

Before finishing a task:

- run tests;
- verify the application still starts;
- summarize files changed;
- summarize behavior changed;
- mention intentional vulnerabilities that remain.
