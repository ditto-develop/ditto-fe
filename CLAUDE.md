# ditto-fe-migration FE Rules

This document defines the rules for all coding agents working inside `ditto-fe-migration/`, including Claude Code and Codex.

Repository-level rules must be read from `../CLAUDE.md` first.

Codex must read `ditto-fe-migration/AGENTS.md`, which points back to this document as the FE source of truth.

This FE project is developed on the `feat/s3-migration` branch and is deployed statically through S3/CloudFront using `output: 'export'` in `next.config.ts`.

The project is gradually migrating from legacy API code in `src/lib/api` to OpenAPI codegen services in `src/shared/lib/api/generated`.

Only this project is currently in scope:

- `ditto-fe-migration/`

Out of scope:

- `ditto-develop/ditto-be/`
- `ditto-fe/`

Do not modify out-of-scope projects unless the user explicitly asks.

---

## Agent Workflow

This repository uses a three-step AI workflow:

1. Claude Code plans the task.
2. Codex implements the approved plan.
3. Claude Code reviews the diff and prepares or validates the PR.

Claude Code should usually operate in planning/review mode.

Codex should usually operate in implementation mode.

When asked to plan, Claude must not edit files.

When asked to review, Claude must inspect the diff and identify:

- Blocking issues
- Non-blocking suggestions
- Validation gaps
- PR risks
- Follow-up prompts for Codex if needed

---

## 1. Core Principles

1. Preserve behavior during cleanup.
   - Do not change business logic during cleanup.
   - If behavior change seems necessary, stop and ask the user.

2. Keep one source of truth.
   - The same concept should exist in one canonical place only.

3. Search before writing new code.
   - Use `rg` or equivalent to find existing implementations.
   - Reuse existing utilities and patterns.

4. Keep PRs small.
   - Work in reviewable batches.
   - Separate file rename commits from content-change commits.

5. Treat public API changes as high-risk.
   - Ask the user before changing externally imported symbol names or signatures.

---

## 2. Directory Ownership and Canonical Locations

| Area | Canonical Path | Rule |
|---|---|---|
| API client | `src/shared/lib/api/generated/` | Use generated services for all API calls. Legacy `src/lib/api` is being removed gradually. |
| Fetch wrapper | `src/shared/lib/api/client.ts` | Consolidate duplicated `apiFetch` logic. Admin-only logic may live in `adminClient.ts`. |
| Design system UI | `src/shared/ui/` | Button, Text, Avatar, Modal, Toast, and other reusable UI components. |
| Page-specific components | `src/components/<domain>/` | home/onboarding/quiz-specific components. Promote only truly reusable components to `shared/ui`. |
| Feature hooks/types/containers | `src/features/<domain>/` | matching/profile/conversation feature logic. Do not cross domain boundaries casually. |
| Global state | `src/context/` | HomeReady and Toast. Check existing context before adding new context. |
| Design tokens | `src/styles/token/{atomic,semantic,components}.css` | The only CSS token source. |
| Runtime token references | `src/shared/styles/tokens.ts` | TS runtime references only. Must stay synchronized with CSS tokens. |
| Global types | `src/types/` | Feature-specific types belong in `features/<domain>/model/types.ts`. Reuse generated DTOs where possible. |

---

## 3. API Layer Rules

- Components and hooks must call service methods from `src/shared/lib/api/generated`.
- Do not call `fetch` or `axios` directly.
- All API requests must go through the shared client.
- General user tokens are handled through the `OpenAPI.TOKEN` resolver.
- Admin token handling must stay separate.
- Request and response types must reuse generated DTOs.
- Do not manually duplicate generated DTOs.
- Do not make response fields optional just to silence type errors.
- If an endpoint is missing from generated API, do not create a manual service file.
- Instead, ask for the BE spec to be updated and rerun `npm run generate-client`.
- React Query is outside the current cleanup scope.
- Do not introduce React Query.

---

## 4. UI Component Rules

- Reusable components belong in `src/shared/ui`.
- `src/components/common`, `src/components/display`, and `src/components/input` are transitional zones.
- Common components in transitional zones should gradually move to `shared/ui`.
- Page/domain-specific components must not be moved to `shared/ui`.
- Toast must be called only through the `useToast()` hook.
- Do not directly import and render the `Toast` component.
- Use PascalCase filenames.
  - Good: `MatchingDay.tsx`
  - Bad: `Step_0.tsx`
- Rename `Step_0.tsx` style files to `Step0.tsx` during relevant refactors.
- Rename typo files when in scope.
  - Example: `Carousle.tsx` → `Carousel.tsx`
- Prefer named exports.
- Default exports are allowed only for Next.js route files:
  - `page.tsx`
  - `layout.tsx`
  - `error.tsx`
  - `loading.tsx`
  - `not-found.tsx`

---

## 5. Styling Rules

### 5.1 Design Tokens Are Required

All colors, typography, and spacing must use CSS variable tokens.

Color tokens must follow this format:

```css
var(--color-semantic-*)
```

Example mapping:

```txt
Semantic/Text/Normal/Strong
→ var(--color-semantic-text-normal-strong)
```

Typography tokens must follow this format:

```css
var(--typography-*-font-size)
var(--typography-*-font-weight)
var(--typography-*-line-height)
var(--typography-*-letter-spacing)
```

Example mapping:

```txt
Typography/Body/Medium
→ var(--typography-body-medium-font-size)
```

Hardcoded values are forbidden:

- hex
- rgb
- rgba
- hsl
- px font-size
- fixed numeric line-height
- fallback values like `var(--color-x, #ffffff)`

If a hardcoded value cannot be mapped to an existing token, do not choose an approximate token.

Stop and ask the user.

---

### 5.2 Styling Method

- `styled-components` is the only standard styling method.
- Do not introduce CSS Modules.
- Do not introduce emotion.
- Do not add new inline styles.
- Existing inline styles should be gradually extracted into styled blocks.
- `className` usage should be minimal and limited to library integration inside `shared/ui`.
- Use styled props for conditional styling.

Example:

```tsx
const Box = styled.div<{ $active?: boolean }>`
  color: ${({ $active }) =>
    $active
      ? 'var(--color-semantic-text-normal-strong)'
      : 'var(--color-semantic-text-normal-default)'};
`;
```

One-off dynamic layout values may use inline style only when unavoidable.

Allowed example:

```tsx
<div style={{ width: computedWidth }} />
```

Forbidden examples:

```tsx
<div style={{ color: '#ffffff' }} />
<div style={{ fontSize: '14px' }} />
```

---

## 6. TypeScript Rules

- Do not add new `any`.
- Do not add new `@ts-ignore`.
- Do not add new `@ts-expect-error`.
- Use `unknown` in catch blocks.

Good:

```ts
catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);
  }
}
```

Bad:

```ts
catch (err: any) {
  console.error(err.message);
}
```

- If an external SDK has no type, add a minimal `declare module` or global declaration.
- Keep feature-specific types in `features/<domain>/model/types.ts`.
- Remove manual types that duplicate generated DTOs.

---

## 7. Import / Export Rules

- Prefer `@/` alias imports.
- Do not use parent relative imports like `../` or `../../`.
- Sibling relative imports like `./Sibling` are allowed.
- Use `import type` for type imports.
- Follow `@typescript-eslint/consistent-type-imports`.
- Barrel `index.ts` files are allowed only in limited canonical locations:
  - `src/shared/ui`
  - `src/components/common`
  - `src/components/display`
- Do not add arbitrary barrel files.
- Do not use default exports except for Next.js route files.

---

## 8. State Management Rules

- Do not introduce new global state libraries.
- Do not add zustand, jotai, redux, or similar state tools.
- React Query is outside the current scope.
- Do not introduce React Query.
- Async data should use existing Context or local `useState` + `useEffect`.
- Avoid loading the same data independently in multiple places.
- Extract repeated loading logic into hooks.
- Major state restructuring is allowed only in the relevant cleanup batch.

---

## 9. Mock and Dead Code Rules

- `src/lib/mock/chatMockData.ts` and component-level mock branches should be removed only after BE integration is confirmed.
- If BE integration is incomplete, isolate mock code with:

```ts
process.env.NODE_ENV === 'development'
```

- Add a short comment explaining why the mock branch remains.
- Dead code removal should be based on `npx knip` or `npx ts-prune`.
- Whitelist:
  - `src/shared/lib/api/generated/**`
  - `src/app/**` route files
  - `.stories.tsx`
- TODO and FIXME comments should be either resolved or converted into issues.
- Do not leave vague TODO comments.

---

## 10. Large Component Rules

Components over 500 lines are refactor candidates.

Known examples:

- `src/components/home/MatchingDay.tsx`
- `src/app/chat/group/[roomId]/_components/GroupVoteCreateModal.tsx`
- `src/app/chat/group/[roomId]/_components/VoteResultsPage.tsx`
- `src/app/chat/group/[roomId]/_components/VoteSubmissionPage.tsx`

When splitting large components:

1. Separate pure move commits from refactor commits.
2. Avoid logic changes.
3. Put local parts in `_parts/`.
4. Put hooks in `features/<domain>/hooks/` or local `_hooks/`.
5. If the split boundary is ambiguous, stop and ask the user.

---

## 11. Validation

After changes, run:

```bash
npm run lint && npm run build && npx tsc --noEmit
```

All three must pass before reporting completion.

If validation fails:

1. Identify whether the failure is caused by the current changes.
2. Fix failures caused by the current changes.
3. Report pre-existing failures clearly.
4. Do not claim success if validation failed.

---

## 12. Smoke Tests

When relevant, manually test:

- `/home`
- `/chat/one-on-one/[roomId]`
- `/chat/group/[roomId]`
- Group vote modal
- `/onboarding`
- `/admin/matches`
- `/admin/users`
- `/auth/callback`

---

## 12.1 Cypress E2E Tests (Required for New Screens)

Whenever a **new screen/route is developed** (or an existing screen's user-facing flow changes meaningfully), you must add or update the corresponding Cypress E2E test. This is mandatory, not optional.

- Test location: `cypress/e2e/<domain>/` (see existing `matching-profile/`, `days/`, `flows/`, `smoke/`).
- Cover the primary happy-path flow of the new screen end-to-end (entry → key interactions → expected result).
- Reuse shared fixtures in `cypress/fixtures/` and existing custom commands instead of duplicating setup.
- Run the suite before reporting completion:

```bash
npm run test:e2e:cypress
```

- A new-screen PR is not complete until its Cypress test exists and passes.
- If the new screen's flow cannot be expressed as a stable E2E test (e.g. external dependency, unfinished BE), stop and ask the user rather than skipping the test silently.

---

## 13. Deployment Verification

### 13.0 How Deployment Works (read this first)

Staging deployment is triggered by pushing commits to the `feat/s3-migration` branch. Production deployment is triggered manually with `workflow_dispatch`, normally from `main` after staging validation.

- The staging workflow is [`.github/workflows/deploy-staging.yml`](.github/workflows/deploy-staging.yml): on `feat/s3-migration` push it runs `npm ci` → `npm run build` (static export to `./out`) → `aws s3 sync ./out s3://<bucket>/staging --delete` → CloudFront `/*` invalidation.
- The production workflow is [`.github/workflows/deploy-prod.yml`](.github/workflows/deploy-prod.yml): on manual dispatch it runs the same build and syncs to `s3://<bucket>/prod --delete` → CloudFront `/*` invalidation.
- `test.ditto.pics` is routed to the `/staging` S3 prefix. `ditto.pics` and `www.ditto.pics` are routed to the `/prod` S3 prefix.
- **Uncommitted or unpushed changes are NEVER deployed.** Working-tree edits and local `npm run build` output (`./out`) have no effect on the live site until they are committed AND pushed. If "deployment isn't happening," first check `git status` and `git log origin/feat/s3-migration..feat/s3-migration` for unpushed work — that is the most common cause.

### 13.1 When the User Says "Push" / "Deploy"

A staging push/deploy instruction means: commit ALL relevant changes, push to `feat/s3-migration`, and watch the staging run until it succeeds. A production deploy instruction means: merge or fast-forward the validated changes to `main`, manually dispatch `deploy-prod.yml`, and watch that run until it succeeds. Do not stop at "validation passed" — the user expects the code to actually reach the remote and deploy. Run `npm run lint && npm run build && npx tsc --noEmit` first, then commit and push.

### 13.2 Deployment Infrastructure (AWS, account `247842832483`)

| Resource | Value |
|---|---|
| GitHub repo | `ditto-develop/ditto-fe` (branch `feat/s3-migration`) |
| S3 bucket | `ditto-pics-247842832483-ap-northeast-2` (region `ap-northeast-2`) |
| CloudFront distribution | `E2IAN5BWR5D33B` |
| Domains | `ditto.pics`, `www.ditto.pics`, `test.ditto.pics` (`d28wm0h79feewt.cloudfront.net`) |

S3 prefixes:

- `staging/`: `test.ditto.pics`
- `prod/`: `ditto.pics`, `www.ditto.pics`

To compare deployed vs local content directly: `aws s3 ls s3://ditto-pics-247842832483-ap-northeast-2/ --recursive`, or `aws s3 cp <key> -` to inspect a file. Note that `_next/static/chunks/*` filenames are content-hashed and the build ID differs on every build, so chunk-name diffs are expected noise — compare route/HTML structure and normalized content, not raw filenames.

### 13.3 Verify GitHub Actions

After pushing, verify GitHub Actions:

```bash
gh run watch <run_id> --repo ditto-develop/ditto-fe
```

If the workflow fails:

1. Inspect logs immediately.
2. Fix the issue.
3. Push again.
4. Watch the new run.

Do not report deployment success before the workflow succeeds.

---

## 14. Cleanup Batch Convention

Cleanup work must follow:

```txt
~/.claude/plans/ditto-fe-migration-fancy-rose.md
```

Rules:

- Branch name: `chore/cleanup-<letter>-<slug>`
  - Example: `chore/cleanup-a-token-replace`
- One cleanup batch = one PR
- Batch I and J may be split by file or service.
- PR body must include:
  - Change scope
  - Validation checklist
  - Screenshots when visual cleanup is involved
  - Mapping/replacement table for batch A
  - Spec diff for batch I
- Do not cross batch boundaries.
- Do not mix multiple batches in one PR.

---

## 15. Stop and Ask the User

Stop immediately and ask the user if:

1. A hardcoded color or font cannot be mapped to an existing token.
2. Generated API and legacy API specs differ.
3. It is unclear whether BE integration is complete before removing mock code.
4. The split boundary of a large component is ambiguous.
5. A public API name or signature must change.
6. A required logic change exceeds the current cleanup batch.
7. The Claude plan conflicts with this document.
8. The task requires modifying out-of-scope projects.

Do not guess.
Do not choose approximate values.
Do not silently change scope.

---

## 16. Claude Planning Format

When asked to plan a task, use this format:

```md
## Task Understanding

Briefly explain what needs to change.

## Relevant Files

- `path/to/file`: why it matters

## Current Flow

Explain how the existing code works.

## Proposed Implementation

Step-by-step implementation plan.

## Risks

- Risk 1
- Risk 2

## Validation Plan

- Command or manual check
- Command or manual check

## Codex Prompt

A concise prompt that can be pasted into Codex for implementation.
```

Do not edit files during planning.

---

## 17. Claude Review Format

When reviewing Codex output, use this format:

```md
## Review Summary

Overall assessment.

## Blocking Issues

Issues that must be fixed before merge.

## Non-blocking Suggestions

Nice-to-have improvements.

## Validation Review

- Commands run
- Missing validation
- Smoke tests needed

## PR Risk

Low / Medium / High

## Suggested Codex Fix Prompt

A concise prompt that can be pasted into Codex to fix the issues.
```

If there are no blocking issues, clearly say:

```txt
No blocking issues found.
```

---

## 18. PR Description Format

When preparing a PR description, use this format:

```md
## Summary

- Change 1
- Change 2
- Change 3

## Why

Explain the motivation.

## Changes

- `file/path`: what changed
- `file/path`: what changed

## Validation

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npx tsc --noEmit`
- [ ] Smoke test completed
- [ ] Deployment workflow passed

## Risks

- Risk or "None known"

## Screenshots / Evidence

Add if applicable.
```

---

## 19. Communication Style

- Be direct.
- Separate facts from assumptions.
- Do not over-explain obvious code.
- Prefer concrete file-level feedback.
- Provide Codex-ready prompts when follow-up implementation is needed.
- Do not claim validation passed unless there is evidence.
