import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";

import type { ChatMessage, ChatOutgoingMessage } from "@/features/chat/model/types";
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
        handlers.onMessage(JSON.parse(frame.body) as ChatMessage);
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
