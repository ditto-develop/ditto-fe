import { parseServerDateTime } from "@/shared/lib/serverDateTime";

export function formatMaskedPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return "-";

  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  }

  return phoneNumber;
}

export function formatBlockedDate(value: string): string {
  const date = parseServerDateTime(value);
  if (!date) return value;

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 차단`;
}
