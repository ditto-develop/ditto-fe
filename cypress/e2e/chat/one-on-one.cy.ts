describe("1:1 chat room", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("loads history in ascending order with TEXT / IMAGE / SYSTEM messages", () => {
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");

    // 헤더의 상대 닉네임은 방 목록 → 프로필 조회로 채워진다.
    cy.contains("수민", { timeout: 8000 }).should("be.visible");

    cy.contains("대화가 시작되었어요.").should("be.visible");
    cy.contains("반갑습니다! 주말에 시간 괜찮으세요?").should("be.visible");
    cy.contains("안녕하세요, 반가워요!").should("be.visible");

    // IMAGE는 content(objectKey)가 아니라 imageUrl로 렌더한다.
    cy.get('img[alt="보낸 이미지"]').should("have.attr", "src", "/assets/avatar/m3.png");
    cy.contains("chat/1/mock-object-key").should("not.exist");

    // 응답은 id DESC지만 화면은 오래된 → 최신 순이어야 한다.
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text.indexOf("대화가 시작되었어요.")).to.be.lessThan(
        text.indexOf("안녕하세요, 반가워요!"),
      );
    });
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

  it("tells the user when a message cannot be sent because the socket is down", () => {
    // Cypress 환경에는 STOMP 서버가 없어 소켓이 연결되지 않는다.
    // 전송 실패를 조용히 삼키지 않는지 확인한다.
    cy.visit("/chat/one-on-one/1");
    cy.wait("@getChatMessages");

    cy.get('textarea[placeholder="텍스트를 입력해 주세요."]').type("저도 반가워요!{enter}");
    cy.contains("연결이 끊겨 메시지를 보내지 못했어요.").should("be.visible");
  });
});
