type NotificationSeed = {
  id: number;
  type: string;
  category: "MATCHING" | "CHAT" | "SYSTEM";
  title: string;
  body: string | null;
  minutesAgo: number;
  read: boolean;
  targetId: number | null;
};

/** 라이브 계약: `{ notifications, nextCursor }` 래퍼 + readAt(null이면 안읽음) + targetId. */
const NOTIFICATIONS: NotificationSeed[] = [
  {
    id: 1,
    type: "MATCH_RESULT",
    category: "MATCHING",
    title: "이번 주 매칭 결과가 나왔어요",
    body: "나와 답변이 비슷한 사람들을 찾았어요. 지금 확인해 보세요.",
    minutesAgo: 0,
    read: false,
    targetId: 11,
  },
  {
    id: 2,
    type: "CHAT_MESSAGE",
    category: "CHAT",
    title: "산책러버님의 새 메시지",
    body: "주말에 시간 괜찮으세요?",
    minutesAgo: 15,
    read: false,
    targetId: 22,
  },
  {
    id: 3,
    type: "GROUP_FORMED",
    category: "MATCHING",
    title: "그룹이 구성됐어요",
    body: "같은 취미, 취향 그룹에 5명이 모였어요.",
    minutesAgo: 60,
    read: false,
    targetId: null,
  },
  {
    id: 4,
    type: "REVIEW_REQUEST",
    category: "SYSTEM",
    title: "이번 만남은 어떠셨나요?",
    body: "댕이누나님과의 만남을 평가해주세요.",
    minutesAgo: 720,
    read: true,
    targetId: null,
  },
  {
    id: 7,
    type: "CHAT_ENDING_SOON",
    category: "CHAT",
    title: "채팅이 6시간 후 종료돼요",
    body: "아직 나누고 싶은 이야기가 있다면 지금 해보는 건 어때요?",
    minutesAgo: 10080,
    read: true,
    targetId: 22,
  },
  {
    // 서버 enum은 늘어난다. 모르는 type도 기본 아이콘으로 반드시 그려야 한다.
    id: 8,
    type: "SOME_FUTURE_TYPE",
    category: "SYSTEM",
    title: "아직 모르는 종류의 알림",
    body: null,
    minutesAgo: 30,
    read: true,
    targetId: null,
  },
];

/** 서버 시각 포맷은 ISO가 아니라 `yyyy-MM-dd HH:mm:ss`다. */
function toServerDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function mockNotificationsApi(seed: NotificationSeed[] = NOTIFICATIONS) {
  const readIds = new Set(seed.filter((item) => item.read).map((item) => item.id));

  cy.intercept("GET", "**/api/**/notifications?*", (req) => {
    const now = Date.now();
    const category = new URL(req.url).searchParams.get("category");
    const visible = category ? seed.filter((item) => item.category === category) : seed;

    req.reply({
      success: true,
      data: {
        notifications: visible.map(({ minutesAgo, read, ...rest }) => ({
          ...rest,
          createdAt: toServerDateTime(now - minutesAgo * 60 * 1000),
          readAt: readIds.has(rest.id) ? toServerDateTime(now) : null,
        })),
        nextCursor: null,
      },
    });
  }).as("getNotifications");

  cy.intercept("GET", "**/api/**/notifications/unread-count", (req) => {
    req.reply({
      success: true,
      data: { count: seed.filter((item) => !readIds.has(item.id)).length },
    });
  }).as("getUnreadCount");

  cy.intercept("PUT", "**/api/**/notifications/read-all", (req) => {
    const readCount = seed.filter((item) => !readIds.has(item.id)).length;
    seed.forEach((item) => readIds.add(item.id));
    req.reply({ success: true, data: { readCount } });
  }).as("readAllNotifications");

  cy.intercept("PUT", "**/api/**/notifications/*/read", (req) => {
    req.reply({ success: true, data: {} });
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

    // 모르는 type도 사라지지 않고 그려진다
    cy.contains("아직 모르는 종류의 알림").should("be.visible");

    // 상대 시간 표기 규칙(Figma 2508:32126)
    cy.contains("방금 전").should("be.visible");
    cy.contains("15분 전").should("be.visible");
    cy.contains("1시간 전").should("be.visible");
    cy.contains("12시간 전").should("be.visible");
    cy.contains("7일 전").should("be.visible");
  });

  it("filters by category chips (서버 category 파라미터)", () => {
    mockNotificationsApi();
    cy.visit("/notifications");
    cy.wait("@getNotifications");

    // dev의 StrictMode가 최초 요청을 두 번 쏘므로 요청 순서에 기대지 않는다.
    // 화면 결과로 확인하고, category 파라미터는 '보낸 적이 있는지'로 본다.
    const shouldHaveRequested = (category: string) =>
      cy
        .get("@getNotifications.all")
        .should((calls: unknown) =>
          expect(
            (calls as { request: { url: string } }[]).some((call) =>
              call.request.url.includes(`category=${category}`),
            ),
            `category=${category} 요청`,
          ).to.equal(true),
        );

    cy.contains('[role="tab"]', "매칭").click();
    cy.contains("이번 주 매칭 결과가 나왔어요").should("be.visible");
    cy.contains("그룹이 구성됐어요").should("be.visible");
    cy.contains("산책러버님의 새 메시지").should("not.exist");
    shouldHaveRequested("MATCHING");

    cy.contains('[role="tab"]', "대화").click();
    cy.contains("산책러버님의 새 메시지").should("be.visible");
    cy.contains("이번 주 매칭 결과가 나왔어요").should("not.exist");
    shouldHaveRequested("CHAT");

    cy.contains('[role="tab"]', "전체").click();
    cy.contains("이번 주 매칭 결과가 나왔어요").should("be.visible");
    cy.contains("산책러버님의 새 메시지").should("be.visible");
  });

  it("marks a single notification read (PUT) and navigates by type", () => {
    mockNotificationsApi();
    cy.visit("/notifications");
    cy.wait("@getNotifications");

    cy.contains("이번 주 매칭 결과가 나왔어요").click();
    cy.wait("@readNotification");
    cy.location("pathname").should("include", "/matching");
  });

  it("does not navigate for an unknown type", () => {
    mockNotificationsApi();
    cy.visit("/notifications");
    cy.wait("@getNotifications");

    cy.contains("아직 모르는 종류의 알림").click();
    cy.location("pathname").should("match", /^\/notifications\/?$/);
  });

  it("marks every notification read via 모두 읽음", () => {
    mockNotificationsApi();
    cy.visit("/notifications");
    cy.wait("@getNotifications");
    cy.wait("@getUnreadCount");

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
