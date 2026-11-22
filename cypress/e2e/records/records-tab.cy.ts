/**
 * 8.1 퀴즈 기록 탭(/records).
 *
 * 서버 IMP-1 계약(GET /quiz-history, /quiz-history/{quizSetId}). 여기서는
 * cypress/fixtures/records/* (src/mocks/recordsData.ts 에서 뽑은 값)로 응답을 고정한다.
 */

type Envelope = { success: true; data: unknown };

function envelope(data: unknown): Envelope {
  return { success: true, data };
}

function mockRecordsApi() {
  cy.fixture("records/quiz-history.json").then((data: unknown) => {
    cy.intercept("GET", "**/api/v1/quiz-history", envelope(data)).as("getQuizRecords");
  });
  cy.fixture("records/quiz-history-in-progress.json").then((data: unknown) => {
    cy.intercept("GET", "**/api/v1/quiz-history/42", envelope(data)).as("getQuizRecord42");
  });
  cy.fixture("records/quiz-history-closed.json").then((data: unknown) => {
    cy.intercept("GET", "**/api/v1/quiz-history/41", envelope(data)).as("getQuizRecord41");
  });
}

describe("퀴즈 기록 탭", () => {
  beforeEach(() => {
    cy.mockApi();
    mockRecordsApi();
    cy.login();
  });

  it("홈 하단 탭에 '기록' 이 홈과 대화방 사이에 보인다", () => {
    cy.visit("/home");

    // trailingSlash: true 라 Link 가 "/records/" 로 그린다.
    cy.contains("nav a", "기록", { timeout: 8000 })
      .should("have.attr", "href")
      .and("match", /^\/records\/?$/);
    // 대화방 탭에는 안읽음 배지 숫자가 같이 들어 있어 탭 라벨(<p>)만 읽는다.
    cy.get("nav a").then(($links) => {
      const labels = [...$links].map((link) => link.querySelector("p")?.textContent?.trim());
      expect(labels).to.deep.equal(["홈", "기록", "대화방", "프로필"]);
    });
  });

  it("요약 3칸·이번 주 카드·지난 퀴즈를 보이고, 이번 주 카드에서 내 답변으로 간다", () => {
    // 통계 공개(10/29 00:00)까지 10:49:25 남은 시각으로 고정한다. 시간대는 앱과 같은 브라우저 기준이다.
    cy.clock(new Date(2026, 9, 28, 13, 10, 35).getTime(), ["Date"]);
    cy.visit("/records");
    cy.wait("@getQuizRecords", { timeout: 15000 });

    cy.contains("h1", "퀴즈 기록").should("be.visible");
    cy.contains("nav a", "기록").should("have.attr", "aria-current", "page");

    cy.contains("참여한 주").next().should("have.text", "3");
    cy.contains("답한 질문").next().should("have.text", "36");
    cy.contains("소수 의견").next().should("have.text", "5");

    // 메타 줄에 "N주차" 를 쓰지 않는다 — 달마다 다시 세서 다른 달의 주와 겹쳐 보였다(QA 1119).
    cy.contains("1:1 · 10월 26일 주").should("be.visible");
    cy.contains("주차").should("not.exist");
    cy.contains("이번 주").should("be.visible");
    cy.contains("h2", "시간이 멈춘다면").should("be.visible");
    // 기록 목록 응답에 답변 수가 없어 "제출 완료" 만 쓴다.
    cy.contains("제출 완료").should("be.visible");
    cy.contains("통계는 목요일 0시에 공개돼요").should("be.visible");

    cy.contains("h2", "지난 퀴즈").should("be.visible");
    cy.contains("button", "가을 밤, 같이 볼 영화").within(() => {
      cy.contains("그룹 · 10월 19일 주");
      cy.contains("주차").should("not.exist");
      cy.contains("결과 보기 · 소수 의견 2개");
    });
    cy.contains("button", "비 오는 날의 기억").should("contain.text", "결과 보기 · 소수 의견 3개");

    cy.contains("button", "내 답변 보기").click();
    cy.location("pathname").should("match", /^\/records\/42\/?$/);
    cy.wait("@getQuizRecord42", { timeout: 15000 });

    cy.contains(/^퀴즈$/).should("be.visible");
    cy.contains("결과 공개 전").should("be.visible");
    cy.contains("1:1 · 10월 26일 주").should("be.visible");
    // 응답에 제출 시각이 없어 "10월 27일 21:14 제출" 줄은 그리지 않는다.
    cy.contains("21:14 제출").should("not.exist");
    cy.get('[data-testid="record-reveal-countdown"]').should("have.text", "10:49:25");
    cy.contains("지금까지 참여한 사람").next().should("have.text", "50명+");
    cy.contains("다른 사람들의 선택은 퀴즈가 끝난 뒤에 보여드려요.").should("be.visible");

    cy.contains("내가 고른 답 12").should("be.visible");
    cy.get('[data-testid="record-answer"]').should("have.length", 12);
    cy.get('[data-testid="record-answer"]')
      .eq(2)
      .should("contain.text", "Q3. 시간이 멈춘다면 그 시각은?")
      .and("contain.text", "새벽 2시");
    cy.contains("제출한 답변은 바꿀 수 없어요").should("be.visible");
    // 공개 전에는 다른 사람의 선택 비율을 보이지 않는다.
    cy.contains("질문별 선택").should("not.exist");
  });

  it("공개된 지난 퀴즈는 질문별 선택 비율과 소수 의견을 보인다", () => {
    cy.visit("/records");
    cy.wait("@getQuizRecords", { timeout: 15000 });

    cy.contains("button", "가을 밤, 같이 볼 영화").click();
    cy.location("pathname").should("match", /^\/records\/41\/?$/);
    cy.wait("@getQuizRecord41", { timeout: 15000 });

    cy.contains(/^퀴즈 결과$/).should("be.visible");
    cy.contains("결과 공개").should("be.visible");
    cy.contains("그룹 · 10월 19일 주").should("be.visible");
    cy.contains("312명 참여").should("not.exist");
    cy.contains("답이 겹친 사람").next().should("have.text", "23명");
    cy.contains("소수 의견").parent().find("strong").should("have.text", "2개");

    cy.contains("질문별 선택").should("be.visible");
    // 비율은 마감 통계 기준이다 — 늦게 푼 사람(시크릿 매칭)도 같은 숫자를 보므로 모두에게 기준을 밝힌다.
    cy.get('[data-testid="record-section-caption"]').should("have.text", "선택 비율은 퀴즈 참여자 312명 기준이에요");
    cy.get('[data-testid="record-result"]').should("have.length", 12);
    cy.get('[data-testid="record-result"]')
      .eq(2)
      .within(() => {
        cy.contains("소수 의견").should("be.visible");
        cy.contains("오후 3시").parent().should("contain.text", "82%");
        // 내가 고른 답은 aria-current 로 표시된다.
        cy.get('[aria-current="true"]').should("contain.text", "새벽 2시").and("contain.text", "18%");
      });
    // 소수 의견이 아닌 문항에는 칩이 없다.
    cy.get('[data-testid="record-result"]').eq(0).should("not.contain.text", "소수 의견");
    cy.contains("내가 고른 답").should("not.exist");
  });
  it("같은 주에 그룹과 1:1 을 둘 다 완주하면 두 장 모두 이번 주 카드로 보인다(시크릿 매칭)", () => {
    // 서버 currentWeek.quizSetId 는 둘 중 하나(42)만 가리킨다. 이번 주는 그 셋의 weekStartedOn 으로 고른다.
    cy.fixture("records/quiz-history.json").then((data: { weeks: Record<string, unknown>[] }) => {
      const lateOneToOne = {
        quizSetId: 43,
        weekStartedOn: "2026-10-26",
        matchingType: "ONE_TO_ONE",
        title: "금요일 밤의 선택",
        lateCompletion: true,
        minorityCount: null,
      };
      const weeks = [lateOneToOne, ...data.weeks];
      cy.intercept("GET", "**/api/v1/quiz-history", envelope({ ...data, weeks })).as("getQuizRecordsTwoThisWeek");
    });
    cy.visit("/records");
    cy.wait("@getQuizRecordsTwoThisWeek", { timeout: 15000 });

    cy.contains("h2", "시간이 멈춘다면").should("be.visible");
    cy.contains("h2", "금요일 밤의 선택").should("be.visible");
    cy.get("button").filter(':contains("내 답변 보기")').should("have.length", 2);
    // 지난 퀴즈에는 지난 주만 남는다.
    cy.contains("h2", "지난 퀴즈")
      .parent()
      .within(() => {
        cy.contains("금요일 밤의 선택").should("not.exist");
        cy.contains("시간이 멈춘다면").should("not.exist");
        cy.contains("가을 밤, 같이 볼 영화").should("be.visible");
      });
  });

  it("마감 뒤에 늦게 완주한 주는 '나와 N개 이상 겹친 사람' 칸을 숨기고 소수 의견만 보인다", () => {
    cy.fixture("records/quiz-history-closed.json").then((data: Record<string, unknown>) => {
      cy.intercept(
        "GET",
        "**/api/v1/quiz-history/41",
        envelope({ ...data, lateCompletion: true, result: { overlapThreshold: 8, overlapCount: 0, minorityCount: 2 } }),
      ).as("getLateRecord41");
    });
    cy.visit("/records/41");
    cy.wait("@getLateRecord41", { timeout: 15000 });

    cy.contains(/^퀴즈 결과$/).should("be.visible");
    cy.get('[data-testid="record-overlap-tile"]').should("not.exist");
    cy.contains("답이 겹친 사람").should("not.exist");
    cy.contains("소수 의견").parent().find("strong").should("have.text", "2개");
  });
});
