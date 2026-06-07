describe("매칭 결과 탭 분리 - 요청하기 / 수락하기", () => {
  beforeEach(() => {
    cy.clockPeriod("MATCHING");
    cy.mockApi();
    cy.login();
  });

  describe("탭 UI 렌더", () => {
    it("요청하기·수락하기 탭이 모두 표시된다", () => {
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("요청하기").should("be.visible");
      cy.contains("수락하기").should("be.visible");
    });

    it("기본으로 요청하기 탭이 활성화되어 있다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("수민").should("be.visible");
    });
  });

  describe("요청하기 탭", () => {
    it("받은 요청이 없는 후보가 요청하기 탭에 표시된다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("수민").should("be.visible");
      cy.contains("🌟 당신과 가장 비슷해요").should("be.visible");
    });

    it("모든 후보가 나에게 요청을 보낸 경우 요청하기 탭이 비어있다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-all-received.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("요청할 수 있는 후보가 없어요").should("be.visible");
    });

    it("요청하기 탭 빈 상태에서 send 아이콘 영역이 표시된다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-all-received.json" });
      cy.visit("/matching");

      cy.contains("요청할 수 있는 후보가 없어요", { timeout: 6000 }).should("be.visible");
      cy.contains("이번 주 매칭된 후보가 모두 나에게 먼저 연락했어요").should("be.visible");
    });
  });

  describe("수락하기 탭", () => {
    it("나에게 요청을 보낸 후보가 수락하기 탭에 표시된다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-received.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");

      cy.contains("수락하기").click();
      cy.contains("수민").should("be.visible");
    });

    it("수락하기 탭에서 요청하기 탭의 후보는 표시되지 않는다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-all-received.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("수락하기").click();

      cy.contains("수민").should("be.visible");
      cy.contains("지우").should("be.visible");
    });

    it("받은 요청이 없는 경우 수락하기 탭이 비어있다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
      cy.contains("수락하기").click();

      cy.contains("아직 받은 요청이 없어요").should("be.visible");
    });

    it("수락하기 탭 빈 상태 설명 텍스트가 표시된다", () => {
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.visit("/matching");

      cy.contains("수락하기", { timeout: 6000 }).click();
      cy.contains("나와 닮은 누군가가 용기를 내고 있을지도 몰라요").should("be.visible");
    });
  });

  describe("탭 전환", () => {
    it("탭 전환 시 해당 탭의 후보 목록으로 즉시 교체된다", () => {
      // 수민이 received → 요청하기 탭은 비어있고, 수락하기 탭에 수민이 표시
      cy.mockApi({ matchesFixture: "matches-1on1-received.json" });
      cy.visit("/matching");

      cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");

      // 기본 요청하기 탭: 수민은 received이므로 요청할 수 없음 → 빈 상태
      cy.contains("요청할 수 있는 후보가 없어요").should("be.visible");

      // 수락하기 탭으로 전환: 수민이 표시됨
      cy.contains("수락하기").click();
      cy.contains("수민").should("be.visible");
      cy.contains("요청할 수 있는 후보가 없어요").should("not.exist");

      // 다시 요청하기 탭으로 전환: 빈 상태로 돌아옴
      cy.contains("요청하기").click();
      cy.contains("요청할 수 있는 후보가 없어요").should("be.visible");
      cy.contains("수민").should("not.exist");
    });
  });
});
