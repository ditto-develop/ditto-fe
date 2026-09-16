import { describe, expect, it } from "vitest";

import { applyReadEvent, mergeAscending } from "@/features/chat/hooks/useChatRoom";
import type { ChatMessage } from "@/features/chat/model/types";

function message(id: number, content = `msg-${id}`): ChatMessage {
  return {
    id,
    roomId: 1,
    senderId: 2,
    messageType: "TEXT",
    content,
    imageUrl: null,
    unreadCount: 2,
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

describe("applyReadEvent", () => {
  const read = {
    type: "READ" as const, roomId: 1, memberId: 3,
    previousLastReadMessageId: 40, lastReadMessageId: 42,
  };

  it("only decrements my messages inside the new read interval", () => {
    const result = applyReadEvent([message(40), message(41), message(42), message(43)], read, 2);
    expect(result.map((item) => item.unreadCount)).toEqual([2, 1, 1, 2]);
  });

  it("does not decrement the earlier interval again on the next read", () => {
    const first = applyReadEvent([message(40), message(41), message(42)], {
      ...read, previousLastReadMessageId: null, lastReadMessageId: 40,
    }, 2);
    expect(applyReadEvent(first, read, 2).map((item) => item.unreadCount)).toEqual([1, 1, 1]);
  });

  it("ignores self reads, other rooms, other senders, SYSTEM and zero counts", () => {
    const messages = [
      { ...message(41), roomId: 2 },
      { ...message(41), senderId: 3 },
      { ...message(41), messageType: "SYSTEM" as const },
      { ...message(41), unreadCount: 0 },
    ];
    expect(applyReadEvent(messages, read, 2)).toEqual(messages);
    expect(applyReadEvent(messages, { ...read, memberId: 2 }, 2)).toBe(messages);
    expect(applyReadEvent(messages, read, null)).toBe(messages);
  });
});
