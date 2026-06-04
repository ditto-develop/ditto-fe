import { http, HttpResponse } from "msw";

import chatMessageSent from "@/mocks/fixtures/chat-message-sent.json";
import chatMessages from "@/mocks/fixtures/chat-messages.json";
import chatRoomDetail from "@/mocks/fixtures/chat-room-detail.json";
import chatRoomItem from "@/mocks/fixtures/chat-room-item.json";
import chatRooms from "@/mocks/fixtures/chat-rooms.json";
import groupJoin from "@/mocks/fixtures/group-join.json";
import introNotes from "@/mocks/fixtures/intro-notes.json";
import localLogin from "@/mocks/fixtures/local-login.json";
import matchRequest from "@/mocks/fixtures/match-request.json";
import matchesOneOnOne from "@/mocks/fixtures/matches-one-on-one.json";
import matchingStatus from "@/mocks/fixtures/matching-status.json";
import publicProfile from "@/mocks/fixtures/public-profile.json";
import quizCurrent from "@/mocks/fixtures/quiz-current.json";
import quizProgressCurrent from "@/mocks/fixtures/quiz-progress-current.json";
import quizSetWithProgress from "@/mocks/fixtures/quiz-set-with-progress.json";
import systemState from "@/mocks/fixtures/system-state.json";
import user from "@/mocks/fixtures/user.json";

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

const emptyList = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
};

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

  http.get(apiPath("/system/state"), () => HttpResponse.json(success(systemState))),
  http.post(apiPath("/users/local-login"), () => HttpResponse.json(success(localLogin))),
  http.post(apiPath("/users/auth/refresh"), () => HttpResponse.json(success(localLogin))),
  http.post(apiPath("/users/auth/logout"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/users"), () => HttpResponse.json(success(user))),
  http.get(apiPath("/users/nickname/[^/]+/availability"), () => HttpResponse.json(success({ available: true }))),
  http.get(apiPath("/users/[^/]+/profile"), () => HttpResponse.json(success(publicProfile))),
  http.get(apiPath("/users/me/profile"), () => HttpResponse.json(success(publicProfile))),
  http.patch(apiPath("/users/me/profile"), () => HttpResponse.json(success(publicProfile))),
  http.get(apiPath("/users/[^/]+/intro-notes"), () => HttpResponse.json(success(introNotes))),
  http.get(apiPath("/users/me/intro-notes"), () => HttpResponse.json(success(introNotes))),
  http.patch(apiPath("/users/me/intro-notes"), () => HttpResponse.json(success(introNotes))),
  http.get(apiPath("/users/[^/]+/answers"), () => HttpResponse.json(success([]))),
  http.get(apiPath("/users/[^/]+/ratings"), () => HttpResponse.json(success([]))),
  http.post(apiPath("/users/[^/]+/ratings"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/auth/kakao/callback"), () => HttpResponse.json(success(localLogin))),

  http.get(apiPath("/chat/rooms"), () => HttpResponse.json(success(chatRooms))),
  http.post(apiPath("/chat/rooms"), () => HttpResponse.json(success(chatRoomItem))),
  http.get(apiPath("/chat/rooms/[^/]+"), () => HttpResponse.json(success(chatRoomDetail))),
  http.get(apiPath("/chat/rooms/[^/]+/messages"), () => HttpResponse.json(success(chatMessages))),
  http.post(apiPath("/chat/rooms/[^/]+/messages"), () => HttpResponse.json(success(chatMessageSent))),
  http.patch(apiPath("/chat/rooms/[^/]+/read"), () => HttpResponse.json(success(null))),
  http.delete(apiPath("/chat/rooms/[^/]+/leave"), () => HttpResponse.json(success(null))),
  http.get(apiPath("/chat/group-rooms/[^/]+"), () => HttpResponse.json(success(chatRoomDetail))),
  http.get(apiPath("/chat/group-rooms/[^/]+/messages"), () => HttpResponse.json(success(chatMessages))),
  http.post(apiPath("/chat/group-rooms/[^/]+/messages"), () => HttpResponse.json(success(chatMessageSent))),
  http.patch(apiPath("/chat/group-rooms/[^/]+/read"), () => HttpResponse.json(success(null))),
  http.delete(apiPath("/chat/group-rooms/[^/]+/leave"), () => HttpResponse.json(success(null))),
  http.get(apiPath("/chat/votes/place-search"), () => HttpResponse.json(success([]))),
  http.get(apiPath("/chat/group-rooms/[^/]+/votes"), () => HttpResponse.json(success([]))),
  http.post(apiPath("/chat/group-rooms/[^/]+/votes"), () => HttpResponse.json(success(null))),
  http.get(apiPath("/chat/group-rooms/[^/]+/votes/[^/]+"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/chat/group-rooms/[^/]+/votes/[^/]+/cast"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/chat/group-rooms/[^/]+/votes/[^/]+/options"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/chat/group-rooms/[^/]+/votes/[^/]+/close"), () => HttpResponse.json(success(null))),

  http.get(apiPath("/admin/stats"), () => HttpResponse.json(success({}))),
  http.get(apiPath("/admin/matches"), () => HttpResponse.json(success(emptyList))),
  http.get(apiPath("/admin/quiz-progress"), () => HttpResponse.json(success(emptyList))),
  http.get(apiPath("/admin/users/[^/]+/match-candidates"), () => HttpResponse.json(success([]))),
  http.get(apiPath("/admin/quiz-sets/active"), () => HttpResponse.json(success(quizCurrent))),
  http.post(apiPath("/admin/system/override"), () => HttpResponse.json(success(null))),
  http.delete(apiPath("/admin/system/override"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/admin/quiz-progress/reset"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/admin/seed-dummy"), () => HttpResponse.json(success(null))),
  http.post(apiPath("/admin/match-requests/dummy-request"), () => HttpResponse.json(success(matchRequest))),
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
