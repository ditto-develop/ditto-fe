import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";

import type { ChatMessage, ChatOutgoingMessage, ChatReadEvent } from "@/features/chat/model/types";
import { getAccessToken } from "@/shared/lib/auth";
import { getExternalApiBase } from "@/shared/lib/api/externalClient";

/** wss://api.ditto.pics/ws — SockJS가 아니라 순수 STOMP over WebSocket. */
export function getChatSocketUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_CHAT_WS_URL;
  if (explicit) return explicit;

  // API base(https://…)를 그대로 ws 스킴으로 바꿔 /ws를 붙인다.
  return `${getExternalApiBase().replace(/^http/, "ws")}/ws`;
}

type ChatSocketHandlers = {
  onMessage: (message: ChatMessage) => void;
  onRead?: (event: ChatReadEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (reason: string) => void;
};

export type ChatSocket = {
  activate: () => void;
  deactivate: () => Promise<void>;
  publish: (message: ChatOutgoingMessage) => boolean;
  isConnected: () => boolean;
};

/** 재연결 지터 백오프: 서버가 단일 인스턴스라 동시 재접속이 몰리는 것을 피한다. */
const BASE_RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

export function jitteredDelay(attempt: number, random: number): number {
  const exponential = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** attempt, MAX_RECONNECT_DELAY_MS);
  // full jitter: 0 ~ exponential 사이에서 고른다.
  return Math.round(exponential * random);
}

/**
 * 채팅방 하나에 대한 STOMP 연결을 만든다.
 *
 * - 인증은 CONNECT 프레임 헤더로 붙인다(핸드셰이크엔 커스텀 헤더를 못 넣는다).
 * - 구독은 /sub/chat/rooms/{roomId}, 전송은 반드시 /pub/chat/rooms/{roomId}.
 *   /sub로 직접 SEND하면 서버가 위조 주입으로 보고 거부한다(code 0003).
 */
export function createChatSocket(roomId: number, handlers: ChatSocketHandlers): ChatSocket {
  let subscription: StompSubscription | null = null;
  let reconnectAttempt = 0;

  const client = new Client({
    brokerURL: getChatSocketUrl(),
    // 매 연결 시점의 최신 토큰을 쓰도록 beforeConnect에서 헤더를 갱신한다.
    beforeConnect: () => {
      client.connectHeaders = buildConnectHeaders();
      client.reconnectDelay = jitteredDelay(reconnectAttempt, Math.random());
      reconnectAttempt += 1;
    },
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    reconnectDelay: BASE_RECONNECT_DELAY_MS,
  });

  client.onConnect = () => {
    reconnectAttempt = 0;
    client.reconnectDelay = BASE_RECONNECT_DELAY_MS;

    subscription = client.subscribe(`/sub/chat/rooms/${roomId}`, (frame: IMessage) => {
      try {
        const payload = JSON.parse(frame.body) as ChatMessage | ChatReadEvent;
        if ("type" in payload) {
          if (payload.type === "READ" && payload.roomId === roomId) handlers.onRead?.(payload);
          return;
        }
        handlers.onMessage(payload);
      } catch {
        handlers.onError?.("수신 메시지를 해석하지 못했어요.");
      }
    });

    handlers.onConnect?.();
  };

  client.onWebSocketClose = () => {
    subscription = null;
    handlers.onDisconnect?.();
  };

  client.onStompError = (frame) => {
    handlers.onError?.(frame.headers.message ?? "채팅 서버 오류");
  };

  return {
    activate: () => client.activate(),
    deactivate: async () => {
      subscription?.unsubscribe();
      subscription = null;
      await client.deactivate();
    },
    publish: (message: ChatOutgoingMessage) => {
      if (!client.connected) return false;
      client.publish({
        destination: `/pub/chat/rooms/${roomId}`,
        body: JSON.stringify(message),
      });
      return true;
    },
    isConnected: () => client.connected,
  };
}

function buildConnectHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const apiKey = process.env.NEXT_PUBLIC_DITTO_API_KEY;
  if (apiKey) headers["X-API-Key"] = apiKey;

  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

type ChatRoomsSocketHandlers = {
  /** 구독 중인 방에 새 메시지가 들어왔다. */
  onMessage: (roomId: number, message: ChatMessage) => void;
  /** 내가 다른 화면·기기에서 읽어 커서가 올라갔다. */
  onSelfRead?: (roomId: number, event: ChatReadEvent) => void;
  onError?: (reason: string) => void;
};

export type ChatRoomsSocket = {
  activate: () => void;
  deactivate: () => Promise<void>;
  /** 구독 대상을 갈아 끼운다. 늘어난 방만 구독하고 빠진 방만 해지한다. */
  setRooms: (roomIds: number[]) => void;
};

/**
 * 대화방 **목록**을 위한 연결. 방 하나가 아니라 내가 참여 중인 방들을 한 연결에서 함께 듣는다.
 *
 * 목록이 마운트할 때 한 번 읽고 마는 구조라, 목록을 보고 있는 동안 새 메시지가 와도 마지막
 * 메시지도 안읽음 배지도 그대로였다. 서버에는 방 토픽(`/sub/chat/rooms/{id}`)밖에 없으므로
 * 내 방들을 각각 구독한다 — 연결은 하나고 구독만 여러 개다.
 *
 * **구독할 수 있는 방만 넘겨야 한다.** 서버는 이탈·개방 전·종료된 방의 SUBSCRIBE 를 거부하고
 * (`ChatRoomAccessChecker.validateActiveMember`), STOMP 는 그 거부를 ERROR 프레임으로 돌려주며
 * **연결 전체가 끊긴다.** 한 방을 잘못 넣으면 나머지 방의 실시간까지 같이 죽는다.
 */
export function createChatRoomsSocket(handlers: ChatRoomsSocketHandlers): ChatRoomsSocket {
  const subscriptions = new Map<number, StompSubscription>();
  let desiredRoomIds: number[] = [];
  let reconnectAttempt = 0;

  const client = new Client({
    beforeConnect: () => {
      client.connectHeaders = buildConnectHeaders();
      client.reconnectDelay = jitteredDelay(reconnectAttempt, Math.random());
      reconnectAttempt += 1;
    },
    brokerURL: getChatSocketUrl(),
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    reconnectDelay: BASE_RECONNECT_DELAY_MS,
  });

  const subscribeRoom = (roomId: number) => {
    if (!client.connected || subscriptions.has(roomId)) return;

    const subscription = client.subscribe(`/sub/chat/rooms/${roomId}`, (frame: IMessage) => {
      try {
        const payload = JSON.parse(frame.body) as ChatMessage | ChatReadEvent;
        if ("type" in payload) {
          if (payload.type === "READ") handlers.onSelfRead?.(roomId, payload);
          return;
        }
        handlers.onMessage(roomId, payload);
      } catch {
        handlers.onError?.("수신 메시지를 해석하지 못했어요.");
      }
    });
    subscriptions.set(roomId, subscription);
  };

  const syncSubscriptions = () => {
    const wanted = new Set(desiredRoomIds);
    for (const [roomId, subscription] of subscriptions) {
      if (wanted.has(roomId)) continue;
      subscription.unsubscribe();
      subscriptions.delete(roomId);
    }
    desiredRoomIds.forEach(subscribeRoom);
  };

  client.onConnect = () => {
    reconnectAttempt = 0;
    client.reconnectDelay = BASE_RECONNECT_DELAY_MS;
    // 재연결이면 이전 구독 핸들은 이미 죽었다. 장부를 비우고 다시 붙인다.
    subscriptions.clear();
    syncSubscriptions();
  };

  client.onWebSocketClose = () => {
    subscriptions.clear();
  };

  client.onStompError = (frame) => {
    handlers.onError?.(frame.headers.message ?? "채팅 서버 오류");
  };

  return {
    activate: () => client.activate(),
    deactivate: async () => {
      subscriptions.clear();
      await client.deactivate();
    },
    setRooms: (roomIds: number[]) => {
      desiredRoomIds = [...roomIds];
      syncSubscriptions();
    },
  };
}
