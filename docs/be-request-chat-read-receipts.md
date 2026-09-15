# BE 개발 요청서 — 채팅 읽음 표시(안 읽은 사람 수)

> 작성: 2026-09-15 · FE 담당: @junseo2323
> 관련: [BE-Request 위키](https://github.com/ditto-develop/ditto-fe/wiki/BE-Request)
> 우선순위: **P1** — QA 신고 8건 중 이것만 FE 단독으로 못 고친다.

---

## 0. 한 줄 요약

**메시지 한 건마다 "아직 안 읽은 사람 수"를 응답에 실어 주세요.** 지금 계약에는 그 값이
없어서 카카오톡의 `1` 같은 표시를 그릴 수가 없습니다.

---

## 1. 왜 FE 단독으로 못 하나

2026-09-15 QA 에서 "읽음표시 숫자 없음"이 올라왔습니다. 확인해 보니 **화면을 안 그린 게
아니라 그릴 데이터가 없습니다.**

현재 계약에서 읽음과 관련된 것은 두 가지뿐입니다.

| 있는 것 | 위치 | 한계 |
|---|---|---|
| `ChatRoomResponse.unreadCount` | `GET /api/v1/chat/rooms` | **방 단위**입니다. "내가 안 읽은 수"라 채팅 목록 뱃지에만 쓸 수 있고, **내가 보낸 메시지를 상대가 읽었는지**는 알 수 없습니다. |
| `POST /api/v1/chat/rooms/{roomId}/read` | 읽음 보고 | 단방향입니다. 응답 본문이 없고, **상대에게 브로드캐스트되지 않습니다.** 상대 화면은 내가 읽었다는 사실을 영영 모릅니다. |

`ChatMessageResponse` 에는 읽음 관련 필드가 하나도 없습니다.

```kotlin
// api/src/main/kotlin/com/ditto/api/chat/dto/ChatMessageResponse.kt (현재)
data class ChatMessageResponse(
    val id: Long,
    val roomId: Long,
    val senderId: Long,
    val messageType: ChatMessageType,
    val content: String,
    val imageUrl: String?,
    val createdAt: LocalDateTime,
)
```

즉 **FE 가 계산할 수 있는 정보가 응답에 존재하지 않습니다.** 클라이언트가 추정하려면 방
참여자 전원의 마지막 읽음 지점을 알아야 하는데, 그건 서버만 가지고 있습니다.

> 참고: 예전 OpenAPI 스냅샷(`ditto-api.json`, 2026-05-17)에는
> `GroupChatMessageDto.unreadCount`("읽지 않은 참여자 수")와
> `MessageListDto.partnerLastReadMessageId` / `readReceipts` 가 있었습니다.
> `/api/v1` 통합 계약으로 옮기면서 빠진 것으로 보입니다. **설계가 이미 있었다면 그걸
> 되살리는 편이 가장 빠릅니다.**

---

## 2. 요청 — 필드 하나면 충분합니다

### 2-1. `ChatMessageResponse` 에 `unreadCount` 추가 (필수)

```kotlin
data class ChatMessageResponse(
    val id: Long,
    // ...기존 필드...
    /** 이 메시지를 아직 읽지 않은 **나를 제외한** 참여자 수. 0 이면 모두 읽었다. */
    val unreadCount: Int,
)
```

- **1:1 방**: `0` 또는 `1`. FE 는 `1` 이면 말풍선 옆에 `1`, `0` 이면 숨깁니다.
- **그룹 방**: `0`~`5`. 그대로 숫자를 그립니다.
- 상대가 나간 방(`hasLeft`)의 이탈자는 **분모에서 빼 주세요.** 빼지 않으면 나간 사람 때문에
  숫자가 영영 안 줄어들어 "아무도 안 읽는다"로 보입니다.
- 내가 받은 메시지(`senderId != me`)의 값은 FE 가 쓰지 않습니다. 계산이 부담되면 `0` 으로
  고정해도 됩니다 — 다만 **필드 자체는 항상 내려 주세요**(옵셔널이면 FE 가 "모름"과
  "다 읽음"을 구분하지 못합니다).

적용 대상: `GET /api/v1/chat/rooms/{roomId}/messages` 응답의 각 메시지, 그리고
`ChatRoomResponse.lastMessage`.

### 2-2. 읽음이 바뀌면 STOMP 로 알려 주기 (필수)

이게 없으면 **상대가 읽어도 내 화면의 `1` 이 안 사라집니다.** 방을 나갔다 들어와야 갱신되는데,
읽음 표시의 요점이 실시간이라 사실상 쓸모가 없어집니다.

`POST /api/v1/chat/rooms/{roomId}/read` 를 처리한 뒤 기존 메시지 토픽에 이벤트 한 건을
발행해 주세요. 모양은 자유지만 **메시지와 구분할 수 있게** `type` 을 주세요 — 지금 FE 는
프레임 본문을 무조건 `ChatMessage` 로 파싱합니다(`src/features/chat/lib/chatSocket.ts`).

```json
{
  "type": "READ",
  "roomId": 3,
  "memberId": 7,
  "lastReadMessageId": 42
}
```

FE 는 이 값을 받아 `id <= lastReadMessageId` 인 내 메시지의 `unreadCount` 를 1 줄입니다.
(메시지마다 다시 조회하지 않습니다.)

### 2-3. 안 해 주셔도 되는 것

- 누가 읽었는지(읽은 사람 **목록**)는 필요 없습니다. 화면에 안 그립니다.
- 읽은 **시각**도 필요 없습니다.
- 별도 엔드포인트(`GET .../read-receipts`)는 만들지 말아 주세요. 폴링이 늘기만 합니다.

---

## 3. FE 쪽 작업 (이 요청이 오면 바로 붙입니다)

| 파일 | 할 일 |
|---|---|
| `src/features/chat/model/types.ts` | `ChatMessage` 에 `unreadCount` 추가 |
| `src/features/chat/api/chatApi.ts` | `normalizeMessage` 에서 기본값 처리 |
| `src/features/chat/lib/chatSocket.ts` | `type: "READ"` 프레임 분기 |
| `src/features/chat/hooks/useChatRoom.ts` | READ 이벤트로 기존 메시지의 카운트 감소 |
| `MessageBubble.tsx` / `GroupMessageBubble.tsx` | `TimeLabel` 옆에 숫자 |

**1~2일이면 붙습니다.** 지금 막혀 있는 건 계약뿐입니다.

---

## 4. 일정 문의

- 2-1(필드 추가)만 먼저 나가도 **"안 읽은 사람 수"는 그릴 수 있습니다** — 갱신이 방 재진입
  시점으로 늦어질 뿐입니다. 2-2 는 그 뒤에 붙여도 됩니다.
- 이번 스프린트에 어렵다면 알려 주세요. QA 보고에는 "BE 계약 대기"로 남겨 두겠습니다.
