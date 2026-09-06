/**
 * 약관 3종과 사업자 정보는 **비로그인으로 열려야 한다.**
 *
 * 카카오 비즈앱 검수와 앱스토어 심사에 이 URL 을 그대로 제출한다. 보호 경로로
 * 되돌아가면 심사자가 링크를 눌렀을 때 로그인 화면으로 튕겨 내용을 볼 수 없고,
 * 그건 제출 반려 사유가 된다. 화면이 아니라 **접근 가능성**을 고정하는 테스트다.
 */
const POLICY_ROUTES = [
  { path: "/settings/privacy", heading: "개인정보처리방침" },
  { path: "/settings/terms", heading: "이용약관" },
  { path: "/settings/location-terms", heading: "위치기반서비스 이용약관" },
  { path: "/settings/business", heading: "사업자 정보" },
] as const;

/**
 * 템플릿 자리표시자가 남아 있으면 심사에서 그대로 보인다.
 * 값을 모두 받았으므로(2026-08-30) 여기서 잔존을 막는다.
 *
 * 처음에는 `[이름]`·`[월]` 처럼 **정확히 일치하는 목록**으로 검사했는데
 * `[이메일 서비스 제공업체]` 를 놓쳤다. 대괄호 표기 자체를 금지한다.
 */
const PLACEHOLDER_PATTERN = /\[[^\]]+\]/;
const PLACEHOLDER_WORDS = ["회사명", "서비스명"];
describe("약관·사업자 정보 화면 비로그인 접근", () => {
  POLICY_ROUTES.forEach(({ path, heading }) => {
    it(`${path} 는 로그인 없이 열린다`, () => {
      cy.clearLocalStorage();
      cy.visit(path);

      // 보호 경로였다면 여기서 "/" 로 튕긴다.
      cy.location("pathname", { timeout: 8000 }).should("include", path);
      cy.contains(heading, { timeout: 8000 }).should("be.visible");
    });

    it(`${path} 에 템플릿 자리표시자가 남아 있지 않다`, () => {
      cy.clearLocalStorage();
      cy.visit(path);

      cy.contains(heading, { timeout: 8000 }).should("be.visible");
      cy.get("main").invoke("text").then((text) => {
        const bracketed = PLACEHOLDER_PATTERN.exec(text);
        expect(bracketed?.[0], `${path} 에 남은 대괄호 자리표시자`).to.equal(undefined);
        PLACEHOLDER_WORDS.forEach((word) => {
          expect(text, `${path} 본문`).not.to.include(word);
        });
      });
    });
  });
});
