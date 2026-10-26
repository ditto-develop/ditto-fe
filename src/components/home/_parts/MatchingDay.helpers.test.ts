import { describe, expect, it } from "vitest";

import { toJoinedGroupMembers } from "@/components/home/_parts/MatchingDay.helpers";
import type { ChatRoom } from "@/features/chat";
import type { MatchCandidateDto } from "@/features/matching/api/matchingApi";

function member(userId: string): MatchCandidateDto {
  return {
    userId,
    nickname: `회원${userId}`,
    gender: "FEMALE",
    age: 25,
    introduction: null,
    matchRate: 50,
    scoreBreakdown: { quizMatchRate: 50, matchedQuestions: 6, totalQuestions: 12, reasons: [] },
  };
}

function room(sourceType: ChatRoom["sourceType"], counterpartMemberIds: number[]): ChatRoom {
  return {
    roomId: 3,
    sourceType,
    counterpartMemberIds,
    lastMessage: null,
    unreadCount: 0,
    createdAt: "2026-10-23 00:00:00",
    opensAt: null,
    expiresAt: null,
    isEnded: false,
    endedAt: null,
    endedReason: null,
    hasLeft: false,
    roomName: null,
    status: null,
    reviewStatus: null,
    reviewId: null,
    isMuted: false,
  };
}

const members = [member("601"), member("602"), member("603"), member("604")];

describe("toJoinedGroupMembers", () => {
  it("그룹 방이 열렸으면 방에 들어온 사람만 남긴다", () => {
    const joined = toJoinedGroupMembers(members, room("GROUP", [602, 604]));

    expect(joined.map((m) => m.userId)).toEqual(["602", "604"]);
  });

  it("방이 아직 없으면 그룹 전원을 그대로 보인다", () => {
    expect(toJoinedGroupMembers(members, undefined)).toBe(members);
  });

  it("최신 방이 1:1 방이면 거르지 않는다", () => {
    expect(toJoinedGroupMembers(members, room("PERSONAL", [602]))).toBe(members);
  });

  /** 홈은 '가장 최근 방'을 쓴다. 지난 주 그룹 방이면 겹치는 사람이 없다 — 카드를 비우지 않는다. */
  it("겹치는 사람이 없으면(다른 그룹의 방) 거르지 않는다", () => {
    expect(toJoinedGroupMembers(members, room("GROUP", [2, 3, 4]))).toBe(members);
  });
});
