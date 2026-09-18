# BE 개발 요청서 — 알림/완료 대화방 삭제, 프로필 수정 가능 필드

> 작성: 2026-09-18 · FE 담당: @junseo2323
> 관련: [BE-Request 위키](https://github.com/ditto-develop/ditto-fe/wiki/BE-Request)
> 우선순위: **P2** — FE 가 임시 우회(기기 로컬 숨김)로 먼저 냈습니다. 우회는 기기마다 어긋납니다.

---

## 0. 한 줄 요약

세 가지가 계약에 없어서 FE 단독으로 끝낼 수 없습니다.

1. **알림 삭제** — `DELETE /api/v1/notifications/{id}`, `DELETE /api/v1/notifications`
2. **완료된 대화방 숨김** — `DELETE /api/v1/chat/rooms/{roomId}` (또는 `.../hide`)
3. **프로필 수정 필드 확장** — `PATCH /api/v1/users/me/profile` 이 닉네임·성별·사는 곳·직업을 받도록

1·2 는 임시로 브라우저 저장소에 숨긴 id 를 적어 두는 방식(아래 §3)으로 냈고,
3 은 **아직 화면에 손대지 않았습니다** — 받아 줄 필드가 없어 저장을 누르는 순간
사용자에게 거짓 성공을 보여 주게 되기 때문입니다.

---

## 1. 알림 삭제

라이브 스펙(`https://api.ditto.pics/v3/api-docs`, 2026-09-18 확인)에 있는 알림 API 는
이것뿐입니다.

| 있는 것 | 한계 |
|---|---|
| `GET /api/v1/notifications` | 조회만 |
| `PUT /api/v1/notifications/{id}/read` · `PUT /api/v1/notifications/read-all` | **읽음일 뿐 삭제가 아닙니다.** 읽은 알림도 목록에 계속 남습니다 |
| `GET /api/v1/notifications/unread-count` | 배지용 |

요청 사항:

```
DELETE /api/v1/notifications/{id}     → 그 알림 1건 삭제(멱등, 내 알림이 아니면 404)
DELETE /api/v1/notifications          → 내 알림 전체 삭제
    ?category=MATCHING|CHAT|SYSTEM    → (선택) 그 카테고리만. 화면의 '전체 지우기'가
                                         지금 보이는 탭만 지우는 동작이라 있으면 정확해집니다
```

- 응답은 `read-all` 과 같은 모양(`{ deletedCount: number }`)이면 충분합니다.
- 소프트 삭제여도 무관합니다 — FE 는 목록·미읽음 수에서 빠지기만 하면 됩니다.
- 삭제한 알림은 `unread-count` 에서도 빠져야 합니다. 안 빠지면 "안 읽은 알림이 있다는데
  목록은 비어 있다"가 됩니다.

## 2. 완료된 대화방 숨김

| 있는 것 | 한계 |
|---|---|
| `POST /api/v1/chat/rooms/{roomId}/end` | 방을 끝냅니다. **목록에는 남습니다** |
| `POST /api/v1/chat/rooms/{roomId}/leave` | 나갑니다. 역시 `hasLeft: true` 로 **목록에 남습니다** |

끝났거나 나간 방을 목록에서 치울 방법이 없습니다. 요청 사항:

```
DELETE /api/v1/chat/rooms/{roomId}    → 그 방을 내 목록에서만 제거(상대 목록은 유지)
```

- **종료된 방(`isEnded: true` 또는 만료)만 허용**해 주세요. 진행 중인 방을 목록에서
  숨기면 상대는 계속 말을 걸 수 있는데 나는 들어갈 길이 없어집니다. 진행 중인 방에는
  기존 오류 코드(7002 계열)로 거절해 주시면 FE 가 막습니다.
- 메시지 자체를 지울 필요는 없습니다. "내 목록에서만 안 보이게"가 전부입니다.

## 3. FE 가 지금 쓰고 있는 임시 우회

`src/shared/lib/hiddenItemStore.ts` — 숨긴 id 를 `localStorage` 에 적고 목록에서만
빼냅니다(`ditto.hiddenNotificationIds`, `ditto.hiddenChatRoomIds`).

한계를 그대로 적습니다.

- **서버 데이터는 남습니다.** 다른 기기·재설치·사이트 데이터 삭제 시 전부 되살아납니다.
- 알림은 숨길 때 읽음 처리를 함께 보내 배지만 맞춰 두었습니다 — 서버 기준으로는
  여전히 존재하는 알림입니다.
- 위 API 가 생기면 호출부를 API 로 갈아 끼우고 이 모듈은 **삭제**합니다.

## 4. 프로필 수정 가능 필드 확장

현재 `PATCH /api/v1/users/me/profile` 이 받는 필드(`UpdateMyProfileRequest`):

```
introduction    (≤50자)
profileImageUrl (≤100자)
interests       (1~5개)
```

`GET` 으로는 내려오지만 `PATCH` 로는 못 고치는 필드:

```
nickname     닉네임
gender       성별
location     사는 곳
occupation   직업
```

요청 사항: 위 네 필드를 `UpdateMyProfileRequest` 에 추가해 주세요(부분 수정 유지).

- `nickname` 은 중복·금칙어 검증이 필요합니다. FE 에 `nicknameSafety` 가 있지만
  중복은 서버만 압니다 — 실패 시 전용 오류 코드를 주시면 인라인 메시지로 붙입니다.
- `location` / `occupation` 은 FE 가 코드→라벨 매핑(`shared/lib/profileLabels`)을 갖고
  있습니다. 회원가입 때 쓰는 것과 **같은 코드 집합**을 받아 주시면 됩니다.
- **나이(`age`)와 이메일은 수정 대상이 아닙니다.** 나이는 `birthDate` 에서 파생되는
  값이라 화면에서도 읽기 전용으로 두고, 이메일은 소셜 로그인 식별자라 잠가 둡니다.
  (`PATCH /api/v1/users/me/personal-info` 가 `birthDate` 를 받는 건 별개 창구입니다.)
