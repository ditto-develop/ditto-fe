type LoginOptions = {
  accessToken?: string;
  refreshToken?: string;
};

type MockApiOptions = {
  matchesFixture?: string;
  matchingStatusFixture?: string;
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

Cypress.Commands.add("login", (options: LoginOptions = {}) => {
  const accessToken = options.accessToken ?? TEST_ACCESS_TOKEN;
  const refreshToken = options.refreshToken ?? TEST_REFRESH_TOKEN;

  return cy.window().then((win) => {
    win.localStorage.setItem("accessToken", accessToken);
    win.localStorage.setItem("refreshToken", refreshToken);
  });
});

Cypress.Commands.add("mockApi", (options: MockApiOptions = {}) => {
  cy.intercept("OPTIONS", "**/api/**", {
    statusCode: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "authorization,content-type,x-api-key,accept",
    },
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

  mockFixture("GET", ["**/api/system/state", "**/api/v1/system/state"], "system-state.json", "getSystemState");
  mockFixture("POST", ["**/api/users/local-login", "**/api/v1/users/local-login"], "local-login.json", "localLogin");
  mockFixture("POST", ["**/api/v1/users/auth/refresh", "**/api/users/auth/refresh"], "local-login.json", "refreshToken");
  mockStatic("GET", ["**/api/v1/users/nickname/*/availability", "**/api/users/nickname/*/availability"], { available: true }, "checkNickname");
  mockFixture("POST", ["**/api/v1/users", "**/api/users"], "user.json", "createUser");
  mockFixture("GET", ["**/api/users/*/profile", "**/api/v1/users/*/profile"], "public-profile.json", "getUserProfile");
  mockFixture("GET", ["**/api/users/*/intro-notes", "**/api/v1/users/*/intro-notes"], "intro-notes.json", "getUserIntroNotes");
  mockFixture("GET", ["**/api/users/*/answers", "**/api/v1/users/*/answers"], "answers-comparison.json", "getUserAnswers");
  mockFixture("GET", ["**/api/users/*/ratings", "**/api/v1/users/*/ratings"], "user-ratings.json", "getUserRatings");

  mockFixture("GET", ["**/api/chat/rooms", "**/api/v1/chat/rooms"], "chat-rooms.json", "getChatRooms");
  mockFixture("POST", ["**/api/chat/rooms", "**/api/v1/chat/rooms"], "chat-room-item.json", "createChatRoom");
  mockFixture("GET", ["**/api/chat/rooms/*", "**/api/v1/chat/rooms/*"], "chat-room-detail.json", "getChatRoomDetail");
  mockFixture("GET", ["**/api/chat/rooms/*/messages*", "**/api/v1/chat/rooms/*/messages*"], "chat-messages.json", "getChatMessages");
  mockFixture("POST", ["**/api/chat/rooms/*/messages", "**/api/v1/chat/rooms/*/messages"], "chat-message-sent.json", "sendChatMessage");
  cy.intercept("PATCH", "**/api/**/chat/rooms/*/read", {
    statusCode: 200,
    body: { success: true },
  }).as("markChatAsRead");

  return cy.wrap(undefined, { log: false });
});
