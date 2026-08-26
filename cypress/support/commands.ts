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

/**
 * 투표 인메모리 목업이 다루는 최소 형태.
 * 화면 타입(GroupVote)을 그대로 쓰지 않는 것은, 테스트가 앱 타입 변경에 끌려다니지 않도록
 * 응답 계약만 붙잡아 두기 위함이다.
 */
type VoteOptionLike = { optionId: number; voterIds: number[] };

type GroupVoteLike = {
  voteId: number;
  roomId: number;
  status: "OPEN" | "CLOSED";
  allowMultiple: boolean;
  createdBy: number;
  createdAt: string;
  closedAt: string | null;
  totalMembers: number;
  votedCount: number;
  placeOptions: Array<VoteOptionLike & {
    label: string;
    address: string | null;
    mapLink: string | null;
    latitude: number | null;
    longitude: number | null;
  }>;
  timeOptions: Array<VoteOptionLike & { meetAt: string }>;
  myVote: { placeIds: number[]; timeIds: number[] } | null;
};

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
  cy.intercept("POST", "**/api/**/chat/rooms/*/leave", emptySuccessResponse()).as("leaveChatRoom");

  // 만남 투표. 다섯 엔드포인트가 모두 같은 상세를 돌려주는 계약이라, 스텁만으로는
  // 화면이 돌지 않는다(내 표가 반영되지 않아 제출 화면에서 못 빠져나온다).
  // 테스트마다 새로 만드는 인메모리 상태를 실제로 갱신한다.
  cy.fixture("group-votes.json").then((seed: GroupVoteLike[]) => {
    const votes: GroupVoteLike[] = JSON.parse(JSON.stringify(seed));
    const findVote = (url: string) => {
      const voteId = Number(new URL(url).pathname.match(/\/votes\/([^/]+)/)?.[1]);
      return votes.find((vote) => vote.voteId === voteId);
    };

    cy.intercept("GET", "**/api/**/chat/rooms/*/votes", (req) => {
      req.reply(successResponse(votes));
    }).as("getRoomVotes");

    cy.intercept("POST", "**/api/**/chat/rooms/*/votes", (req) => {
      const body = req.body as {
        allowMultiple: boolean;
        placeOptions: { label: string }[];
        timeOptions: { meetAt: string }[];
      };
      let nextOptionId = 900;
      const created: GroupVoteLike = {
        voteId: 99,
        roomId: 3,
        status: "OPEN",
        allowMultiple: body.allowMultiple,
        createdBy: 1,
        createdAt: "2026-06-05 18:30:00",
        closedAt: null,
        totalMembers: 4,
        votedCount: 0,
        placeOptions: body.placeOptions.map((option) => ({
          optionId: (nextOptionId += 1),
          label: option.label,
          address: null,
          mapLink: null,
          latitude: null,
          longitude: null,
          voterIds: [],
        })),
        timeOptions: body.timeOptions.map((option) => ({
          optionId: (nextOptionId += 1),
          meetAt: option.meetAt,
          voterIds: [],
        })),
        myVote: null,
      };
      votes.unshift(created);
      req.reply(successResponse(created));
    }).as("createVote");

    cy.intercept("GET", "**/api/**/chat/rooms/*/votes/*", (req) => {
      req.reply(successResponse(findVote(req.url)));
    }).as("getVote");

    cy.intercept("POST", "**/api/**/chat/rooms/*/votes/*/cast", (req) => {
      const vote = findVote(req.url);
      const body = req.body as { placeIds: number[]; timeIds: number[] };
      if (!vote) return;

      // 보낸 집합이 최종 선택으로 치환된다(덧붙이기가 아니다).
      const MY_ID = 1;
      const apply = (options: VoteOptionLike[], selected: number[]) =>
        options.map((option) => ({
          ...option,
          voterIds: selected.includes(option.optionId)
            ? [...option.voterIds.filter((id) => id !== MY_ID), MY_ID]
            : option.voterIds.filter((id) => id !== MY_ID),
        }));

      if (vote.myVote === null) vote.votedCount += 1;
      vote.placeOptions = apply(vote.placeOptions, body.placeIds);
      vote.timeOptions = apply(vote.timeOptions, body.timeIds);
      vote.myVote = { placeIds: body.placeIds, timeIds: body.timeIds };
      req.reply(successResponse(vote));
    }).as("castVote");

    // 마감은 멱등이다.
    cy.intercept("POST", "**/api/**/chat/rooms/*/votes/*/close", (req) => {
      const vote = findVote(req.url);
      if (!vote) return;
      vote.status = "CLOSED";
      vote.closedAt = "2026-06-05 19:00:00";
      req.reply(successResponse(vote));
    }).as("closeVote");
  });
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
