/**
 * BE 날짜/시각 문자열을 Date로 변환한다.
 *
 * 일반 JSON 응답은 `yyyy-MM-dd HH:mm:ss` 형태로 내려오는데, 공백 구분자는
 * Safari에서 파싱되지 않아 Invalid Date가 된다. ISO-8601(`T` 포함)로 내려오는
 * 응답도 있으므로 둘 다 받아 정규화한다.
 */
export function parseServerDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}
