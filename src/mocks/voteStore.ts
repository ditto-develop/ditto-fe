import type { CastVoteRequest, CreateGroupVoteRequest, GroupVote } from "@/features/chat";

/**
 * 만남 투표 목업 상태.
 *
 * 투표는 생성·cast·close가 모두 갱신된 상세를 돌려주는 계약이라, 스텁 응답만으로는
 * 화면이 전혀 돌지 않는다(내 표가 반영되지 않아 제출 화면에서 못 빠져나온다).
 * 그래서 목업도 인메모리 상태를 들고 실제로 갱신한다. 새로고침하면 초기화된다.
 */

/** 목업 로그인 사용자. `my-profile.json`의 userId와 같다. */
export const MOCK_MY_MEMBER_ID = 1;

/** 목업 그룹 방(roomId 3)의 활성 멤버 수 — 나 + counterpartMemberIds 3명. */
const MOCK_TOTAL_MEMBERS = 4;
const MOCK_GROUP_ROOM_ID = 3;

let nextVoteId = 41;
let nextOptionId = 301;

function seedVote(): GroupVote {
  return {
    voteId: nextVoteId++,
    roomId: MOCK_GROUP_ROOM_ID,
    status: "OPEN",
    allowMultiple: false,
    createdBy: 3,
    createdAt: "2026-06-05 18:10:00",
    closedAt: null,
    totalMembers: MOCK_TOTAL_MEMBERS,
    votedCount: 2,
    placeOptions: [
      {
        optionId: nextOptionId++,
        label: "강남역 스타벅스",
        address: "서울 강남구 테헤란로 231",
        mapLink: "http://place.map.kakao.com/26338954",
        latitude: 37.4979,
        longitude: 127.0276,
        voterIds: [2, 3],
      },
      {
        optionId: nextOptionId++,
        label: "홍대 카페거리",
        address: null,
        mapLink: null,
        latitude: null,
        longitude: null,
        voterIds: [],
      },
    ],
    timeOptions: [
      { optionId: nextOptionId++, meetAt: "2026-06-13 19:00:00", voterIds: [2] },
      { optionId: nextOptionId++, meetAt: "2026-06-14 12:30:00", voterIds: [3] },
    ],
    // 나는 아직 안 던졌다 — 진입하면 제출 화면이 뜬다.
    myVote: null,
  };
}

/** 최신순. 방마다 배열 하나. */
const votesByRoomId = new Map<number, GroupVote[]>([[MOCK_GROUP_ROOM_ID, [seedVote()]]]);

export function listVotes(roomId: number): GroupVote[] {
  return votesByRoomId.get(roomId) ?? [];
}

export function findVote(roomId: number, voteId: number): GroupVote | undefined {
  return listVotes(roomId).find((vote) => vote.voteId === voteId);
}

export function hasOpenVote(roomId: number): boolean {
  return listVotes(roomId).some((vote) => vote.status === "OPEN");
}

export function createVote(roomId: number, body: CreateGroupVoteRequest): GroupVote {
  const vote: GroupVote = {
    voteId: nextVoteId++,
    roomId,
    status: "OPEN",
    allowMultiple: body.allowMultiple,
    createdBy: MOCK_MY_MEMBER_ID,
    createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    closedAt: null,
    totalMembers: MOCK_TOTAL_MEMBERS,
    votedCount: 0,
    placeOptions: body.placeOptions.map((option) => ({
      optionId: nextOptionId++,
      label: option.label,
      address: option.address ?? null,
      mapLink: option.mapLink ?? null,
      latitude: option.latitude ?? null,
      longitude: option.longitude ?? null,
      voterIds: [],
    })),
    timeOptions: body.timeOptions.map((option) => ({
      optionId: nextOptionId++,
      meetAt: option.meetAt,
      voterIds: [],
    })),
    myVote: null,
  };

  votesByRoomId.set(roomId, [vote, ...listVotes(roomId)]);
  return vote;
}

/** 내 표를 요청 집합으로 **치환**한다. 서버 계약과 같은 의미다. */
export function castVote(vote: GroupVote, body: CastVoteRequest): GroupVote {
  const replaceVoter = <T extends { optionId: number; voterIds: number[] }>(
    options: T[],
    selectedIds: number[],
  ): T[] =>
    options.map((option) => {
      const others = option.voterIds.filter((id) => id !== MOCK_MY_MEMBER_ID);
      return {
        ...option,
        voterIds: selectedIds.includes(option.optionId)
          ? [...others, MOCK_MY_MEMBER_ID]
          : others,
      };
    });

  vote.placeOptions = replaceVoter(vote.placeOptions, body.placeIds);
  vote.timeOptions = replaceVoter(vote.timeOptions, body.timeIds);

  const hadVoted = vote.myVote !== null;
  const votesNow = body.placeIds.length > 0 || body.timeIds.length > 0;
  vote.myVote = votesNow ? { placeIds: body.placeIds, timeIds: body.timeIds } : null;

  if (!hadVoted && votesNow) vote.votedCount += 1;
  if (hadVoted && !votesNow) vote.votedCount -= 1;

  return vote;
}

/** 멱등 — 이미 마감된 투표에 다시 불러도 성공으로 답한다. */
export function closeVote(vote: GroupVote): GroupVote {
  if (vote.status === "OPEN") {
    vote.status = "CLOSED";
    vote.closedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
  }
  return vote;
}
