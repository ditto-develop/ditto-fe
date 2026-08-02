type NotificationSeed = {
  id: string;
  type: string;
  title: string;
  body: string;
  minutesAgo: number;
  read: boolean;
  linkTo: string | null;
};

const NOTIFICATIONS: NotificationSeed[] = [
  {
    id: "noti-1",
    type: "MATCH_RESULT",
    title: "이번 주 매칭 결과가 나왔어요",
    body: "나와 답변이 비슷한 사람들을 찾았어요. 지금 확인해 보세요.",
    minutesAgo: 0,
    read: false,
    linkTo: "/matching",
  },
  {
    id: "noti-2",
    type: "NEW_MESSAGE",
    title: "산책러버님의 새 메시지",
    body: "주말에 시간 괜찮으세요?",
    minutesAgo: 15,
    read: false,
    linkTo: "/chat/one-on-one/room-1",
  },
  {
    id: "noti-3",
    type: "GROUP_FORMED",
    title: "그룹이 구성됐어요",
    body: "같은 취미, 취향 그룹에 5명이 모였어요.",
    minutesAgo: 60,
    read: false,
    linkTo: null,
  },
  {
    id: "noti-4",
    type: "RATING_REQUEST",
    title: "이번 만남은 어떠셨나요?",
    body: "댕이누나님과의 만남을 평가해주세요.",
    minutesAgo: 720,
    read: true,
    linkTo: null,
  },
  {
    id: "noti-7",
    type: "CHAT_CLOSING",
    title: "채팅이 6시간 후 종료돼요",
    body: "아직 나누고 싶은 이야기가 있다면 지금 해보는 건 어때요?",
    minutesAgo: 10080,
    read: true,
    linkTo: null,
  },
];

function mockNotificationsApi(seed: NotificationSeed[] = NOTIFICATIONS) {
  const readIds = new Set(seed.filter((item) => item.read).map((item) => item.id));

  cy.intercept("GET", "**/api/**/notifications", (req) => {
    const now = Date.now();
    req.reply({
      success: true,
      data: seed.map(({ minutesAgo, ...rest }) => ({
        ...rest,
        createdAt: new Date(now - minutesAgo * 60 * 1000).toISOString(),
        read: readIds.has(rest.id),
      })),
    });
  }).as("getNotifications");

  cy.intercept("POST", "**/api/**/notifications/read-all", (req) => {
    seed.forEach((item) => readIds.add(item.id));
    req.reply({ success: true, data: null });
  }).as("readAllNotifications");

  cy.intercept("POST", "**/api/**/notifications/*/read", (req) => {
    req.reply({ success: true, data: null });
  }).as("readNotification");
}

describe("notification center", () => {
  // 이 화면은 주차 기간(period)에 의존하지 않는다. cy.clock으로 Date를 고정하면
  // 앱의 '지금'과 인터셉트가 만드는 createdAt의 기준 시각이 어긋나므로 쓰지 않는다.
  beforeEach(() => {
    cy.mockApi();
    cy.login();
  });

  it("opens from the home bell and groups notifications by 오늘 / 지난 소식", () => {
    mockNotificationsApi();
    cy.visit("/home");

    cy.get('button[aria-label="알림"]', { timeout: 6000 }).click();
    cy.location("pathname").should("include", "/notifications");
    cy.wait("@getNotifications");

    cy.contains("알림").should("be.visible");
    cy.contains("오늘").should("be.visible");
    cy.contains("지난 소식").should("be.visible");

    // 24시간 이내는 '오늘', 그 밖은 '지난 소식'
    cy.contains("이번 주 매칭 결과가 나왔어요").should("be.visible");
    cy.contains("채팅이 6시간 후 종료돼요").should("be.visible");

    // 상대 시간 표기 규칙(Figma 2508:32126)
    cy.contains("방금 전").should("be.visible");
    cy.contains("15분 전").should("be.visible");
    cy.contains("1시간 전").should("be.visible");
    cy.contains("12시간 전").should("be.visible");
    cy.contains("7일 전").should("be.visible");
  });

  it("filters by category chips", () => {
    mockNotificationsApi();
    cy.visit("/notifications");
    cy.wait("@getNotifications");

    cy.contains('[role="tab"]', "매칭").click();
    cy.contains("이번 주 매칭 결과가 나왔어요").should("be.visible");
    cy.contains("그룹이 구성됐어요").should("be.visible");
    cy.contains("산책러버님의 새 메시지").should("not.exist");

    cy.contains('[role="tab"]', "대화").click();
    cy.contains("산책러버님의 새 메시지").should("be.visible");
    cy.contains("이번 주 매칭 결과가 나왔어요").should("not.exist");

    cy.contains('[role="tab"]', "전체").click();
    cy.contains("이번 주 매칭 결과가 나왔어요").should("be.visible");
    cy.contains("산책러버님의 새 메시지").should("be.visible");
  });

  it("marks a single notification read and navigates to its link", () => {
    mockNotificationsApi();
    cy.visit("/notifications");
    cy.wait("@getNotifications");

    cy.contains("이번 주 매칭 결과가 나왔어요").click();
    cy.wait("@readNotification");
    cy.location("pathname").should("include", "/matching");
  });

  it("marks every notification read via 모두 읽음", () => {
    mockNotificationsApi();
    cy.visit("/notifications");
    cy.wait("@getNotifications");

    cy.contains("button", "모두 읽음").should("not.be.disabled").click();
    cy.wait("@readAllNotifications");
    cy.contains("button", "모두 읽음").should("be.disabled");
  });

  it("shows the empty state when there is no notification", () => {
    mockNotificationsApi([]);
    cy.visit("/notifications");
    cy.wait("@getNotifications");

    cy.contains("새로운 알림이 없어요").should("be.visible");
    cy.contains("중요한 소식이 오면 알려드릴게요.").should("be.visible");
  });
});
