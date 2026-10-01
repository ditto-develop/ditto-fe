describe("chat read receipts", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login({
      accessToken: `e30.${btoa(JSON.stringify({ sub: "1", exp: 4102444800 }))}.test`,
    });
  });

  [
    { route: "one-on-one", roomId: 1, count: 1 },
    { route: "group", roomId: 3, count: 3 },
  ].forEach(({ route, roomId, count }) => {
    it(`${route}: updates only the READ interval without adding chat bubbles`, () => {
      let deliver: (payload: object) => void = () => { throw new Error("socket not subscribed"); };
      let subscribed = false;
      cy.fixture("chat-messages.json").then((page) => {
        const ownMessage = page.messages.find((message: { senderId: number }) => message.senderId === 1);
        cy.intercept("GET", `**/api/**/chat/rooms/${roomId}/messages*`, {
          body: {
            success: true,
            data: {
              messages: [43, 42, 41, 40].map((id) => ({
                ...ownMessage, id, roomId, messageType: "TEXT",
                content: `읽음 테스트 ${id}`, imageUrl: null, unreadCount: count,
              })),
              nextCursor: null,
            },
          },
        }).as("readMessages");
      });
      cy.visit(`/chat/${route}/${roomId}`, {
        onBeforeLoad(win) {
          const OriginalWebSocket = win.WebSocket;
          class ChatSocket {
            readyState = 1;
            binaryType = "arraybuffer";
            onopen: (() => void) | null = null;
            onmessage: ((event: { data: string }) => void) | null = null;
            onclose: (() => void) | null = null;
            constructor() { setTimeout(() => this.onopen?.(), 0); }
            send(frame: string) {
              if (frame.startsWith("CONNECT")) {
                setTimeout(() => this.onmessage?.({
                  data: "CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0",
                }), 0);
              }
              if (frame.startsWith("SUBSCRIBE")) {
                const subscription = frame.match(/\nid:([^\n]+)/)?.[1];
                deliver = (payload) => this.onmessage?.({
                  data: `MESSAGE\nsubscription:${subscription}\nmessage-id:read\ndestination:/sub/chat/rooms/${roomId}\n\n${JSON.stringify(payload)}\0`,
                });
                subscribed = true;
              }
            }
            close() { this.readyState = 3; }
          }
          win.WebSocket = new Proxy(OriginalWebSocket, {
            construct(target, args) {
              return String(args[0]).endsWith("/ws")
                ? new ChatSocket()
                : Reflect.construct(target, args);
            },
          });
        },
      });
      cy.wait("@readMessages");
      cy.get(`[aria-label="안 읽은 사람 ${count}명"]`).should("have.length", 4);
      cy.wrap(null).should(() => expect(subscribed).to.equal(true));
      cy.then(() => deliver({
        type: "READ", roomId, memberId: 2,
        previousLastReadMessageId: null, lastReadMessageId: 40,
      }));
      cy.get(`[aria-label="안 읽은 사람 ${count}명"]`).should("have.length", 3);
      cy.then(() => deliver({
        type: "READ", roomId, memberId: 2,
        previousLastReadMessageId: 40, lastReadMessageId: 42,
      }));
      cy.get(`[aria-label="안 읽은 사람 ${count}명"]`).should("have.length", 1);
      if (count > 1) cy.get(`[aria-label="안 읽은 사람 ${count - 1}명"]`).should("have.length", 3);
      cy.contains("읽음 테스트 43").should("be.visible");
      cy.contains("Invalid Date").should("not.exist");
      cy.contains("READ").should("not.exist");
      cy.wait("@markChatAsRead").its("request.body").should("deep.equal", { lastReadMessageId: 43 });
    });
  });

  it("one-on-one: my own READ lowers the partner's bubbles too", () => {
    let deliver: (payload: object) => void = () => { throw new Error("socket not subscribed"); };
    let subscribed = false;
    cy.fixture("chat-messages.json").then((page) => {
      const partnerMessage = page.messages.find((message: { senderId: number }) => message.senderId !== 1);
      cy.intercept("GET", "**/api/**/chat/rooms/1/messages*", {
        body: {
          success: true,
          data: {
            messages: [41, 40].map((id) => ({
              ...partnerMessage, id, roomId: 1, messageType: "TEXT",
              content: `상대 메시지 ${id}`, imageUrl: null, unreadCount: 1,
            })),
            nextCursor: null,
          },
        },
      }).as("partnerMessages");
    });
    cy.visit("/chat/one-on-one/1", {
      onBeforeLoad(win) {
        const OriginalWebSocket = win.WebSocket;
        class ChatSocket {
          readyState = 1;
          binaryType = "arraybuffer";
          onopen: (() => void) | null = null;
          onmessage: ((event: { data: string }) => void) | null = null;
          onclose: (() => void) | null = null;
          constructor() { setTimeout(() => this.onopen?.(), 0); }
          send(frame: string) {
            if (frame.startsWith("CONNECT")) {
              setTimeout(() => this.onmessage?.({
                data: "CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0",
              }), 0);
            }
            if (frame.startsWith("SUBSCRIBE")) {
              const subscription = frame.match(/\nid:([^\n]+)/)?.[1];
              deliver = (payload) => this.onmessage?.({
                data: `MESSAGE\nsubscription:${subscription}\nmessage-id:read\ndestination:/sub/chat/rooms/1\n\n${JSON.stringify(payload)}\0`,
              });
              subscribed = true;
            }
          }
          close() { this.readyState = 3; }
        }
        win.WebSocket = new Proxy(OriginalWebSocket, {
          construct(target, args) {
            return String(args[0]).endsWith("/ws")
              ? new ChatSocket()
              : Reflect.construct(target, args);
          },
        });
      },
    });
    cy.wait("@partnerMessages");
    cy.get('[aria-label="안 읽은 사람 1명"]').should("have.length", 2);
    cy.wrap(null).should(() => expect(subscribed).to.equal(true));
    // 서버는 내 READ 도 방 토픽으로 돌려준다(memberId 1 = 나).
    cy.then(() => deliver({
      type: "READ", roomId: 1, memberId: 1,
      previousLastReadMessageId: null, lastReadMessageId: 41,
    }));
    cy.get('[aria-label="안 읽은 사람 1명"]').should("not.exist");
  });
});
