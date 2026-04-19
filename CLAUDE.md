# ditto-fe-migration FE 규약

> 이 문서는 **Claude Code와 Codex를 포함한 모든 코딩 에이전트**가 이 폴더에서 작업할 때 따라야 하는 규칙이다.
> 프로젝트 수준 규칙은 상위 [`../CLAUDE.md`](../CLAUDE.md)를 먼저 읽는다.
> Codex는 `ditto-fe-migration/AGENTS.md`를 읽어 본 문서와 동일한 규칙을 적용한다.

이 FE는 `feat/s3-migration` 브랜치에서 개발되며 S3/CloudFront로 정적 배포된다 (`next.config.ts`의 `output: 'export'` 기반 SSG). 레거시 API(`src/lib/api`)에서 OpenAPI codegen(`src/shared/lib/api/generated`)으로의 점진 전환 중이다.

---

## 1. 대원칙

1. **기능 동작 보존**: 클린업 중 비즈니스 로직을 바꾸지 않는다. 필요하면 중단하고 사용자 확인.
2. **정본 단일화**: 같은 개념은 한 곳에만 둔다.
3. **새 코드 작성 전 기존 확인**: `rg` / `grep`으로 유사 구현 검색 후 재사용.
4. **작은 배치**: PR은 리뷰 가능한 단위로. 파일 rename과 내용 수정은 커밋을 분리.
5. **public API 리네이밍은 플래그**: 외부에서 import되는 심볼명/시그니처 변경 전 사용자 확인.

---

## 2. 디렉토리 역할과 정본

| 영역 | 정본 경로 | 규칙 |
|---|---|---|
| API 클라이언트 | `src/shared/lib/api/generated/` | 모든 API는 이 경로의 generated 서비스를 사용. legacy `src/lib/api`는 **점진 제거 대상**. |
| fetch 래퍼 | `src/shared/lib/api/client.ts` (통합 예정) | `profileApi`·`matchingApi`·`adminApi`의 개별 `apiFetch` 중복은 제거. admin용만 별도 `adminClient.ts`. |
| 디자인 시스템 UI | `src/shared/ui/` | Button, Text, Avatar, Modal, Toast 등 **범용** 컴포넌트. 페이지/도메인 특화는 이동하지 않는다. |
| 페이지 특화 컴포넌트 | `src/components/<domain>/` | home/onboarding/quiz 전용. 공용성이 있으면 `shared/ui`로 승격. |
| 도메인 훅·타입·컨테이너 | `src/features/<domain>/` | matching/profile/conversation. 도메인 경계를 넘는 import 금지. |
| 전역 상태 | `src/context/` | HomeReady, Toast. 새 Context 추가 전 기존으로 충분한지 검토. |
| 디자인 토큰 | `src/styles/token/{atomic,semantic,components}.css` | 유일한 토큰 소스. `src/shared/styles/tokens.ts`는 TS 런타임 참조용이며 CSS 토큰과 **동기화** 책임. |
| 전역 타입 | `src/types/` | 피처 종속 타입은 `features/<domain>/model/types.ts`로. generated DTO는 그대로 재사용. |

---

## 3. API 레이어 규칙

- **호출**: 컴포넌트·훅에서는 `src/shared/lib/api/generated`의 서비스 메서드만 호출한다.
- **fetch 래퍼**: 직접 `fetch` 또는 `axios` 호출 금지. 공통 client를 통해서만.
- **토큰**: 일반 사용자 토큰은 `OpenAPI.TOKEN` resolver로 관리. admin 토큰(`adminAccessToken`)은 별도 client.
- **타입**: 요청/응답은 generated DTO를 그대로 사용. 수동 DTO 복제 금지. 응답 필드 누락을 임의로 optional로 완화하지 않는다.
- **generated에 없는 엔드포인트**: 수작업 서비스 파일을 직접 만들지 말고, BE(`ditto-develop/ditto-be:develop`)의 spec에 추가 요청 후 `npm run generate-client` 재실행.
- **React Query**: 이번 클린업 범위 외. 신규 도입 금지.

---

## 4. 공용 UI 규칙

- 재사용성이 있는 컴포넌트는 `src/shared/ui`에만 둔다.
- `src/components/common`, `src/components/display`, `src/components/input`은 **과도기 존** — 이 경로에 있는 공용 컴포넌트는 `shared/ui`로 점진 이동한다.
- **Toast**: `useToast()` 훅으로만 호출. `Toast` 컴포넌트를 직접 import하지 않는다.
- **파일명**: PascalCase 유지 (`MatchingDay.tsx`). 언더스코어 케이스(`Step_0.tsx`)는 금지, 리팩터링 시 `Step0.tsx`로 수정.
- 오타 수정 대상: `Carousle.tsx` → `Carousel.tsx`.
- **export**: named export 우선. `app/` 라우트 파일(`page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`)만 default export 허용.

---

## 5. 스타일링 규칙 (엄격)

### 5-1. 디자인 토큰 — 필수

- 모든 색상·폰트·간격은 CSS 변수 토큰으로 지정한다.
- 컬러: `var(--color-semantic-*)` (Figma 토큰 경로를 `/` 구분으로 소문자화해 `--color-` 접두어)
  - 예) `Semantic/Text/Normal/Strong` → `var(--color-semantic-text-normal-strong)`
- 타이포그래피: `var(--typography-*-font-size)` / `-font-weight` / `-line-height` / `-letter-spacing`
  - 예) `Typography/Body/Medium` → `var(--typography-body-medium-font-size)`
- **하드코딩 절대 금지**: hex(`#ffffff`), rgb/rgba, hsl, px font-size, 고정 line-height 숫자.
- **Fallback 금지**: `var(--color-x, #fallback)` 형태의 hex fallback도 사용 금지. 토큰이 없으면 추가하거나 질문.
- **매핑 불가 시**: 임의의 근사값을 쓰지 말고 **사용자에게 어떤 토큰을 써야 하는지 물어본다.**

### 5-2. 스타일링 방식

- **styled-components가 유일한 표준**. CSS Modules·emotion 신규 도입 금지.
- **인라인 `style={{...}}` 금지**: 신규 작성 금지. 기존 인라인은 styled 블록으로 추출하며 점진 제거.
- **className** 사용은 `shared/ui` 내부의 라이브러리 연동 등 최소 범위로 제한.
- props에 따라 스타일이 변하는 경우 styled의 props API 사용 (`styled.div<{ $active?: boolean }>`).
- 일회성 동적 값(계산된 width 등)은 `style={{ width: computed }}` 한정으로만 허용, 색/폰트 값 인라인은 금지.

---

## 6. 타입 규칙

- `any` 신규 추가 금지. `@ts-ignore` / `@ts-expect-error` 신규 추가 금지.
- 외부 SDK(Kakao 등) 타입이 없으면 `declare module`로 최소 범위만 타이핑.
- `catch (err: any)` 패턴은 `catch (err: unknown)` + `instanceof Error` narrowing으로.
- 피처 타입은 `features/<domain>/model/types.ts`에. generated DTO와 중복되는 수동 정의는 제거.

---

## 7. Import / Export 규칙

- **경로 alias 우선**: `@/`로 시작하는 alias를 사용한다. `../`, `../../` 같은 부모 상향 상대경로는 금지(형제 파일 `./Sibling`은 허용).
- **타입 import 분리**: `import type { X } from '...'` 사용 (`@typescript-eslint/consistent-type-imports`).
- **barrel `index.ts`**: `src/shared/ui`, `src/components/common`, `src/components/display`에 각각 최대 1개. 무분별한 `index.ts` 금지.
- `app/` 라우트의 Next.js 규약 파일을 제외하면 default export 금지.

---

## 8. 상태 관리

- 새 전역 상태 도구(zustand/jotai/redux) 신규 도입 금지.
- React Query는 이번 범위 외 — 사용 금지.
- 비동기 데이터는 컴포넌트·훅 내부 `useState` + `useEffect` 또는 기존 Context로 처리하되, 같은 데이터를 여러 곳에서 중복 로드하지 않도록 훅으로 묶는다.
- 로컬 상태 파편화가 심한 컴포넌트(홈, 투표 등)는 리팩터링 배치 J에서만 구조 변경.

---

## 9. Mock / 데드 코드

- `src/lib/mock/chatMockData.ts` 및 컴포넌트의 `MOCK` 분기는 BE 연동 완료 영역부터 제거. 미완료 영역은 `process.env.NODE_ENV === 'development'` 가드로 격리하고 사유를 주석으로 남긴다.
- 데드 코드 탐지: `npx knip` 또는 `npx ts-prune` 결과 기반으로 제거. 화이트리스트: `src/shared/lib/api/generated/**`, `src/app/**` 라우트 파일, `.stories.tsx`.
- TODO/FIXME는 이슈화하거나 즉시 처리. 주석만 남기지 않는다.

---

## 10. 거대 컴포넌트

- 500줄 이상 컴포넌트는 리팩터 후보. 대표:
  - `src/components/home/MatchingDay.tsx` (1,117줄)
  - `src/app/chat/group/[roomId]/_components/GroupVoteCreateModal.tsx` (807줄)
  - `src/app/chat/group/[roomId]/_components/VoteResultsPage.tsx` (790줄)
  - `src/app/chat/group/[roomId]/_components/VoteSubmissionPage.tsx` (682줄)
- 분해 시 "순수 이동" 커밋과 "리팩터" 커밋을 분리. 로직 변경은 최소화.
- 하위 구성은 동일 폴더 `_parts/`, 훅은 `features/<domain>/hooks/` 또는 `_hooks/`.

---

## 11. 배포/검증

- 변경 후 로컬에서 `npm run lint && npm run build && npx tsc --noEmit` **모두 통과** 확인.
- 스모크 테스트: `/home`, `/chat/one-on-one/[roomId]`, `/chat/group/[roomId]` 투표 모달, `/onboarding` 단계 이동, `/admin/matches`·`/admin/users`, `/oauth/kakao` 콜백.
- 배포 후 `gh run watch <run_id> --repo ditto-develop/ditto-fe`로 Actions 성공까지 확인. **실패 시 로그 즉시 확인·수정·재푸시, 성공 전 완료 보고 금지.**
- 대상 브랜치: `feat/s3-migration`.

---

## 12. 배치 작업 컨벤션

클린업 작업은 [`~/.claude/plans/ditto-fe-migration-fancy-rose.md`](~/.claude/plans/ditto-fe-migration-fancy-rose.md) 기반의 배치 단위로 진행한다.

- 브랜치: `chore/cleanup-<letter>-<slug>` (예: `chore/cleanup-a-token-replace`)
- 한 배치 = 한 PR (배치 I·J는 파일·서비스당 1 PR)
- PR 본문에 **변경 범위**, **검증 체크리스트**, **스크린샷(인라인 제거·거대 컴포넌트 분해 배치 시)**, **매핑/치환 표**(배치 A), **spec diff**(배치 I)를 포함.
- 배치 간 경계를 넘지 않는다 — 한 PR에서 여러 배치의 변경을 섞지 않는다.

---

## 13. 사용자 확인이 필요한 상황

다음의 경우 임의 결정 금지, 반드시 질문:

1. 하드코딩된 색/폰트 값이 기존 토큰 어디에도 매핑되지 않을 때.
2. generated API와 legacy API의 spec이 다를 때(필드 누락·타입 불일치).
3. Mock 분기 제거 시 BE 연동 완료 여부가 불명확할 때.
4. 거대 컴포넌트 분해의 섹션 경계가 모호할 때.
5. public API(외부에서 import되는 심볼) 이름/시그니처 변경이 필요할 때.
6. 배치 범위를 넘어서는 로직 변경이 필요해 보일 때.
