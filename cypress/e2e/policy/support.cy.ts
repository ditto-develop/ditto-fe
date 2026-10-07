/**
 * 고객 지원 화면(`/support`) — App Store Connect 지원 URL 이 가리키는 곳.
 *
 * 리뷰어가 링크로 바로 들어와 문의처를 확인할 수 있어야 한다(가이드라인 1.5).
 * 사업자 정보 화면은 2026-10-07 에 지웠다. 사업자등록번호가 화면에 되살아나지 않는지도
 * 여기서 막는다 — 번호 값 자체는 테스트에도 남기지 않으므로 라벨로 검사한다.
 */
const CONTACT_EMAIL = "ditto.apply@gmail.com";

describe("고객 지원", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("문의 이메일이 메일 링크로 보이고, 뒤로가기는 첫 화면으로 간다", () => {
    cy.visit("/support");

    cy.contains("고객 지원", { timeout: 8000 }).should("be.visible");
    cy.contains("a", CONTACT_EMAIL)
      .should("be.visible")
      .and("have.attr", "href", `mailto:${CONTACT_EMAIL}`);

    // 비로그인이면 보호 경로인 /settings 가 아니라 첫 화면으로 돌아가야 한다.
    cy.get('img[alt="back"]').click();
    cy.location("pathname", { timeout: 8000 }).should("eq", "/");
  });

  it("첫 화면과 고객 지원 화면에 사업자 정보가 없다", () => {
    cy.visit("/");
    cy.contains("카카오로 계속하기", { timeout: 10000 }).should("be.visible");
    cy.contains("사업자").should("not.exist");

    cy.visit("/support");
    cy.contains("고객 지원", { timeout: 8000 }).should("be.visible");
    cy.contains("사업자").should("not.exist");
  });
});
