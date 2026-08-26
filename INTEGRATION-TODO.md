# FE 남은 작업 (TODO)

> 갱신: 2026-08-25
>
> BE 개발 요청서는 발송 완료됐고 정본은 리포지토리 위키에 있다 —
> [BE-Request](https://github.com/ditto-develop/ditto-fe/wiki/BE-Request).
> **2026-08-24 BE 회신**으로 부록 B 체크리스트 6건과 부록 A(스키마) 3건에 전부 답이 왔다.
> 아래 §A 항목들은 이제 "요청할 것"이 아니라 **계약이 확정된 채 구현 도착을 기다리는 것**이다.
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

### A-2. 그룹 투표

회신으로 확정된 것:

- **STOMP 브로드캐스트 가능.** 별도 destination 없이 기존 방 토픽(`/sub/chat/rooms/{roomId}`)으로
  SYSTEM 메시지가 온다. `content`는 `"VOTE_CREATED:{voteId}"` / `"VOTE_CLOSED:{voteId}"`(콜론 1회 split).
  → **5초 폴링은 걷는다.**
- 단 **전달 보장이 없다**(인메모리 브로커). 재접속·백그라운드 복귀 시 놓친 프레임은 못 받는다.
  그래서 `GET /api/v1/chat/rooms/{roomId}/votes`(방의 투표 목록)가 함께 열린다.
  **화면 복구(배너의 열린 투표 되찾기)는 이 REST를 기준으로 잡을 것.** 브로드캐스트는 실시간 갱신용.
- **권한**: 생성·마감 모두 방 멤버 누구나.
- **장소검색**: BE 프록시(카카오 키는 서버 관리).

도착 시 FE 작업:

1. `GROUP_VOTE_ENABLED`(`features/chat/model/constants.ts`)를 `true`로.
2. 투표 컴포넌트 7개(`VoteBanner`, `GroupVoteCreateModal`, `VoteSubmissionPage`, `VoteResultsPage`,
   `PlaceSearchModal`, `PlaceMapPage`, `VoteCreatedMessageBubble`)를 구 경로
   (`/api/chat/group-rooms/{id}/votes`) → `externalApiFetch`로 이관.
3. 폴링 제거 + STOMP `VOTE_CREATED`/`VOTE_CLOSED` 수신 처리, 진입/복귀 시 `GET .../votes`로 복구.
4. MSW 투표 핸들러 추가(현재는 **일부러 비워 뒀다** — 빈 스텁이 있으면 동작하는 것처럼 보여 위험).
5. 이관이 끝나면 generated client의 마지막 소비자가 사라진다 → §B-1과 함께 정리.

### A-3. 타인 프로필 보조

**둘 다 원문은 노출하지 않는 방향으로 확정.**

- **평가 코멘트**: 주당 평가 인원이 1~2명이라 코멘트가 사실상 익명이 아니다.
  → `averageScore` + `totalCount`만 별도 엔드포인트로. `noShowCount`도 타인 화면에는 내리지 않는다.
  - 도착 시: `ProfileDetailModal`·`IntroNoteContainer`의 `ratingSummary: null` 되살리기 +
    `cypress/e2e/matching-profile/02-intro-note.cy.ts`의 '받은 평가 없음' 기대 뒤집기.
- **퀴즈 답변**: 원문 대신 **서버가 계산한 일치 개수만** 내린다.
  - 도착 시: `GroupMemberListPage`의 유사도 배지 복구.

### A-4. 그룹 채팅 개별 이탈 + 인원 부족 종료

- `POST /api/v1/chat/rooms/{roomId}/leave` 신설. **멱등** — 이미 나간 방·종료된 방에 재호출해도 200.
- **1:1 방에 호출해도 거절하지 않는다.** 기존 `end`와 동일 처리(위임). REMATCH 방도 같다.
  → FE가 방 유형별로 호출을 가를 필요 없다.
- **SYSTEM 코드 신규 `MEMBER_LEFT`**(`senderId` = 나간 회원). `USER_LEFT`는 1:1·REMATCH 종료 전용으로 유지.
  같은 코드가 1:1에선 "방이 끝났다", 그룹에선 "방은 계속된다"로 정반대가 되기 때문에 분리한 것이다.
- **인원 부족 해체**: `endedReason = INSUFFICIENT_MEMBERS`.
  정책 — **잔여 2명까지는 방을 유지**하고 **1명만 남는 순간** 해체.
  해체 시 `MEMBER_LEFT` 1건 + `INSUFFICIENT_MEMBERS` 1건(`senderId` = 마지막 이탈자)이 연달아 발행된다.
- **이탈자의 방 목록**: 남는다(읽기 전용). 구분용으로 `ChatRoomResponse`에 **`hasLeft: Boolean`** 추가.
- ⚠️ **계약 변경 예고**: `counterpartMemberIds`에서 이탈자가 빠진다(필드명·타입 그대로, 의미만 변경).

도착 시 FE 작업:

1. `GroupChatMenuBottomSheet`에 '대화방 나가기' 복구 + 나가기 모달(1:1 `ChatLeaveModal` 재사용).
2. `ChatRoomEndedReason`에 `INSUFFICIENT_MEMBERS` 추가 →
   `getRoomEndedMessage()`에 "인원 부족으로 대화가 종료되었습니다." 분기.
3. `getSystemMessageText()`·`isRoomEndedSystemMessage()`에 `MEMBER_LEFT` 처리 추가.
   **`MEMBER_LEFT`는 방을 끝내지 않는다** — `USER_LEFT`와 달리 `endedBySystemMessage`로 보면 안 된다.
4. `ChatRoom` 타입에 `hasLeft` 추가, 목록에서 읽기 전용 표시.
5. 1명 이탈한 방은 "대화는 계속" 화면 그대로 간다(Figma `2124-33472`).
   "인원 부족 종료" 전용 문구는 3명 방에서 2명이 차례로 나간 경우에만 뜬다.

### A-5. 회원가입 누락 필드

라이브 `CreateUserRequest`에 `profileImageUrl`·`introduce`가 없어 온보딩 입력이 저장되지 않는다
(`src/shared/lib/api/externalApi.ts` 주석 참조).
도착 시: `Tutorial.tsx`에서 두 필드 전송 복구.

### A-6. 탈퇴 사유 자유 입력

**A안 확정** — `POST /api/v1/users/{id}/leave`에 `reasonDetail`(선택, 최대 100자) 추가.
`reason`은 지금처럼 선택지 코드. `reasonDetail`은 `other`가 아니어도 받는다(강제 안 함).

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
- generated client의 남은 소비자는 §A-2 대기 중인 투표 UI뿐이므로, A-2와 함께 정리하는 게 맞다.

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
