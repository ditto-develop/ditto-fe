describe("chat QA regressions", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  for (const path of ["/chat/one-on-one/1", "/chat/group/3"]) {
    it(`renders each timestamp and clickable links in ${path}`, () => {
      cy.intercept("GET", "**/chat/rooms/*/messages*", {
        success: true,
        data: {
          messages: [2, 1].map((id) => ({
            id, roomId: path.endsWith("3") ? 3 : 1, senderId: 2,
            messageType: "TEXT", content: `메시지 ${id}\nhttps://example.com/${id}`,
            imageUrl: null, unreadCount: 1, createdAt: "2026-06-06 10:10:00",
          })),
          nextCursor: null,
        },
      });
      cy.visit(path);
      cy.contains("메시지 1").should("be.visible");
      cy.contains("메시지 2").should("be.visible");
      cy.get('a[href="https://example.com/1"]').should("have.attr", "target", "_blank");
      cy.get('a[href="https://example.com/2"]').should("have.attr", "rel", "noopener noreferrer");
      cy.contains("메시지 1").should("have.css", "white-space", "pre-wrap");
      cy.get("span").filter((_, el) => el.textContent === "10:10").should("have.length", 2);
    });
  }

  it("edits draft vote options and returns to chat after creating a vote", () => {
    cy.intercept("GET", "**/chat/rooms/*/votes", { success: true, data: [] });
    cy.fixture("group-votes.json").then((votes) => {
      cy.intercept("POST", "**/chat/rooms/*/votes", (req) => {
        expect(req.body.placeOptions[0].label).to.eq("수정한 장소");
        expect(req.body.timeOptions[0].meetAt).to.include("18:30");
        req.reply({ success: true, data: votes[0] });
      }).as("createDraftVote");
    });
    cy.visit("/chat/group/3", {
      onBeforeLoad(win) {
        Object.defineProperty(win, "kakao", { configurable: true, value: { maps: {
          load: (callback: () => void) => callback(),
          services: {
            Status: { OK: "OK" },
            Places: class {
              keywordSearch(keyword: string, callback: (items: object[], status: string) => void) {
                callback([{ id: keyword, place_name: keyword, road_address_name: "서울", address_name: "서울", place_url: "https://example.com/place", x: "127", y: "37" }], "OK");
              }
            },
          },
        } } });
      },
    });
    cy.get('img[alt="더보기"]').click();
    cy.contains("투표 만들기").click();
    const choosePlace = (index: number, name: string) => {
      cy.get(`[aria-label="장소 옵션 ${index}"]`).click();
      cy.get('input[placeholder="장소를 입력해 주세요."]').type(name);
      cy.contains("button", name).click();
    };
    choosePlace(1, "첫 장소");
    choosePlace(2, "둘째 장소");
    choosePlace(1, "수정한 장소");
    cy.contains("button", "다음").click();
    cy.get('input[aria-label="시간 옵션 1 날짜"]').type("2026-06-13", { force: true });
    cy.get('input[aria-label="시간 옵션 1 시간"]').type("17:00", { force: true }).clear({ force: true }).type("18:30", { force: true });
    cy.get('input[aria-label="시간 옵션 2 날짜"]').type("2026-06-14", { force: true });
    cy.get('input[aria-label="시간 옵션 2 시간"]').type("18:30", { force: true });
    cy.contains("button", "완료").click();
    cy.wait("@createDraftVote");
    cy.get('[aria-labelledby="group-vote-title"]').should("not.exist");
    cy.get('[aria-labelledby="vote-submission-title"]').should("not.exist");
    cy.contains("투표를 만들었어요.").should("be.visible");
  });
});
