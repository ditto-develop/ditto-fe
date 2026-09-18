import { createHiddenItemStore } from "@/shared/lib/hiddenItemStore";

/**
 * 사용자가 대화방 목록에서 치운 방 id.
 *
 * **완료된 방만 치울 수 있다** — 진행 중인 방을 목록에서 숨기면 상대는 계속 말을 걸 수 있는데
 * 나는 들어갈 길이 없어진다. 나가기(leave)와는 다른 동작이라 서로 대체하지 않는다.
 *
 * 서버에 방 삭제/숨김 API 가 없어 기기 로컬로만 숨긴다 — 배경과 한계는
 * `createHiddenItemStore` 주석과 docs/be-request-notification-chat-delete.md 참고.
 */
export const hiddenChatRooms = createHiddenItemStore("ditto.hiddenChatRoomIds");
