import { parseServerDateTime } from "@/shared/lib/serverDateTime";

export function formatBlockedDate(value: string): string {
  const date = parseServerDateTime(value);
  if (!date) return value;

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 차단`;
}
