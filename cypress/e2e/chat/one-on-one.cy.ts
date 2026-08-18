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
    cy.contains("button", "평가하기").should("be.visible");
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
    cy.get('[data-cy="message-list"]').scrollTo("top");

    // 과거를 붙인 뒤에는 스크롤 위치를 유지하므로 화면 밖(위)에 있다. 존재만 확인한다.
    cy.contains("아주 오래된 메시지", { timeout: 8000 }).should("exist");

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
  });

  it("keeps a failed message in the room and retries it", () => {
    // Cypress 환경에는 STOMP 서버가 없어 소켓이 연결되지 않는다.
    // 일반 실패는 토스트 대신 실패 버블과 재전송 액션으로 남는다.
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");

    cy.get('textarea[placeholder="텍스트를 입력해 주세요."]').type("저도 반가워요!{enter}");
    cy.contains("저도 반가워요!").should("be.visible");
    cy.get('[aria-label="전송 실패"]').should("be.visible");
    cy.contains("button", "재전송").should("be.visible").click();
    cy.contains("button", "재전송").should("be.visible");
    cy.contains("메시지를 보내지 못했어요. 잠시 후 다시 시도해주세요.").should("not.exist");
  });
});
