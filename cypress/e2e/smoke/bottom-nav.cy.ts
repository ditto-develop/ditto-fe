/**
 * 하단 탭 활성 표시.
 *
 * `trailingSlash: true`라 화면을 직접 열면 usePathname()이 "/home/"을 준다.
 * 예전에는 `pathname === "/home"` 문자열 비교라 이 경우 어느 탭도 활성화되지 않았다.
 */
const TABS = [
  { path: "/home", label: "홈" },
  { path: "/chat", label: "대화방" },
  { path: "/profile", label: "프로필" },
];

describe("bottom navigation", () => {
  beforeEach(() => {
    cy.mockApi();
    cy.login();
  });

  TABS.forEach(({ path, label }) => {
    it(`${path} 에서 '${label}' 탭이 활성 상태가 된다`, () => {
      cy.visit(path);

      cy.get('nav a[aria-current="page"]', { timeout: 8000 })
        .should("have.length", 1)
        .and("contain.text", label);

      TABS.filter((tab) => tab.label !== label).forEach((tab) => {
        cy.contains("nav a", tab.label).should("not.have.attr", "aria-current");
      });
    });
  });
});
