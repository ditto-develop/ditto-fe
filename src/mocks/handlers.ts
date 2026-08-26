import { http, HttpResponse } from "msw";

import type {
  MeetingStatus,
  MemberReview,
  ReviewSubmitResult,
} from "@/features/rating";
import type { CastVoteRequest, CreateGroupVoteRequest } from "@/features/chat";
import {
  castVote as castMockVote,
  closeVote as closeMockVote,
  createVote as createMockVote,
  findVote as findMockVote,
  hasOpenVote as hasMockOpenVote,
  listVotes as listMockVotes,
} from "@/mocks/voteStore";

import chatMessages from "@/mocks/fixtures/chat-messages.json";
import chatRooms from "@/mocks/fixtures/chat-rooms.json";
import groupChatMessages from "@/mocks/fixtures/group-chat-messages.json";
import blockedUsersFixture from "@/mocks/fixtures/blocked-users.json";
import currentUser from "@/mocks/fixtures/current-user.json";
import groupJoin from "@/mocks/fixtures/group-join.json";
import introNotes from "@/mocks/fixtures/intro-notes.json";
import localLogin from "@/mocks/fixtures/local-login.json";
import matchRequest from "@/mocks/fixtures/match-request.json";
import matchesOneOnOne from "@/mocks/fixtures/matches-one-on-one.json";
import matchingStatus from "@/mocks/fixtures/matching-status.json";
import myProfile from "@/mocks/fixtures/my-profile.json";
import myRatings from "@/mocks/fixtures/my-ratings.json";
import myStats from "@/mocks/fixtures/my-stats.json";
import notificationSettingsFixture from "@/mocks/fixtures/notification-settings.json";
import notificationsFixture from "@/mocks/fixtures/notifications.json";
import publicProfile from "@/mocks/fixtures/public-profile.json";
import quizCurrent from "@/mocks/fixtures/quiz-current.json";
import quizProgressCurrent from "@/mocks/fixtures/quiz-progress-current.json";
import quizSetWithProgress from "@/mocks/fixtures/quiz-set-with-progress.json";
import systemState from "@/mocks/fixtures/system-state.json";
import user from "@/mocks/fixtures/user.json";
import memberReviews from "@/mocks/fixtures/member-reviews.json";
import mySanction from "@/mocks/fixtures/my-sanction.json";
import {
  adminActiveQuizSets,
  adminDummyMatchResult,
  adminLoginResult,
  adminMatchCandidateList,
  adminMatchList,
  adminQuizProgress,
  adminSeedResult,
  adminStats,
  adminUsers,
} from "@/mocks/adminData";

type SuccessEnvelope = {
  success: true;
  data: unknown;
};

function success(data: unknown): SuccessEnvelope {
  return {
    success: true,
    data,
  };
}

function apiPath(path: string): RegExp {
  return new RegExp(`/api(?:/v1)?${path}(?:\\?.*)?$`);
}

/** 실패 응답 봉투. 화면이 error.code로 분기하므로 코드까지 채워 준다. */
function failure(code: string, message: string, statusCode: number) {
  return HttpResponse.json(
    { success: false, data: null, error: { code, message, statusCode } },
    { status: statusCode },
  );
}

/** `/chat/rooms/{roomId}/...` 경로에서 roomId를 뽑는다. */
function roomIdFromUrl(url: string): number {
  return Number(new URL(url).pathname.match(/\/chat\/rooms\/([^/]+)/)?.[1]);
}

function voteIdFromUrl(url: string): number {
  return Number(new URL(url).pathname.match(/\/votes\/([^/]+)/)?.[1]);
}

const emptyList = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
};

/**
 * 어드민 '시간 임시 조정'의 목업 상태. 라이브 BE는 Redis에 저장하지만 목업은 인메모리다
 * — 새로고침하면 초기화된다. 이 값이 /system/state의 period로 그대로 나가야
 * 오버라이드가 화면(홈·채팅 개방 판정)에 실제로 반영된다.
 */
let systemPeriodOverride: string | null = null;

let notificationSettings = { ...notificationSettingsFixture };
let blockedUsers = [...blockedUsersFixture];

/**
 * 평가 목업 상태(인메모리 — 새로고침하면 초기화된다).
 *
 * 실제 BE와 맞춰야 하는 규칙:
 * - 완료(COMPLETED)된 평가는 목록에서 사라진다.
 * - 마지막 대상을 제출하면 자동으로 완료된다.
 * - 그룹에서 양쪽이 재매칭을 원하면 성사되고 rematch가 실린다.
 *   목업에는 상대가 없으므로 wantsOneToOneRematch=true를 성사로 간주한다.
 */
type MockReviewSubmitBody = {
  meetingStatus: MeetingStatus;
  rating: number;
  comment: string | null;
  wantsOneToOneRematch?: boolean;
};

const mockReviews: MemberReview[] = JSON.parse(JSON.stringify(memberReviews)) as MemberReview[];

function listOpenReviews(): MemberReview[] {
  return mockReviews.filter((review) => review.status !== "COMPLETED");
}

function answerReviewTarget(
  reviewId: number,
  memberId: number,
  body: MockReviewSubmitBody,
): ReviewSubmitResult {
  const review = mockReviews.find((item) => item.reviewId === reviewId);
  if (!review) {
    return {
      reviewId,
      status: "IN_PROGRESS",
      answeredTargetCount: 0,
      totalTargetCount: 0,
      completedAt: null,
      rematch: null,
    };
  }

  const target = review.targets.find((item) => item.memberId === memberId);
  if (target && target.answeredAt === null) {
    target.meetingStatus = body.meetingStatus;
    target.rating = body.rating;
    target.comment = body.comment;
    target.answeredAt = "2026-08-03 10:00:00";
  }

  review.answeredTargetCount = review.targets.filter((item) => item.answeredAt !== null).length;
  review.status =
    review.answeredTargetCount >= review.totalTargetCount ? "COMPLETED" : "IN_PROGRESS";

  return {
    reviewId,
    status: review.status,
    answeredTargetCount: review.answeredTargetCount,
    totalTargetCount: review.totalTargetCount,
    completedAt: review.status === "COMPLETED" ? "2026-08-03 10:30:00" : null,
    rematch: body.wantsOneToOneRematch
      ? { matchedMemberId: memberId, matchedAt: "2026-08-03 10:30:00" }
      : null,
  };
}

// 알림 목록은 '오늘 / 지난 소식' 구간과 상대 시간 표기가 항상 의미를 갖도록
// 고정 시각 대신 요청 시점 기준 상대 오프셋(minutesAgo)으로 만들어 준다.
type NotificationFixture = (typeof notificationsFixture)[number];
let readNotificationIds = new Set<number>(
  notificationsFixture.filter((item) => item.read).map((item) => item.id),
);

/** 라이브 BE의 시각 포맷은 ISO가 아니라 `yyyy-MM-dd HH:mm:ss`다. */
function toServerDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function toNotification(item: NotificationFixture, now: number) {
  return {
    id: item.id,
    type: item.type,
    category: item.category,
    title: item.title,
    body: item.body,
    targetId: item.targetId,
    createdAt: toServerDateTime(now - item.minutesAgo * 60 * 1000),
    // 안읽음 판정은 readAt이 null인지로 한다(라이브 계약).
    readAt: readNotificationIds.has(item.id) ? toServerDateTime(now) : null,
  };
}

export const handlers = [
  http.get(apiPath("/quiz-sets/current-week"), () => HttpResponse.json(success(quizCurrent))),
  http.get(apiPath("/quiz-progress/current"), () => HttpResponse.json(success(quizProgressCurrent))),
  http.get(apiPath("/quiz-progress/quiz-sets/[^/]+"), () => HttpResponse.json(success(quizSetWithProgress))),
  http.post(apiPath("/quiz-progress/answers"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/quiz-progress/reset"), () => HttpResponse.json(success(null))),

  http.get(apiPath("/matches/1on1"), () => HttpResponse.json(success(matchesOneOnOne))),
  http.get(apiPath("/matching/status/[^/]+"), () => HttpResponse.json(success(matchingStatus))),
  http.post(apiPath("/matches/request"), () => HttpResponse.json(success(matchRequest))),
  http.post(apiPath("/matches/request/[^/]+/accept"), () => HttpResponse.json(success(matchRequest))),
  http.post(apiPath("/matches/request/[^/]+/reject"), () => HttpResponse.json(success(matchRequest))),
  http.post(apiPath("/matches/group/join"), () => HttpResponse.json(success(groupJoin))),
  http.post(apiPath("/matches/group/decline"), () => HttpResponse.json(success(null))),

  // 평가는 대상 한 명씩 PUT으로 확정된다. 진행률/완료가 화면 분기를 좌우하므로 인메모리로 상태를 들고 간다.
  http.get(apiPath("/member-reviews"), () => HttpResponse.json(success(listOpenReviews()))),
  http.put(
    apiPath("/member-reviews/([^/]+)/targets/([^/]+)"),
    async ({ request }) => {
      const [, reviewId, memberId] = new URL(request.url).pathname.match(
        /\/member-reviews\/([^/]+)\/targets\/([^/]+)/,
      ) ?? [];
      const body = (await request.json()) as MockReviewSubmitBody;
      return HttpResponse.json(success(answerReviewTarget(Number(reviewId), Number(memberId), body)));
    },
  ),

  http.get(apiPath("/system/state"), () =>
    HttpResponse.json(
      success({ ...systemState, period: systemPeriodOverride ?? systemState.period }),
    ),
  ),
  http.post(apiPath("/users/local-login"), () => HttpResponse.json(success(localLogin))),
  // admin 로그인: /admin/login → POST /api/users/login → data.accessToken 저장
  http.post(apiPath("/users/login"), () => HttpResponse.json(success(adminLoginResult))),
  http.post(apiPath("/users/auth/refresh"), () => HttpResponse.json(success(localLogin))),
  http.post(apiPath("/users/auth/logout"), () => HttpResponse.json(success(null))),
  // admin 사용자 목록(GET) — POST /users(가입)와 메서드로 구분
  http.get(apiPath("/users"), () => HttpResponse.json(success(adminUsers))),
  http.post(apiPath("/users"), () => HttpResponse.json(success(user))),
  // 카카오 로그인 직후 회원가입 단계와 설정 화면에서 받아오는 현재 사용자 정보
  http.get(apiPath("/users/me"), () => HttpResponse.json(success(currentUser))),
  http.get(apiPath("/users/me/notification-settings"), () => HttpResponse.json(success(notificationSettings))),
  http.patch(apiPath("/users/me/notification-settings"), async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const patch = body && typeof body === "object" ? body : {};
    notificationSettings = { ...notificationSettings, ...patch };
    return HttpResponse.json(success(notificationSettings));
  }),
  // BE와 같이 최신순으로 준다. blockedAt은 `yyyy-MM-dd HH:mm:ss`라 문자열 비교로도 시간순이 된다.
  http.get(apiPath("/users/me/blocks"), () => {
    const sorted = [...blockedUsers].sort((left, right) =>
      right.blockedAt.localeCompare(left.blockedAt),
    );
    return HttpResponse.json(success(sorted));
  }),
  // 경로의 id는 차단된 회원 ID(int64)다. 멱등이라 없는 대상이어도 성공으로 답한다.
  http.delete(apiPath("/users/me/blocks/[^/]+"), ({ request }) => {
    const id = request.url.split("/").pop();
    blockedUsers = blockedUsers.filter((userItem) => String(userItem.id) !== id);
    return HttpResponse.json(success(null));
  }),
  http.get(apiPath("/notifications/unread-count"), () =>
    HttpResponse.json(
      success({
        count: notificationsFixture.filter((item) => !readNotificationIds.has(item.id)).length,
      }),
    ),
  ),
  // 목록은 배열이 아니라 `{ notifications, nextCursor }` 래퍼다. category는 서버 필터.
  http.get(apiPath("/notifications"), ({ request }) => {
    const now = Date.now();
    const category = new URL(request.url).searchParams.get("category");
    const visible = category
      ? notificationsFixture.filter((item) => item.category === category)
      : notificationsFixture;

    return HttpResponse.json(
      success({
        notifications: visible.map((item) => toNotification(item, now)),
        nextCursor: null,
      }),
    );
  }),
  http.put(apiPath("/notifications/read-all"), () => {
    const readCount = notificationsFixture.filter(
      (item) => !readNotificationIds.has(item.id),
    ).length;
    readNotificationIds = new Set(notificationsFixture.map((item) => item.id));
    return HttpResponse.json(success({ readCount }));
  }),
  http.put(apiPath("/notifications/[^/]+/read"), ({ request }) => {
    const id = Number(request.url.split("/").filter(Boolean).at(-2));
    if (Number.isFinite(id)) readNotificationIds.add(id);
    return HttpResponse.json(success({}));
  }),

  // 신고(PR #97): presigned URL 발급 → S3 PUT → 접수.
  // 목업에서는 uploadUrl로 아래 /mock-s3-upload 핸들러를 돌려준다.
  http.post(apiPath("/user-reports/image-upload-urls"), async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { files?: unknown[] } | null;
    const files = Array.isArray(body?.files) ? body.files : [];
    return HttpResponse.json(
      success({
        uploads: files.map((_, index) => ({
          objectKey: `pending/user-reports/1/mock-object-key-${index}`,
          uploadUrl: `${new URL(request.url).origin}/mock-s3-upload/${index}`,
        })),
      }),
    );
  }),
  http.put("*/mock-s3-upload/*", () => new HttpResponse(null, { status: 200 })),
  http.post(apiPath("/user-reports"), () => HttpResponse.json(success({ id: 321 }))),

  http.get(apiPath("/users/me/sanction"), () => HttpResponse.json(success(mySanction))),

  http.post(apiPath("/users/[^/]+/leave"), () => HttpResponse.json(success(user))),
  http.get(apiPath("/users/nickname/[^/]+/availability"), () => HttpResponse.json(success({ available: true }))),
  http.get(apiPath("/users/me/profile"), () => HttpResponse.json(success(myProfile))),
  http.patch(apiPath("/users/me/profile"), async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const profilePatch = body && typeof body === "object" ? body : {};
    return HttpResponse.json(success({ ...myProfile, ...profilePatch }));
  }),
  http.get(apiPath("/users/me/stats"), () => HttpResponse.json(success(myStats))),
  http.get(apiPath("/users/me/ratings"), () => HttpResponse.json(success(myRatings))),
  http.get(apiPath("/users/[^/]+/profile"), () => HttpResponse.json(success(publicProfile))),
  http.get(apiPath("/users/[^/]+/intro-notes"), () => HttpResponse.json(success(introNotes))),
  http.get(apiPath("/users/me/intro-notes"), () => HttpResponse.json(success(introNotes))),
  http.put(apiPath("/users/me/intro-notes/[^/]+"), () => HttpResponse.json(success(introNotes))),
  http.get(apiPath("/users/[^/]+/answers"), () => HttpResponse.json(success([]))),
  http.get(apiPath("/users/[^/]+/ratings"), () => HttpResponse.json(success([]))),
  http.post(apiPath("/users/[^/]+/ratings"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/auth/kakao/callback"), () => HttpResponse.json(success(localLogin))),

  // 채팅(PR #103/#105/#119/#128 계약). 1:1·그룹·재매칭이 모두 이 경로를 쓴다.
  // 메시지 전송은 REST가 아니라 STOMP라 여기엔 없다.
  http.get(apiPath("/chat/rooms"), () => HttpResponse.json(success(chatRooms))),
  http.get(apiPath("/chat/rooms/[^/]+/messages"), ({ request }) => {
    const url = new URL(request.url);
    const roomId = url.pathname.match(/\/chat\/rooms\/([^/]+)\/messages/)?.[1];
    const page = roomId === "3" ? groupChatMessages : chatMessages;

    // cursor가 오면 그보다 과거 구간을 돌려주고, 더 없으면 nextCursor를 null로 끝낸다.
    const cursor = url.searchParams.get("cursor");
    if (!cursor) return HttpResponse.json(success(page));

    const older = page.messages.filter((message) => message.id < Number(cursor));
    return HttpResponse.json(success({ messages: older, nextCursor: null }));
  }),
  http.post(apiPath("/chat/rooms/[^/]+/read"), () => HttpResponse.json(success(null))),
  // 종료는 멱등이고 응답 data가 비어 있다. 그룹 방이면 BE가 7002로 막는다.
  http.post(apiPath("/chat/rooms/[^/]+/end"), () => HttpResponse.json(success({}))),
  http.post(apiPath("/chat/rooms/[^/]+/image-upload-urls"), async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { files?: unknown[] } | null;
    const files = Array.isArray(body?.files) ? body.files : [];
    return HttpResponse.json(
      success({
        uploads: files.map((_, index) => ({
          objectKey: `chat/1/mock-object-key-${index}`,
          uploadUrl: `${new URL(request.url).origin}/mock-s3-upload/chat-${index}`,
        })),
      }),
    );
  }),
  // 나가기는 멱등이고 응답 data가 비어 있다. 1:1에 불러도 서버가 end와 동일하게 처리한다.
  http.post(apiPath("/chat/rooms/[^/]+/leave"), () => HttpResponse.json(success({}))),

  // 그룹 방은 /chat/rooms 계약으로 통합됐다(BE #119). group-rooms 핸들러는 더 이상 없다.
  //
  // 만남 투표. 다섯 엔드포인트가 모두 같은 상세를 돌려주는 계약이라, 목업도 인메모리
  // 상태를 실제로 갱신한다(voteStore). 장소 검색은 카카오 SDK 직접 호출이라 핸들러가 없다.
  http.get(apiPath("/chat/rooms/[^/]+/votes"), ({ request }) =>
    HttpResponse.json(success(listMockVotes(roomIdFromUrl(request.url)))),
  ),
  http.post(apiPath("/chat/rooms/[^/]+/votes"), async ({ request }) => {
    const roomId = roomIdFromUrl(request.url);
    // 방당 열린 투표는 하나뿐이다.
    if (hasMockOpenVote(roomId)) {
      return failure("8202", "이미 진행 중인 투표가 있습니다.", 409);
    }

    const body = (await request.json()) as CreateGroupVoteRequest;
    return HttpResponse.json(success(createMockVote(roomId, body)));
  }),
  http.get(apiPath("/chat/rooms/[^/]+/votes/[^/]+"), ({ request }) => {
    const vote = findMockVote(roomIdFromUrl(request.url), voteIdFromUrl(request.url));
    if (!vote) return failure("8201", "존재하지 않는 투표입니다.", 404);
    return HttpResponse.json(success(vote));
  }),
  http.post(apiPath("/chat/rooms/[^/]+/votes/[^/]+/cast"), async ({ request }) => {
    const vote = findMockVote(roomIdFromUrl(request.url), voteIdFromUrl(request.url));
    if (!vote) return failure("8201", "존재하지 않는 투표입니다.", 404);
    if (vote.status === "CLOSED") return failure("8203", "이미 마감된 투표입니다.", 409);

    const body = (await request.json()) as CastVoteRequest;
    if (!vote.allowMultiple && (body.placeIds.length > 1 || body.timeIds.length > 1)) {
      return failure("8207", "복수 선택이 허용되지 않은 투표입니다.", 400);
    }

    return HttpResponse.json(success(castMockVote(vote, body)));
  }),
  // 마감은 멱등이다 — 이미 닫힌 투표에 다시 보내도 성공으로 답한다.
  http.post(apiPath("/chat/rooms/[^/]+/votes/[^/]+/close"), ({ request }) => {
    const vote = findMockVote(roomIdFromUrl(request.url), voteIdFromUrl(request.url));
    if (!vote) return failure("8201", "존재하지 않는 투표입니다.", 404);
    return HttpResponse.json(success(closeMockVote(vote)));
  }),

  http.get(apiPath("/admin/stats"), () => HttpResponse.json(success(adminStats))),
  http.get(apiPath("/admin/matches"), () => HttpResponse.json(success(adminMatchList))),
  http.get(apiPath("/admin/quiz-progress"), () => HttpResponse.json(success(adminQuizProgress))),
  http.get(apiPath("/admin/users/[^/]+/match-candidates"), () => HttpResponse.json(success(adminMatchCandidateList))),
  http.get(apiPath("/admin/quiz-sets/active"), () => HttpResponse.json(success(adminActiveQuizSets))),
  http.post(apiPath("/admin/system/override"), async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { period?: string } | null;
    if (body?.period) systemPeriodOverride = body.period;
    return HttpResponse.json(success(null));
  }),
  http.delete(apiPath("/admin/system/override"), () => {
    systemPeriodOverride = null;
    return HttpResponse.json(success(null));
  }),
  http.post(apiPath("/admin/quiz-progress/reset"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/admin/seed-dummy"), () => HttpResponse.json(success(adminSeedResult))),
  http.post(apiPath("/admin/match-requests/dummy-request"), () => HttpResponse.json(success(adminDummyMatchResult))),
  http.get(apiPath("/quizzes"), () => HttpResponse.json(success(emptyList))),
  http.post(apiPath("/quizzes"), () => HttpResponse.json(success(null))),
  http.get(apiPath("/quizzes/[^/]+"), () => HttpResponse.json(success(null))),
  http.patch(apiPath("/quizzes/[^/]+"), () => HttpResponse.json(success(null))),
  http.delete(apiPath("/quizzes/[^/]+"), () => HttpResponse.json(success(null))),
  http.get(apiPath("/quiz-sets"), () => HttpResponse.json(success(emptyList))),
  http.post(apiPath("/quiz-sets"), () => HttpResponse.json(success(null))),
  http.get(apiPath("/quiz-sets/[^/]+"), () => HttpResponse.json(success(quizSetWithProgress))),
  http.patch(apiPath("/quiz-sets/[^/]+"), () => HttpResponse.json(success(null))),
  http.delete(apiPath("/quiz-sets/[^/]+"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/quiz-sets/[^/]+/activate"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/quiz-sets/[^/]+/deactivate"), () => HttpResponse.json(success(null))),
  http.patch(apiPath("/quiz-sets/[^/]+/reorder"), () => HttpResponse.json(success(null))),
  http.get(apiPath("/roles"), () => HttpResponse.json(success([]))),
  http.get(apiPath("/roles/[^/]+"), () => HttpResponse.json(success(null))),

  http.all(/\/api(?:\/v1)?\/.*(?:\?.*)?$/, ({ request }) => {
    console.warn(`[MSW] Add a fixture-backed handler for ${request.method} ${request.url}`);
    return HttpResponse.json(success(null));
  }),
];
