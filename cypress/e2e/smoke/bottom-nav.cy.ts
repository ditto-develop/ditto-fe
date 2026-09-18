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

  /**
   * '대화방' 탭 안읽음 배지. chat-rooms.json 은 진행 중인 방 두 개(1건 + 2건)와
   * 종료된 방 하나(0건)를 담고 있다 — 종료 방은 종료 안내(SYSTEM)가 안읽음에 섞이므로
   * 목록 줄 배지와 같은 기준으로 빼고 센다.
   */
  it("대화방 탭에 안읽은 메시지 총합이 뜬다", () => {
    cy.clockPeriod("CHATTING");
    cy.visit("/home");

    cy.contains("nav a", "대화방").within(() => {
      cy.contains("3", { timeout: 8000 }).should("be.visible");
    });
    // 다른 탭에는 배지가 붙지 않는다.
    cy.contains("nav a", "홈").find('[aria-label*="안 읽은 메시지"]').should("not.exist");
  });

  it("안읽은 메시지가 없으면 배지를 달지 않는다", () => {
    cy.clockPeriod("CHATTING");
    cy.fixture("chat-rooms.json").then((rooms) => {
      cy.intercept("GET", "**/api/v1/chat/rooms", {
        success: true,
        data: rooms.map((room: { unreadCount: number }) => ({ ...room, unreadCount: 0 })),
      }).as("getChatRoomsAllRead");
    });

    cy.visit("/home");

    cy.contains("nav a", "대화방", { timeout: 8000 }).should("be.visible");
    cy.get('nav [aria-label*="안 읽은 메시지"]').should("not.exist");
  });
});
