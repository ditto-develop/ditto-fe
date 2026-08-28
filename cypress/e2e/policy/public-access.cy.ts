/**
 * 약관·개인정보처리방침·위치기반 약관은 **비로그인으로 열려야 한다.**
 *
 * 카카오 비즈앱 검수와 앱스토어 심사에 이 URL 을 그대로 제출한다. 보호 경로로
 * 되돌아가면 심사자가 링크를 눌렀을 때 로그인 화면으로 튕겨 내용을 볼 수 없고,
 * 그건 제출 반려 사유가 된다. 화면이 아니라 **접근 가능성**을 고정하는 테스트다.
 */
const POLICY_ROUTES = [
  { path: "/settings/privacy", heading: "개인정보처리방침" },
  { path: "/settings/terms", heading: "이용약관" },
  { path: "/settings/location-terms", heading: "위치기반서비스 이용약관" },
] as const;

// 자리표시자([이름]·[월] 등) 잔존 검사는 값을 받은 뒤 여기에 추가한다.
// 지금 넣으면 실패가 확정이라 배포 게이트를 막는다.
describe("약관 화면 비로그인 접근", () => {
  POLICY_ROUTES.forEach(({ path, heading }) => {
    it(`${path} 는 로그인 없이 열린다`, () => {
      cy.clearLocalStorage();
      cy.visit(path);

      // 보호 경로였다면 여기서 "/" 로 튕긴다.
      cy.location("pathname", { timeout: 8000 }).should("include", path);
      cy.contains(heading, { timeout: 8000 }).should("be.visible");
    });
  });
});
