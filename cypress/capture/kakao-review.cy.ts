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

import {
  mockProfileAndSettings,
  shoot,
  visitScreen,
  waitForSplashToClear,
} from "./captureHelpers";

const OAUTH_SIGNUP_ENTRY =
  "/oauth/kakao?accessToken=e2e-token&refreshToken=e2e-refresh&signupRequired=true";

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
      // 성명·전화번호는 방침에서 뺐다(2026-09-18). 남은 건 직책과 이메일뿐이다.
      cy.contains("직책: 대표").should("be.visible");
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
      cy.mockApi({ groupMatchesFixture: "matches-group.json" });
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
