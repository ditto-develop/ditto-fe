import type { QuizMatchingType, QuizRecordItem } from "@/features/records/model/types";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

/*
 * 8.1 퀴즈 기록 화면 문구. 서버 값은 날짜 문자열·숫자로만 오고, 화면 문구는 여기서 만든다.
 * 날짜는 서버 문자열(KST, `yyyy-MM-dd HH:mm:ss`)을 그대로 읽는다 — 다른 화면(채팅 남은 시간 등)과
 * 같은 방식이다.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function matchingTypeLabel(type: QuizMatchingType): string {
  return type === "GROUP" ? "그룹" : "1:1";
}

/** "2026-10-26" → "10월 26일 주". 시간대 영향을 받지 않게 문자열을 직접 자른다. */
export function formatWeekOf(weekStartedOn: string): string {
  const [, month, day] = weekStartedOn.split("-").map(Number);
  if (!month || !day) return "";
  return `${month}월 ${day}일 주`;
}

type RecordMetaOptions = {
  /** 맨 앞에 "4주차" 를 붙인다(기록 탭 카드). 상세 화면은 제목이 "4주차 퀴즈" 라 뺀다. */
  withWeek?: boolean;
  /** 끝에 "312명 참여" 를 붙인다(퀴즈 결과). */
  participantCount?: number;
};

/** "4주차 · 1:1 · 10월 26일 주" (Figma 3254:37528 · 3254:37958 · 3255:37092). */
export function formatRecordMeta(
  record: Pick<QuizRecordItem, "week" | "matchingType" | "weekStartedOn">,
  { withWeek = false, participantCount }: RecordMetaOptions = {},
): string {
  return [
    withWeek ? `${record.week}주차` : null,
    matchingTypeLabel(record.matchingType),
    formatWeekOf(record.weekStartedOn),
    participantCount === undefined ? null : `${participantCount.toLocaleString("ko-KR")}명 참여`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** "2026-10-27 21:14:00" → "10월 27일 21:14 제출". 값이 없으면 null. */
export function formatSubmittedAt(submittedAt: string | null): string | null {
  const date = parseServerDateTime(submittedAt);
  if (!date) return null;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${pad2(date.getHours())}:${pad2(date.getMinutes())} 제출`;
}

/** "2026-10-29 00:00:00" → "목요일 0시" (분이 있으면 "목요일 0시 30분"). */
export function formatRevealMoment(statsRevealAt: string): string | null {
  const date = parseServerDateTime(statsRevealAt);
  if (!date) return null;
  const minutes = date.getMinutes();
  return `${WEEKDAYS[date.getDay()]}요일 ${date.getHours()}시${minutes ? ` ${minutes}분` : ""}`;
}

/**
 * 남은 시간 → "10:49:25". 하루가 넘으면 "1일 10:49:25".
 * 응답 기간(월~수)에 끝낸 퀴즈는 공개(목 0시)까지 최대 사흘이 남는다 — 시간만 쓰면 "58:49:25" 가 된다.
 */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  return days > 0 ? `${days}일 ${clock}` : clock;
}

export type PastRecordLabel = {
  text: string;
  /** `positive` = 결과 공개(초록, Figma 3254:37738). `neutral` = 공개 전. */
  tone: "positive" | "neutral";
};

/** 지난 퀴즈 카드 아랫줄. 소수 의견이 없으면 개수를 빼고 "결과 보기" 만 둔다("0개" 는 어색하다). */
export function pastRecordLabel(
  record: Pick<QuizRecordItem, "revealed" | "minorityCount">,
): PastRecordLabel {
  if (!record.revealed) return { text: "통계 공개 전 · 내 답변 보기", tone: "neutral" };
  const count = record.minorityCount ?? 0;
  return {
    text: count > 0 ? `결과 보기 · 소수 의견 ${count}개` : "결과 보기",
    tone: "positive",
  };
}
