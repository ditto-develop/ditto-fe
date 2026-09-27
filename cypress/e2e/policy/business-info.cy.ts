/**
 * 사업자 정보 노출 플래그 고정 테스트.
 *
 * 현재는 첫 화면과 설정 목록에서 숨기되, 나중에 다시 켤 수 있도록 직접 접근 가능한
 * 페이지와 데이터는 유지한다.
 */
const COMPANY_NAME = "카운트제로";
const REGISTRATION_NUMBER = "291-39-01610";
const CONTACT_EMAIL = "ditto.apply@gmail.com";

describe("사업자 정보", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("비로그인 첫 화면에서 사업자 정보 영역을 숨긴다", () => {
    cy.visit("/");

    cy.contains("카카오로 계속하기", { timeout: 10000 }).should("be.visible");
    cy.contains(COMPANY_NAME).should("not.exist");
    cy.contains(REGISTRATION_NUMBER).should("not.exist");
    cy.contains(CONTACT_EMAIL).should("not.exist");
    cy.contains("사업자 정보").should("not.exist");
  });

  it("직접 접근용 사업자 정보 페이지와 데이터는 유지한다", () => {
    cy.visit("/settings/business");

    cy.location("pathname", { timeout: 8000 }).should("include", "/settings/business");
    cy.contains(COMPANY_NAME).should("be.visible");
    cy.contains(REGISTRATION_NUMBER).should("be.visible");
    cy.contains(CONTACT_EMAIL).should("be.visible");
  });

  it("첫 화면의 약관·개인정보처리방침 링크가 실제로 열린다", () => {
    cy.visit("/");

    cy.contains("이용약관", { timeout: 10000 }).click();
    cy.location("pathname", { timeout: 8000 }).should("include", "/settings/terms");

    cy.visit("/");
    cy.contains("개인정보처리방침", { timeout: 10000 }).click();
    cy.location("pathname", { timeout: 8000 }).should("include", "/settings/privacy");
  });
});
