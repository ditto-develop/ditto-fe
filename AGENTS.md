# FE Agents Guide

This file is the Codex entrypoint for `ditto-fe-migration/`.

All coding agents working in this folder, including Codex and Claude Code, must follow the same project rules.

The source of truth for FE rules is `./CLAUDE.md`.

---

## Required Reading Order

Before making any change, read these files in order:

1. `../CLAUDE.md` — repository-level rules and clean code principles
2. `./CLAUDE.md` — FE-specific rules and conventions
3. `../AGENTS.md` — repository entrypoint summary

Do not rely only on this file.

---

## Role of Codex in This Repository

Codex is the implementation agent.

The expected workflow is:

1. Claude Code creates the plan.
2. Codex implements the approved plan.
3. Claude Code reviews the diff.
4. Codex applies review fixes if needed.
5. Claude Code prepares or validates the PR.

Codex should not expand the task scope beyond the provided Claude plan.

If there is no Claude plan, Codex must first inspect the relevant files and produce a short implementation plan before editing.

---

## Current Target Project

Only this project is in scope:

- `ditto-fe-migration/`

Out of scope:

- `ditto-fe/`
- `ditto-develop/ditto-be/`
- Backend implementation changes
- Legacy frontend cleanup outside `ditto-fe-migration/`

Do not modify out-of-scope projects unless the user explicitly asks.

---

## Branch and PR Rules

- Base branch: `feat/s3-migration`
- Cleanup branch naming: `chore/cleanup-<letter>-<slug>`
  - Example: `chore/cleanup-b-fetch-unify`
- One cleanup batch = one PR
- Do not mix multiple batches in one PR
- Separate file rename commits from content-change commits

---

## Cleanup Batch Rule

Cleanup work must follow the batch definitions in:

`~/.claude/plans/ditto-fe-migration-fancy-rose.md`

Do not cross batch boundaries.

If a required change appears to exceed the current batch scope, stop and ask the user.

---

## Implementation Rules

When implementing:

1. Read the relevant files first.
2. Search for existing patterns using `rg` or equivalent.
3. Reuse existing utilities and components.
4. Make the smallest correct change.
5. Preserve existing behavior.
6. Avoid speculative refactoring.
7. Do not change public APIs without user confirmation.
8. Do not introduce new dependencies unless explicitly approved.
9. Do not change deployment, CI, or infrastructure files unless required by the task.

---

## Strict FE Rules

Follow `./CLAUDE.md` for all FE conventions, especially:

- Use generated API services from `src/shared/lib/api/generated/`
- Do not call `fetch` or `axios` directly
- Use styled-components only
- Do not add CSS Modules or emotion
- Do not use hardcoded colors, fonts, or spacing
- Do not use hex, rgb, rgba, hsl, or fallback color values
- Do not add new `any`, `@ts-ignore`, or `@ts-expect-error`
- Use `import type` for type imports
- Prefer `@/` alias imports
- Do not use parent relative imports like `../` or `../../`
- Do not use default exports except Next.js route files
- Do not introduce React Query in this cleanup scope

---

## API Rules

- Components and hooks must call generated services from `src/shared/lib/api/generated/`.
- Do not create manual service files for endpoints missing from generated API.
- Do not manually duplicate generated DTOs.
- Do not loosen generated response types by making fields optional.
- If generated API and legacy API differ, stop and ask the user.

---

## Styling Rules

- All colors, fonts, and spacing must use CSS variable tokens.
- Do not use hardcoded `hex`, `rgb`, `rgba`, `hsl`, or fallback token values.
- Do not use inline styles for colors or typography.
- If a hardcoded value cannot be mapped to an existing token, stop and ask the user.
- Do not choose approximate token values.

---

## Validation

After changes, run:

```bash
npm run lint && npm run build && npx tsc --noEmit
```

If any command fails:

1. Identify whether the failure is caused by your changes.
2. Fix failures caused by your changes.
3. Clearly report pre-existing failures.

Do not report completion before validation is complete.

---

## Smoke Test Targets

When relevant, manually check:

- `/home`
- `/chat/one-on-one/[roomId]`
- `/chat/group/[roomId]`
- Group vote modal
- `/onboarding`
- `/admin/matches`
- `/admin/users`
- `/auth/callback`

---

## Cypress E2E Tests (Required for New Screens)

Whenever a new screen/route is developed (or an existing screen's user-facing flow changes meaningfully), you must add or update the matching Cypress E2E test. This is mandatory.

- Test location: `cypress/e2e/<domain>/` (see existing `matching-profile/`, `days/`, `flows/`, `smoke/`).
- Cover the primary happy-path flow end-to-end and reuse fixtures in `cypress/fixtures/`.
- Run before reporting completion:

```bash
npm run test:e2e:cypress
```

- A new-screen change is not complete until its Cypress test exists and passes.
- If a stable E2E test is not feasible (external dependency, unfinished BE), stop and ask the user instead of skipping silently.

See `./CLAUDE.md` section 12.1 for the full rule.

---

## Deployment Verification

After deployment, verify GitHub Actions with:

```bash
gh run watch <run_id> --repo ditto-develop/ditto-fe
```

If the run fails:

1. Inspect the logs.
2. Fix the issue.
3. Push again.
4. Watch the new run.

Do not report success before the deployment workflow succeeds.

---

## Stop and Ask the User

Stop immediately and ask the user if:

1. A hardcoded color or font cannot be mapped to an existing token.
2. Generated API and legacy API specs differ.
3. It is unclear whether BE integration is complete before removing mock code.
4. The split boundary of a large component is ambiguous.
5. A public API name or signature must change.
6. A required logic change exceeds the current cleanup batch.
7. The Claude plan conflicts with `./CLAUDE.md`.

Do not guess.
Do not choose approximate values.
Do not silently change scope.

---

## Git / Diff Rules

Before finishing:

1. Inspect the diff.
2. Remove debug logs.
3. Remove temporary comments.
4. Remove unused imports.
5. Confirm no unrelated files were changed.
6. Confirm rename-only changes are separated from content changes when applicable.

---

## Final Response Format

Always finish with:

```md
## Summary

- ...

## Files Changed

- `path/to/file`: ...

## Validation

- `npm run lint`: passed / failed / not run
- `npm run build`: passed / failed / not run
- `npx tsc --noEmit`: passed / failed / not run

## Notes / Risks

- ...
```

Do not claim that a command passed unless it was actually run.
