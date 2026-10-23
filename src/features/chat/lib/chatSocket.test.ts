import { describe, expect, it, vi } from "vitest";

import { createChatRoomsSocket, createChatSocket, jitteredDelay } from "@/features/chat/lib/chatSocket";

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
    config: Record<string, unknown>;
    connected: boolean;
    onConnect: () => void;
    subscribe: ReturnType<typeof vi.fn>;
    activate: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock("@stomp/stompjs", () => ({
  Client: class {
    config: Record<string, unknown>;
    connected = false;
    onConnect = () => {};
    subscribe = vi.fn();
    activate = vi.fn();
    deactivate = vi.fn(async () => undefined);
    constructor(config: Record<string, unknown>) {
      this.config = config;
      stomp.clients.push(this);
    }
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

describe("dead connection escape", () => {
  it("discards a dead socket instead of waiting for close, and bounds hung connects", () => {
    // 하트비트가 끊긴 소켓에 close() 만 부르면 웹뷰가 onclose 를 끝없이 미뤄 재연결이 예약되지 않는다.
    createChatSocket(1, { onMessage: vi.fn() });
    createChatRoomsSocket({ onMessage: vi.fn() });
    for (const client of stomp.clients.slice(-2)) {
      expect(client.config.discardWebsocketOnCommFailure).toBe(true);
      expect(client.config.connectionTimeout).toBe(10000);
    }
  });
});

describe("reconnectNow", () => {
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("force-discards the stuck socket and activates again when disconnected", async () => {
    const socket = createChatSocket(1, { onMessage: vi.fn() });
    const client = stomp.clients.at(-1)!;

    socket.reconnectNow();
    await flush();

    expect(client.deactivate).toHaveBeenCalledWith({ force: true });
    expect(client.activate).toHaveBeenCalledTimes(1);
  });

  it("does nothing while connected", async () => {
    const socket = createChatRoomsSocket({ onMessage: vi.fn() });
    const client = stomp.clients.at(-1)!;
    client.connected = true;

    socket.reconnectNow();
    await flush();

    expect(client.deactivate).not.toHaveBeenCalled();
  });

  it("collapses overlapping calls into one reconnect", async () => {
    const socket = createChatSocket(1, { onMessage: vi.fn() });
    const client = stomp.clients.at(-1)!;

    socket.reconnectNow();
    socket.reconnectNow();
    await flush();

    expect(client.deactivate).toHaveBeenCalledTimes(1);
    expect(client.activate).toHaveBeenCalledTimes(1);
  });

  it("never reopens a socket the screen already closed", async () => {
    const socket = createChatSocket(1, { onMessage: vi.fn() });
    const client = stomp.clients.at(-1)!;

    socket.reconnectNow();
    await socket.deactivate();
    await flush();
    socket.reconnectNow();
    await flush();

    expect(client.activate).not.toHaveBeenCalled();
  });
});
