describe("chat list", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("lists chat rooms with the counterpart profile and opens a 1:1 room", () => {
    cy.visit("/chat");

    cy.wait("@getChatRooms");
    cy.contains("대화방", { timeout: 6000 }).should("be.visible");

    // 방 목록 응답에는 counterpartMemberIds만 있어 닉네임은 프로필 조회로 채운다.
    cy.contains("수민", { timeout: 8000 }).should("be.visible");
    cy.contains("안녕하세요, 반가워요!").should("be.visible");

    cy.contains("안녕하세요, 반가워요!").click();
    cy.location("pathname", { timeout: 6000 }).should("include", "/chat/one-on-one/1");
  });

  it("shows every counterpart name for a group room", () => {
    cy.fixture("public-profile.json").then((profile) => {
      cy.intercept("GET", /\/api\/v1\/users\/\d+\/profile/, (req) => {
        const memberId = req.url.match(/users\/(\d+)\/profile/)?.[1];
        req.reply({ success: true, data: { ...profile, userId: Number(memberId), nickname: `멤버${memberId}` } });
      });
    });
    cy.visit("/chat");
    cy.contains("멤버2, 멤버3, 멤버4").should("be.visible");
  });

  // 로딩 문구 한 줄만 띄우면 데이터 도착 순간 레이아웃이 통째로 바뀌어 화면이 튄다.
  it("holds the layout with a skeleton while rooms load", () => {
    cy.intercept("GET", "**/api/**/chat/rooms", (req) => {
      req.on("response", (res) => res.setDelay(600));
    }).as("slowChatRooms");

    cy.visit("/chat");

    cy.get("[data-cy=chat-list-skeleton]").should("exist");
    cy.contains("수민", { timeout: 8000 }).should("be.visible");
    cy.get("[data-cy=chat-list-skeleton]").should("not.exist");
  });

  it("splits rooms by the derived state (isEnded · expiresAt)", () => {
    cy.visit("/chat");
    cy.wait("@getChatRooms");

    // 종료 = isEnded 이거나 expiresAt이 지난 방. 픽스처의 roomId 2가 여기 해당한다.
    cy.contains("button", "종료").click();
    cy.contains("사진을 보냈어요.").should("be.visible");
    cy.contains("안녕하세요, 반가워요!").should("not.exist");

    cy.contains("button", "진행중").click();
    cy.contains("안녕하세요, 반가워요!").should("be.visible");
    cy.contains("사진을 보냈어요.").should("not.exist");
  });

  it("shows filter-specific empty states and returns to the full list", () => {
    cy.intercept("GET", "**/api/**/chat/rooms", {
      statusCode: 200,
      body: { success: true, data: [] },
    }).as("emptyChatRooms");

    cy.visit("/chat");
    cy.wait("@emptyChatRooms");

    cy.contains("아직 나눈 대화가 없어요").should("be.visible");
    cy.contains("퀴즈에 참여하고 새로운 만남을 시작해 보세요!").should("be.visible");

    cy.contains("button", "진행중").click();
    cy.contains("대화방이 없어요").should("be.visible");
    cy.contains("퀴즈에 참여하고 새로운 만남을 시작해 보세요!").should("not.exist");
    cy.contains("button", "대화목록 전체보기").click();
    cy.contains("아직 나눈 대화가 없어요").should("be.visible");

    cy.contains("button", "종료").click();
    cy.contains("대화방이 없어요").should("be.visible");
    cy.contains("button", "대화목록 전체보기").click();
    cy.contains("아직 나눈 대화가 없어요").should("be.visible");
  });

  /**
   * 목록은 마운트할 때 한 번 읽고 마는 구조라, 목록을 보고 있는 동안 새 메시지가 와도 마지막
   * 메시지도 안읽음 배지도 그대로였다. 방 토픽을 목록에서도 구독해 그 자리에서 반영한다.
   *
   * 구독 대상은 **진행 중인 방만**이다 — 서버는 종료·개방 전·이탈한 방의 SUBSCRIBE 를 거부하고
   * STOMP 는 그 거부에 연결 전체를 끊는다.
   */
  it("subscribes to active rooms and updates the row when a message arrives", () => {
    const subscribed: string[] = [];
    let deliver: (destination: string, payload: object) => void = () => {
      throw new Error("socket not subscribed");
    };

    cy.visit("/chat", {
      onBeforeLoad(win) {
        const OriginalWebSocket = win.WebSocket;
        class ListSocket {
          readyState = 1;
          binaryType = "arraybuffer";
          onopen: (() => void) | null = null;
          onmessage: ((event: { data: string }) => void) | null = null;
          onclose: (() => void) | null = null;
          private ids = new Map<string, string>();
          constructor() {
            setTimeout(() => this.onopen?.(), 0);
          }
          send(frame: string) {
            if (frame.startsWith("CONNECT")) {
              setTimeout(
                () => this.onmessage?.({ data: "CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0" }),
                0,
              );
            }
            if (frame.startsWith("SUBSCRIBE")) {
              const destination = frame.match(/\ndestination:([^\n]+)/)?.[1] ?? "";
              const id = frame.match(/\nid:([^\n]+)/)?.[1] ?? "";
              subscribed.push(destination);
              this.ids.set(destination, id);
              deliver = (target, payload) =>
                this.onmessage?.({
                  data: `MESSAGE\nsubscription:${this.ids.get(target)}\nmessage-id:list\ndestination:${target}\n\n${JSON.stringify(payload)}\0`,
                });
            }
          }
          close() {
            this.readyState = 3;
          }
        }
        win.WebSocket = new Proxy(OriginalWebSocket, {
          construct(target, args) {
            return String(args[0]).endsWith("/ws")
              ? new ListSocket()
              : Reflect.construct(target, args);
          },
        });
      },
    });

    cy.contains("수민", { timeout: 8000 }).should("be.visible");

    // 방 1·3 은 진행 중, 방 2 는 종료된 방이다.
    cy.wrap(subscribed).should((destinations: string[]) => {
      expect(destinations).to.include("/sub/chat/rooms/1");
      expect(destinations).to.include("/sub/chat/rooms/3");
      expect(destinations, "종료된 방은 구독하지 않는다").to.not.include("/sub/chat/rooms/2");
    });

    cy.get("[data-cy=unread-badge]").first().should("have.text", "1");

    cy.then(() =>
      deliver("/sub/chat/rooms/1", {
        id: 31,
        roomId: 1,
        senderId: 2,
        messageType: "TEXT",
        content: "방금 도착한 메시지",
        imageUrl: null,
        unreadCount: 1,
        createdAt: "2026-06-05 18:00:00",
      }),
    );

    // 새로 고치지 않아도 미리보기와 배지가 따라온다.
    cy.contains("방금 도착한 메시지").should("be.visible");
    cy.get("[data-cy=unread-badge]").first().should("have.text", "2");
  });

  /**
   * 그룹 방을 나가도 서버는 목록에서 지우지 않는다 — 읽기 전용으로 남기는 것이 계약이다
   * (`hasLeft: true`). 그런데 목록이 그 값을 보지 않아 "진행중" 배지를 달고 안읽음까지
   * 세서, 나갔는데도 아직 참여 중인 것처럼 보였다.
   */
  it("shows a room I left as read-only instead of an ongoing one", () => {
    cy.fixture("chat-rooms.json").then((rooms) => {
      cy.intercept("GET", "**/api/**/chat/rooms", {
        success: true,
        // 방 3(그룹)에서 나간 상태. 서버는 방을 그대로 내려준다.
        data: rooms.map((room: { roomId: number }) =>
          room.roomId === 3 ? { ...room, hasLeft: true, unreadCount: 2 } : room,
        ),
      }).as("roomsWithLeft");
    });

    cy.visit("/chat");
    cy.wait("@roomsWithLeft");
    cy.contains("대화방", { timeout: 8000 }).should("be.visible");

    cy.contains("나간 방").should("be.visible");
    /*
     * 안읽음 배지는 방 1(안읽음 1) 것 하나만 남는다. 나간 방 3 은 안읽음 2 를 받았지만
     * 종료된 방과 같은 규칙으로 배지를 떼야 한다. 픽스처의 방 2 는 원래 종료된 방이다.
     */
    cy.get("[data-cy=unread-badge]").should("have.length", 1);

    // 종료 필터에 들어가고 진행중에서는 빠진다.
    cy.contains("button", "진행중").click();
    cy.contains("나간 방").should("not.exist");
    cy.contains("button", "종료").click();
    cy.contains("나간 방").should("be.visible");
  });
});
