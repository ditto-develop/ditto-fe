/**
 * 화면 캡처 스크립트 공용 헬퍼(cypress/capture/*.cy.ts).
 *
 * 카카오 심사 캡처(kakao-review.cy.ts)에서 꺼냈다. App Store 스크린샷(app-store.cy.ts)도
 * 같은 목업·대기·촬영 규칙을 쓴다 — 두 제출 자료가 같은 화면을 보여 주도록.
 */

/** 로그인 후 화면들이 추가로 부르는 API. `cy.mockApi()` 가 덮지 않는 것만 채운다. */
export function mockProfileAndSettings() {
  cy.fixture("my-profile.json").then((profile) => {
    cy.intercept("GET", "**/api/**/users/me/profile", { success: true, data: profile }).as(
      "getMyProfile",
    );
  });
  cy.fixture("my-ratings.json").then((ratings) => {
    cy.intercept("GET", "**/api/**/users/me/ratings", { success: true, data: ratings });
  });
  cy.fixture("my-stats.json").then((stats) => {
    cy.intercept("GET", "**/api/**/users/me/stats", { success: true, data: stats });
  });
  cy.fixture("intro-notes.json").then((notes) => {
    cy.intercept("GET", "**/api/**/users/me/intro-notes", { success: true, data: notes });
  });

  cy.intercept("GET", "**/api/**/users/me/notification-settings", {
    success: true,
    data: { matching: true, chat: true, marketing: false },
  });
  cy.intercept("GET", "**/api/**/users/me/blocks", {
    success: true,
    data: [
      {
        id: 42,
        nickname: "댕이나나",
        profileImageUrl: "/assets/avatar/f1.png",
        blockedAt: "2026-06-01 09:00:00",
      },
    ],
  });

  // BE는 KST 벽시계 문자열('yyyy-MM-dd HH:mm:ss')을 주고 앱은 이를 브라우저 로컬로
  // 파싱한다. toISOString()(UTC)을 쓰면 9시간 미래가 되어 전부 "방금 전"으로 보인다.
  const minutesAgo = (minutes: number) => {
    const at = new Date(Date.now() - minutes * 60_000);
    const pad = (value: number) => String(value).padStart(2, "0");
    return (
      `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ` +
      `${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}`
    );
  };

  cy.intercept("GET", "**/api/**/notifications/unread-count", {
    success: true,
    data: { count: 2 },
  });
  cy.intercept("GET", "**/api/**/notifications?*", {
    success: true,
    data: {
      notifications: [
        {
          id: 1,
          type: "MATCH_RESULT",
          category: "MATCHING",
          title: "이번 주 매칭 결과가 나왔어요",
          body: "나와 답변이 비슷한 사람들을 찾았어요. 지금 확인해 보세요.",
          createdAt: minutesAgo(5),
          readAt: null,
          targetId: 11,
        },
        {
          id: 2,
          type: "CHAT_MESSAGE",
          category: "CHAT",
          title: "산책러버님의 새 메시지",
          body: "주말에 시간 괜찮으세요?",
          createdAt: minutesAgo(30),
          readAt: null,
          targetId: 1,
        },
        {
          id: 3,
          type: "REVIEW_REQUEST",
          category: "SYSTEM",
          title: "이번 만남은 어떠셨나요?",
          body: "지난 대화 상대를 평가해주세요.",
          createdAt: minutesAgo(720),
          readAt: minutesAgo(700),
          targetId: null,
        },
      ],
      nextCursor: null,
    },
  });
}

type VisitScreenOptions = {
  /**
   * 채팅 소켓을 "연결됨"으로 응답하는 가짜로 바꾼다. 캡처 환경에는 STOMP 브로커가 없어
   * 대화방에 "연결이 끊겼어요" 안내가 붙는데, 실제 사용 화면이 아니므로 제출 자료에서 걷는다.
   */
  connectedChatSocket?: boolean;
  /** 오버레이 스크롤바를 숨긴다. 스토어 스크린샷에 세로 막대가 찍히지 않게. */
  hideScrollbars?: boolean;
};

/**
 * 순수 STOMP over WebSocket(`.../ws`)만 가로채는 가짜 소켓.
 *
 * CONNECT 프레임에 CONNECTED(하트비트 0,0)로 답하고 나머지(SUBSCRIBE·SEND)는 삼킨다.
 * Next 개발 서버의 HMR 소켓(`/_next/...`)은 진짜 WebSocket 으로 그대로 보낸다.
 */
function installConnectedChatSocket(win: Cypress.AUTWindow) {
  const RealWebSocket = win.WebSocket;

  class ConnectedStompSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readyState = ConnectedStompSocket.CONNECTING;
    binaryType: BinaryType = "blob";
    protocol = "v12.stomp";
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor(readonly url: string) {
      setTimeout(() => {
        this.readyState = ConnectedStompSocket.OPEN;
        this.onopen?.(new Event("open"));
      }, 10);
    }

    send(data: string | ArrayBuffer) {
      const frame = typeof data === "string" ? data : new TextDecoder().decode(data);
      if (!frame.startsWith("CONNECT") && !frame.startsWith("STOMP")) return;
      setTimeout(() => {
        this.onmessage?.(
          new MessageEvent("message", { data: "CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\u0000" }),
        );
      }, 10);
    }

    close() {
      this.readyState = ConnectedStompSocket.CLOSED;
      this.onclose?.(new CloseEvent("close", { code: 1000, wasClean: true }));
    }

    addEventListener() {}
    removeEventListener() {}
  }

  const PatchedWebSocket = function (url: string | URL, protocols?: string | string[]) {
    return String(url).endsWith("/ws")
      ? new ConnectedStompSocket(String(url))
      : new RealWebSocket(url, protocols);
  } as unknown as typeof WebSocket;
  Object.assign(PatchedWebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  win.WebSocket = PatchedWebSocket;
}

/**
 * 캡처용 방문.
 *
 * `next dev` 는 좌하단에 개발 인디케이터(<nextjs-portal>)를 띄운다. 제출 자료에
 * 개발 도구가 찍히면 안 되므로 숨긴다 — 앱 코드가 아니라 캡처에서만 지우는 것이라
 * 제품 동작에는 영향이 없다.
 */
export function visitScreen(path: string, options: VisitScreenOptions = {}) {
  cy.visit(path, {
    onBeforeLoad(win) {
      if (options.connectedChatSocket) installConnectedChatSocket(win);
    },
  });
  cy.document().then((doc) => {
    const style = doc.createElement("style");
    style.setAttribute("data-capture", "hide-dev-tools");
    style.textContent =
      "nextjs-portal{display:none!important}" +
      (options.hideScrollbars
        ? "*{scrollbar-width:none!important}*::-webkit-scrollbar{display:none!important}"
        : "");
    doc.head.appendChild(style);
  });
}

/**
 * 비로그인 첫 화면은 스플래시가 3초간 덮는다. 스플래시는 오버레이라 아래 화면이
 * 이미 마운트돼 있어 `should('be.visible')` 만으로는 걷혔는지 알 수 없다.
 * 스플래시의 로고(alt="Ditto")가 사라질 때까지 기다린다.
 */
export function waitForSplashToClear() {
  cy.get('img[alt="Ditto"]', { timeout: 10000 }).should("not.exist");
}

/** 화면이 다 그려질 때까지 기다린 뒤 찍는다. */
export function shoot(name: string, options: Partial<Cypress.ScreenshotOptions> = {}) {
  // 이미지·폰트가 얹히기 전에 찍히면 빈 칸이 남는다.
  cy.wait(600);
  cy.screenshot(name, { capture: "viewport", overwrite: true, ...options });
}
