"use client";

import { useRef } from "react";

import { HiddenPickerInput, PickerLabel, TimeInputRow } from "./GroupVoteCreateModal.parts";

/** 타입당 선택지 상한. 서버도 같은 값으로 막는다(초과 시 8206). */
export const MAX_OPTION_COUNT = 10;

export function formatDateLabel(value: string) {
  if (!value) return "날짜 선택";

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  const date = new Date(year, month - 1, day);
  const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

  return `${month}월 ${day}일 ${weekdays[date.getDay()]}`;
}

export function formatTimeLabel(value: string) {
  if (!value) return "시간 선택";

  const [hourValue, minuteValue] = value.split(":").map(Number);
  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) return value;

  const period = hourValue < 12 ? "오전" : "오후";
  const hour = hourValue % 12 || 12;
  const minute = minuteValue > 0 ? ` ${minuteValue}분` : "";

  return `${period} ${hour}시${minute}`;
}

type NativePickerFieldProps = {
  type: "date" | "time";
  value: string;
  label: string;
  isPlaceholder: boolean;
  subtle?: boolean;
  ariaLabel: string;
  icon: React.ReactNode;
  onChange: (value: string) => void;
};

/**
 * 네이티브 날짜·시간 피커를 행 모양으로 감싼 필드.
 *
 * 투표 생성과 진행 중 선택지 추가가 같은 입력을 쓰므로 여기로 모았다.
 * 실제 `<input>`은 감춰 두고 행 전체를 눌러 `showPicker()`를 연다 — 웹뷰에서
 * 기본 인풋 UI가 제각각이라 표시는 우리가 하고 피커만 OS 것을 빌린다.
 */
export function NativePickerField({
  type,
  value,
  label,
  isPlaceholder,
  subtle,
  ariaLabel,
  icon,
  onChange,
}: NativePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpeningRef = useRef(false);

  const openPicker = () => {
    if (isOpeningRef.current) return;

    const input = inputRef.current;
    if (!input) return;

    isOpeningRef.current = true;
    input.focus();

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.click();
    } finally {
      window.setTimeout(() => {
        isOpeningRef.current = false;
      }, 0);
    }
  };

  return (
    <TimeInputRow
      role="button"
      tabIndex={0}
      $subtle={subtle}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
    >
      {icon}
      <PickerLabel $placeholder={isPlaceholder}>{label}</PickerLabel>
      <HiddenPickerInput
        ref={inputRef}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        tabIndex={-1}
      />
    </TimeInputRow>
  );
}
