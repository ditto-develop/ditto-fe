/**
 * 가입 퍼널 계측 회귀 테스트.
 *
 * 계측은 화면에 아무것도 보이지 않는 코드다. 누가 이벤트 호출을 지우거나 단계 번호를
 * 어긋나게 만들어도 앱은 멀쩡히 동작하고, **몇 주 뒤 "퍼널 데이터가 왜 이상하지"로**
 * 발견된다. 그때는 그 기간의 데이터를 되살릴 수 없다. 그래서 이 흐름만은 E2E 로 묶는다.
 *
 * 측정 ID 가 없어도 `initGtagQueue()` 가 `window.dataLayer` 배열은 만들어 두기 때문에,
 * 외부 요청 없이 여기서 이벤트를 그대로 읽을 수 있다(shared/lib/analytics/gtag.ts 참고).
 */

const OAUTH_ENTRY = "/oauth/kakao?accessToken=e2e-token&refreshToken=e2e-refresh&signupRequired=true";

const ADULT_BIRTH_DATE = "1998-03-15";
const EMAIL = "e2e@example.com";

interface TrackedEvent {
  name: string;
  params: Record<string, unknown>;
}

/** dataLayer 에 쌓인 gtag 호출 중 `event` 호출만 뽑아 읽기 쉬운 모양으로 바꾼다. */
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

/**
 * 이름이 `name` 인 이벤트가 나올 때까지 기다린다.
 *
 * `readEvents().then(...)` 은 재시도하지 않는다. 화면 진입 이벤트에는 300ms 디바운스가
 * 걸려 있어(가드 리다이렉트로 스쳐 가는 경로를 세지 않기 위한 것) 곧바로 읽으면 아직
 * 없다. 재시도되는 `should` 로 기다린 뒤에 읽는다.
 */
function waitForEvent(name: string) {
  return cy.window().should((win) => {
    const dataLayer = (win as unknown as { dataLayer?: unknown[][] }).dataLayer ?? [];
    const found = dataLayer.some(
      (entry) => Array.isArray(entry) && entry[0] === "event" && entry[1] === name,
    );
    expect(found, `${name} 이벤트가 기록돼야 한다`).to.equal(true);
  });
}

/** 이름이 `name` 인 이벤트만 고른다. */
function eventsNamed(events: TrackedEvent[], name: string): TrackedEvent[] {
  return events.filter((event) => event.name === name);
}

function selectFromBottomSheet(labelText: string, optionText: string) {
  cy.get(`button[aria-label="${labelText}"]`).click();
  cy.contains("li", optionText, { timeout: 4000 }).click();
}

function selectBirthDate(birthDate: string) {
  const [year, month, day] = birthDate.split("-").map(Number);
  cy.get('button[aria-label="생년월일"]').click();
  cy.get('select[aria-label="연도"]', { timeout: 4000 }).select(String(year));
  cy.get('select[aria-label="월"]').select(String(month));
  cy.get('select[aria-label="일"]').select(String(day));
  cy.contains("button", "확인").click();
}

function fillProfile() {
  cy.get('input[placeholder="사용할 닉네임을 입력해주세요"]').type("테스트닉");
  cy.contains("button", "저장").click();
  cy.wait("@checkNickname");

  cy.get('input[placeholder="이메일을 입력해주세요"]').type(EMAIL);

  selectFromBottomSheet("성별", "남자");
  selectBirthDate(ADULT_BIRTH_DATE);

  cy.contains("💪 운동").click();
  cy.contains("🍿 영화/드라마").click();
  cy.contains("💃 공연").click();
  cy.contains("📷 사진").click();
  cy.contains("📚 독서").click();

  selectFromBottomSheet("사는 곳", "서울");
  selectFromBottomSheet("직업", "IT/기술");
}

describe("signup funnel analytics", () => {
  beforeEach(() => {
    cy.clockPeriod("QUIZ");
    cy.mockApi();
    cy.on("uncaught:exception", () => false);
  });

  it("리다이렉트 콜백으로 들어오면 신규 회원 로그인 성공을 기록한다", () => {
    cy.visit(OAUTH_ENTRY);
    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");

    readEvents().then((events) => {
      const success = eventsNamed(events, "login_success");
      expect(success, "login_success 가 정확히 한 번").to.have.length(1);
      expect(success[0].params).to.deep.include({
        provider: "kakao",
        method: "redirect",
        // 가입 화면으로 들어왔으니 신규 회원이어야 한다. 이 값이 뒤집히면
        // "로그인은 되는데 가입에서 빠진다"를 영영 볼 수 없다.
        is_new_user: true,
      });
    });
  });

  it("각 가입 단계의 진입과 완료를 순서대로 기록한다", () => {
    cy.visit(OAUTH_ENTRY);
    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");

    // 1단계(프로필) 진입.
    readEvents().then((events) => {
      const views = eventsNamed(events, "signup_step_view");
      expect(views).to.have.length(1);
      expect(views[0].params).to.deep.include({ step_index: 1, step_name: "profile" });
    });

    fillProfile();
    cy.contains("button", "다음").click();
    cy.contains("소개 노트 작성하기", { timeout: 6000 }).should("be.visible");

    // 1단계 완료 → 2단계(소개 노트) 진입.
    readEvents().then((events) => {
      const completes = eventsNamed(events, "signup_step_complete");
      expect(completes, "1단계 완료가 기록돼야 한다").to.have.length(1);
      expect(completes[0].params).to.deep.include({ step_index: 1, step_name: "profile" });

      const views = eventsNamed(events, "signup_step_view");
      expect(views, "2단계 진입까지 두 번").to.have.length(2);
      expect(views[1].params).to.deep.include({ step_index: 2, step_name: "intro_note" });
    });
  });

  it("검증에 걸려 되돌아가면 단계 완료를 기록하지 않는다", () => {
    // 여기가 깨지면 통과하지 않은 사람까지 분자에 들어가 전환율이 부풀려진다.
    cy.visit(OAUTH_ENTRY);
    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");

    cy.contains("button", "다음").click();
    cy.contains("프로필 작성하기").should("be.visible");

    readEvents().then((events) => {
      expect(eventsNamed(events, "signup_step_complete")).to.have.length(0);
    });
  });

  it("1단계에서 뒤로가기하면 가입 포기를 기록한다", () => {
    cy.visit(OAUTH_ENTRY);
    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");

    cy.get('img[alt="back"]').click();
    cy.location("pathname", { timeout: 6000 }).should("match", /^\/$/);

    readEvents().then((events) => {
      const abandons = eventsNamed(events, "signup_abandon");
      expect(abandons).to.have.length(1);
      expect(abandons[0].params).to.deep.include({ step_index: 1, step_name: "profile" });
    });
  });

  it("화면 진입에 식별자가 아니라 라우트 패턴이 실린다", () => {
    // roomId/memberId 가 GA4 로 새어 나가는 걸 막는 방어선이다.
    cy.visit(OAUTH_ENTRY);
    cy.contains("프로필 작성하기", { timeout: 6000 }).should("be.visible");
    waitForEvent("screen_view");

    readEvents().then((events) => {
      const views = eventsNamed(events, "screen_view");
      expect(views.length, "screen_view 가 최소 한 번").to.be.greaterThan(0);
      views.forEach((view) => {
        expect(String(view.params.screen_path)).not.to.match(/\d{2,}/);
      });
    });
  });
});
