import type {
  CastVoteRequest,
  CreateGroupVoteRequest,
  GroupVote,
  MyVote,
  VotePlaceOption,
  VoteTimeOption,
} from "@/features/chat/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

/**
 * 그룹 만남 투표 (`/api/v1/chat/rooms/{roomId}/votes`).
 *
 * 다섯 엔드포인트가 **모두 같은 상세 형태**를 돌려준다. 생성·cast·close가 갱신된 상세를
 * 주므로 성공 후 재조회가 필요 없다.
 *
 * 투표는 그룹 방 전용이다(1:1·재매칭에 호출하면 8208). 방당 열린 투표는 하나뿐이라
 * 진행 중인 투표가 있는데 또 만들면 8202가 온다.
 *
 * 계약 정본은 BE 위키 Frontend-Vote-Guide.
 */

/**
 * 스펙의 `voterIds`/`myVote.*Ids` 아이템 타입이 `oneOf[object|boolean|string|number]`로
 * 뭉개져 내려온다(생성기가 추론에 실패한 자리다). 실제 값은 회원 ID·선택지 ID 숫자이고,
 * `getMyMemberId()`가 number라 비교하려면 숫자여야 한다. 여기서 한 번만 좁힌다.
 */
function toIdList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(Number).filter((id) => Number.isFinite(id));
}

function normalizePlaceOption(option: VotePlaceOption): VotePlaceOption {
  return {
    ...option,
    // 직접 입력한 장소는 좌표·주소가 없다. undefined 분기를 화면에서 없앤다.
    address: option.address ?? null,
    mapLink: option.mapLink ?? null,
    latitude: option.latitude ?? null,
    longitude: option.longitude ?? null,
    voterIds: toIdList(option.voterIds),
  };
}

function normalizeTimeOption(option: VoteTimeOption): VoteTimeOption {
  return { ...option, voterIds: toIdList(option.voterIds) };
}

/** 한 표도 안 던졌으면 myVote 자체가 null이다 — 제출/결과 화면 분기의 기준. */
function normalizeMyVote(myVote: MyVote | null | undefined): MyVote | null {
  if (!myVote) return null;
  return { placeIds: toIdList(myVote.placeIds), timeIds: toIdList(myVote.timeIds) };
}

function normalizeVote(vote: GroupVote): GroupVote {
  return {
    ...vote,
    closedAt: vote.closedAt ?? null,
    placeOptions: (vote.placeOptions ?? []).map(normalizePlaceOption),
    timeOptions: (vote.timeOptions ?? []).map(normalizeTimeOption),
    myVote: normalizeMyVote(vote.myVote),
  };
}

/**
 * 방의 투표 목록(최신순).
 *
 * **브로드캐스트 유실 시 화면 복구의 기준이 이 REST다.** STOMP는 인메모리 브로커라
 * 전달 보장이 없어서, 재접속·백그라운드 복귀 시에는 이걸로 열린 투표를 되찾는다.
 * 종료된 방·이미 나간 방에서도 읽을 수 있다.
 */
export async function getRoomVotes(roomId: number): Promise<GroupVote[]> {
  const votes = await externalApiFetch<GroupVote[]>(`/api/v1/chat/rooms/${roomId}/votes`);
  return (votes ?? []).map(normalizeVote);
}

/** SYSTEM 메시지의 voteId로 카드·배너를 그릴 때 쓴다. 조회는 항상 열려 있다. */
export async function getVote(roomId: number, voteId: number): Promise<GroupVote> {
  const vote = await externalApiFetch<GroupVote>(`/api/v1/chat/rooms/${roomId}/votes/${voteId}`);
  return normalizeVote(vote);
}

/** 장소·시간 각 2~10개. 이미 진행 중인 투표가 있으면 8202로 거절된다. */
export async function createVote(
  roomId: number,
  body: CreateGroupVoteRequest,
): Promise<GroupVote> {
  const vote = await externalApiFetch<GroupVote>(`/api/v1/chat/rooms/${roomId}/votes`, {
    method: "POST",
    body,
  });
  return normalizeVote(vote);
}

/**
 * 투표하기. **치환이다** — 보낸 집합이 그 회원의 최종 선택이 된다.
 * 재투표도 같은 엔드포인트를 그대로 다시 부르고, 유지할 기존 선택을 포함해서 보낸다.
 */
export async function castVote(
  roomId: number,
  voteId: number,
  body: CastVoteRequest,
): Promise<GroupVote> {
  const vote = await externalApiFetch<GroupVote>(
    `/api/v1/chat/rooms/${roomId}/votes/${voteId}/cast`,
    { method: "POST", body },
  );
  return normalizeVote(vote);
}

/**
 * 마감. 방 멤버 누구나 가능하고 **멱등**이라 더블 탭·재시도를 FE가 막을 필요가 없다.
 * SYSTEM 메시지·알림은 실제로 닫은 요청 한 번만 나간다.
 */
export async function closeVote(roomId: number, voteId: number): Promise<GroupVote> {
  const vote = await externalApiFetch<GroupVote>(
    `/api/v1/chat/rooms/${roomId}/votes/${voteId}/close`,
    { method: "POST" },
  );
  return normalizeVote(vote);
}
