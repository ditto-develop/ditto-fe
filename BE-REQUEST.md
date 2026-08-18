# BE 개발 요청서 — ditto FE

> **작성**: 2026-08-18 · FE
> **대상**: `ditto-develop/ditto-server`
> **근거**: 라이브 Swagger(`https://api.ditto.pics/docs`) · BE 위키 **전체 4개 페이지**(Chat / MyPage-Settings / Notification / Review-Rematch, 2026-08-18 전수 확인) · Figma `Ditto` 파일 전 섹션
> **상세 배경**: 같은 리포지토리의 [`INTEGRATION-TODO.md`](./INTEGRATION-TODO.md) (FE 내부 문서, 항목 번호 `A-n`이 이 문서와 대응)

FE는 `/api/v1` 엔드포인트 41개를 호출하고 그중 **38개가 라이브에 존재**합니다(2026-08-11 대조).
이 문서는 나머지와, 디자인이 완성됐는데 계약이 없는 기능들을 정리한 것입니다.

---

## 이 문서 읽는 법

요청은 세 종류입니다. **[확인]은 코드 작업이 아니라 답만 주시면 되는 항목**이라 먼저 봐 주시면 FE가 그동안 막힌 화면을 풀 수 있습니다.

| 태그 | 의미 |
|---|---|
| **[개발]** | 새 엔드포인트가 필요합니다 |
| **[확장]** | 기존 엔드포인트에 필드/값 추가면 됩니다 |
| **[확인]** | 구현 없이 "이렇게 갑니다" 답만 주시면 됩니다 |

경로·스키마는 **FE 제안**입니다. BE 관례에 맞게 바꾸셔도 되고, 확정된 형태만 알려주시면 FE가 맞춥니다.

---

## 요약

| # | 항목 | 태그 | 우선 | FE 현재 상태 | 대응 |
|---|---|---|---|---|---|
| 1 | ~~알림 센터 3종~~ **취소** | – | – | **이미 라이브.** FE 연동 작업으로 전환 | `A-1` |
| 2 | 그룹 투표 6종 | 개발 | **P1** | 컴포넌트 7개 완성, 플래그로 진입점 차단 | `A-2` |
| 3 | 그룹 채팅 개별 이탈 | 개발 | **P1** | 디자인 3장 완성, 메뉴에서 의도적 제외 | `A-4.6` |
| 4 | 그룹 "인원 부족 종료" 사유 | 확인 | P1 | `EXPIRED`로 뭉뚱그려 표시 중 | `A-4.5` |
| 5 | 타인 프로필 보조 2종 | 확장 | P2 | 평점·유사도 배지 비활성 | `A-3` |
| 6 | 회원가입 누락 필드 2개 | 확장 | P2 | 입력받고 버림 | `A-5` |
| 7 | 탈퇴 사유 100자 vs 50자 | 확장 | P3 | 입력란 미구현 | `A-9` |
| 8 | ~~프로필 수정 가능 범위~~ **해결** | – | – | 위키에 "의도적 비활성" 명시 | `A-7` |
| 9 | ~~알림 보존 기간~~ **해결** | – | – | 서버가 30일 컷(위키 확인) | `A-1` |
| 10 | 매칭 히스토리 | 개발 | P3 | 화면 없음(디자인도 없음) | `A-8` |
| 11 | 어드민 API | 개발 | P3 | 전부 목업 | `A-4` |
| 12 | 로드맵 항목 일정 | 확인 | P3 | 각각 우회 중 | `A-6` |

**권장 순서**: 4(확인, 즉답 가능) → 2 → 3 → 5 → 6 → 7 → 10·11

> **1·8·9번은 취소되었습니다.** BE 위키 4개 페이지를 전수 확인한 결과 이미 답이 있거나 구현돼 있었습니다.
> 최초 작성 시 `Frontend-Notification-Guide`를 놓치고 나머지 3개도 정독하지 않은 제 잘못입니다.

---

## 1. ~~[개발] 알림 센터~~ — **취소 (이미 라이브)**

> **2026-08-18 정정.** BE 위키 [`Frontend-Notification-Guide`](https://github.com/ditto-develop/ditto-server/wiki/Frontend-Notification-Guide)
> 확인 결과 알림 API는 **이미 구현돼 있습니다.** 이 항목은 BE 요청이 아니라 **FE 연동 작업**입니다.
> 최초 작성 시 MyPage 가이드의 "미구현" 표기와 커밋 기록만 보고 잘못 판단했습니다. 죄송합니다.

라이브 계약(위키 기준):

```
GET /api/v1/notifications?category=MATCHING|CHAT|SYSTEM&cursor=&size=20   (최근 30일, size max 100)
GET /api/v1/notifications/unread-count                                    → { count }
PUT /api/v1/notifications/{id}/read                                       (멱등)
PUT /api/v1/notifications/read-all                                        → { readCount }
```

응답 항목: `id` · `type` · `category` · `title` · `body` · `targetId` · `readAt` · `createdAt`,
목록 래퍼에 `nextCursor`.

FE 구현이 이 계약과 어긋나 있어 **FE가 맞춰야 합니다**(BE 작업 없음).

| 항목 | 라이브 계약 | FE 현재 |
|---|---|---|
| 읽음 처리 | `PUT` | `POST` ← 요구서 초안의 "POST가 맞다"는 판단이 틀렸습니다 |
| 목록 응답 | `{ notifications: [], nextCursor }` | 배열 직접 |
| 읽음 필드 | `readAt`(nullable 시각) | `read`(boolean) |
| 이동 경로 | `targetId` + `type` 조합 | `linkTo`(완성 경로) |
| 카테고리 필터 | 서버 `category` 파라미터 | 클라이언트 사이드 필터 |
| 페이징 | `cursor` / `size` | 없음 |
| 안 읽음 개수 | `unread-count` 전용 API | 목록에서 FE가 계산 |
| 보존 30일 | 서버가 컷 | FE가 전건 표시 |

`type` 목록도 위키에 있어 **BE에 물을 것이 없습니다.** FE 상수 8종 중 5종이 이름부터 다릅니다.

| BE 실제 | `category` | `targetId` | FE 현재 |
|---|---|---|---|
| `MATCH_RESULT` | MATCHING | `quizSetId`(이동 금지, 중복 방지 키) | `MATCH_RESULT` ✅ |
| `GROUP_FORMED` | MATCHING | 그룹 `chatRoomId` | `GROUP_FORMED` ✅ |
| `REMATCH_MATCHED` | MATCHING | 재매칭 `chatRoomId` | `REMATCH_SUCCESS` ❌ |
| `REVIEW_REQUEST` | MATCHING | 끝난 방 `chatRoomId` | `RATING_REQUEST` ❌ |
| `CHAT_MESSAGE` | CHAT | `chatRoomId` | `NEW_MESSAGE` ❌ |
| `CHAT_ENDING_SOON` | CHAT | `chatRoomId` | `CHAT_CLOSING` ❌ |
| `SYSTEM_NOTICE` | SYSTEM | `null` | 없음 ❌ (현재 미발송) |
| — | — | — | `VOTE_RESULT`·`APP_UPDATE`는 BE에 없는 값 |

FE가 추가로 반영할 것:
- `category`를 서버가 주므로 FE의 자체 분류 상수는 불필요합니다.
- **모르는 `type`은 기본 아이콘 + 이동 없음으로 폴백**해야 합니다(위키 명시, 투표 알림 등 추가 예정).
  현재 FE는 모르는 값을 렌더하지 않아 알림이 통째로 사라집니다.
- 새 메시지 알림은 방당 한 줄로 접히는데, **접힐 때 서버가 행을 지우고 다시 넣어 `id`가 바뀝니다.**
  `id` 기준 로컬 병합을 하면 이전 행이 사라진 것으로 처리해야 합니다.
- 벨 배지는 진입·복귀 시 `unread-count` 재호출로 갱신합니다.

---

## 2. [개발] 그룹 투표 — P1

### 왜

그룹 채팅의 핵심 기능인데 **Swagger에도 위키에도 계약이 없습니다.** Chat 가이드가 그룹 방을 상세히 다루면서 투표를 한 번도 언급하지 않아 미구현으로 판단했습니다.

FE는 컴포넌트 7개(`VoteBanner`, `GroupVoteCreateModal`, `VoteSubmissionPage`, `VoteResultsPage`, `PlaceSearchModal`, `PlaceMapPage`, `VoteCreatedMessageBubble`)를 만들어 두고, `GROUP_VOTE_ENABLED = false` 플래그로 **진입점(더보기 메뉴의 '투표 만들기', 상단 배너)을 막아 둔 상태**입니다. 404 버튼이 노출되지 않게 하려는 조치이며, 계약이 나오면 플래그만 올리고 호출부를 이관합니다.

### 요청

```
POST /api/v1/chat/rooms/{roomId}/votes                    투표 생성
GET  /api/v1/chat/rooms/{roomId}/votes/{voteId}           투표 상세
POST /api/v1/chat/rooms/{roomId}/votes/{voteId}/cast      투표하기
POST /api/v1/chat/rooms/{roomId}/votes/{voteId}/options   선택지 추가
POST /api/v1/chat/rooms/{roomId}/votes/{voteId}/close     마감
GET  /api/v1/chat/votes/place-search?query=               카카오 장소검색 프록시
```

경로는 그룹 채팅이 `/chat/rooms`로 통합된 것에 맞춰 제안한 형태입니다.

스키마는 **구 스펙에 이미 정의돼 있던 것**을 그대로 옮겼습니다(리포지토리 `ditto-api.json`). 그대로 쓰셔도 되고 바꾸셔도 됩니다.

```jsonc
// GET .../votes/{voteId} 응답
{
  "id": "string",
  "title": "만남 장소 투표",
  "allowMultiple": true,
  "status": "OPEN | CLOSED",
  "totalMembers": 5,
  "votedCount": 3,
  "placeOptions": [
    { "id": "p1", "label": "성수 카페거리", "address": "서울 성동구 …",
      "mapLink": "https://…", "latitude": 37.5, "longitude": 127.0,
      "voterIds": ["12", "34"] }
  ],
  "timeOptions": [
    { "id": "t1", "dateLabel": "8/22 (금) 저녁", "date": "2026-08-22",
      "time": "19:00", "voterIds": ["12"] }
  ],
  "myVote": { "placeIds": ["p1"], "timeIds": [] }   // 미투표면 null
}

// POST .../votes 요청
{ "title": "string", "allowMultiple": true,
  "placeOptions": [ … ], "timeOptions": [ … ] }

// POST .../cast 요청
{ "placeIds": ["p1"], "timeIds": ["t1"] }

// POST .../options 요청
{ "type": "PLACE | TIME", "label": "…", "address": "…", "mapLink": "…",
  "latitude": 0, "longitude": 0, "dateLabel": "…", "date": "…", "time": "…" }
```

### 함께 확인

- **투표 생성/마감 시 STOMP 브로드캐스트를 주실 수 있나요?** 없으면 FE는 폴링해야 합니다(이전 구현이 5초 폴링이었습니다). 채팅 메시지처럼 SYSTEM 메시지 한 건으로 알려 주셔도 충분합니다.
- **장소검색 프록시**는 카카오 API 키를 FE에 노출하지 않으려고 BE 경유를 제안한 것입니다. 다른 방식을 쓰신다면 알려주세요.
- 권한: 투표 생성·마감을 방 멤버 누구나 할 수 있는지, 개설자만 마감할 수 있는지 정해 주세요.

---

## 3. [개발] 그룹 채팅 개별 이탈 — P1

### 왜

Figma `4.2 채팅 시스템`에 그룹 이탈이 **화면 3장으로 완결돼** 있습니다.

| 화면 | node-id | 내용 |
|---|---|---|
| 더보기 바텀시트 | `2124-32783` | 메뉴 4번째 항목이 **대화방 나가기** |
| 나가기 모달 | `2124-33157` | "정말 대화를 종료하시겠어요? / 이 대화를 끝내면 이번주는 다시 대화할 수 없어요." |
| 이탈 후 방 | `2124-33472` | 남은 멤버에게 "{닉네임}님이 채팅방을 나갔습니다" 시스템 메시지, **대화는 계속** |

라이브 `POST /api/v1/chat/rooms/{roomId}/end`는 그룹 방에 대해 `7002`로 거절하고, 애초에 **방 전체를 종료**하는 동작이라 "나 혼자 나가고 방은 유지"라는 디자인 의도와 맞지 않습니다. 그래서 FE는 지금 이 메뉴 항목을 **의도적으로 빼 둔 상태**입니다.

### 요청

```
POST /api/v1/chat/rooms/{roomId}/leave
```

- 호출자만 방에서 빠지고, 방은 남은 인원으로 유지됩니다.
- 멱등이면 좋겠습니다(이미 나간 방에 재호출 시 성공 또는 전용 에러 코드).

### 확정해 주실 것

1. **1:1 방에 호출되면?** 거절할지, `end`와 동일하게 볼지.
2. **이탈 브로드캐스트 코드.** 현재 `SYSTEM` 메시지 계약은 `content`에 사건 코드(`USER_LEFT`)만 오고 `senderId`가 행위자입니다. 그룹에서도 같은 형태라면 FE가 `senderId`로 닉네임을 붙여 문구를 만듭니다.
   **1:1 종료(`USER_LEFT`)와 그룹 이탈을 같은 코드로 뭉갤지, 새 코드(예: `MEMBER_LEFT`)를 주실지** 정해 주세요. 같은 코드면 FE가 `sourceType`으로 문구를 갈라야 하고, 그 경우 재매칭(`REMATCH`) 방 처리도 함께 정해야 합니다.
3. **이탈한 본인의 방 목록.** 그 방이 계속 보이는지(읽기 전용), 사라지는지.
4. 이탈로 최소 인원이 깨지는 경우 → **4번 항목과 같이 확정**해 주세요.

> 답이 "지원 안 함"이면 FE는 지금 상태(메뉴에서 제외)를 유지하고 디자인 3장을 후순위로 내립니다. **결론이 나기 전까지 FE 작업 없음.**

---

## 4. [확인] 그룹 "인원 부족 종료" 사유 — P1

### 왜

Figma `4.2 그룹 채팅_인원 미달`(node-id=`2124-33784`)은 최소 인원 미달로 방이 닫혔을 때 전용 문구 **"인원 부족으로 대화가 종료되었습니다."** 를 보여줍니다.

그런데 FE가 아는 `endedReason`은 `EXPIRED` / `USER_ENDED` 둘뿐이라, 이 경우도 `EXPIRED`로 들어와 일반 만료 문구("대화 기간이 끝나 메시지를 보낼 수 없어요.")가 뜹니다. Swagger·위키 어디에도 명시가 없습니다.

### 확인해 주실 것

인원 미달 종료를 **별도 `endedReason` 값(예: `INSUFFICIENT_MEMBERS`)으로 내려주실 수 있는지**, 아니면 `EXPIRED`로 뭉뚱그리는 게 의도인지.

- 새 값을 주시면 FE는 `getRoomEndedMessage()`에 분기 하나만 추가합니다.
- 뭉뚱그리는 게 의도라면 FE는 디자인의 전용 문구를 포기하고 현행을 유지합니다.

**3번(개별 이탈)과 한 묶음으로 답해 주시는 게 좋습니다** — 이탈이 인원 미달을 유발하는 경로라서요.

---

## 5. [확장] 타인 프로필 보조 — P2

`me`는 있는데 `{id}`가 없어 상대 프로필 화면 일부가 비어 있습니다.

### 5-1. `GET /api/v1/users/{id}/ratings`

- **사용처**: `ProfileDetailModal`, `IntroNoteContainer`, `GroupMemberProfilePage`
- `GET /api/v1/users/me/ratings`와 같은 스키마면 FE가 타입을 그대로 재사용합니다:
  ```jsonc
  { "averageScore": 4.7, "totalCount": 30, "publicThreshold": 3,
    "noShowCount": 0, "ratings": [{ "comment": "…", "createdAt": "…" }] }
  ```
- `PublicProfileResponse.rating` 필드는 이미 있지만 위키에 **"평점 (아직 null)"** 로 표기돼 있어 값이 안 채워집니다. 이 필드를 채워 주시는 것으로 갈음해도 되지만, 화면에는 평균 점수 외에 **총 건수와 코멘트 칩**이 필요해서 별도 엔드포인트를 요청합니다.
- 타인의 코멘트를 노출하는 게 정책상 괜찮은지 함께 봐 주세요. 안 되면 `averageScore` + `totalCount`만 주셔도 화면은 구성됩니다.

### 5-2. `GET /api/v1/users/{id}/answers`

- **사용처**: `GroupMemberListPage`의 "나와 같은 답" 유사도 배지
- 상대의 이번 주 퀴즈 답변이 필요합니다. 스키마는 BE가 편한 형태로 제안해 주세요 — FE는 내 답변과 대조만 합니다.
- 프라이버시상 원문 답변을 못 주신다면, **서버가 계산한 일치 개수만** 주셔도 됩니다.

---

## 6. [확장] 회원가입 누락 필드 — P2

라이브 `CreateUserRequest`의 required는 `caricature` / `interests` / `job` / `location`인데, **`profileImageUrl`과 `introduce`(한 줄 소개)가 없습니다.**

온보딩에서 두 값을 다 입력받지만 가입 요청에 실리지 않아 그대로 버려집니다. 사용자는 프로필을 완성했다고 생각하고 들어오는데 실제로는 비어 있는 상태입니다.

→ `CreateUserRequest`에 `profileImageUrl`(string, nullable)과 `introduce`(string, ≤50자, nullable)를 추가해 주세요. `PATCH /users/me/profile`은 이미 두 필드를 받고 있으니 같은 제약을 쓰시면 됩니다.

---

## 7. [확장] 탈퇴 사유 자유 입력 — P2

Figma `6.2.4 탈퇴하기_사유선택완료_기타`(node-id=`2741-31829`)는 사유로 **기타**를 고르면 자유 입력 textarea(최대 100자)를 띄웁니다.

현재 `POST /api/v1/users/{id}/leave`의 바디는 `{ reason }` 문자열 하나뿐이고, FE는 여기에 선택지 코드(`no_desired_match`, `low_usage`, `privacy_concern`, `bad_experience`, `other`)를 넣고 있습니다.

### 확인 + 요청

**확인 완료**: 위키에 `{ "reason": "not-useful" }  // 선택, 최대 50자`로 명시돼 있습니다.
enum이 아니라 **자유 문자열, 최대 50자**입니다. 따라서 원문을 `reason`에 실을 수는 있지만 **50자 제한이 걸립니다.**

**남은 것은 하나**: Figma는 textarea를 **100자**로 그렸는데 서버 `reason`은 **50자**입니다.

- **(A)** `reasonDetail`(nullable, ≤100자)를 추가 — 사유 코드와 원문이 분리돼 집계도 깔끔합니다. **권장**
- **(B)** `reason` 길이를 100자로 확대 — 대신 선택지 코드와 원문이 한 필드에 섞입니다
- **(C)** 그대로 두고 FE가 입력란을 50자로 줄임 — BE 작업 0. 디자인만 조정하면 됩니다

**(C)로 정하셔도 됩니다.** 그 경우 BE 작업 없이 FE에서 끝냅니다.

> 확정 전까지 FE는 **textarea를 넣지 않습니다.** 입력받아 놓고 전송하지 않으면 사용자가 쓴 글이 조용히 버려지니까요.

---

## 8. ~~[확인] 프로필 수정 가능 범위~~ — **해결 (질문 철회)**

> **2026-08-18 정정.** BE 위키 [`Frontend-MyPage-Settings-Guide`](https://github.com/ditto-develop/ditto-server/wiki/Frontend-MyPage-Settings-Guide)에
> 이미 답이 있었습니다. 확인 없이 요청으로 올린 것은 제 잘못입니다.

위키 원문:

> **수정 가능한 건 이 셋뿐입니다.** 닉네임·성별·나이·사는곳·직업은 **화면에서 비활성**이며 서버도 받지 않습니다.
> `introduction`은 소개노트 `one-word` 답변에 저장됩니다 — `GET /api/v1/users/me/intro-notes`로도 같은 값이 보입니다.

두 질문 모두 답이 나왔습니다.

1. **닉네임 등 5개 필드는 의도적으로 잠긴 것**입니다. Figma의 `*` 표시는 필수 데이터라는 뜻이지 편집 가능하다는 뜻이 아니고, 실제로 "화면에서 비활성"이 설계입니다. FE 현행(읽기 전용)이 맞습니다. **계약 확장 요청 철회합니다.**
2. **한 줄 소개 = 소개노트 `one-word`(Q10)** 입니다. 저장소가 같아 어느 쪽에서 고쳐도 다른 쪽에 반영됩니다. Figma `6.1.1`에 한 줄 소개 필드가 없는 이유도 이것으로 설명됩니다 — 소개 노트에서 편집하는 값입니다.

> **FE가 정리할 것(BE 무관):** 현재 `EditProfileContainer`의 한 줄 소개 textarea와 `Step_3`의 Q10이
> 같은 값을 두 화면에서 편집하고 있습니다. 한쪽으로 모으거나, 같은 값임을 화면에 알려야 합니다.
> 관심사 code에 `exhibition`(전시)이 추가된 것도 위키에 명시돼 있습니다(FE 반영 완료).

---

## 9. ~~[확인] 알림 보존 기간~~ — **해결 (질문 철회)**

BE 위키에 `GET /api/v1/notifications`가 **"최근 30일만 조회됩니다"** 로 명시돼 있습니다.
서버가 자르는 것으로 확인했으니 FE가 별도로 자르지 않습니다. 회신 불필요합니다.

---

## 10. [개발] 매칭 히스토리 — P3 (디자인 대기)

Figma 스펙 표 `1.6 마이페이지 & 설정`이 매칭 히스토리를 세 줄로 정의했는데, **대응 화면이 Figma에 한 장도 없습니다.**

| 항목 | 내용 | 화면 ID |
|---|---|---|
| 1:1 히스토리 | 탭 구분(전체/만남/노쇼) | WF-14 |
| 그룹 히스토리 | 그룹 참여 기록 | WF-17 |
| 재매칭 히스토리 | 그룹→1:1 기록 | WF-15 |

스펙 표는 `GET /matches/history`, `/group-matches/history`, `/rematches/history` 3종을 제안했지만, 나머지 API가 전부 `/api/v1/users/me/*` 꼴이므로 **`GET /api/v1/users/me/match-history?type=PERSONAL|GROUP|REMATCH` 하나로 합치는 편**이 관례에 맞다고 봅니다. BE가 편한 형태로 정해 주세요.

**화면 디자인이 먼저 나와야 FE가 붙일 수 있으므로 급하지 않습니다.** 다만 재매칭 히스토리는 12번의 `GET /api/v1/rematches`와 사실상 같은 데이터라 **한 묶음으로 확정**하시는 게 좋습니다.

---

## 11. [개발] 어드민 API — P3

라이브 `/api/v1/admin/*`은 `POST /api/v1/admin/quiz-sets/{quizSetId}/matching/regenerate` **1개뿐**이고, `/admin/**` 화면은 전부 목업입니다. 내부 운영툴이라 우선순위는 가장 낮습니다.

- `POST /api/v1/users/login`(admin 로그인) · `GET /api/v1/users`(사용자 목록)
- `GET /api/v1/admin/stats` · `/admin/matches` · `/admin/quiz-progress` · `/admin/quiz-sets/active`
- `GET /api/v1/admin/users/{userId}/match-candidates`
- `POST`, `DELETE /api/v1/admin/system/override` — 시간 임시 조정
- `POST /api/v1/admin/quiz-progress/reset` · `/admin/seed-dummy` · `/admin/match-requests/dummy-request`
- 퀴즈 CRUD: `/api/v1/quizzes`, `/api/v1/quiz-sets` (`GET /api/v1/quiz-sets/{id}`만 라이브)

---

## 12. [확인] 로드맵 항목 일정 — P3

위키에 "미구현/로드맵"으로 명시된 것들입니다. FE가 우회 중이라 당장 막히지는 않지만, **일정만 알려 주시면** FE가 우회 코드를 남길지 걷을지 판단할 수 있습니다.

| 항목 | 현재 FE 우회 |
|---|---|
| 재매칭 전용 조회 `GET /api/v1/rematches` | 평가 제출 응답의 `rematch` 필드로만 인지 |
| 채팅 연장 (#121) | `expiresAt` 고정 취급 |
| 타이핑 표시 · 읽음 실시간 이벤트 | 읽음은 REST만 |
| STOMP 전송 실패 응답 | 5초 에코 타임아웃으로 실패 판정 |
| 성사·개방 푸시 알림 | FE 폴링 |

---

## 부록 A. 스펙 문서 관련 (FE 사정)

리포지토리의 `ditto-api.json`이 **구 스펙**입니다(`localhost:4000`, v0.0.1, `/api/v1` 0개). 여기서 생성한 클라이언트를 타는 호출은 전부 `/api/...`로 나가 라이브에서 404입니다.

FE가 `https://api.ditto.pics/docs/openapi.yaml`로 교체해 재생성할 예정인데, **재생성 시 아래가 빠져 있어 수기 보정이 필요합니다**(BE 위키에도 명시된 사항). 여유 되실 때 Swagger 스키마에 반영해 주시면 FE가 수기 타입을 지울 수 있습니다.

- `ChatRoom`에 `endedAt` · `endedReason` 누락
- `lastMessage.imageUrl` · `messages[].imageUrl` 누락
- `sourceType` enum에 `REMATCH` 누락

또한 경미한 건으로, `GET /users/{id}/intro-notes`가 내려주는 Q10 질문 문구가 `"Q10. 나를 한 단어로 표현한다면?"` 인데 최신 Figma는 `"Q10. 나를 한 줄로 표현한다면?"` 입니다. FE가 로컬 문구를 우선 쓰도록 처리해 화면에는 영향이 없으니, 급하지 않을 때 맞춰 주시면 됩니다.

---

## 부록 B. 회신 체크리스트

코드 없이 **답만 주시면 되는 것들**입니다. 이것부터 회신해 주시면 FE가 막힌 화면을 바로 풉니다.

- [ ] **(4)** 인원 미달 종료에 별도 `endedReason` 값을 주시나요? → 값 이름
- [ ] **(3)** 그룹 개별 이탈을 지원하시나요? → 예/아니오
- [ ] **(3)** 지원 시: 1:1 방 호출 처리 / 이탈 SYSTEM 코드(`USER_LEFT` 재사용 vs 신규) / 이탈자의 방 목록 노출 여부
- [ ] **(7)** 탈퇴 사유 100자: `reasonDetail` 추가(A) / `reason` 50→100자(B) / FE가 50자로 축소(C·BE 작업 0)
- [ ] **(2)** 투표 생성/마감 STOMP 브로드캐스트 가능 여부, 투표 생성·마감 권한
- [ ] **(5)** 타인 평가 코멘트 노출이 정책상 가능한가요? 퀴즈 답변 원문은요?
- [ ] **(12)** 로드맵 5건 대략 일정

문의는 FE 채널로 주시면 됩니다. 스키마는 전부 제안이니 편하신 대로 바꾸시고 확정본만 공유해 주세요.
