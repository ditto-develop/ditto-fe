import type { GroupVote, MyVote, VotePlaceOption, VoteTimeOption } from "@/features/chat/model/types";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

/**
 * 투표 집계·표시 헬퍼.
 *
 * **서버는 승자도 득표율도 계산하지 않는다.** `voterIds`와 입력 순 배열만 내려주므로
 * 1위·동표 판정이 전부 여기 있다. 동표는 그대로 동표로 둔다 — 재투표·확정 절차는
 * 기획에 없고, 서버도 마감 시 승자를 정하지 않는다.
 */

const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

/** 선택지 하나의 집계 결과. */
export type VoteTally<TOption> = {
  option: TOption;
  /** 이 선택지를 고른 활성 멤버 수. */
  count: number;
  /** 0~1. 분모는 활성 멤버 수(totalMembers)다. 분모가 0이면 0. */
  ratio: number;
  /** 최다 득표. **동표면 여럿이 true**다. 아무도 안 골랐으면 전부 false. */
  isWinner: boolean;
};

/**
 * 입력 순을 유지한 채 집계한다. 정렬하지 않는 것이 의도다 —
 * 동표일 때의 노출 순서가 곧 생성 시 입력 순이라고 계약에 적혀 있다.
 */
export function tallyOptions<TOption extends { voterIds: number[] }>(
  options: TOption[],
  totalMembers: number,
): Array<VoteTally<TOption>> {
  const maxCount = options.reduce((max, option) => Math.max(max, option.voterIds.length), 0);

  return options.map((option) => {
    const count = option.voterIds.length;
    return {
      option,
      count,
      ratio: totalMembers > 0 ? count / totalMembers : 0,
      // 0표끼리는 동률이어도 승자가 아니다.
      isWinner: count > 0 && count === maxCount,
    };
  });
}

export function tallyPlaceOptions(vote: GroupVote): Array<VoteTally<VotePlaceOption>> {
  return tallyOptions(vote.placeOptions, vote.totalMembers);
}

export function tallyTimeOptions(vote: GroupVote): Array<VoteTally<VoteTimeOption>> {
  return tallyOptions(vote.timeOptions, vote.totalMembers);
}

/** 최다 득표가 둘 이상인가. 마감 결과 화면의 '동표' 안내 조건이다. */
export function isTied(tallies: Array<VoteTally<unknown>>): boolean {
  return tallies.filter((tally) => tally.isWinner).length > 1;
}

/**
 * 마감된 투표의 결과 요약. 채팅방 결과 카드가 읽는다.
 *
 * `null` 은 **아무도 고르지 않은 채 마감된 경우**다 — 0표끼리는 동률이어도 승자가
 * 아니라서(tallyOptions) 보여 줄 결과가 없다. 호출부는 기존 한 줄 안내로 떨어뜨린다.
 *
 * ⚠️ 장소·시간 중 **한쪽만 동표인 경우**도 `tied` 로 본다. Figma 에 그 조합이 없어
 * 카드를 하나 더 만드는 대신, 확정된 쪽은 1번 하나만 있는 목록으로 그린다.
 */
export type VoteOutcome =
  | { kind: "decided"; place: string; time: string }
  | { kind: "tied"; places: string[]; times: string[] };

export function summarizeVoteOutcome(vote: GroupVote): VoteOutcome | null {
  const places = tallyPlaceOptions(vote).filter((tally) => tally.isWinner);
  const times = tallyTimeOptions(vote).filter((tally) => tally.isWinner);

  if (places.length === 0 || times.length === 0) return null;

  if (places.length === 1 && times.length === 1) {
    return {
      kind: "decided",
      place: places[0].option.label,
      time: formatMeetAt(times[0].option.meetAt),
    };
  }

  return {
    kind: "tied",
    // 동표의 노출 순서는 생성 시 입력 순이다(tallyOptions 가 정렬하지 않는 이유).
    places: places.map((tally) => tally.option.label),
    times: times.map((tally) => formatMeetAt(tally.option.meetAt)),
  };
}

/** 내가 한 표라도 던졌는가. 제출 화면과 결과 화면을 가르는 기준이다. */
export function hasVoted(myVote: MyVote | null): boolean {
  return myVote !== null;
}

/**
 * 생성 화면의 날짜·시간 입력을 요청 본문의 `meetAt`으로 조립한다.
 * 서버는 분 단위로만 판정하므로 초는 항상 00이다.
 *
 * @param date `yyyy-MM-dd`
 * @param time `HH:mm`
 */
export function toMeetAt(date: string, time: string): string {
  return `${date} ${time}:00`;
}

/** `"3월 14일 토요일 오후 7시"`. 서버가 라벨을 저장하지 않아 표시 문구는 전부 FE가 만든다. */
export function formatMeetAt(meetAt: string): string {
  const parsed = parseServerDateTime(meetAt);
  if (!parsed) return meetAt;

  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  const weekday = WEEKDAYS[parsed.getDay()];
  const hours = parsed.getHours();
  const minutes = parsed.getMinutes();
  const period = hours < 12 ? "오전" : "오후";
  const hour = hours % 12 || 12;
  const minuteLabel = minutes > 0 ? ` ${minutes}분` : "";

  return `${month}월 ${day}일 ${weekday} ${period} ${hour}시${minuteLabel}`;
}

/** 배너·카드의 진행 문구. 예: `"3/4명 참여"`. */
export function formatVoteProgress(vote: GroupVote): string {
  return `${vote.votedCount}/${vote.totalMembers}명 참여`;
}

/**
 * 방의 투표 목록(최신순)에서 진행 중인 투표를 고른다.
 * 방당 열린 투표는 하나뿐이라 첫 OPEN이 곧 그 투표다.
 */
export function findOpenVote(votes: GroupVote[]): GroupVote | null {
  return votes.find((vote) => vote.status === "OPEN") ?? null;
}
