/**
 * 카카오 비즈니스 정보 심사 제출용 **서비스 화면 캡처**.
 *
 * 카카오는 2026-08 심사에서 "회원가입 후 이용 가능한 서비스라 심사 진행이 어렵다 —
 * 이용 동선을 포함한 사이트 화면을 첨부하라"며 반려했다. 심사자는 카카오 로그인이
 * 승인 전이라 서비스에 들어올 수 없으므로, 우리가 동선 전체를 캡처해 제출한다.
 *
 * 이 파일은 **테스트가 아니라 캡처 스크립트**다. 단언(assert)은 화면이 다 그려진 뒤에
 * 찍기 위한 대기 용도로만 쓴다. `cypress/e2e` 밖에 두어 배포 게이트(verify 잡)의
 * specPattern 에 걸리지 않는다.
 *
 * 실행:
 *   npm run dev:e2e            # 다른 터미널
 *   npx cypress run --config-file cypress.config.capture.ts
 *
 * 결과: cypress/screenshots/kakao-review/*.png (파일명 번호 = 동선 순서)
 */

const OAUTH_SIGNUP_ENTRY =
  "/oauth/kakao?accessToken=e2e-token&refreshToken=e2e-refresh&signupRequired=true";

/** 로그인 후 화면들이 추가로 부르는 API. `cy.mockApi()` 가 덮지 않는 것만 채운다. */
function mockProfileAndSettings() {
  cy.fixture("my-profile.json").then((profile) => {
    cy.intercept("GET", "**/api/**/users/me/profile", { success: true, data: profile }).as(
      "getMyProfile",
    );
  });
  cy.fixture("my-ratings.json").then((ratings) => {
    cy.intercept("GET", "**/api/**/users/me/ratings", { success: true, data: ratings });
  });
  cy.fixture("my-stats.json").then((stats) => {
    cy.intercept("GET", "**/api/**/users/me/stats", { success: true, data: stats });
  });
  cy.fixture("intro-notes.json").then((notes) => {
    cy.intercept("GET", "**/api/**/users/me/intro-notes", { success: true, data: notes });
  });

  cy.intercept("GET", "**/api/**/users/me/notification-settings", {
    success: true,
    data: { matching: true, chat: true, marketing: false },
  });
  cy.intercept("GET", "**/api/**/users/me/blocks", {
    success: true,
    data: [
      {
        id: 42,
        nickname: "댕이나나",
        profileImageUrl: "/assets/avatar/f1.png",
        blockedAt: "2026-06-01 09:00:00",
      },
    ],
  });

  // BE는 KST 벽시계 문자열('yyyy-MM-dd HH:mm:ss')을 주고 앱은 이를 브라우저 로컬로
  // 파싱한다. toISOString()(UTC)을 쓰면 9시간 미래가 되어 전부 "방금 전"으로 보인다.
  const minutesAgo = (minutes: number) => {
    const at = new Date(Date.now() - minutes * 60_000);
    const pad = (value: number) => String(value).padStart(2, "0");
    return (
      `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ` +
      `${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}`
    );
  };

  cy.intercept("GET", "**/api/**/notifications/unread-count", {
    success: true,
    data: { count: 2 },
  });
  cy.intercept("GET", "**/api/**/notifications?*", {
    success: true,
    data: {
      notifications: [
        {
          id: 1,
          type: "MATCH_RESULT",
          category: "MATCHING",
          title: "이번 주 매칭 결과가 나왔어요",
          body: "나와 답변이 비슷한 사람들을 찾았어요. 지금 확인해 보세요.",
          createdAt: minutesAgo(5),
          readAt: null,
          targetId: 11,
        },
        {
          id: 2,
          type: "CHAT_MESSAGE",
          category: "CHAT",
          title: "산책러버님의 새 메시지",
          body: "주말에 시간 괜찮으세요?",
          createdAt: minutesAgo(30),
          readAt: null,
          targetId: 1,
        },
        {
          id: 3,
          type: "REVIEW_REQUEST",
          category: "SYSTEM",
          title: "이번 만남은 어떠셨나요?",
          body: "지난 대화 상대를 평가해주세요.",
          createdAt: minutesAgo(720),
          readAt: minutesAgo(700),
          targetId: null,
        },
      ],
      nextCursor: null,
    },
  });
}

/**
 * 캡처용 방문.
 *
 * `next dev` 는 좌하단에 개발 인디케이터(<nextjs-portal>)를 띄운다. 제출 자료에
 * 개발 도구가 찍히면 안 되므로 숨긴다 — 앱 코드가 아니라 캡처에서만 지우는 것이라
 * 제품 동작에는 영향이 없다.
 */
function visitScreen(path: string) {
  cy.visit(path);
  cy.document().then((doc) => {
    const style = doc.createElement("style");
    style.setAttribute("data-capture", "hide-dev-tools");
    style.textContent = "nextjs-portal{display:none!important}";
    doc.head.appendChild(style);
  });
}

/**
 * 비로그인 첫 화면은 스플래시가 3초간 덮는다. 스플래시는 오버레이라 아래 화면이
 * 이미 마운트돼 있어 `should('be.visible')` 만으로는 걷혔는지 알 수 없다.
 * 스플래시의 로고(alt="Ditto")가 사라질 때까지 기다린다.
 */
function waitForSplashToClear() {
  cy.get('img[alt="Ditto"]', { timeout: 10000 }).should("not.exist");
}

/** 화면이 다 그려질 때까지 기다린 뒤 찍는다. */
function shoot(name: string, options: Partial<Cypress.ScreenshotOptions> = {}) {
  // 이미지·폰트가 얹히기 전에 찍히면 빈 칸이 남는다.
  cy.wait(600);
  cy.screenshot(name, { capture: "viewport", overwrite: true, ...options });
}

describe("카카오 심사 제출용 화면 캡처", () => {
  beforeEach(() => {
    cy.on("uncaught:exception", () => false);
  });

  context("1. 로그인 전 — 심사자가 바로 볼 수 있는 화면", () => {
    it("01 첫 화면(서비스 소개 + 사업자 정보)", () => {
      cy.clearLocalStorage();
      visitScreen("/");
      waitForSplashToClear();
      cy.contains("카카오로 계속하기", { timeout: 10000 }).should("be.visible");
      cy.contains("카운트제로").should("be.visible");
      shoot("01-첫화면-서비스소개-사업자정보");
    });

    it("02 사업자 정보", () => {
      cy.clearLocalStorage();
      visitScreen("/settings/business");
      cy.contains("사업자등록번호", { timeout: 10000 }).should("be.visible");
      shoot("02-사업자정보", { capture: "fullPage" });
    });

    it("03 이용약관", () => {
      cy.clearLocalStorage();
      visitScreen("/settings/terms");
      cy.contains("이용약관", { timeout: 10000 }).should("be.visible");
      shoot("03-이용약관");
    });

    it("04 개인정보처리방침", () => {
      cy.clearLocalStorage();
      visitScreen("/settings/privacy");
      cy.contains("개인정보처리방침", { timeout: 10000 }).should("be.visible");
      shoot("04-개인정보처리방침", { capture: "fullPage" });
    });

    /**
     * 방침 전체 캡처는 세로 9000px 가까이라 사람이 확인하기 어렵다. 심사에서 실제로
     * 대조하는 항목(개인정보 보호책임자·연락처)만 한 화면으로 따로 남긴다.
     */
    it("04b 개인정보처리방침 — 개인정보 보호책임자", () => {
      cy.clearLocalStorage();
      visitScreen("/settings/privacy");
      // 상단 내비게이션이 고정이라 그냥 스크롤하면 제목 줄이 그 뒤로 숨는다.
      cy.contains("11. 개인정보 보호책임자", { timeout: 10000 }).scrollIntoView({
        offset: { top: -140, left: 0 },
      });
      cy.contains("오세영").should("be.visible");
      cy.contains("ditto.apply@gmail.com").should("be.visible");
      shoot("04b-개인정보처리방침-보호책임자");
    });

    it("05 위치기반 서비스 이용약관", () => {
      cy.clearLocalStorage();
      visitScreen("/settings/location-terms");
      cy.contains("위치기반서비스 이용약관", { timeout: 10000 }).should("be.visible");
      shoot("05-위치기반서비스-이용약관");
    });
  });

  context("2. 회원가입 동선", () => {
    beforeEach(() => {
      cy.clockPeriod("QUIZ");
      cy.mockApi();
    });

    it("06~07 프로필 작성 → 소개 노트", () => {
      visitScreen(OAUTH_SIGNUP_ENTRY);

      // 본인인증 스텝은 없앴다(2026-08-30). 온보딩은 프로필 → 소개 노트 2단계다.
      cy.contains("프로필 작성하기", { timeout: 10000 }).should("be.visible");
      cy.get('input[placeholder="사용할 닉네임을 입력해주세요"]').type("테스트닉");
      cy.contains("button", "저장").click();
      cy.wait("@checkNickname");
      cy.get('button[aria-label="성별"]').click();
      cy.contains("li", "남자", { timeout: 4000 }).click();
      cy.get('button[aria-label="생년월일"]').click();
      cy.get('select[aria-label="연도"]', { timeout: 4000 }).select("1998");
      cy.get('select[aria-label="월"]').select("3");
      cy.get('select[aria-label="일"]').select("15");
      cy.contains("button", "확인").click();
      ["💪 운동", "🍿 영화/드라마", "💃 공연", "📷 사진", "📚 독서"].forEach((interest) => {
        cy.contains(interest).click();
      });
      cy.get('button[aria-label="사는 곳"]').click();
      cy.contains("li", "서울", { timeout: 4000 }).click();
      cy.get('button[aria-label="직업"]').click();
      cy.contains("li", "IT/기술", { timeout: 4000 }).click();
      // 닉네임 저장 토스트가 화면 하단을 덮은 채로 찍히지 않도록 사라질 때까지 기다린다.
      cy.contains("닉네임이 저장되었어요.", { timeout: 10000 }).should("not.exist");
      shoot("06-회원가입-1-프로필작성");

      cy.contains("button", "다음").click();
      cy.contains("소개 노트 작성하기", { timeout: 10000 }).should("be.visible");
      shoot("07-회원가입-2-소개노트");
    });
  });

  context("3. 가입 후 주요 이용 화면", () => {
    beforeEach(() => {
      cy.mockApi();
      cy.login();
      mockProfileAndSettings();
    });

    it("08 홈 — 퀴즈 기간", () => {
      cy.clockPeriod("QUIZ");
      cy.mockApi();
      cy.login();
      mockProfileAndSettings();
      visitScreen("/home");
      cy.contains("타임라인", { timeout: 12000 }).should("be.visible");
      shoot("08-홈-퀴즈기간");
    });

    it("09 홈 — 매칭 기간", () => {
      cy.clockPeriod("MATCHING");
      cy.mockApi();
      cy.login();
      mockProfileAndSettings();
      visitScreen("/home");
      cy.contains("타임라인", { timeout: 12000 }).should("be.visible");
      shoot("09-홈-매칭기간");
    });

    it("10 홈 — 대화 기간", () => {
      cy.clockPeriod("CHATTING");
      cy.mockApi();
      cy.login();
      mockProfileAndSettings();
      visitScreen("/home");
      cy.contains("타임라인", { timeout: 12000 }).should("be.visible");
      shoot("10-홈-대화기간");
    });

    it("11 주간 퀴즈", () => {
      visitScreen("/quiz/current");
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("11-주간퀴즈");
    });

  });

  context("3-1. 매칭 결과 — 후보가 있는 상태", () => {
    /**
     * 기본 픽스처(`matches-one-on-one.json`)는 "후보 없음" 빈 상태다. 심사 제출 자료에
     * 빈 화면을 넣으면 서비스가 무엇을 하는지 보이지 않으므로 후보가 있는 픽스처를 쓴다.
     */
    it("12 1:1 매칭 결과", () => {
      cy.clockPeriod("MATCHING");
      cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
      cy.login();
      mockProfileAndSettings();
      visitScreen("/matching");
      cy.contains("이번 주 매칭 결과", { timeout: 12000 }).should("be.visible");
      cy.contains("수민").should("be.visible");
      shoot("12-매칭결과-1대1");
    });

    it("12b 그룹 매칭 결과", () => {
      cy.clockPeriod("MATCHING");
      cy.mockApi({ matchesFixture: "matches-group.json" });
      cy.login();
      mockProfileAndSettings();
      visitScreen("/home");
      cy.contains("이번주 매칭", { timeout: 12000 }).should("be.visible");
      cy.contains("대화 신청하기").click();
      cy.contains("3명 이상이 참여하면 대화를 나눌 수 있어요", { timeout: 8000 }).should(
        "be.visible",
      );
      shoot("12b-매칭결과-그룹");
    });
  });

  context("3-2. 대화·프로필·설정", () => {
    beforeEach(() => {
      // 채팅방 픽스처는 2026-06-05~08 창을 쓴다. 시계를 그 주에 고정하지 않으면
      // 방이 전부 만료돼 "대화 기간이 끝나 메시지를 보낼 수 없어요"로 찍힌다.
      cy.clockPeriod("CHATTING");
      cy.mockApi();
      cy.login();
      mockProfileAndSettings();
    });

    it("13 대화방 목록", () => {
      visitScreen("/chat");
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("13-대화방목록");
    });

    it("14 1:1 대화방", () => {
      visitScreen("/chat/one-on-one/1");
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("14-1대1-대화방");
    });

    it("15 그룹 대화방", () => {
      visitScreen("/chat/group/3");
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("15-그룹-대화방");
    });

    it("16 내 프로필", () => {
      visitScreen("/profile");
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("16-내프로필");
    });

    it("17 프로필 수정", () => {
      visitScreen("/profile/edit");
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("17-프로필수정");
    });

    it("18 소개 노트", () => {
      visitScreen("/profile/intro-note");
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("18-소개노트");
    });

    it("19 알림", () => {
      visitScreen("/notifications");
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("19-알림");
    });

    it("20 설정(사업자 정보 진입점 포함)", () => {
      visitScreen("/settings");
      cy.contains("사업자 정보", { timeout: 12000 }).should("be.visible");
      shoot("20-설정", { capture: "fullPage" });
    });

    it("21 차단 목록", () => {
      visitScreen("/settings/blocks");
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("21-차단목록");
    });
  });
});
