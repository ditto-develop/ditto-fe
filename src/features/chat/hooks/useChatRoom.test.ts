import { describe, expect, it } from "vitest";

import { mergeAscending } from "@/features/chat/hooks/useChatRoom";
import type { ChatMessage } from "@/features/chat/model/types";

function message(id: number, content = `msg-${id}`): ChatMessage {
  return {
    id,
    roomId: 1,
    senderId: 2,
    messageType: "TEXT",
    content,
    imageUrl: null,
    createdAt: "2026-06-03 17:00:00",
  };
}

describe("mergeAscending", () => {
  it("keeps messages sorted by id ascending", () => {
    const merged = mergeAscending([message(3)], [message(1), message(2)]);
    expect(merged.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("de-duplicates by id so STOMP and REST resume can overlap", () => {
    // 재연결 리줌은 이미 소켓으로 받은 메시지를 다시 가져올 수 있다.
    const merged = mergeAscending([message(1), message(2)], [message(2), message(3)]);
    expect(merged.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("lets the incoming copy win for the same id", () => {
    const merged = mergeAscending([message(1, "stale")], [message(1, "fresh")]);
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe("fresh");
  });

  it("returns the current list untouched when nothing arrives", () => {
    const current = [message(1)];
    expect(mergeAscending(current, [])).toBe(current);
  });
});
