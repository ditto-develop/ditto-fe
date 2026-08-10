import type { SanctionCallback, SanctionLevel } from "@/features/sanction/model/types";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/**
 * 제재 날짜(일반 JSON 응답은 `yyyy-MM-dd HH:mm:ss`, OAuth 콜백의 suspendedUntil만 ISO-8601)를
 * Date로 변환한다. 파싱 규칙은 공용 헬퍼와 동일하다.
 */
export function parseSanctionDate(value: string | null): Date | null {
  return parseServerDateTime(value);
}

/** "2026.08.02(일) 01:00" 형태로 표시한다. */
export function formatSanctionDateTime(value: string | null): string {
  const date = parseSanctionDate(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day}(${weekday}) ${hour}:${minute}`;
}

export const SANCTION_LEVEL_LABEL: Record<SanctionLevel, string> = {
  WARNING: "경고",
  SUSPENSION: "기간 이용 정지",
  PERMANENT_BAN: "영구 차단",
};

/**
 * OAuth 콜백 쿼리에서 제재 정보를 읽는다.
 * 제재 유저는 accessToken이 발급되지 않으므로, 토큰을 저장하기 전에 이 값부터 확인해야 한다.
 */
export function readSanctionCallback(params: URLSearchParams): SanctionCallback | null {
  if (params.get("sanctioned") !== "true") return null;

  const code = params.get("sanctionCode");
  return {
    sanctionCode: code === "MEMBER_BANNED" ? "MEMBER_BANNED" : "MEMBER_SUSPENDED",
    suspendedUntil: params.get("suspendedUntil"),
  };
}
