# FE 남은 작업 (TODO)

> 갱신: 2026-08-26
>
> BE 개발 요청서는 발송 완료됐고 정본은 리포지토리 위키에 있다 —
> [BE-Request](https://github.com/ditto-develop/ditto-fe/wiki/BE-Request).
> **2026-08-26 BE 회신**: 그룹 투표 · 채팅방 나가기 · 어드민 시각 조정 수정이 배포됐고,
> 나머지 요청도 A-3(타인 프로필 보조, P2 — 재현님 담당)만 남기고 전부 반영됐다.
> **§A-2 · A-4 · A-5 · A-6은 FE 연동까지 끝났다.** 남은 §A 항목은 A-3 · A-7 · A-8뿐이다.
>
> ⚠️ 라이브 스펙(`https://api.ditto.pics/docs/openapi.yaml`)이 요청서와 **필드명이 다른 곳이
> 있다**(§A-5). 연동 전에는 요청서가 아니라 라이브 스펙을 정본으로 대조할 것.
>
> §A-2 · §A-3 · §A-5 번호는 코드 주석 15곳이 참조하므로 그대로 둔다.

| 출처 | URL |
|---|---|
| 라이브 Swagger | `https://api.ditto.pics/docs` → 실제 로드는 `/docs/openapi.yaml` (정본) |
| BE 위키 | `github.com/ditto-develop/ditto-server/wiki` |

---

## 0. 배포 · 인프라

### 0-0. 🔴 프로덕션 DNS 장애 — `ditto.pics` 아펙스에 레코드가 없다

**2026-08-26 발견. 실사용자가 프로덕션에 접속할 수 없는 상태다.**

공개 리졸버(8.8.8.8 / 1.1.1.1) 양쪽에서 아펙스 `ditto.pics`의 A·AAAA·CNAME·MX·TXT가
**전부 비어 있다**(존은 존재, `status: NOERROR`).

```
dig +short @8.8.8.8 ditto.pics A      → (빈 응답)
dig +short @8.8.8.8 www.ditto.pics    → d28wm0h79feewt.cloudfront.net ✅
dig +short @8.8.8.8 test.ditto.pics   → d28wm0h79feewt.cloudfront.net ✅
```

그런데 `www.ditto.pics`는 CloudFront에서 **301로 `https://ditto.pics/`로 보낸다.**
→ www로 들어와도 존재하지 않는 도메인으로 튕긴다. staging(`test.ditto.pics`)만 살아 있다.

- 네임서버가 Route53이 아니라 `ns1~4.hosting.co.kr` 이다. DNS는 해당 호스팅 콘솔에서 관리된다.
- 아펙스는 CNAME을 쓸 수 없으므로 호스팅 업체의 **ALIAS/ANAME** 기능이 필요하다.
  없으면 Route53으로 이전하거나, www를 정본으로 바꾸고 301 방향을 뒤집어야 한다.

---

### 0-1. 정적 export의 동적 라우트가 하드 로드에서 깨진다

`output: 'export'`는 동적 라우트를 `generateStaticParams`의 더미값(`placeholder`) 한 장으로만
내보낸다. 실제 id 경로는 S3에 객체가 없고, CloudFront가 404를 **루트 `index.html`(HTTP 200)** 으로
덮고 있어 주소창만 `/profile/12/`인 채 앱 첫 화면(로그인)이 뜬다.
확인: `curl -o /dev/null -w "%{http_code}" https://test.ditto.pics/존재하지않는경로/` → `200`.

앱 안에서 이동할 때만 동작하는 이유는 부모 세그먼트(`/profile`, `/chat`)가 실제 정적 라우트로
존재해 Next 클라이언트 라우터가 이어받기 때문이다. 신고 화면은 부모(`/report`)가 없어
하드 내비게이션으로 떨어졌고, 그래서 `/report?userId=..` 정적 라우트로 이미 옮겼다.

**남은 라우트 4계열** — `/profile/[id]`, `/quiz/[id]`,
`/chat/one-on-one/[roomId]`(+`/rate`), `/chat/group/[roomId]`(+`/rate`).

권장안은 CloudFront viewer-request Function으로 **placeholder 페이지에 rewrite** 하는 것이다.
`resolveStaticRouteParam`(`src/shared/lib/staticRouteParam.ts`)이 이미 이 방식을 전제로
`window.location.pathname`에서 진짜 id를 복구하도록 작성돼 있어 FE 변경이 사실상 없고,
공유·딥링크 URL이 유지된다(알림 딥링크가 방 URL을 그대로 쓴다).

```
1단계 (본체) — viewer-request rewrite
  /profile/{id}/                → /profile/placeholder/index.html
  /quiz/{id}/                   → /quiz/placeholder/index.html
  /chat/one-on-one/{id}/        → /chat/one-on-one/placeholder/index.html
  /chat/one-on-one/{id}/rate/   → /chat/one-on-one/placeholder/rate/index.html
  /chat/group/{id}/ · .../rate/ → 동일
2단계 — 그 다음에야 404 폴백을 /index.html(200) → /404.html(404)로 교체
```

순서가 중요하다. **2단계만 하면 더 나빠진다** — 지금 첫 화면이 뜨던 자리에 404가 뜰 뿐이다.

- ⚠️ **드리프트**: 패턴 목록이 AWS에만 살면 새 동적 라우트가 조용히 깨진다.
  `out/**/placeholder`를 스캔해 함수 소스를 생성하고 배포 워크플로에서 publish 하면 없앨 수 있다.
- ✅ **드리프트 해소됨(2026-08-26)**: `out/**/placeholder`를 스캔해 함수 소스를 생성하는
  `scripts/generate-cf-rewrite-function.mjs`를 추가했다. 배포 워크플로가 `--check`로
  빌드 산출물과 커밋본 불일치 시 배포를 중단한다.
- 🔴 **정정(2026-08-26)**: 위의 "미검증 / 한 번도 동작한 적이 없다"는 **사실이 아니었다.**
  staging 실측 결과 rewrite는 **이미 동작 중이고 과매칭 상태**다. 동적 세그먼트를
  무제한 매칭해서 **형제 정적 라우트 3개를 placeholder로 덮고 있다**:
  `/profile/edit/`(9521 서빙 / 실제 16759), `/profile/intro-note/`(9521 / 16555),
  `/quiz/current/`(9489 / 9895). 하드 로드에서만 재현되어(앱 내부 이동은 Next 라우터가
  받는다) 그동안 드러나지 않았다.
  → `infra/cloudfront/rewrite-dynamic-routes.js`는 **숫자 id만 매칭**해 이를 막는다.
  연결은 신규 도입이 아니라 **기존 과매칭의 수정**이다.
- ⚠️ **연결 전 필수 확인**: CloudFront는 behavior당 viewer-request 함수를 하나만 붙일 수
  있다. 지금 무엇이 rewrite를 하고 있는지 콘솔에서 확인하지 않고 붙이면 기존 함수가
  교체되어 사이트 전체가 깨질 수 있다. 기존 함수가 host 기반 staging/prod 프리픽스 분기를
  겸하고 있다면 그 로직을 합쳐야 한다.
- ⚠️ **staging 단독 검증 불가**: `ditto.pics`와 `test.ditto.pics`가 같은 배포판
  (E2IAN5BWR5D33B)을 쓴다. default behavior에 붙이면 prod에 즉시 적용된다.
- 배포 IAM 롤에 `cloudfront:UpdateFunction` · `PublishFunction` ·
  (최초 연결 시) `UpdateDistribution` 권한이 추가로 필요하다.

---

## A. BE 구현 대기 — 계약은 확정됨 (2026-08-24 회신)

### A-2. 그룹 투표 — ✅ 연동 완료 (2026-08-26)

BE 배포 완료(위키 `Frontend-Vote-Guide`). FE 이관도 끝났다.

- API: `src/features/chat/api/voteApi.ts` — 목록·상세·생성·cast·close 5개. 다섯 응답이 모두
  같은 상세 형태라 성공 후 재조회가 없다.
- 상태: `useGroupVote`. **진실은 목록 REST이고 STOMP는 갱신 신호일 뿐이다** —
  `VOTE_CREATED:{id}` / `VOTE_CLOSED:{id}` SYSTEM 메시지를 보면 목록을 다시 읽는다
  (`parseVoteSystemMessage`). 인메모리 브로커라 전달 보장이 없어 이 구조가 필수다.
- 집계: `lib/voteResult.ts`. **서버는 승자·득표율을 계산하지 않는다** — `voterIds.length`로
  FE가 1위·동표를 판정하고, 선택지 배열 순서(=입력 순)를 그대로 노출한다.
- 화면: 배너 → 제출/결과, 생성 모달, VOTE_CREATED 카드까지 `GroupChatRoomPageClient`에 연결됨.
  결과 화면에 **투표 마감** 진입점을 새로 넣었다(방 멤버 누구나·멱등).
- 장소 검색은 **BE 프록시가 아니라 카카오 지도 SDK 직접 호출**이다(`lib/placeSearch.ts`).
  `loadKakaoMaps()`가 이미 `libraries=services`로 불러온다.
- **선택지 추가·삭제 UI는 제거했다** — API를 만들지 않기로 확정됐다. 선택지는 생성 시 확정.
- 목업: `src/mocks/voteStore.ts` + 핸들러 5개(인메모리 상태를 실제로 갱신).
- E2E: `cypress/e2e/chat/group-vote.cy.ts`.

⚠️ **투표 생성 플로우는 E2E로 고정하지 못했다** — 장소 선택이 카카오 지도 SDK의 키워드 검색에
의존해 테스트 환경에서 결정적이지 않다. 생성 진입점의 노출/숨김 규칙만 검증한다.
실기기·스테이징에서 눈으로 확인할 것.

### A-3. 타인 프로필 보조 — ⏸️ P2, 재현님 담당 (BE 회신 2026-08-26)

**둘 다 원문은 노출하지 않는 방향으로 확정.**

- **평가 코멘트**: 주당 평가 인원이 1~2명이라 코멘트가 사실상 익명이 아니다.
  → `averageScore` + `totalCount`만 별도 엔드포인트로. `noShowCount`도 타인 화면에는 내리지 않는다.
  - 도착 시: `ProfileDetailModal`·`IntroNoteContainer`의 `ratingSummary: null` 되살리기 +
    `cypress/e2e/matching-profile/02-intro-note.cy.ts`의 '받은 평가 없음' 기대 뒤집기.
- **퀴즈 답변**: 원문 대신 **서버가 계산한 일치 개수만** 내린다.
  - 도착 시: `GroupMemberListPage`의 유사도 배지 복구.

### A-4. 그룹 채팅 개별 이탈 + 인원 부족 종료 — ✅ 연동 완료 (2026-08-26)

`POST /api/v1/chat/rooms/{roomId}/leave` 배포 완료.

- `leaveChatRoom()` 추가. 방 유형별 분기 없음 — 1:1·재매칭에 불러도 서버가 end와 동일 처리.
- `GroupChatMenuBottomSheet`에 '대화방 나가기' + 그룹 문구를 쓴 `ChatLeaveModal` 재사용.
- `ChatRoomEndedReason`에 `INSUFFICIENT_MEMBERS`, `ChatRoom`에 `hasLeft` 추가.
  나간 방은 입력창·평가 버튼을 숨겨 읽기 전용으로 둔다.
- **`MEMBER_LEFT`는 방을 끝내지 않는다** — `isRoomEndedSystemMessage`에서 의도적으로 제외했고
  회귀 테스트로 못 박아 뒀다(`roomState.test.ts`). `USER_LEFT`와 정반대라 섞이면 그룹 방이
  한 명 나갈 때마다 종료 화면으로 넘어간다.
- `getSystemMessageText`에 세 번째 인자(나간 사람 닉네임)를 추가했다. 기존 호출부는 그대로 동작한다.

### A-5. 회원가입 누락 필드 — ✅ 연동 완료 (2026-08-26)

라이브 스펙을 다시 읽어 보니 **요청서의 필드명과 다르게 반영돼 있었다.**

- `profileImageUrl`은 **별도 필드가 아니다.** `caricature`에 실은 아바타 경로가 프로필 조회의
  `profileImageUrl`로 그대로 나간다(스펙 설명 명시). FE는 이미 보내고 있었다 — 할 일 없음.
- 소개는 `introduce`가 아니라 **`introduction`**(한 줄 소개, 최대 50자)이고,
  소개노트 Q10('나를 한 줄로 표현한다면?') 답변으로 저장된다.
  → `Tutorial.tsx`가 `formData.introduce[9]`를 `introduction`으로 보낸다.
- 나머지 소개노트 9개는 가입 직후 `PUT /users/me/intro-notes/{code}`로 저장한다.
  가입은 이미 끝난 상태라 저장 실패해도 되돌리지 않는다(`Promise.allSettled`).

### A-6. 탈퇴 사유 자유 입력 — ✅ 연동 완료 (2026-08-26)

`reasonDetail`(선택, 최대 100자)이 라이브에 있다. `leaveExternalUser(id, reason, reasonDetail)`로
넓히고 탈퇴 화면에 선택 입력 textarea를 추가했다. '기타'가 아니어도 보낸다(BE가 허용).

### A-7. 매칭 히스토리 — **Figma 대기**

화면도 API도 없다. 1:1/그룹/재매칭 3종 · 탭 구분. **디자인이 먼저 나와야 착수 가능.**

### A-8. 어드민 API

어드민 화면이 쓰는 엔드포인트는 라이브 스펙에 `/api/v1/admin/quiz-sets/{quizSetId}/matching/regenerate`
하나뿐이다. 나머지는 미문서화 상태로 동작 중이라 계약 확정이 필요하다.

### A-9. 로드맵 — 일정 회신 완료

| 항목 | 상태 |
|---|---|
| `GET /api/v1/rematches` | 계획 확정, 다음 착수 후보 |
| 채팅 연장 (#121) | 이번 분기 내 목표(확정 일정 아님) |
| 타이핑 표시 · 읽음 실시간 | 채팅 연장과 같은 묶음 |
| STOMP 전송 실패 응답 | 같은 묶음. 오면 에코 타임아웃(`SEND_ECHO_TIMEOUT_MS`)을 교체 |
| 성사·개방 푸시 알림 | **이번 분기 밖** — FCM 인프라 자체가 없다. 폴링 유지 |

---

## B. BE 무관 — 지금 할 수 있는 것

### B-1. OpenAPI 스펙 재생성

`ditto-api.json`이 **구 스펙**이다(`localhost:4000`, v0.0.1, `/api/v1` 0개).
`https://api.ditto.pics/docs/openapi.yaml`로 교체 후 `npm run generate-client`.

BE가 스키마 누락을 반영 완료했다([ditto-server#141](https://github.com/ditto-develop/ditto-server/pull/141)) —
`endedAt`·`endedReason`·`lastMessage.imageUrl`·`messages[].imageUrl` 포함, 같은 원인으로 빠져 있던
`respondedAt`·`readAt`·`rating`·`role` 등 총 11개 복구. **머지 후** 다시 받아 재생성할 것.

- ⚠️ `sourceType`은 description에만 `REMATCH`가 추가됐고 **타입 수준 enum으로는 안 내려온다**
  (코드젠 결과가 `string`). `'PERSONAL' | 'GROUP' | 'REMATCH'` 리터럴 유니온이 필요하면 BE에 알리면
  yaml 후처리를 붙여 준다. → **회신 필요.** 현재는 `features/chat/model/types.ts`가 수기 정본이다.
- 투표 UI는 §A-2에서 `externalApi`로 이관돼 generated client를 더 쓰지 않는다.
  **남은 소비자는 quiz·home·profile·system 4계열**이다
  (`MainSection`, `QuizPageClient`, `quiz/current`, `ProfileDetailModal`,
  `IntroNoteContainer`, `systemStateApi`, `externalApi`의 DTO 재사용).
  이들이 `/api/v1`로 옮겨가야 generated 레이어를 지울 수 있다.

### B-2. 설정 > 정보

- **공지사항 URL 미정** — `src/features/settings/model/externalLinks.ts`의 `notice`가 빈 문자열이라
  누르면 "준비 중입니다." 토스트가 뜬다. 주소가 나오면 넣으면 된다.
  (자주 묻는 질문은 Notion FAQ로 연결됨.)
- **앱 버전이 `v1.0.0` 하드코딩** — 실제 빌드 버전을 보여줄지 결정 필요.

### B-3. 미사용 라이브 엔드포인트

`POST /api/v1/users/me/blocks`(직접 차단; 현재는 신고 경유만), `GET /api/v1/quiz-sets/{id}`.
진입 UI가 없어 손대지 않았다.

### B-4. Q10 문구

서버가 `"Q10. 나를 한 단어로 표현한다면?"`, 최신 Figma는 `"나를 한 줄로 표현한다면?"`.
BE가 Figma에 맞춰 변경 예정. **반영 전까지 로컬 문구 우선 처리를 유지할 것**
(`features/profile/model/introNotes.ts`).

### B-5. 7004/7005 에러 코드 분기

현재는 방 목록에서 상태를 파생해 안내한다. 이미지 업로드 발급만 코드를 돌려주므로 실익이 적다.

---

## C. 배포 후 눈으로 확인할 것

- 그룹 방이 채팅 목록에 뜨고 `/chat/group/{roomId}`로 열리는지
- 그룹 방 STOMP 실시간 수신(폴링이 없으므로 안 되면 메시지가 안 온다)
- 개방 전 방의 **대기중** 배지, 종료 방의 **종료** 필터
- 1:1 '대화방 나가기' → 실제 종료 반영
- 홈 대화 카드가 가로로 넘치지 않는지(360·390·430px)
- 하단 탭이 새로고침 후에도 활성 표시되는지
- 알림센터 목록·필터·읽음
- 1:1 채팅 메뉴 → 신고하기가 `/report?userId=..`로 열리는지
- **그룹 투표 생성** — 장소 검색(카카오 SDK 직접 호출)이 실기기·앱 웹뷰에서 뜨는지.
  E2E로 고정하지 못한 유일한 구간이다(§A-2).
- 그룹 투표 배너 → 제출 → 결과 → 마감, 그리고 마감 후 '투표 만들기'가 다시 열리는지
- 그룹 '대화방 나가기' → 남은 인원에게 `MEMBER_LEFT` 안내가 뜨고 방이 유지되는지
  (2명까지 유지, 1명 남으면 해체)
- 어드민 시각 조정 상태에서 채팅 전송 — BE가 서버 측을 고쳤다(2026-08-26 회신).
  `deriveRoomState`의 `openedByOverride` 보정은 그대로 두었다(있어도 무해).
  실제로 불필요해졌는지는 오버라이드를 걸어 눈으로 확인할 것.
