// localhost 목업 전용 admin 데이터. dev(MSW)에서만 사용되며 프로덕션 빌드엔 포함되지 않는다.
// admin 페이지들이 기대하는 응답 shape에 맞춰 작성됨(src/app/admin/**).

export const adminLoginResult = {
  // /admin/login → POST /api/users/login → data.accessToken 저장(adminAccessToken)
  accessToken: "mock-admin-access-token",
  refreshToken: "mock-admin-refresh-token",
};

export const adminUsers = [
  {
    id: "501",
    name: "김수민",
    nickname: "수민",
    email: "sumin@ditto.pics",
    phoneNumber: "010-1111-2222",
    gender: "FEMALE",
    age: 27,
    joinedAt: "2026-05-20T09:00:00.000Z",
    role: { code: "USER", name: "일반" },
  },
  {
    id: "502",
    name: "이준호",
    nickname: "준호",
    email: "junho@ditto.pics",
    phoneNumber: "010-3333-4444",
    gender: "MALE",
    age: 29,
    joinedAt: "2026-05-21T09:00:00.000Z",
    role: { code: "USER", name: "일반" },
  },
  {
    id: "1",
    name: "관리자",
    nickname: "admin",
    email: "admin@ditto.pics",
    phoneNumber: "010-0000-0000",
    gender: "MALE",
    age: 30,
    joinedAt: "2026-05-01T09:00:00.000Z",
    role: { code: "ADMIN", name: "관리자" },
  },
];

export const adminStats = {
  users: 42,
  quizSets: 6,
  quizzes: 72,
  matchRequests: 18,
  chatRooms: 7,
  ratings: 25,
  matchRequestsByStatus: {
    PENDING: 5,
    ACCEPTED: 8,
    REJECTED: 3,
    CANCELLED: 1,
    EXPIRED: 1,
  },
};

export const adminSeedResult = {
  createdUsers: 20,
  oneToOneUsers: 12,
  groupUsers: 8,
  matchRequests: 10,
  chatRooms: 4,
};

export const adminMatchCandidateList = {
  quizSetId: "101",
  matchingType: "ONE_TO_ONE",
  algorithmVersion: "v1",
  candidates: [
    {
      userId: "502",
      nickname: "준호",
      gender: "MALE",
      age: 29,
      introduction: "운동과 영화를 좋아해요.",
      location: "seoul",
      profileImageUrl: "/assets/avatar/m1.png",
      matchRate: 83,
      scoreBreakdown: {
        quizMatchRate: 83,
        matchedQuestions: 10,
        totalQuestions: 12,
        reasons: [],
      },
    },
  ],
};

export const adminActiveQuizSets = [
  {
    id: "101",
    title: "이번 주 1:1 매칭 퀴즈",
    matchingType: "ONE_TO_ONE",
    isActive: true,
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-07T23:59:59.000Z",
  },
];

// GET /admin/matches → ApiResponse.data = MatchListResponse({ data: MatchRequest[], total, page, limit })
export const adminMatchList = {
  data: [
    {
      id: "9001",
      quizSetId: "101",
      fromUserId: "502",
      fromUserNickname: "준호",
      toUserId: "501",
      toUserNickname: "수민",
      status: "PENDING",
      score: 83,
      matchingType: "ONE_TO_ONE",
      algorithmVersion: "v1",
      requestedAt: "2026-06-04T01:00:00.000Z",
      respondedAt: null,
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

// GET /admin/quiz-progress → { year, month, week, items: QuizProgressItem[], total }
export const adminQuizProgress = {
  year: 2026,
  month: 6,
  week: 1,
  total: 2,
  items: [
    {
      userId: "501",
      nickname: "수민",
      email: "sumin@ditto.pics",
      quizSetId: "101",
      quizSetTitle: "이번 주 1:1 매칭 퀴즈",
      matchingType: "ONE_TO_ONE",
      status: "COMPLETED",
      totalQuizzes: 12,
      completedAt: "2026-06-03T10:00:00.000Z",
      selectedAt: "2026-06-02T10:00:00.000Z",
    },
    {
      userId: "502",
      nickname: "준호",
      email: "junho@ditto.pics",
      quizSetId: "101",
      quizSetTitle: "이번 주 1:1 매칭 퀴즈",
      matchingType: "GROUP",
      status: "IN_PROGRESS",
      totalQuizzes: 12,
      completedAt: null,
      selectedAt: "2026-06-02T11:00:00.000Z",
    },
  ],
};

// POST /admin/match-requests/dummy-request → DummyMatchResult
export const adminDummyMatchResult = {
  id: "9002",
  fromUserNickname: "준호",
  toUserNickname: "수민",
  quizSetId: "101",
  status: "PENDING",
  score: 83,
  alreadyExists: false,
};
