type LoginOptions = {
  accessToken?: string;
  refreshToken?: string;
};

type MockApiOptions = {
  matchesFixture?: string;
  matchingStatusFixture?: string;
  memberReviewsFixture?: string;
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const TEST_ACCESS_TOKEN =
  "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyLWUxZSIsInVzZXJJZCI6InVzZXItZTFlIn0.signature";
const TEST_REFRESH_TOKEN = "cypress-refresh-token";

function successResponse(data: unknown) {
  return {
    statusCode: 200,
    body: {
      success: true,
      data,
    },
  };
}

function emptySuccessResponse() {
  return successResponse(null);
}

// /home(MainSection)은 /system/state API 응답으로 기간을 정한다.
// Date도 같은 기간의 KST 요일로 맞춰 카운트다운/타임라인 표시를 결정적으로 고정한다.
type PeriodName = "QUIZ" | "MATCHING" | "CHATTING";

const PERIOD_KST_TIMESTAMP: Record<PeriodName, number> = {
  QUIZ: Date.parse("2026-06-02T03:00:00Z"), // KST 화요일
  MATCHING: Date.parse("2026-06-04T03:00:00Z"), // KST 목요일
  CHATTING: Date.parse("2026-06-06T03:00:00Z"), // KST 토요일
};

const API_PERIOD_BY_NAME: Record<PeriodName, string> = {
  QUIZ: "QUIZ_PERIOD",
  MATCHING: "MATCHING_PERIOD",
  CHATTING: "CHATTING_PERIOD",
};

function mockFixture(method: HttpMethod, urls: string[], fixtureName: string, alias: string) {
  cy.fixture(fixtureName).then((data: unknown) => {
    urls.forEach((url, index) => {
      cy.intercept(method, url, successResponse(data)).as(index === 0 ? alias : `${alias}${index + 1}`);
    });
  });
}

function mockStatic(method: HttpMethod, urls: string[], data: unknown, alias: string) {
  urls.forEach((url, index) => {
    cy.intercept(method, url, successResponse(data)).as(index === 0 ? alias : `${alias}${index + 1}`);
  });
}

Cypress.Commands.add("clockPeriod", (period: PeriodName) => {
  // Date만 오버라이드 → setTimeout/rAF(토스트 duration, 애니메이션)는 정상 동작
  Cypress.env("systemPeriod", period);
  cy.clock(PERIOD_KST_TIMESTAMP[period], ["Date"]);
});

Cypress.Commands.add("login", (options: LoginOptions = {}) => {
  const accessToken = options.accessToken ?? TEST_ACCESS_TOKEN;
  const refreshToken = options.refreshToken ?? TEST_REFRESH_TOKEN;

  return cy.window().then((win) => {
    win.localStorage.setItem("accessToken", accessToken);
    win.localStorage.setItem("refreshToken", refreshToken);
  });
});

Cypress.Commands.add("mockApi", (options: MockApiOptions = {}) => {
  // 자격증명(credentials:'include') 요청(예: 토큰 refresh)은 와일드카드 origin을
  // 허용하지 않으므로, preflight에서 요청 origin을 그대로 echo하고
  // access-control-allow-credentials를 true로 응답한다.
  cy.intercept("OPTIONS", "**/api/**", (req) => {
    req.reply({
      statusCode: 204,
      headers: {
        "access-control-allow-origin": req.headers.origin ?? "*",
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "authorization,content-type,x-api-key,accept",
      },
    });
  }).as("apiPreflight");

  mockFixture("GET", ["**/api/v1/quiz-sets/current-week", "**/api/quiz-sets/current-week"], "quiz-current.json", "getCurrentWeekQuiz");
  mockFixture("GET", ["**/api/v1/quiz-progress/current", "**/api/quiz-progress/current"], "quiz-progress-current.json", "getQuizProgress");
  mockFixture("GET", ["**/api/v1/quiz-progress/quiz-sets/*", "**/api/quiz-progress/quiz-sets/*"], "quiz-set-with-progress.json", "getQuizSetWithProgress");
  mockStatic("POST", ["**/api/v1/quiz-progress/answers*", "**/api/quiz-progress/answers*"], null, "submitAnswer");

  mockFixture("GET", ["**/api/v1/matches/1on1*", "**/api/matches/1on1*"], options.matchesFixture ?? "matches-one-on-one.json", "getMatchesOneOnOne");
  mockFixture("GET", ["**/api/v1/matching/status/**", "**/api/matching/status/**"], options.matchingStatusFixture ?? "matching-status.json", "getMatchingStatus");
  mockFixture("POST", ["**/api/v1/matches/request*", "**/api/matches/request*"], "match-request.json", "sendMatchRequest");
  mockStatic(
    "POST",
    ["**/api/v1/matches/request/*/accept", "**/api/matches/request/*/accept"],
    { id: 9001, quizSetId: 101, requesterId: 501, receiverId: "user-e1e", status: "ACCEPTED" },
    "acceptMatchRequest",
  );
  mockStatic(
    "POST",
    ["**/api/v1/matches/request/*/reject", "**/api/matches/request/*/reject"],
    { id: 9001, quizSetId: 101, requesterId: 501, receiverId: "user-e1e", status: "REJECTED" },
    "rejectMatchRequest",
  );
  mockFixture("POST", ["**/api/v1/matches/group/join", "**/api/matches/group/join"], "group-join.json", "joinGroupMatch");
  cy.intercept("POST", "**/api/**/matches/group/decline", emptySuccessResponse()).as("declineGroupMatch");

  const systemPeriod = (Cypress.env("systemPeriod") as PeriodName | undefined) ?? "QUIZ";
  mockStatic("GET", ["**/api/system/state", "**/api/v1/system/state"], {
    year: 2026,
    month: 6,
    week: 1,
    period: API_PERIOD_BY_NAME[systemPeriod],
  }, "getSystemState");
  mockFixture("POST", ["**/api/users/local-login", "**/api/v1/users/local-login"], "local-login.json", "localLogin");
  // 토큰 refresh는 credentials:'include'로 요청되므로 응답에도
  // access-control-allow-credentials/origin echo 헤더가 필요하다(와일드카드 불가).
  cy.fixture("local-login.json").then((data: unknown) => {
    ["**/api/v1/users/auth/refresh", "**/api/users/auth/refresh"].forEach((url, index) => {
      cy.intercept("POST", url, (req) => {
        req.reply({
          statusCode: 200,
          headers: {
            "access-control-allow-origin": req.headers.origin ?? "*",
            "access-control-allow-credentials": "true",
          },
          body: { success: true, data },
        });
      }).as(index === 0 ? "refreshToken" : `refreshToken${index + 1}`);
    });
  });
  mockStatic("GET", ["**/api/v1/users/me", "**/api/users/me"], {
    name: null,
    phoneNumber: null,
    gender: null,
    email: null,
    birthDate: null,
  }, "getCurrentUser");
  mockStatic("GET", ["**/api/v1/users/nickname/*/availability", "**/api/users/nickname/*/availability"], { available: true }, "checkNickname");
  mockFixture("POST", ["**/api/v1/users", "**/api/users"], "user.json", "createUser");
  mockFixture("GET", ["**/api/users/*/profile", "**/api/v1/users/*/profile"], "public-profile.json", "getUserProfile");
  mockFixture("GET", ["**/api/users/*/intro-notes", "**/api/v1/users/*/intro-notes"], "intro-notes.json", "getUserIntroNotes");
mockFixture("GET", ["**/api/users/*/ratings", "**/api/v1/users/*/ratings"], "user-ratings.json", "getUserRatings");

  // 1:1 채팅(PR #103/#105). 방 생성·상세·나가기 엔드포인트는 사라졌고,
  // 메시지 전송은 REST가 아니라 STOMP라 여기서 목킹하지 않는다.
  mockFixture("GET", ["**/api/v1/chat/rooms", "**/api/chat/rooms"], "chat-rooms.json", "getChatRooms");
  // 그룹 방(roomId 3)도 같은 경로를 쓴다. 화자가 여럿인 히스토리를 돌려주려고 방별로 나눈다.
  cy.fixture("chat-messages.json").then((oneOnOne) => {
    cy.fixture("group-chat-messages.json").then((group) => {
      cy.intercept("GET", "**/api/**/chat/rooms/*/messages*", (req) => {
        const roomId = new URL(req.url).pathname.match(/\/chat\/rooms\/([^/]+)\/messages/)?.[1];
        req.reply(successResponse(roomId === "3" ? group : oneOnOne));
      }).as("getChatMessages");
    });
  });
  cy.intercept("POST", "**/api/**/chat/rooms/*/end", emptySuccessResponse()).as("endChatRoom");
  cy.intercept("POST", "**/api/**/chat/rooms/*/read", emptySuccessResponse()).as("markChatAsRead");
  cy.intercept("POST", "**/api/**/chat/rooms/*/image-upload-urls", (req) => {
    const body = req.body as { files?: { contentType: string }[] };
    req.reply(
      successResponse({
        uploads: (body.files ?? []).map((_, index) => ({
          objectKey: `chat/1/cy-key-${index}`,
          uploadUrl: `http://localhost:3100/mock-chat-s3/${index}`,
        })),
      }),
    );
  }).as("chatImageUploadUrls");
  cy.intercept("PUT", "**/mock-chat-s3/*", { statusCode: 200, body: "" }).as("chatImagePut");

  // 평가(member-reviews). 채팅방 목록이 평가 진입점을 그리려고 항상 조회하므로
  // 개별 스펙이 아니라 여기서 기본 목킹한다.
  mockFixture(
    "GET",
    ["**/api/v1/member-reviews", "**/api/member-reviews"],
    options.memberReviewsFixture ?? "member-reviews.json",
    "getMemberReviews",
  );
  cy.intercept("PUT", "**/api/**/member-reviews/*/targets/*", (req) => {
    const body = req.body as { wantsOneToOneRematch?: boolean };
    req.reply(
      successResponse({
        reviewId: 11,
        status: "COMPLETED",
        answeredTargetCount: 1,
        totalTargetCount: 1,
        completedAt: "2026-06-06 10:30:00",
        rematch: body.wantsOneToOneRematch
          ? { matchedMemberId: 3, matchedAt: "2026-06-06 10:30:00" }
          : null,
      }),
    );
  }).as("submitMemberReview");

  return cy.wrap(undefined, { log: false });
});
