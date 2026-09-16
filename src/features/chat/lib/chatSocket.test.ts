import { describe, expect, it, vi } from "vitest";

import { createChatSocket, jitteredDelay } from "@/features/chat/lib/chatSocket";

describe("jitteredDelay", () => {
  it("stays within [0, exponential] for the given random draw", () => {
    // full jitter: 같은 시도라도 0 ~ 지수 상한 사이에서 고르게 흩어져야
    // 단일 인스턴스 서버로 재접속이 몰리지 않는다.
    expect(jitteredDelay(0, 0)).toBe(0);
    expect(jitteredDelay(0, 1)).toBe(2000);
    expect(jitteredDelay(1, 1)).toBe(4000);
    expect(jitteredDelay(2, 1)).toBe(8000);
  });

  it("grows exponentially but is capped at 30s", () => {
    expect(jitteredDelay(10, 1)).toBe(30000);
    expect(jitteredDelay(50, 1)).toBe(30000);
  });

  it("scales the cap by the random draw as well", () => {
    expect(jitteredDelay(10, 0.5)).toBe(15000);
  });
});


const stomp = vi.hoisted(() => ({
  clients: [] as Array<{
    onConnect: () => void;
    subscribe: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock("@stomp/stompjs", () => ({
  Client: class {
    onConnect = () => {};
    subscribe = vi.fn();
    constructor() { stomp.clients.push(this); }
  },
}));

describe("room frame dispatch", () => {
  it("routes READ separately and ignores events from another room or unknown types", () => {
    const onMessage = vi.fn();
    const onRead = vi.fn();
    createChatSocket(3, { onMessage, onRead });
    const client = stomp.clients.at(-1)!;
    client.onConnect();
    const receive = client.subscribe.mock.calls[0][1] as (frame: { body: string }) => void;
    const read = {
      type: "READ", roomId: 3, memberId: 7,
      previousLastReadMessageId: 40, lastReadMessageId: 42,
    };
    receive({ body: JSON.stringify(read) });
    expect(onRead).toHaveBeenCalledWith(read);
    receive({ body: JSON.stringify({ ...read, roomId: 4 }) });
    receive({ body: JSON.stringify({ ...read, type: "UNKNOWN" }) });
    expect(onRead).toHaveBeenCalledTimes(1);
    expect(onMessage).not.toHaveBeenCalled();

    const message = { id: 43, roomId: 3, messageType: "TEXT", content: "hello" };
    receive({ body: JSON.stringify(message) });
    expect(onMessage).toHaveBeenCalledWith(message);
  });
});
