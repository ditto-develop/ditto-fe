/**
 * 홈 카드 클릭률(CTR) 계측 회귀 테스트.
 *
 * 클릭만 세면 "몇 명이 눌렀나"는 알아도 "본 사람 중 몇 %가 눌렀나"는 알 수 없다.
 * 그래서 노출(`card_impression`)과 클릭(`card_click`)이 **짝으로** 나가야 하고,
 * 둘의 `card_state` 가 같아야 한다 — 어긋나면 노출은 A 로 클릭은 B 로 잡혀
 * 클릭률이 통째로 틀어진다. 그게 이 스펙이 지키는 것이다.
 *
 * 기간(`period`)은 전역 파라미터라 이벤트마다 실리지 않는다. 기간별로 나눠 보는 것은
 * GA4 쪽 설정이고, 여기서는 카드 상태와 짝만 검증한다.
 */

interface TrackedEvent {
  name: string;
  params: Record<string, unknown>;
}

function readEvents(): Cypress.Chainable<TrackedEvent[]> {
  return cy.window().then((win) => {
    const dataLayer = (win as unknown as { dataLayer?: unknown[][] }).dataLayer ?? [];
    return dataLayer
      .filter((entry) => Array.isArray(entry) && entry[0] === "event")
      .map((entry) => ({
        name: String(entry[1]),
        params: (entry[2] ?? {}) as Record<string, unknown>,
      }));
  });
}

function waitForEvent(name: string) {
  return cy.window().should((win) => {
    const dataLayer = (win as unknown as { dataLayer?: unknown[][] }).dataLayer ?? [];
    const found = dataLayer.some(
      (entry) => Array.isArray(entry) && entry[0] === "event" && entry[1] === name,
    );
    expect(found, `${name} 이벤트가 기록돼야 한다`).to.equal(true);
  });
}

function eventsNamed(events: TrackedEvent[], name: string): TrackedEvent[] {
  return events.filter((event) => event.name === name);
}

describe("home card CTR analytics", () => {
  it("퀴즈 기간: 카드 노출을 한 번만 센다", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();
    cy.visit("/home");

    cy.contains("이번주 퀴즈", { timeout: 6000 }).should("be.visible");
    waitForEvent("card_impression");

    readEvents().then((events) => {
      const impressions = eventsNamed(events, "card_impression");
      // 분모가 부풀면 클릭률이 실제보다 낮게 보인다. 리렌더가 몇 번 일어나든 한 번이다.
      expect(impressions, "노출은 정확히 한 번").to.have.length(1);
      expect(impressions[0].params).to.deep.include({ card_name: "quiz" });
    });
  });

  it("퀴즈 기간: 시작하기 클릭이 같은 card_state 로 짝지어진다", () => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.login();
    cy.visit("/home");

    cy.contains("이번주 퀴즈", { timeout: 6000 }).should("be.visible");
    waitForEvent("card_impression");
    cy.contains("button", "시작하기").click();
    waitForEvent("card_click");

    readEvents().then((events) => {
      const impression = eventsNamed(events, "card_impression")[0];
      const click = eventsNamed(events, "card_click")[0];

      expect(click.params).to.deep.include({ card_name: "quiz", action: "start_quiz" });
      // 짝이 어긋나면 클릭률 계산이 통째로 무너진다.
      expect(click.params.card_state, "노출과 클릭의 card_state 가 같아야 한다").to.equal(
        impression.params.card_state,
      );
    });
  });

  it("매칭 기간: 결과 확인 클릭을 매칭 카드로 기록한다", () => {
    cy.clockPeriod("MATCHING");
    cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
    cy.login();
    cy.visit("/home");

    cy.contains("이번주 매칭", { timeout: 6000 }).should("be.visible");
    waitForEvent("card_impression");

    cy.contains("결과 확인").click();
    waitForEvent("card_click");

    readEvents().then((events) => {
      const impression = eventsNamed(events, "card_impression")[0];
      const click = eventsNamed(events, "card_click")[0];

      expect(impression.params).to.deep.include({ card_name: "matching" });
      expect(click.params).to.deep.include({
        card_name: "matching",
        action: "alert_view_result",
      });
      expect(click.params.card_state).to.equal(impression.params.card_state);
    });
  });

  it("매칭 결과 화면 진입을 퍼널의 분모로 한 번 기록한다", () => {
    cy.clockPeriod("MATCHING");
    cy.mockApi({ matchesFixture: "matches-1on1-populated.json" });
    cy.login();
    cy.visit("/matching");

    cy.contains("이번 주 매칭 결과", { timeout: 6000 }).should("be.visible");
    waitForEvent("matching_result_view");

    readEvents().then((events) => {
      const views = eventsNamed(events, "matching_result_view");
      // 탭 전환이나 리렌더로 분모가 부풀면 안 된다.
      expect(views).to.have.length(1);
      expect(Number(views[0].params.candidate_count)).to.be.greaterThan(0);
    });
  });
});
