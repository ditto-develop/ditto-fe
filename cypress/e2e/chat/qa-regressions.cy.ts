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

  /**
   * 방에 들어가면 서버의 안읽은 수는 0 이 되는데, 목록은 마운트할 때 한 번만 읽어서
   * 뒤로 나와도 들어가기 전 배지가 남아 있었다. 화면이 다시 보이는 시점에 다시 읽는다.
   */
  it("refreshes the unread badge when the chat list becomes visible again", () => {
    // 호출 횟수로 응답을 가르지 않는다 — 개발 모드의 이중 마운트 때문에 최초 진입에서도
    // 두 번 불린다. "방을 읽고 왔는가"를 플래그로 두고 그때부터 0 을 준다.
    const state = { allRead: false };
    cy.fixture("chat-rooms.json").then((rooms) => {
      cy.intercept("GET", "**/api/**/chat/rooms", (req) => {
        const data = state.allRead ? rooms.map((room) => ({ ...room, unreadCount: 0 })) : rooms;
        req.reply({ success: true, data });
      }).as("chatRooms");
    });

    cy.visit("/chat");
    cy.contains("수민", { timeout: 8000 }).should("be.visible");
    // 숫자만으로 찾으면 날짜 같은 다른 문구에도 걸린다 — 배지만 본다.
    cy.get("[data-cy=unread-badge]").should("have.length.at.least", 1);

    // 방에 들어갔다 나온 상태를 만든다. 서버는 이제 안읽음 0 을 준다.
    cy.then(() => {
      state.allRead = true;
    });

    // 화면 복귀 신호. 이 이벤트로 다시 읽지 않으면 들어가기 전 배지가 그대로 남는다.
    cy.window().then((win) => win.dispatchEvent(new win.Event("focus")));

    cy.contains("수민").should("be.visible");
    cy.get("[data-cy=unread-badge]").should("not.exist");
  });

  /**
   * 과거 페이지를 부르는 조건이 `scrollTop <= 60` 뿐이라, **바닥으로 맞추는 프로그램 스크롤도**
   * 그 조건을 만족시켰다. 방이 짧아 바닥에서의 scrollTop 이 이미 60 이하면 들어가자마자 과거를
   * 붙이고, 뒤이어 위치 보정이 돌면서 바닥 대신 이전 페이지의 첫 메시지로 화면이 튀었다.
   * 손가락·휠이 닿기 전에는 과거를 부르지 않아야 한다.
   */
  it("pulls older pages only after the user touches the list", () => {
    const older = { calls: 0 };
    cy.intercept("GET", "**/chat/rooms/*/messages*", (req) => {
      if (new URL(req.url).searchParams.get("cursor")) {
        older.calls += 1;
        req.reply({ success: true, data: { messages: [], nextCursor: null } });
        return;
      }
      req.reply({
        success: true,
        data: {
          // 스크롤이 생길 만큼 채운다. 응답은 최신 먼저다.
          messages: Array.from({ length: 30 }, (_, index) => {
            const id = 30 - index;
            return {
              id, roomId: 1, senderId: id === 30 ? 2 : 1, messageType: "TEXT",
              content: `메시지 ${id}`, imageUrl: null, unreadCount: 0,
              createdAt: "2026-06-06 10:10:00",
            };
          }),
          nextCursor: 10,
        },
      });
    });

    cy.visit("/chat/one-on-one/1");
    cy.contains("메시지 30", { timeout: 8000 }).should("be.visible");

    // 사용자가 만지지 않은 스크롤 — 진입 시의 프로그램 스크롤과 같은 상황이다.
    cy.get("[data-cy=message-list]").then((list) => {
      const el = list[0];
      el.scrollTop = 0;
      el.dispatchEvent(new Event("scroll"));
    });
    cy.wait(300);
    cy.then(() => {
      expect(older.calls, "만지기 전 과거 요청").to.eq(0);
    });

    // 손가락이 닿은 뒤에는 열린다 — 위로 올려 과거를 읽는 경로는 살아 있어야 한다.
    cy.get("[data-cy=message-list]").then((list) => {
      const el = list[0];
      el.dispatchEvent(new Event("touchstart", { bubbles: true }));
      el.scrollTop = 0;
      el.dispatchEvent(new Event("scroll"));
    });
    // 요청이 나가길 기다린다 — 바로 재면 아직 안 나간 상태를 잡는다.
    cy.wrap(older).should((counter: { calls: number }) => {
      expect(counter.calls, "만진 뒤 과거 요청").to.eq(1);
    });
  });

  /**
   * 목록의 사진은 loading="lazy" 이고 크기를 예약하지 않아, 첫 스크롤이 끝난 뒤 로드되며
   * 높이를 최대 320px 늘린다. scrollTop 은 그대로라 방금 맞춰 둔 바닥이 위로 밀린다.
   *
   * ⚠️ 이 테스트는 **회귀를 가려내지 못한다** — Chrome 의 스크롤 앵커링이 같은 상황을
   * 자동으로 보정해서 `useStayAtBottom` 의 보정을 지워도 통과한다. 증상이 보고된 iOS
   * 웹뷰에는 그 보정이 없다. 여기서는 "들어가면 바닥에서 시작한다"는 계약만 지킨다.
   */
  it("stays at the bottom after a late-loading image grows the list", () => {
    cy.intercept("GET", "**/chat/rooms/*/messages*", {
      success: true,
      data: {
        messages: [
          ...Array.from({ length: 20 }, (_, index) => ({
            id: index + 1, roomId: 1, senderId: 2, messageType: "TEXT",
            content: `이전 메시지 ${index + 1}`, imageUrl: null,
            unreadCount: 0, createdAt: "2026-06-06 10:10:00",
          })),
          {
            id: 21, roomId: 1, senderId: 2, messageType: "IMAGE", content: "chat/late.png",
            imageUrl: "https://example.com/late.png",
            unreadCount: 0, createdAt: "2026-06-06 10:11:00",
          },
          {
            id: 22, roomId: 1, senderId: 2, messageType: "TEXT", content: "마지막 메시지",
            imageUrl: null, unreadCount: 0, createdAt: "2026-06-06 10:12:00",
          },
        ],
        nextCursor: null,
      },
    });

    // 첫 스크롤이 끝난 뒤에 도착하도록 사진을 늦춘다.
    cy.intercept("GET", "https://example.com/late.png", (req) => {
      req.on("response", (res) => res.setDelay(800));
      req.reply({ fixture: "images/tall.png" });
    }).as("lateImage");

    cy.visit("/chat/one-on-one/1");
    cy.contains("마지막 메시지", { timeout: 8000 }).should("be.visible");
    cy.wait("@lateImage");

    cy.get("[data-cy=message-list]").should((list) => {
      const el = list[0];
      // 바닥 판정 여유는 useStayAtBottom 의 BOTTOM_THRESHOLD_PX 와 같다.
      expect(el.scrollHeight - el.scrollTop - el.clientHeight).to.be.at.most(48);
    });
  });

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
