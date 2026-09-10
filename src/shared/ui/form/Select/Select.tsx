// Select.tsx
import { Label1Normal } from "@/shared/ui";
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";

/* =========================
 *  Types
 * =======================*/

export type SelectFieldType = "text" | "number" | "date" | "time";
export type Primitive = string | number;

export interface SelectOption<T extends Primitive = string> {
  label: string;
  value: T;
}

export interface SelectProps<T extends Primitive = string> {
  label?: string;
  isessential?: boolean;
  /** placeholder (기본값: "선택해주세요.") */
  placeholder?: string;
  /** 단일 또는 다중 값 */
  value: T | T[] | null;
  onChange: (value: T | null) => void;
  /** "date" 필드는 바텀시트 내 연/월/일 선택으로 값을 만들기 때문에 옵션 목록이 필요 없다. */
  options?: ReadonlyArray<SelectOption<T>>;

  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;

  /**
   * 필드 타입
   * - "date" 는 바텀시트에서 연/월/일 네이티브 select 3개로 고른다.
   *   (`input[type=date]` 는 일부 인앱 웹뷰에서 탭해도 피커가 뜨지 않아 선택 자체가
   *   막히는 문제가 있었다 — 네이티브 select 는 플랫폼 피커가 뜨는 게 보장된다.)
   * - "time" 은 기본 input[type=time] 사용
   * - 그 외(text, number…)는 바텀시트 목록 Select UI 사용
   */
  fieldType?: SelectFieldType;

  /** 바텀시트 상단 타이틀 (예: "사는 곳") */
  bottomSheetTitle?: string;
}

/* =========================
 *  Styled Components
 * =======================*/

interface SelectTriggerProps {
  $error?: boolean;
  $disabled?: boolean;
}

const SelectWrapper = styled.div`
  width: 100%;
  box-sizing: border-box;
`;

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  color: var(--color-semantic-label-normal);
`;

/*
 * 높이·모서리·여백·테두리는 TextField(InputWrapper)와 같게 둔다. 프로필 작성 화면에서
 * 닉네임 입력과 나란히 놓이므로 한 필드처럼 보여야 한다.
 * 테두리 색 토큰이 정의되지 않은 이름(--color-line-neutral 등)이면 border 선언 전체가
 * 무효가 되어 테두리가 아예 사라진다 — 반드시 존재하는 시맨틱 토큰만 쓴다.
 */
const SelectTrigger = styled.button<SelectTriggerProps>`
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  padding: 0 16px;
  border-radius: 12px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  background: ${({ $disabled }) =>
    $disabled
      ? "var(--color-semantic-interaction-disable)"
      : "var(--color-semantic-background-normal-normal)"};

  border: 1px solid
    ${({ $error, $disabled }) =>
      $disabled
        ? "rgb(from var(--color-atomic-neutral-20) r g b / var(--color-atomic-opacity-12))"
        : $error
        ? "var(--color-semantic-status-negative)"
        : "var(--color-semantic-line-normal-normal)"};

  color: ${({ $disabled }) =>
    $disabled
      ? "var(--color-semantic-label-disable)"
      : "var(--color-semantic-label-normal)"};

  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  transition: background 0.15s ease, border 0.15s ease;
`;

const SelectValue = styled.span<{ $placeholder?: boolean }>`
  flex: 1;
  /* 트리거가 button 이라 UA 기본값(text-align: center)을 물려받는다. 입력 필드처럼 왼쪽 정렬. */
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--typography-label-1-normal-font-size);

  color: ${({ $placeholder }) =>
    $placeholder
      ? "var(--color-semantic-label-alternative)"
      : "var(--color-semantic-label-strong)"};
`;

const ErrorMessage = styled.div`
  margin-top: 4px;
  font-size: var(--typography-caption-1-font-size);
  color: var(--color-semantic-status-negative);
`;

/* ---- Native date/time input ---- */

const NativeInput = styled.input<{ $error?: boolean }>`
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  padding: 0 16px;
  border-radius: 12px;

  border: 1px solid
    ${({ $error }) =>
      $error ? "var(--color-semantic-status-negative)" : "var(--color-semantic-line-normal-normal)"};
  background: var(--color-semantic-background-normal-normal);
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-label-1-normal-font-size);

  &:disabled {
    background: var(--color-semantic-interaction-disable);
    color: var(--color-semantic-label-disable);
    border-color: rgb(from var(--color-atomic-neutral-20) r g b / var(--color-atomic-opacity-12));
    cursor: not-allowed;
  }
`;

/* ---- Bottom Sheet ---- */

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
`;

const slideDown = keyframes`
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
`;

const overlayFadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const overlayFadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

const SheetOverlay = styled.div<{ $closing: boolean }>`
  position: fixed;
  inset: 0;
  background: var(--color-semantic-material-dimmer);
  z-index: 1000;

  display: flex;
  justify-content: center;
  align-items: flex-end;

  animation: ${({ $closing }) => $closing ? overlayFadeOut : overlayFadeIn} 0.28s ease forwards;
`;

const Sheet = styled.div<{ $closing: boolean }>`
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
  border-radius: 16px 16px 0 0;
  background: var(--Background-Elevated-Normal, var(--color-semantic-background-normal-normal));
  padding-bottom: env(safe-area-inset-bottom);

  animation: ${({ $closing }) => $closing ? slideDown : slideUp} 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
`;

const SheetHandle = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 8px;

  &::before {
    content: "";
    width: 44px;
    height: 4px;
    border-radius: 999px;
    background: var(--color-semantic-fill-strong);
  }
`;

const SheetHeader = styled.div`
  padding: 12px 16px 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SheetTitle = styled.span`
  flex: 1;
  text-align: center;
  padding-right: 10px;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
`;

const SheetCloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: var(--typography-heading-2-font-size);
  line-height: 1;
  cursor: pointer;
`;

const SheetList = styled.ul`
  padding: 8px 0 24px;
  max-height: 60vh;
  overflow-y: auto;
`;

const SheetOption = styled.li<{ $selected?: boolean }>`
  padding: 14px 20px;
  cursor: pointer;

  font-size: var(--typography-body-1-normal-font-size);
  line-height: 1.4;

  &:hover {
    background: var(--color-atomic-opacity-12);
  }
`;

/* ---- Date bottom sheet (연/월/일 네이티브 select) ---- */

const DateColumns = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px 20px 4px;
`;

const DateColumnSelect = styled.select`
  flex: 1 1 0;
  min-width: 0;
  height: 44px;
  box-sizing: border-box;
  padding: 0 8px;
  border-radius: 8px;
  text-align: center;

  border: 1px solid var(--color-semantic-line-normal-normal);
  background: var(--color-semantic-background-normal-normal);
  color: var(--color-semantic-label-normal);
  font-size: var(--typography-body-1-normal-font-size);
`;

const DateConfirmButton = styled.button`
  width: calc(100% - 40px);
  margin: 16px 20px 0;
  height: 48px;
  border: none;
  border-radius: 12px;
  cursor: pointer;

  background: var(--color-semantic-primary-normal);
  color: var(--color-semantic-static-white);
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;

  &:disabled {
    background: var(--color-semantic-interaction-disable);
    color: var(--color-semantic-label-assistive);
    cursor: not-allowed;
  }
`;

const CURRENT_YEAR = new Date().getFullYear();
/** 최근 연도부터 100년 치. 생년월일 선택 범위를 넉넉히 잡는다. */
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

/** year/month 가 아직 안 정해졌을 때는 윤년(29일까지) 기준으로 넉넉히 보여준다. */
function daysInMonth(year: number | null, month: number | null): number {
  if (!month) return 31;
  return new Date(year ?? 2024, month, 0).getDate();
}

function parseDateValue(value: string): { year: number | null; month: number | null; day: number | null } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return { year: null, month: null, day: null };
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function formatDateValue(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** "1998-03-15" → "1998. 03. 15." (네이티브 input[type=date]의 ko-KR 표시 형식과 맞춘다) */
function formatDisplayDate(value: string): string | null {
  const { year, month, day } = parseDateValue(value);
  if (year == null || month == null || day == null) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}. ${pad(month)}. ${pad(day)}.`;
}

/* =========================
 *  Component
 * =======================*/

export function Select<T extends Primitive = string>(
  props: SelectProps<T>
) {
  const {
    label,
    isessential,
    placeholder,
    value,
    onChange,
    options = [],
    error,
    errorMessage,
    disabled,
    fieldType = "text",
    bottomSheetTitle,
  } = props;

  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 날짜 바텀시트 전용 임시 선택값. 확인을 눌러야 실제 value로 반영된다.
  const [tempYear, setTempYear] = useState<number | null>(null);
  const [tempMonth, setTempMonth] = useState<number | null>(null);
  const [tempDay, setTempDay] = useState<number | null>(null);

  const usesNativeInput = fieldType === "time";
  const usesDateSheet = fieldType === "date";

  const resolvedPlaceholder =
    placeholder ?? (usesDateSheet ? "연도. 월. 일." : "선택해주세요.");

  const stringValue =
    typeof value === "string" || typeof value === "number" ? String(value) : "";
  const maxDay = daysInMonth(tempYear, tempMonth);

  // 월이 바뀌어 일수가 줄면(예: 31일 → 2월) 선택된 일을 그 달의 마지막 날로 당긴다.
  useEffect(() => {
    if (tempDay != null && tempDay > maxDay) setTempDay(maxDay);
  }, [maxDay, tempDay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 280);
  };

  const openDateSheet = () => {
    const parsed = parseDateValue(stringValue);
    setTempYear(parsed.year);
    setTempMonth(parsed.month);
    setTempDay(parsed.day);
    setOpen(true);
  };

  const handleConfirmDate = () => {
    if (tempYear == null || tempMonth == null || tempDay == null) return;
    onChange(formatDateValue(tempYear, tempMonth, tempDay) as T);
    handleClose();
  };

  const selectedLabels = useMemo(() => {
    if (usesDateSheet || value == null) return [];
    if (Array.isArray(value)) {
      return value
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter((v): v is string => Boolean(v));
    }
    const found = options.find((o) => o.value === value)?.label;
    return found ? [found] : [];
  }, [usesDateSheet, value, options]);

  const handleSelect = (item: SelectOption<T>) => {
    onChange(item.value);
    handleClose();
  };

  const dateDisplay = usesDateSheet ? formatDisplayDate(stringValue) : null;
  const displayText = usesDateSheet
    ? dateDisplay ?? resolvedPlaceholder
    : selectedLabels.length > 0
    ? selectedLabels.join(", ")
    : resolvedPlaceholder;
  const isPlaceholderShown = usesDateSheet ? dateDisplay == null : selectedLabels.length === 0;

  /* ------------ time: 기본 input 사용 (현재 사용처 없음, 기존 동작 유지) ------------- */
  if (usesNativeInput) {
    return (
      <SelectWrapper>
        {label &&
        <div style={{display: "flex", gap: "4px"}}>
        <FieldLabel>{label}</FieldLabel>
        {isessential && <Label1Normal $color="var(--color-semantic-status-destructive)">*</Label1Normal>}
        </div>}

        <NativeInput
          type={fieldType}
          value={stringValue}
          onChange={(e) => onChange(e.target.value as T)}
          disabled={disabled}
          $error={error}
        />

        {error && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </SelectWrapper>
    );
  }

  /* ------------ date / 그 외 타입: 바텀시트 Select ------------- */
  return (
    <SelectWrapper>
      {label &&
      <div style={{display: "flex", gap: "4px"}}>
      <FieldLabel>{label}</FieldLabel>
      {isessential && <Label1Normal $color="var(--color-semantic-status-destructive)">*</Label1Normal>}
      </div>}
      <SelectTrigger
        type="button"
        aria-label={label ?? bottomSheetTitle}
        onClick={() => !disabled && (usesDateSheet ? openDateSheet() : setOpen(true))}
        $error={error}
        $disabled={disabled}
      >
        <SelectValue $placeholder={isPlaceholderShown}>
          {displayText}
        </SelectValue>
        <img
          src="/icons/navigation/textfield-arrow.svg"
          alt=""
        />
      </SelectTrigger>

      {error && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      {open && (
        <SheetOverlay $closing={isClosing} onClick={handleClose}>
          <Sheet $closing={isClosing} onClick={(e) => e.stopPropagation()}>
            <SheetHandle />
            <SheetHeader>
              <div style={{ width: 24 }} /> {/* 왼쪽 spacer */}
              <SheetTitle>{bottomSheetTitle ?? label}</SheetTitle>
              <SheetCloseButton onClick={handleClose}>
                ×
              </SheetCloseButton>
            </SheetHeader>

            {usesDateSheet ? (
              <>
                <DateColumns>
                  <DateColumnSelect
                    aria-label="연도"
                    value={tempYear ?? ""}
                    onChange={(e) => setTempYear(Number(e.target.value))}
                  >
                    <option value="" disabled>년도</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </DateColumnSelect>
                  <DateColumnSelect
                    aria-label="월"
                    value={tempMonth ?? ""}
                    onChange={(e) => setTempMonth(Number(e.target.value))}
                  >
                    <option value="" disabled>월</option>
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </DateColumnSelect>
                  <DateColumnSelect
                    aria-label="일"
                    value={tempDay ?? ""}
                    onChange={(e) => setTempDay(Number(e.target.value))}
                  >
                    <option value="" disabled>일</option>
                    {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}일</option>
                    ))}
                  </DateColumnSelect>
                </DateColumns>
                <DateConfirmButton
                  type="button"
                  disabled={tempYear == null || tempMonth == null || tempDay == null}
                  onClick={handleConfirmDate}
                >
                  확인
                </DateConfirmButton>
              </>
            ) : (
              <SheetList>
                {options.map((opt) => {
                  const selected = Array.isArray(value)
                    ? value.includes(opt.value)
                    : value === opt.value;

                  return (
                    <SheetOption
                      key={String(opt.value)}
                      $selected={selected}
                      onClick={() => handleSelect(opt)}
                    >
                      {opt.label}
                    </SheetOption>
                  );
                })}
              </SheetList>
            )}
          </Sheet>
        </SheetOverlay>
      )}
    </SelectWrapper>
  );
}
