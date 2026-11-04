# ditto-fe-migration FE Rules

This document defines the rules for all coding agents working inside `ditto-fe-migration/`, including Claude Code and Codex.

Repository-level rules must be read from `../CLAUDE.md` first.

Codex must read `ditto-fe-migration/AGENTS.md`, which points back to this document as the FE source of truth.

This FE project is developed on the `feat/s3-migration` branch, released by merging into the `deploy` branch, and deployed statically through S3/CloudFront using `output: 'export'` in `next.config.ts`.

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
| API client (live, `/api/v1`) | `src/shared/lib/api/externalApi.ts` (+ `externalClient.ts`) | Forward-canonical client for the live BE. Matching/profile/settings/auth run here. Add new endpoints following the existing pattern. |
| API client (generated, `/api`) | `src/shared/lib/api/generated/` (via `client.ts`) | OpenAPI codegen services still used for chat/quiz/home. Migrated to `/api/v1` incrementally. Legacy `src/lib/api` already removed. |
| Fetch wrapper | `src/shared/lib/api/client.ts` | Consolidate duplicated `apiFetch` logic. Admin-only logic may live in `adminClient.ts`. |
| Design system UI | `src/shared/ui/` | Button, Text, Avatar, Modal, Toast, and other reusable UI components. |
| Page-specific components | `src/components/<domain>/` | home/onboarding/quiz-specific components. Promote only truly reusable components to `shared/ui`. |
| Feature hooks/types/containers | `src/features/<domain>/` | matching/profile/conversation feature logic. Do not cross domain boundaries casually. |
| Global state | `src/context/` | HomeReady and Toast. Check existing context before adding new context. |
| Design tokens | `src/styles/token/{atomic,semantic,components}.css` | The only CSS token source. |
| Runtime token references | `src/shared/styles/tokens.ts` | TS runtime references only. Must stay synchronized with CSS tokens. |
| Global types | `src/types/` | Feature-specific types belong in `features/<domain>/model/types.ts`. Reuse generated DTOs where possible. |

---

`externalApi.ts` (`/api/v1`) is the **main, surviving client**. The generated client is being phased out: as the live `/api/v1` BE is built out, the generated services (and `client.ts`) will be deleted. Do not deepen the generated client — route new work through `externalApi`.

The project currently uses two shared API clients. Every request goes through one of them — never call `fetch` or `axios` directly outside the client modules themselves.

- `src/shared/lib/api/externalApi.ts` (+ `externalClient.ts`): the canonical client for the live `/api/v1` BE. Matching, profile, settings, and auth already run through it. Add newly-migrated endpoints here following the existing function pattern, and reuse the DTO types defined alongside them.
- `src/shared/lib/api/generated/` (via `client.ts`): OpenAPI codegen services for the `/api` endpoints not yet migrated (chat, quiz, parts of home). **Do not regenerate** — the BE spec is REST Docs-derived with no named schemas, so codegen emits hash names like `api_v1_chat_rooms_roomId_votes_696220761`. The folder is frozen: `models/` for types, `core/` for the request wrapper used by `client.ts`/`adminClient.ts`. `services/` was deleted (2026-09-17) because it pointed at endpoints the server does not have. Add new endpoints via `externalApiFetch`. These migrate to `/api/v1` incrementally and the generated layer is removed once empty.
- Token access for both clients goes through the single entry point `src/shared/lib/auth.ts` (`getAccessToken` / `setTokens` / `clearTokens`). Do not re-read `localStorage` for `accessToken` directly in client code.
- Legacy `src/lib/api` has been removed. Do not reintroduce it.
- Admin token handling stays separate in `adminClient.ts`.
- Reuse generated / externalApi DTOs. Do not manually duplicate them, and do not make response fields optional just to silence type errors.
- React Query is outside the current cleanup scope. Do not introduce React Query.
- When generated and live (`/api/v1`) specs disagree, stop and ask (§15) — do not guess.

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
- Rename `Step_N.tsx` style files to `StepN.tsx` during relevant refactors (`Step_1.tsx`/`Step_2.tsx`/`Step_3.tsx` still pending; `Step0.tsx` already renamed).
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

### 5.3 Admin Pages Exception

`src/app/admin/**` is internal operator tooling, not a user-facing product surface. It is **exempt** from the strict styling rules in §5.1–§5.2:

- Inline styles and ad-hoc simplified styling are allowed.
- Hardcoded colors/spacing are tolerated (no design-token requirement).
- Raw `alert()` / `confirm()` are allowed in place of `useToast()` / modal components.

Do not spend cleanup effort converting admin pages to styled-components or tokens unless explicitly asked. All token / styled-components / `useToast` rules in §4–§5 apply to **every non-admin surface**.

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

- Mock data lives in MSW handlers under `src/mocks/` (`handlers.ts` + `fixtures/`), gated by `NEXT_PUBLIC_API_MOCKING=enabled` via `MswProvider`. The old `src/lib/mock/chatMockData.ts` has already been removed.
- Component-level mock branches should be removed only after BE integration is confirmed.
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

## 9.1 Unreleased Features — Tester Mode Flags

There is no staging (§13.0), so a new screen ships to production **hidden** and the team checks it
there first. Tapping the home logo 7 times toggles "tester mode" on that device (localStorage);
features at stage `"tester"` are visible only in tester mode. Source: `src/shared/lib/featureFlags.ts`.

When building a new screen or feature that must not be public yet:

1. Register it in `FEATURES` in `src/shared/lib/featureFlags.ts`: `records: "tester",`.
2. **Gate every entry point** (tab, button, banner, link) with
   `useFeatureFlag("records")` from `@/shared/lib/hooks/useFeatureFlag`.
3. **Gate the route itself.** Static export uploads the page HTML regardless of the flag, so a URL,
   push or deep link still opens it. At the top of the page component:
   `const allowed = useFeatureGate("records"); if (!allowed) return null;`
   (redirects to `/home` when off; waits while the flag is still unknown during hydration).
4. Cypress (§12.1): call `cy.enableTesterMode()` before `cy.visit` in the new screen's tests. Also
   assert that the entry point is **absent** without it.
5. **Release** = change the value to `"all"` and deploy. Later cleanup removes the key and the
   branches together — deleting the key makes every remaining `useFeatureFlag("records")` a type error.

Limits: this hides UI only. It is not access control (the code is in the bundle) and it does not
gate APIs — any BE API the feature calls must already be live in the production BE. Changes to
existing code paths (bug fixes, refactors) cannot be hidden this way.

---

## 10. Large Component Rules

Components over 500 lines are refactor candidates.

Known examples:

- `src/components/home/GroupMatchingResultModal.tsx` (~620)
- `src/app/admin/matches/page.tsx` (~590, admin — exempt from styling rules but still a split candidate)
- `src/app/chat/group/[roomId]/_components/_parts/VoteResultsPage.parts.tsx` (~550)
- `src/app/chat/group/[roomId]/_components/_parts/GroupVoteCreateModal.parts.tsx` (~540)
- `src/app/chat/one-on-one/[roomId]/_components/MessageList.tsx` (~480)

(The previously-listed `GroupVoteCreateModal.tsx` / `VoteResultsPage.tsx` / `VoteSubmissionPage.tsx` and `home/MatchingDay.tsx` have already been split into `_parts/`.)

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

**`deploy` is the release branch. Pushing to `deploy` deploys straight to production
(`ditto.pics`).** Day-to-day work still lands on `feat/s3-migration`; a release is a
`feat/s3-migration` → `deploy` merge (since 2026-09-19 — before that, pushing the work branch
itself released).

There is no staging environment as of 2026-08-26 — `test.ditto.pics` was dropped during the
Route53 migration and is not coming back. An `alpha.ditto.pics` environment is planned for
after the first release, at which point a second workflow will be added.

- The only deploy workflow is [`.github/workflows/deploy-prod.yml`](.github/workflows/deploy-prod.yml).
  It runs on push to `deploy` and on manual `workflow_dispatch`.
- It has two jobs. **`verify` gates `deploy`** — lint, typecheck, vitest, and Cypress E2E must
  all pass before anything reaches S3. This gate replaces the staging buffer; do not weaken it.
- `deploy` then runs `npm run build` (static export to `./out`) → uploads the build into a new
  release folder (see §13.2.2) → **switches** by publishing the CloudFront function with that
  release's prefix → CloudFront `/*` invalidation → prunes old releases and abandoned chunks.
- **Rollback** = run the workflow manually with `rollback_to=<release id>` (no build, seconds).
  Candidates: `aws s3 ls s3://ditto-pics-247842832483-ap-northeast-2/releases-meta/` (last 5).
- [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) is **pull-request only**. The push
  path's E2E lives in the deploy workflow's `verify` job, so it can block the deploy.
- `ditto.pics` and `www.ditto.pics` are routed to the current `releases/<id>/` S3 prefix, chunks to
  the shared `prod/_next/static/` (`www` 301s to the apex).
- **Uncommitted or unpushed changes are NEVER deployed.** Working-tree edits and local
  `npm run build` output (`./out`) have no effect on the live site until they are committed AND
  pushed. If "deployment isn't happening," first check `git status`, then
  `git log origin/deploy..feat/s3-migration` for work that has not been released yet.

### 13.1 When the User Says "Push" / "Deploy"

These are now two different actions — check which one is meant.

- **"Push"** = commit all relevant changes and push `feat/s3-migration`. This runs no deploy.
- **"Deploy" / "릴리스"** = merge `feat/s3-migration` into `deploy` and push `deploy`, then
  watch the run until it succeeds.

Run `npm run lint && npm run build && npx tsc --noEmit` locally first — the workflow will run
the full suite anyway, but catching failures locally is faster than waiting for CI.

For a deploy, do not stop at "validation passed" — the user expects the code to actually reach
production. After the run succeeds, confirm the live site with `npm run verify:domains`.

### 13.2 Deployment Infrastructure (AWS, account `247842832483`)

| Resource | Value |
|---|---|
| GitHub repo | `ditto-develop/ditto-fe` (work: `feat/s3-migration`, release: `deploy`) |
| S3 bucket | `ditto-pics-247842832483-ap-northeast-2` (region `ap-northeast-2`) |
| CloudFront distribution | `E2IAN5BWR5D33B` |
| Domains | `ditto.pics`, `www.ditto.pics` (`d28wm0h79feewt.cloudfront.net`). DNS is Route53 since 2026-08-26 |

S3 prefixes:

- `releases/<id>/`: one full build per deploy (everything except `_next/static`). The CloudFront
  function's `PROD_RELEASE_PREFIX` picks the live one. `<id>` = `<run_id>-<run_attempt>-<sha7>`.
- `releases-meta/<id>/`: `function.js` (the exact function that release was published with — used
  by rollback) and `chunks.txt` (its chunk keys — protects them from pruning). Never served.
- `prod/_next/static/`: the shared chunk pool, live for every release.
- `prod/` (everything else): frozen at the last deploy before release folders (2026-11). Nothing
  serves it unless the **committed** function (default `PROD_RELEASE_PREFIX = '/prod'`) is
  published as-is. Safe to delete once a few releases have gone out.
- `staging/`: orphaned. `test.ditto.pics` was dropped in the Route53 migration and nothing
  serves this prefix any more. Safe to delete once `alpha.ditto.pics` is set up.

To compare deployed vs local content directly: `aws s3 ls s3://ditto-pics-247842832483-ap-northeast-2/ --recursive`, or `aws s3 cp <key> -` to inspect a file. Note that `_next/static/chunks/*` filenames are content-hashed and the build ID differs on every build, so chunk-name diffs are expected noise — compare route/HTML structure and normalized content, not raw filenames.

### 13.2.1 Cache-Control: never rewrite S3 metadata in place

**Do not use `aws s3 cp <s3-uri> <same-s3-uri> --metadata-directive REPLACE` to change cache
headers.** It also rewrites `Content-Type`, and for an S3→S3 copy the CLI does **not** re-guess
it from the key — every object lands as `binary/octet-stream`. On 2026-09-18 this took
production down: all of `_next/static/**` was served as octet-stream with `max-age=31536000,
immutable`, and because the header-verification step then failed, the CloudFront invalidation
never ran (run `35312035278`).

To set a long cache, **re-upload from `./out`** (`aws s3 cp ./out <bucket> --recursive --include
…`). A local upload guesses the type the same way `s3 sync` does, so types stay correct.

Classify by **file extension, not directory**. `out/quiz/` and `out/onboarding/` hold both
`public/` assets *and* route output (`index.html`, `__next.*.txt`) in the same path — a
directory-wide 30-day cache pins route HTML in browser caches and deploys stop reaching users.

The `Verify Content-Type and Cache-Control` step asserts one object per class plus route HTML;
keep it, and note it gates the invalidation, so a failure there leaves S3 updated but edges
stale — fix forward and re-run rather than leaving it red.

### 13.2.2 Release folders and the atomic switch (zero-downtime)

S3/CloudFront never goes down during a deploy — there is no process to restart. The real
hazards are **version skew** (some routes new, some old while files are being overwritten) and
**stale tabs** (a tab that loaded before the deploy keeps requesting the old build's hashed
chunks). The deploy handles both; do not undo these rules.

1. **Upload everything first, then switch once.** Each deploy uploads into a fresh
   `releases/<id>/` that nobody is looking at yet, then publishes the CloudFront function with
   `PROD_RELEASE_PREFIX = '/releases/<id>'` (rendered by `scripts/render-cf-release-function.mjs`,
   which fails unless it replaces exactly one line). That publish *is* the release. While the
   function propagates, users flip at slightly different moments, but every request gets HTML
   and files from one release. The cache key uses the rewritten URI, so a new release starts
   with fresh cache keys.
2. **Header verification runs before the switch.** If it fails, users stay on the previous
   release — fix forward and re-run.
3. **Chunks live in one shared pool, `prod/_next/static/**`, and are never deleted by the
   upload.** The function sends only `/_next/static/` there. Filenames are content-hashed, so
   releases coexist harmlessly, and a tab from before the switch still gets its old chunks.
   Moving chunks into release folders would turn every deploy into a mass `ChunkLoadError`.
4. **Pruning happens inside the deploy, not by an S3 lifecycle rule.** The last step keeps the
   newest 5 releases and deletes chunks that are older than 7 days **and** not listed in any kept
   release's `chunks.txt` — so a rollback target always has its chunks. A bucket lifecycle
   `Expiration` rule would be wrong: it runs regardless of deploys, so a quiet week would expire
   the **live** chunks and take the site down.
5. **One deploy at a time.** The workflow has `concurrency: deploy-prod`; two overlapping runs
   could otherwise publish their functions in the wrong order.

The client-side backstop is [`src/shared/lib/chunkReload.ts`](src/shared/lib/chunkReload.ts),
wired in `ClientLayout`: on a chunk/module load failure it reloads the document once (30s
cooldown, so a permanently-missing chunk cannot cause a reload loop). It only reacts to
same-origin `/_next/static/` failures — third-party scripts blocked by an ad blocker must not
trigger reloads.

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
