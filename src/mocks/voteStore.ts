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

/**
 * 이미 마감된 지난 투표. 채팅방의 `VOTE_CLOSED:40` SYSTEM 메시지
 * (group-chat-messages.json)가 이걸 읽어 결과 카드를 그린다.
 *
 * 장소·시간 모두 단독 1위라 '확정' 카드가 나온다. 동표 카드를 보려면 아래
 * voterIds 를 같은 수로 맞추면 된다.
 */
function seedClosedVote(): GroupVote {
  return {
    voteId: 40,
    roomId: MOCK_GROUP_ROOM_ID,
    status: "CLOSED",
    allowMultiple: false,
    createdBy: 2,
    createdAt: "2026-06-04 12:00:00",
    closedAt: "2026-06-04 21:00:00",
    totalMembers: MOCK_TOTAL_MEMBERS,
    votedCount: 3,
    placeOptions: [
      {
        optionId: 291,
        label: "성수 카페거리",
        address: "서울 성동구 아차산로",
        mapLink: null,
        latitude: null,
        longitude: null,
        voterIds: [1, 2],
      },
      {
        optionId: 292,
        label: "연남동 골목",
        address: null,
        mapLink: null,
        latitude: null,
        longitude: null,
        voterIds: [3],
      },
    ],
    timeOptions: [
      { optionId: 293, meetAt: "2026-06-07 14:00:00", voterIds: [1, 2] },
      { optionId: 294, meetAt: "2026-06-07 18:00:00", voterIds: [3] },
    ],
    myVote: { placeIds: [291], timeIds: [293] },
  };
}

/** 장소·시간이 모두 동표로 끝난 투표. 동표 결과 카드(Figma 2232:40125)를 확인한다. */
function seedTiedVote(): GroupVote {
  return {
    voteId: 39,
    roomId: MOCK_GROUP_ROOM_ID,
    status: "CLOSED",
    allowMultiple: false,
    createdBy: 3,
    createdAt: "2026-06-03 12:00:00",
    closedAt: "2026-06-03 21:00:00",
    totalMembers: MOCK_TOTAL_MEMBERS,
    votedCount: 2,
    placeOptions: [
      {
        optionId: 281,
        label: "망원 한강공원",
        address: null,
        mapLink: null,
        latitude: null,
        longitude: null,
        voterIds: [1],
      },
      {
        optionId: 282,
        label: "이태원 루프탑",
        address: null,
        mapLink: null,
        latitude: null,
        longitude: null,
        voterIds: [2],
      },
    ],
    timeOptions: [
      { optionId: 283, meetAt: "2026-06-06 11:00:00", voterIds: [1] },
      { optionId: 284, meetAt: "2026-06-06 17:00:00", voterIds: [2] },
    ],
    myVote: { placeIds: [281], timeIds: [283] },
  };
}

/** 최신순. 방마다 배열 하나. */
const votesByRoomId = new Map<number, GroupVote[]>([
  [MOCK_GROUP_ROOM_ID, [seedVote(), seedClosedVote(), seedTiedVote()]],
]);

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

/**
 * 마감이 채팅방에 남기는 SYSTEM 메시지.
 *
 * 실제 BE 는 마감 시 `VOTE_CLOSED:{voteId}` 를 방에 흘리고, 그 메시지가 결과 카드를
 * 그리는 방아쇠다(GroupMessageList). 목업이 이걸 안 남기면 마감을 눌러도 카드가
 * 영영 안 뜬다 — 화면이 도는지 확인할 수가 없다.
 */
type MockSystemMessage = {
  id: number;
  roomId: number;
  senderId: number;
  messageType: "SYSTEM";
  content: string;
  imageUrl: null;
  createdAt: string;
};

/** 고정 픽스처(group-chat-messages.json)의 최대 id 가 43이라 그 위에서 이어 붙인다. */
let nextSystemMessageId = 100;
const extraMessagesByRoomId = new Map<number, MockSystemMessage[]>();

/** 최신순. 핸들러가 고정 픽스처 앞에 붙인다. */
export function listExtraMessages(roomId: number): MockSystemMessage[] {
  return extraMessagesByRoomId.get(roomId) ?? [];
}

/** 멱등 — 이미 마감된 투표에 다시 불러도 성공으로 답한다. */
export function closeVote(vote: GroupVote): GroupVote {
  if (vote.status === "OPEN") {
    vote.status = "CLOSED";
    vote.closedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    // 마감은 누가 눌렀든 그 사람이 보낸 SYSTEM 메시지로 남는다. 목업에선 나다.
    const extras = extraMessagesByRoomId.get(vote.roomId) ?? [];
    extras.unshift({
      id: nextSystemMessageId++,
      roomId: vote.roomId,
      senderId: MOCK_MY_MEMBER_ID,
      messageType: "SYSTEM",
      content: `VOTE_CLOSED:${vote.voteId}`,
      imageUrl: null,
      createdAt: vote.closedAt,
    });
    extraMessagesByRoomId.set(vote.roomId, extras);
  }
  return vote;
}
