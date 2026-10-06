/**
 * App Store 제품 페이지 **스크린샷** 캡처(iPhone 6.9", 1320×2868).
 *
 * 테스트가 아니라 산출물 생성 스크립트다 — kakao-review.cy.ts 와 같은 규칙으로 목업 데이터를
 * 띄워 찍는다. 순서가 곧 스토어 노출 순서이고, 가이드라인 4.3(b)(데이팅 앱은 차별점이
 * 보여야 한다)를 염두에 두고 "퀴즈 → 매칭 → 대화"의 흐름이 앞에 오도록 골랐다.
 *
 * 실행:
 *   npm run dev:e2e            # 다른 터미널
 *   npm run capture:appstore
 *
 * 결과: cypress/screenshots/app-store.cy.ts/*.png
 * 업로드 전 알파 채널을 걷어야 한다(App Store 는 투명도가 있는 스크린샷을 거절한다).
 */

import { mockProfileAndSettings, shoot, visitScreen } from "./captureHelpers";

/** 스토어 자료에는 캡처 환경의 흔적(소켓 끊김 안내·스크롤바)을 남기지 않는다. */
const STORE_CAPTURE = { connectedChatSocket: true, hideScrollbars: true };

describe("App Store 스크린샷", () => {
  beforeEach(() => {
    cy.on("uncaught:exception", () => false);
  });

  it("01 홈 — 이번 주 매칭", () => {
    cy.clockPeriod("MATCHING");
    cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
    cy.login();
    mockProfileAndSettings();
    visitScreen("/home", STORE_CAPTURE);
    cy.contains("타임라인", { timeout: 12000 }).should("be.visible");
    shoot("01-home");
  });

  it("02 주간 퀴즈", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();
    mockProfileAndSettings();
    visitScreen("/quiz/current", STORE_CAPTURE);
    cy.get("body", { timeout: 12000 }).should("be.visible");
    shoot("02-quiz");
  });

  it("03 1:1 매칭 결과", () => {
    cy.clockPeriod("MATCHING");
    cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
    cy.login();
    mockProfileAndSettings();
    visitScreen("/matching", STORE_CAPTURE);
    cy.contains("이번 주 매칭 결과", { timeout: 12000 }).should("be.visible");
    cy.contains("수민").should("be.visible");
    shoot("03-matching");
  });

  context("대화", () => {
    beforeEach(() => {
      // 채팅방 픽스처는 2026-06-05~08 창을 쓴다. 시계를 그 주에 고정하지 않으면
      // 방이 전부 만료돼 "대화 기간이 끝나 메시지를 보낼 수 없어요"로 찍힌다.
      cy.clockPeriod("CHATTING");
      cy.mockApi();
      cy.login();
      mockProfileAndSettings();
    });

    it("04 1:1 대화방", () => {
      visitScreen("/chat/one-on-one/1", STORE_CAPTURE);
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("04-chat-1on1");
    });

    it("05 그룹 대화방", () => {
      visitScreen("/chat/group/3", STORE_CAPTURE);
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("05-chat-group");
    });

    it("06 내 프로필", () => {
      visitScreen("/profile", STORE_CAPTURE);
      cy.get("body", { timeout: 12000 }).should("be.visible");
      shoot("06-profile");
    });
  });
});
