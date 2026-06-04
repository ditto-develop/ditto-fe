# Codex 인계 — 매칭 Cypress E2E 실패 (스테이징 WIP)

> 상태: `feat/s3-migration`에 커밋·배포됨(staging=test.ditto.pics). **Cypress E2E 3/5 spec 실패 중.** 배포/목업 인프라와는 무관하며, 매칭 feature 통합 문제다. 이 문서대로 원인 파악 후 수정.

## 실패 목록 (CI: GitHub Actions `Cypress E2E`)

CI 실행일 기준 요일은 **목요일**(KST·UTC 모두 2026-06-04 목)이라 요일 게이팅 자체는 통과 조건을 만족한다.

| spec | 실패 내용 |
|---|---|
| `cypress/e2e/days/thursday-matching.cy.ts` (4 tests 전부) | `/home`에서 `이번주 매칭` 미표시 / `/matching`에서 후보 `수민` 미표시 |
| `cypress/e2e/flows/quiz-to-matching.cy.ts` (1) | `cy.wait('@submitAnswer')` 타임아웃 — `POST .../quiz-progress/answers` 요청이 **아예 발생 안 함** |
| `cypress/e2e/smoke/protected.cy.ts` (1) | `/matching` 빈 상태 문구 `이번 주 매칭 결과가 없어요.` 미표시 |

통과한 spec: `flows/onboarding.cy.ts`, `smoke/public.cy.ts`.

## 데이터 흐름 / 관련 파일

- 홈 매칭 카드: [src/app/home/MainSection.tsx](../src/app/home/MainSection.tsx) → [src/components/home/MatchingDay.tsx](../src/components/home/MatchingDay.tsx)
- 매칭 페이지: [src/app/matching/page.tsx](../src/app/matching/page.tsx) → `MatchingResultContainer` ([src/features/matching/containers/MatchingResultContainer.tsx](../src/features/matching/containers/MatchingResultContainer.tsx)) → `useMatchCandidates` ([src/features/matching/hooks/useMatchCandidates.ts](../src/features/matching/hooks/useMatchCandidates.ts))
- API 매핑: `getExternalMatchCandidates` / `getMatchingStatus` ([src/shared/lib/api/externalApi.ts](../src/shared/lib/api/externalApi.ts), [src/features/matching/api/matchingApi.ts](../src/features/matching/api/matchingApi.ts))
- 목업 인터셉트: [cypress/support/commands.ts](../cypress/support/commands.ts) `cy.mockApi()` + fixtures

## 핵심 의심 지점 (가설)

1. **빈 상태 미표시 (protected `/matching`)** — 기본 fixture `matches-one-on-one.json`은 `{ "sent": [], "received": [] }`로 **`quizSetId`·`candidates`·`matchingType`가 없다.**
   - `getExternalMatchCandidates`: `quizSetId = toId(data.quizSetId) || pickQuizSetId(data)` → fixture에 quizSetId가 없으니 `pickQuizSetId` 결과(아마 `""`)에 의존.
   - 이어서 `getMatchingStatus(qid)` 호출 시 `qid`가 빈 문자열이면 URL이 `.../matching/status/`가 되어, `cy.mockApi()`의 인터셉트 패턴 `**/api/v1/matching/status/**`와 **매칭이 안 될 수 있다** → 요청 실패 → `useMatchCandidates`가 `error` 상태로 빠져 빈 상태 대신 에러/로딩이 렌더됐을 가능성.
   - 확인: `MatchingResultContainer`가 `loading`/`error`/`empty`를 어떻게 분기하는지, qid 빈 값일 때 status 호출을 스킵하는지 점검.

2. **populated 미표시 (thursday-matching)** — `matches-1on1-populated.json`은 `candidates`/`matchingType`/`quizSetId(101)`를 갖고 있어 `getExternalMatchCandidates` 매핑은 정상 동작해야 한다(타입 일치 확인됨). 그럼에도 `수민`이 안 보이면:
   - `MainSection`/`MatchingResultContainer`가 후보를 렌더하기 전에 `getMatchingStatus`가 선행 실패해 throw → 전체 catch로 빠질 가능성(위 1번과 동일 원인).
   - `useMatchCandidates`는 status 실패 시 `setError` → 후보가 있어도 렌더 안 됨. (단 `MainSection`은 자체 try/catch라 분기 다름 — 양쪽 컨테이너의 에러 처리 일관성 점검 필요.)

3. **quiz submit 미발생 (quiz-to-matching)** — `submitAnswer`(`POST .../quiz-progress/answers`) 인터셉트가 한 번도 안 걸림. 퀴즈 제출 UI 흐름/버튼 셀렉터가 바뀌었거나, 제출 전 가드(예: 모든 문항 응답 필요)에서 멈춰 요청까지 도달 못 했을 가능성. 테스트가 기대하는 제출 트리거와 실제 컴포넌트 동작을 대조.

## 권장 디버깅 순서

1. 로컬 재현: `npm run test:e2e:cypress` (또는 `npm run cypress:open` 후 dev:e2e 3100). 실패 spec을 헤디드로 띄워 네트워크 탭에서 `matches/1on1` → `matching/status/<qid>` 요청의 실제 URL과 응답을 확인.
2. `getExternalMatchCandidates`가 빈 fixture에서 반환하는 `quizSetId` 값을 로그로 확인 → 빈 문자열이면 status 인터셉트 미스가 근본 원인.
3. 빈 상태/후보 렌더가 `useMatchCandidates`의 `error`에 막히는지 확인. 막힌다면 status 호출 실패를 빈 결과로 graceful 처리하거나, qid 부재 시 status 스킵.
4. quiz-to-matching은 제출 버튼 활성화 조건과 테스트 시나리오를 일치시킴.

## 주의

- 이 수정은 매칭 feature 영역이며 **배포/목업/워크플로우 변경과 분리**해서 진행할 것(별도 PR).
- 수정 후 `npm run lint && npm run build && npx tsc --noEmit` + 실패 spec 재실행으로 검증.
