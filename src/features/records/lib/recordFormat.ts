import type { QuizHistoryWeek, QuizMatchingType } from "@/features/records/model/types";
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

function parseDate(value: string): { year: number; month: number; day: number } | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

/** "2026-10-26" → "10월 26일 주". 시간대 영향을 받지 않게 문자열을 직접 자른다. */
export function formatWeekOf(weekStartedOn: string): string {
  const date = parseDate(weekStartedOn);
  if (!date) return "";
  return `${date.month}월 ${date.day}일 주`;
}

/**
 * "그룹 · 10월 26일 주" (Figma 3254:37528 · 3254:37958 · 3255:37092).
 * 시안의 맨 앞 "N주차" 는 뺀다 — 달마다 다시 세는 번호라 10월 19일 주와 11월 16일 주가 둘 다 "4주차" 로
 * 보였다(QA 1119). 날짜("N월 N일 주")가 이미 주를 가리킨다.
 */
export function formatRecordMeta(record: { matchingType: QuizMatchingType; weekStartedOn: string }): string {
  return [matchingTypeLabel(record.matchingType), formatWeekOf(record.weekStartedOn)]
    .filter(Boolean)
    .join(" · ");
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** "2026-10-29 00:00:00" → "목요일 0시" (분이 있으면 "목요일 0시 30분"). */
export function formatRevealMoment(resultOpensAt: string): string | null {
  const date = parseServerDateTime(resultOpensAt);
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

/** 결과가 공개된 주인지. 서버는 공개 전 주의 `minorityCount` 를 null 로 준다. */
export function isWeekRevealed(week: Pick<QuizHistoryWeek, "minorityCount">): boolean {
  return week.minorityCount !== null;
}

export type PastRecordLabel = {
  text: string;
  /** `positive` = 결과 공개(초록, Figma 3254:37738). `neutral` = 공개 전. */
  tone: "positive" | "neutral";
};

/** 지난 퀴즈 카드 아랫줄. 소수 의견이 없으면 개수를 빼고 "결과 보기" 만 둔다("0개" 는 어색하다). */
export function pastRecordLabel(week: Pick<QuizHistoryWeek, "minorityCount">): PastRecordLabel {
  if (week.minorityCount === null) return { text: "통계 공개 전 · 내 답변 보기", tone: "neutral" };
  const count = week.minorityCount;
  return {
    text: count > 0 ? `결과 보기 · 소수 의견 ${count}개` : "결과 보기",
    tone: "positive",
  };
}

/**
 * 선택 비율의 기준. 비율은 응답 마감 때 굳힌 통계(마감까지 완주한 사람)라, 마감 뒤에 푼 사람(시크릿 매칭 늦은
 * 응시)은 자기가 빠진 숫자를 본다. 그래서 누구 기준인지 모든 사람에게 밝힌다(IMP-2, 2026-11-16 결정).
 */
export function formatResultBasis(participantCount: number): string {
  return `선택 비율은 퀴즈 참여자 ${participantCount.toLocaleString("ko-KR")}명 기준이에요`;
}
