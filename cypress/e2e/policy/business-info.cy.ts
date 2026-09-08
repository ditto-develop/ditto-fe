/**
 * 사업자 정보 노출 고정 테스트.
 *
 * 카카오 비즈앱 심사는 2026-08 에 "사이트 내 사업자 정보가 확인되지 않는다"로 반려했다.
 * 심사자는 **로그인을 통과하지 못한 상태**로 사이트를 보므로, 로그인 전 첫 화면과
 * 사업자 정보 화면 두 곳 모두에서 값이 보여야 한다.
 *
 * 대표자·사업장 소재지·전화번호는 화면에서 뺐다(2026-09-08 사용자 요청) — 더 이상
 * 이 화면들에 노출되지 않으므로 검증 대상에서도 제외한다.
 *
 * 값은 사업자등록증 기재 그대로여야 한다 — 여기서 문자열을 다듬으면 심사에서
 * 대조에 실패한다. 그래서 이 테스트는 화면 존재가 아니라 **문자열 일치**를 본다.
 */
const COMPANY_NAME = "카운트제로";
const REGISTRATION_NUMBER = "291-39-01610";
const CONTACT_EMAIL = "ditto.apply@gmail.com";

describe("사업자 정보", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("비로그인 첫 화면에 상호·사업자등록번호가 보인다", () => {
    cy.visit("/");

    // 비로그인 첫 화면은 3초 스플래시가 덮는다. 걷힌 뒤를 본다.
    cy.contains(COMPANY_NAME, { timeout: 10000 }).should("be.visible");
    cy.contains(REGISTRATION_NUMBER).should("be.visible");
  });

  it("비로그인 첫 화면의 문의처가 보이고 눌린다", () => {
    cy.visit("/");

    cy.contains(CONTACT_EMAIL, { timeout: 10000 })
      .should("be.visible")
      .and("have.attr", "href", `mailto:${CONTACT_EMAIL}`);
  });

  it("첫 화면에서 사업자 정보 화면으로 이동해 전체 항목을 확인한다", () => {
    cy.visit("/");

    cy.contains("사업자 정보", { timeout: 10000 }).click();

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
