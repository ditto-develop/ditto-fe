/**
 * 2026-09-15 QA 3건을 고정한다.
 *
 * - "욕설, 링크 등에 대한 채팅 금지단어 보내지기" — 금칙어가 배너로만 뜨고 그대로 나갔다.
 *   이제 한 번 더 묻는다. 차단이 아니라 확인인 이유는 부분 일치라 오탐이 남아서다.
 * - "계좌번호 같은 주의사항 알림이 없음" — 1:1 방에만 있던 주의 카드가 그룹 방에는 없었다.
 * - "점3개에서 신고하기는 그룹에서는 없어야" — 누르면 토스트만 뜨는 죽은 버튼이었다.
 */

const INPUT = 'textarea[placeholder="텍스트를 입력해 주세요."]';

describe("chat safety", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  describe("금칙어 — 보내기 전에 한 번 더 묻는다", () => {
    beforeEach(() => {
      cy.visit("/chat/one-on-one/1");
      cy.wait("@getChatMessages");
      cy.get(INPUT, { timeout: 8000 }).should("be.visible");
    });

    it("금칙어를 입력하면 배너가 뜨고, 보내기를 눌러도 바로 나가지 않는다", () => {
      cy.get(INPUT).type("야 이 병신아");
      cy.contains("채팅 내 금칙어가 있습니다.").should("be.visible");

      cy.get('img[alt="전송"]').click();

      cy.contains("금칙어가 포함되어 있어요").should("be.visible");
      cy.contains("그래도 이대로 보낼까요?").should("be.visible");
      // 아직 전송되지 않았으므로 입력값이 그대로 남아 있어야 한다.
      cy.get(INPUT).should("have.value", "야 이 병신아");
    });

    it("'고칠래요'를 고르면 입력값을 그대로 두고 돌아간다", () => {
      cy.get(INPUT).type("야 이 병신아");
      cy.get('img[alt="전송"]').click();

      cy.contains("button", "고칠래요").click();

      cy.contains("금칙어가 포함되어 있어요").should("not.exist");
      cy.get(INPUT).should("have.value", "야 이 병신아");
    });

    it("금칙어가 없으면 확인 없이 바로 보낸다", () => {
      cy.get(INPUT).type("내일 저녁 괜찮으세요?");
      cy.contains("채팅 내 금칙어가 있습니다.").should("not.exist");

      cy.get('img[alt="전송"]').click();
      cy.contains("금칙어가 포함되어 있어요").should("not.exist");
    });
  });

  describe("주의 카드 — 그룹 방도 1:1 방과 같게", () => {
    /** 링크와 계좌번호가 섞인 방 하나를 쓴다. 둘 다 같은 메시지에 오는 게 실제 수법이다. */
    function stubRiskyMessages(roomId: number, senderId: number) {
      cy.intercept("GET", "**/api/**/chat/rooms/*/messages*", {
        statusCode: 200,
        body: {
          success: true,
          data: {
            messages: [
              {
                id: 91,
                roomId,
                senderId,
                messageType: "TEXT",
                content: "110-123-456789 로 먼저 입금해 주세요 my-scam-site.com/pay",
                imageUrl: null,
                createdAt: "2026-06-05 18:30:00",
              },
            ],
            nextCursor: null,
          },
        },
      }).as("riskyMessages");
    }

    it("그룹 방에서도 링크·금전 요구 주의 카드를 그린다", () => {
      stubRiskyMessages(3, 3);
      cy.visit("/chat/group/3");
      cy.wait("@riskyMessages");

      cy.contains("출처 불명의 링크는", { timeout: 8000 }).should("be.visible");
      cy.contains("금전 요구는 100% 사기입니다.").should("be.visible");
    });

    it("1:1 방의 기존 동작은 그대로다", () => {
      stubRiskyMessages(1, 2);
      cy.visit("/chat/one-on-one/1");
      cy.wait("@riskyMessages");

      cy.contains("출처 불명의 링크는", { timeout: 8000 }).should("be.visible");
      cy.contains("금전 요구는 100% 사기입니다.").should("be.visible");
    });
  });

  describe("신고 진입점", () => {
    it("그룹 방 3점 메뉴에는 신고하기가 없다 — 대상 한 명을 고를 수 없기 때문", () => {
      cy.visit("/chat/group/3");
      cy.wait("@getChatRooms");
      cy.contains("다들 안녕하세요!", { timeout: 8000 }).should("be.visible");

      cy.get('img[alt="더보기"]').click();
      cy.contains("멤버 목록").should("be.visible");
      cy.contains("신고하기").should("not.exist");
    });

    it("그룹 신고는 멤버 프로필의 더보기로 간다", () => {
      cy.visit("/chat/group/3");
      cy.wait("@getChatRooms");
      cy.contains("다들 안녕하세요!", { timeout: 8000 }).should("be.visible");

      cy.get('img[alt="더보기"]').click();
      cy.contains("멤버 목록").click();
      cy.contains("멤버 전체보기", { timeout: 6000 }).should("be.visible");
      // 닉네임으로 찾으면 오버레이 뒤의 채팅방 헤더("수민, 수민, 수민")가 먼저 잡힌다.
      cy.get('[data-cy="group-member-card"]').first().click();

      // 채팅방 헤더의 더보기가 오버레이 뒤에 그대로 남아 있어 마지막(= 프로필의 것)을 집는다.
      cy.get('img[alt="더보기"]', { timeout: 6000 }).last().click();
      cy.contains("신고하기").click();
      cy.location("pathname", { timeout: 6000 }).should("include", "/report");
    });

    it("1:1 방 3점 메뉴의 신고하기는 그대로 남아 있다 — 상대가 한 명이라 대상이 분명하다", () => {
      cy.visit("/chat/one-on-one/1");
      cy.wait("@getChatMessages");
      cy.contains("수민", { timeout: 8000 }).should("be.visible");

      cy.get('img[alt="더보기"]').click();
      cy.contains("신고하기").click();
      cy.location("pathname", { timeout: 6000 }).should("include", "/report");
    });
  });
});
