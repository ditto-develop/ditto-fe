import { describe, expect, it } from "vitest";

import type { GroupVote } from "@/features/chat/model/types";
import {
  findOpenVote,
  formatMeetAt,
  formatVoteProgress,
  hasVoted,
  isTied,
  tallyOptions,
  tallyPlaceOptions,
  toMeetAt,
} from "./voteResult";

function makeVote(overrides: Partial<GroupVote> = {}): GroupVote {
  return {
    voteId: 41,
    roomId: 7,
    status: "OPEN",
    allowMultiple: false,
    createdBy: 3,
    createdAt: "2026-03-13 12:00:00",
    closedAt: null,
    totalMembers: 4,
    votedCount: 2,
    placeOptions: [
      {
        optionId: 11,
        label: "성수 카페거리",
        address: null,
        mapLink: null,
        latitude: null,
        longitude: null,
        voterIds: [1, 2],
      },
      {
        optionId: 12,
        label: "홍대",
        address: null,
        mapLink: null,
        latitude: null,
        longitude: null,
        voterIds: [3],
      },
    ],
    timeOptions: [{ optionId: 21, meetAt: "2026-03-14 19:00:00", voterIds: [1] }],
    myVote: null,
    ...overrides,
  };
}

describe("tallyOptions", () => {
  it("최다 득표를 승자로 표시하고 분모는 활성 멤버 수를 쓴다", () => {
    const tallies = tallyPlaceOptions(makeVote());

    expect(tallies.map((tally) => tally.count)).toEqual([2, 1]);
    expect(tallies.map((tally) => tally.isWinner)).toEqual([true, false]);
    expect(tallies[0].ratio).toBe(0.5);
  });

  it("입력 순을 바꾸지 않는다 — 동표 노출 순서의 근거다", () => {
    const vote = makeVote();
    const tallies = tallyPlaceOptions(vote);

    expect(tallies.map((tally) => tally.option.optionId)).toEqual([11, 12]);
  });

  it("아무도 안 고른 선택지끼리는 동률이어도 승자가 없다", () => {
    const tallies = tallyOptions([{ voterIds: [] }, { voterIds: [] }], 4);

    expect(tallies.every((tally) => tally.isWinner)).toBe(false);
    expect(tallies.every((tally) => tally.ratio === 0)).toBe(true);
  });

  it("활성 멤버가 0명이면 비율이 0이다(0으로 나누지 않는다)", () => {
    expect(tallyOptions([{ voterIds: [1] }], 0)[0].ratio).toBe(0);
  });
});

describe("isTied", () => {
  it("최다 득표가 둘 이상이면 동표다", () => {
    const tied = tallyOptions([{ voterIds: [1] }, { voterIds: [2] }], 4);
    const notTied = tallyOptions([{ voterIds: [1, 2] }, { voterIds: [3] }], 4);

    expect(isTied(tied)).toBe(true);
    expect(isTied(notTied)).toBe(false);
  });
});

describe("hasVoted", () => {
  it("myVote가 null이면 아직 안 던진 것이다", () => {
    expect(hasVoted(null)).toBe(false);
    expect(hasVoted({ placeIds: [], timeIds: [] })).toBe(true);
  });
});

describe("meetAt", () => {
  it("날짜·시간 입력을 초 단위까지 붙여 조립한다", () => {
    expect(toMeetAt("2026-03-14", "19:00")).toBe("2026-03-14 19:00:00");
  });

  it("표시 문구를 FE가 만든다", () => {
    expect(formatMeetAt("2026-03-14 19:00:00")).toBe("3월 14일 토요일 오후 7시");
    expect(formatMeetAt("2026-03-14 09:30:00")).toBe("3월 14일 토요일 오전 9시 30분");
  });

  it("파싱할 수 없으면 원문을 그대로 둔다", () => {
    expect(formatMeetAt("나중에")).toBe("나중에");
  });
});

describe("findOpenVote / formatVoteProgress", () => {
  it("진행 중인 투표만 고른다", () => {
    const open = makeVote({ voteId: 42 });
    const closed = makeVote({ voteId: 41, status: "CLOSED" });

    expect(findOpenVote([closed, open])?.voteId).toBe(42);
    expect(findOpenVote([closed])).toBeNull();
  });

  it("진행 카운터를 만든다", () => {
    expect(formatVoteProgress(makeVote())).toBe("2/4명 참여");
  });
});
