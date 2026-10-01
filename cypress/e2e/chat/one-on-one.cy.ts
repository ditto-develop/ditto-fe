describe("1:1 chat room", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("loads history in ascending order with TEXT / IMAGE messages", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");

    // 헤더의 상대 닉네임은 방 목록 → 프로필 조회로 채워진다.
    cy.contains("수민", { timeout: 8000 }).should("be.visible");

    cy.contains("반갑습니다! 주말에 시간 괜찮으세요?").should("be.visible");
    cy.contains("안녕하세요, 반가워요!").should("be.visible");

    // IMAGE는 content(objectKey)가 아니라 imageUrl로 렌더한다.
    cy.get('img[alt="보낸 이미지"]').should("have.attr", "src", "/assets/avatar/m3.png");
    cy.contains("chat/1/mock-object-key").should("not.exist");

    // 응답은 id DESC지만 화면은 오래된 → 최신 순이어야 한다.
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text.indexOf("반갑습니다! 주말에 시간 괜찮으세요?")).to.be.lessThan(
        text.indexOf("안녕하세요, 반가워요!"),
      );
    });
  });

  it("renders the SYSTEM event code as a reader-specific notice", () => {
    // content는 문장이 아니라 사건 코드(USER_LEFT)다. 문구는 senderId를 보고 FE가 만든다.
    cy.intercept("GET", "**/api/**/chat/rooms/*/messages*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          messages: [
            {
              id: 31,
              roomId: 1,
              senderId: 2,
              messageType: "SYSTEM",
              content: "USER_LEFT",
              imageUrl: null,
              createdAt: "2026-06-06 11:00:00",
            },
          ],
          nextCursor: null,
        },
      },
    }).as("endedMessages");

    cy.visit("/chat/one-on-one/1");
    cy.wait("@endedMessages");

    cy.contains("상대방이 채팅을 종료했습니다.", { timeout: 8000 }).should("be.visible");
    cy.contains("대화가 종료되어 메시지를 보낼 수 없어요.").should("be.visible");
    cy.get('textarea[placeholder="텍스트를 입력해 주세요."]').should("not.exist");
    cy.contains("button", "평가하기").should("be.visible");
    cy.contains("USER_LEFT").should("not.exist");
  });

  it("replaces the input with the ended banner and rating action", () => {
    cy.visit("/chat/one-on-one/2");
    cy.wait("@getChatMessages");

    cy.contains("남은 시간 0분", { timeout: 8000 }).should("be.visible");
    cy.contains("대화 기간이 끝나 메시지를 보낼 수 없어요.").should("be.visible");
    cy.get('textarea[placeholder="텍스트를 입력해 주세요."]').should("not.exist");
    // 평가 목록(member-reviews.json)에 방 2의 1:1 평가가 없다 — 완료한 평가로 본다.
    cy.wait("@getMemberReviews");
    cy.contains("button", "완료된 평가입니다").should("be.visible").and("be.disabled");
    cy.contains("button", "평가하기").should("not.exist");
  });

  /** 방 목록 항목에 새 필드(status·reviewStatus·isMuted)를 덮어 쓴다(BE 위키 Frontend-QA-Fixes-Guide). */
  function mockRoomsWith(roomId: number, patch: Record<string, unknown>, alias: string) {
    cy.fixture("chat-rooms.json").then((rooms: Record<string, unknown>[]) => {
      cy.intercept("GET", "**/api/**/chat/rooms", {
        statusCode: 200,
        body: {
          success: true,
          data: rooms.map((room) => (room.roomId === roomId ? { ...room, ...patch } : room)),
        },
      }).as(alias);
    });
  }

  it("splits the rating action by the room's reviewStatus", () => {
    mockRoomsWith(2, { status: "ENDED", reviewStatus: "IN_PROGRESS", reviewId: 31 }, "roomsInProgress");
    cy.visit("/chat/one-on-one/2");
    cy.wait("@roomsInProgress");
    cy.contains("button", "이어서 평가하기", { timeout: 8000 }).should("be.enabled");
  });

  it("locks the rating action once the review is completed", () => {
    mockRoomsWith(2, { status: "ENDED", reviewStatus: "COMPLETED", reviewId: null }, "roomsCompleted");
    cy.visit("/chat/one-on-one/2");
    cy.wait("@roomsCompleted");
    cy.contains("button", "평가 완료", { timeout: 8000 }).should("be.disabled");
  });

  it("shows the review as opening soon while the server is still creating it", () => {
    mockRoomsWith(2, { status: "ENDED", reviewStatus: "NOT_OPENED", reviewId: null }, "roomsNotOpened");
    cy.visit("/chat/one-on-one/2");
    cy.wait("@roomsNotOpened");
    cy.contains("button", "평가가 곧 열려요", { timeout: 8000 }).should("be.disabled");
  });

  it("trusts the server status over the device clock for a room before opening", () => {
    // 기기 시계로는 만료가 지난 값이지만 서버는 개방 전(SCHEDULED)이라고 한다 — 종료로 그리면 안 된다.
    mockRoomsWith(1, { status: "SCHEDULED", expiresAt: "2026-06-01 00:00:00" }, "roomsScheduled");
    cy.visit("/chat/one-on-one/1");
    cy.wait("@roomsScheduled");
    cy.contains("대화 기간이 끝나 메시지를 보낼 수 없어요.").should("not.exist");
    cy.contains("button", "평가하기").should("not.exist");
  });

  it("turns the room's notifications off from the menu", () => {
    mockRoomsWith(1, { status: "ACTIVE", isMuted: false }, "roomsUnmuted");
    cy.intercept("PUT", "**/api/v1/chat/rooms/1/mute", { statusCode: 200, body: { success: true, data: null } }).as(
      "muteRoom",
    );

    cy.visit("/chat/one-on-one/1");
    cy.wait("@roomsUnmuted");
    cy.get('[data-cy="chat-menu-button"]', { timeout: 8000 }).click();
    cy.contains("대화방 알림 끄기").click();

    cy.wait("@muteRoom");
    cy.contains("이 대화방 알림을 껐어요.").should("be.visible");
  });

  it("dismisses the urgent notice for the room during the session", () => {
    cy.fixture("chat-rooms.json").then((rooms) => {
      const urgentRooms = (rooms as { roomId: number; expiresAt: string | null }[]).map((room) =>
        room.roomId === 1 ? { ...room, expiresAt: "2026-06-06 12:30:00" } : room,
      );
      cy.intercept("GET", "**/api/**/chat/rooms", {
        statusCode: 200,
        body: { success: true, data: urgentRooms },
      }).as("urgentChatRooms");
    });

    cy.visit("/chat/one-on-one/1");
    cy.wait("@urgentChatRooms");

    cy.contains(
      "대화가 1시간 후 종료돼요. 아직 하고 싶은 말이 있다면 지금 전해보세요!",
    ).should("be.visible");
    cy.contains("button", "확인").click();
    cy.contains("대화가 1시간 후 종료돼요.").should("not.exist");

    cy.reload();
    cy.contains("대화가 1시간 후 종료돼요.").should("not.exist");
  });

  it("ends the chat through the live end endpoint", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");

    cy.contains("수민", { timeout: 8000 }).should("be.visible");
    cy.get('[data-cy="chat-menu-button"]').click();
    cy.contains("대화방 나가기").click();
    cy.contains("나가기").click();

    cy.wait("@endChatRoom");
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/chat\/?$/);
  });

  it("marks the room read with the newest message id", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");

    cy.wait("@markChatAsRead").its("request.body").should("deep.equal", { lastReadMessageId: 30 });
  });

  it("does not mark an off-screen incoming message read while viewing older messages", () => {
    const readIds: number[] = [];
    let subscribed = false;
    let deliver: (payload: object) => void = () => {
      throw new Error("socket not subscribed");
    };

    cy.intercept("GET", "**/api/**/chat/rooms/1/messages*", {
      success: true,
      data: {
        messages: Array.from({ length: 30 }, (_, index) => {
          const id = 30 - index;
          return {
            id,
            roomId: 1,
            senderId: 2,
            messageType: "TEXT",
            content: `메시지 ${id}\n두 번째 줄\n세 번째 줄`,
            imageUrl: null,
            unreadCount: 1,
            createdAt: "2026-06-06 10:10:00",
          };
        }),
        nextCursor: null,
      },
    }).as("visibleBoundaryMessages");
    cy.intercept("POST", "**/api/**/chat/rooms/1/read", (req) => {
      readIds.push(req.body.lastReadMessageId as number);
      req.reply({ success: true, data: null });
    }).as("visibleBoundaryRead");

    cy.visit("/chat/one-on-one/1", {
      onBeforeLoad(win) {
        const OriginalWebSocket = win.WebSocket;
        class ChatSocket {
          readyState = 1;
          binaryType = "arraybuffer";
          onopen: (() => void) | null = null;
          onmessage: ((event: { data: string }) => void) | null = null;
          onclose: (() => void) | null = null;
          constructor() {
            setTimeout(() => this.onopen?.(), 0);
          }
          send(frame: string) {
            if (frame.startsWith("CONNECT")) {
              setTimeout(
                () =>
                  this.onmessage?.({
                    data: "CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0",
                  }),
                0,
              );
            }
            if (frame.startsWith("SUBSCRIBE")) {
              const subscription = frame.match(/\nid:([^\n]+)/)?.[1];
              deliver = (payload) =>
                this.onmessage?.({
                  data: `MESSAGE\nsubscription:${subscription}\nmessage-id:visible-boundary\ndestination:/sub/chat/rooms/1\n\n${JSON.stringify(payload)}\0`,
                });
              subscribed = true;
            }
          }
          close() {
            this.readyState = 3;
          }
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

    cy.wait("@visibleBoundaryMessages");
    cy.wrap(readIds).should((ids) => expect(ids).to.include(30));
    cy.wrap(null).should(() => expect(subscribed).to.equal(true));

    cy.get('[data-cy="message-list"]').trigger("touchstart").scrollTo("top");
    cy.get('[data-chat-message-id="1"]').should("be.visible");

    cy.then(() =>
      deliver({
        id: 31,
        roomId: 1,
        senderId: 2,
        messageType: "TEXT",
        content: "화면 밖 새 메시지",
        imageUrl: null,
        unreadCount: 1,
        createdAt: "2026-06-06 10:11:00",
      }),
    );

    cy.get('[data-chat-message-id="31"]').should("exist").and("not.be.visible");
    cy.wait(200);
    cy.then(() => expect(readIds, "서버에 보낸 읽음 경계").not.to.include(31));
  });

  it("loads older messages when scrolled to the top (cursor paging)", () => {
    // 첫 페이지는 목록이 실제로 스크롤되도록 넉넉히 채운다.
    const firstPage = Array.from({ length: 30 }, (_, index) => ({
      id: 30 - index,
      roomId: 1,
      senderId: 2,
      messageType: "TEXT" as const,
      content: index === 0 ? "최신 메시지" : `본문 ${30 - index}`,
      imageUrl: null,
      createdAt: "2026-06-03 17:00:00",
    }));

    cy.intercept("GET", "**/api/**/chat/rooms/*/messages*", (req) => {
      const cursor = new URL(req.url).searchParams.get("cursor");
      if (!cursor) {
        req.reply({ success: true, data: { messages: firstPage, nextCursor: 1 } });
        return;
      }
      req.reply({
        success: true,
        data: {
          messages: [
            {
              id: 10,
              roomId: 1,
              senderId: 2,
              messageType: "TEXT",
              content: "아주 오래된 메시지",
              imageUrl: null,
              createdAt: "2026-06-01 09:00:00",
            },
          ],
          nextCursor: null,
        },
      });
    }).as("pagedMessages");

    cy.visit("/chat/one-on-one/1");
    cy.wait("@pagedMessages");
    cy.contains("최신 메시지").should("be.visible");
    cy.contains("아주 오래된 메시지").should("not.exist");

    // 리스트 최상단으로 스크롤하면 직전 응답의 nextCursor로 과거를 더 불러온다.
    // 손가락이 닿았다는 신호를 먼저 준다 — 진입 직후의 프로그램 스크롤과 사용자의 스크롤을
    // 가르기 위해 목록이 입력 이벤트를 기다린다(MessageList 의 userHasScrolled).
    cy.get('[data-cy="message-list"]').trigger("touchstart").scrollTo("top");

    // 과거를 붙인 뒤에는 스크롤 위치를 유지하므로 화면 밖(위)에 있다. 존재만 확인한다.
    cy.contains("아주 오래된 메시지", { timeout: 8000 }).should("exist");
    // 붙은 높이만큼 내려가 있어야 한다. 0 이면 방 맨 위로 튄 것이다(anchoring 미지원 브라우저).
    cy.get('[data-cy="message-list"]').should((list) => {
      expect(list[0].scrollTop, "과거를 붙인 뒤 스크롤 위치").to.be.greaterThan(20);
    });

    // dev StrictMode가 최초 조회를 두 번 호출하므로 순서 대신 전체 호출을 확인한다.
    cy.get("@pagedMessages.all").then((calls) => {
      const urls = (calls as unknown as { request: { url: string } }[]).map(
        (call) => call.request.url,
      );
      expect(urls.some((url) => url.includes("cursor=1"))).to.equal(true);
    });
  });

  it("uploads an image through presigned URL before publishing it", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake-image-bytes"),
        fileName: "photo.png",
        mimeType: "image/png",
      },
      { force: true },
    );

    cy.wait("@chatImageUploadUrls").its("request.body.files.0.contentType").should("eq", "image/png");
    cy.wait("@chatImagePut");
    cy.window().its("scrollY").should("eq", 0);
  });

  it("keeps a failed message in the room and retries it", () => {
    // Cypress 환경에는 STOMP 서버가 없어 소켓이 연결되지 않는다.
    // 일반 실패는 토스트 대신 실패 버블과 재전송 액션으로 남는다.
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");

    cy.get('textarea[placeholder="텍스트를 입력해 주세요."]').type("저도 반가워요!{enter}다음 줄").should("have.value", "저도 반가워요!\n다음 줄");
    cy.get('[aria-label="전송 실패"]').should("not.exist");
    cy.get('img[alt="전송"]').click();
    cy.contains("저도 반가워요!").should("be.visible");
    cy.get('[aria-label="전송 실패"]').should("be.visible");
    cy.contains("button", "재전송").should("be.visible").click();
    cy.contains("button", "재전송").should("be.visible");
    cy.contains("메시지를 보내지 못했어요. 잠시 후 다시 시도해주세요.").should("not.exist");
  });
});
