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
  /** 끊겨 있으면 백오프를 기다리지 않고 지금 다시 붙는다. 이미 붙어 있으면 아무것도 안 한다. */
  reconnectNow: () => void;
  publish: (message: ChatOutgoingMessage) => boolean;
  isConnected: () => boolean;
};

/** 재연결 지터 백오프: 서버가 단일 인스턴스라 동시 재접속이 몰리는 것을 피한다. */
const BASE_RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * 죽은 연결에서 빠져나오기 위한 설정. 두 연결(방·목록)이 같이 쓴다.
 *
 * stompjs 는 `onclose` 가 와야만 재연결을 예약한다. 그런데 서버가 사라지면(배포·Spot 회수) 하트비트가
 * 끊겼을 때 기본 동작은 `ws.close()` 로 정중히 닫기를 요청하는 것뿐이고, 상대가 없는 소켓에서는
 * 웹뷰가 닫기 핸드셰이크를 끝없이 기다려 `onclose` 가 오지 않는다 — 재시도를 아무리 눌러도 앱을
 * 다시 켜기 전까지 붙지 않던 원인이다.
 *
 * - `discardWebsocketOnCommFailure`: 하트비트가 끊기면 닫기를 기다리지 않고 소켓을 버린 뒤 바로 재연결한다.
 * - `connectionTimeout`: 연결 시도 자체가 응답 없이 매달려도 제한 시간 뒤 버리고 다시 시도한다.
 */
const DEAD_CONNECTION_ESCAPE = {
  discardWebsocketOnCommFailure: true,
  connectionTimeout: 10000,
} as const;

/**
 * 백오프를 건너뛰고 지금 다시 붙는다 — 화면 복귀·네트워크 복구·사용자 재시도용.
 *
 * `deactivate({ force: true })` 로 매달린 소켓을 즉시 버리고 새로 시작한다. 연속 호출이 겹치면
 * 연결이 두 개 생길 수 있어 진행 중이면 넘긴다. 이미 닫은 소켓은 건드리지 않는다.
 */
function createReconnectNow(
  client: Client,
  resetBackoff: () => void,
  isDisposed: () => boolean,
): () => void {
  let reconnecting = false;
  return () => {
    if (isDisposed() || client.connected || reconnecting) return;
    reconnecting = true;
    resetBackoff();
    void client
      .deactivate({ force: true })
      // 기다리는 사이 화면이 닫혔으면(deactivate) 다시 켜지 않는다 — 떠난 방에 연결이 남는다.
      .then(() => {
        if (!isDisposed()) client.activate();
      })
      .finally(() => {
        reconnecting = false;
      });
  };
}

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
    ...DEAD_CONNECTION_ESCAPE,
  });
  let disposed = false;
  const reconnectNow = createReconnectNow(
    client,
    () => {
      reconnectAttempt = 0;
    },
    () => disposed,
  );

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
      disposed = true;
      subscription?.unsubscribe();
      subscription = null;
      await client.deactivate();
    },
    reconnectNow,
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
  /** 끊겨 있으면 백오프를 기다리지 않고 지금 다시 붙는다. */
  reconnectNow: () => void;
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
    ...DEAD_CONNECTION_ESCAPE,
  });
  let disposed = false;
  const reconnectNow = createReconnectNow(
    client,
    () => {
      reconnectAttempt = 0;
    },
    () => disposed,
  );

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
      disposed = true;
      subscriptions.clear();
      await client.deactivate();
    },
    reconnectNow,
    setRooms: (roomIds: number[]) => {
      desiredRoomIds = [...roomIds];
      syncSubscriptions();
    },
  };
}
