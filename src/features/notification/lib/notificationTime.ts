import { parseServerDateTime } from "@/shared/lib/serverDateTime";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** 오늘 / 지난 소식을 가르는 기준. Figma [2508:32056] — 24시간. */
export const TODAY_THRESHOLD_MS = DAY_MS;

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/**
 * 상대 시간 표기. Figma [2508:32126] 표를 그대로 따른다.
 *
 * | 방금 전            | 1분 미만    |
 * | N분 전             | 1분 - 59분  |
 * | N시간 전           | 1시간 - 23시간 |
 * | N일 전             | 1일 - 7일   |
 * | 날짜 표시(MM.DD.요일) | 8일 이상   |
 */
export function formatNotificationTime(createdAt: string, now: number = Date.now()): string {
  // 서버는 `yyyy-MM-dd HH:mm:ss`로 내려준다. 공백 구분자는 Safari에서 Invalid Date다.
  const created = parseServerDateTime(createdAt);
  if (!created) return "";
  const timestamp = created.getTime();

  const elapsed = now - timestamp;
  // 서버/클라이언트 시계 차이로 미래 시각이 오면 '방금 전'으로 처리한다.
  if (elapsed < MINUTE_MS) return "방금 전";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}분 전`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}시간 전`;

  const days = Math.floor(elapsed / DAY_MS);
  if (days <= 7) return `${days}일 전`;

  const month = String(created.getMonth() + 1).padStart(2, "0");
  const date = String(created.getDate()).padStart(2, "0");
  return `${month}.${date}.${WEEKDAY_LABELS[created.getDay()]}`;
}

/** 24시간 이내이면 '오늘' 구간에 속한다. Figma [2508:32056]. */
export function isToday(createdAt: string, now: number = Date.now()): boolean {
  const created = parseServerDateTime(createdAt);
  if (!created) return false;
  return now - created.getTime() < TODAY_THRESHOLD_MS;
}
