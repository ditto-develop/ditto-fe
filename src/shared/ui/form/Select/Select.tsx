// Select.tsx
import { Label1Normal } from "@/shared/ui";
import React, { useMemo, useState } from "react";
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
  options: ReadonlyArray<SelectOption<T>>;

  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;

  /**
   * 필드 타입
   * - "date" | "time" 이면 기본 input[type=date|time] 사용
   * - 그 외(text, number…)는 바텀시트 Select UI 사용
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
`;

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  color: var(--color-semantic-label-normal);
`;

const SelectTrigger = styled.button<SelectTriggerProps>`
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  background: ${({ $disabled }) =>
    $disabled
      ? "var(--color-atomic-coolNeutral-50)"
      : "var(--color-semantic-background-normal-normal)"};

  border: 1px solid
    ${({ $error, $disabled }) =>
      $disabled
        ? "var(--color-line-disabled)"
        : $error
        ? "var(--color-status-negative)"
        : "var(--color-line-neutral)"};

  color: ${({ $disabled }) =>
    $disabled
      ? "var(--color-label-disabled)"
      : "var(--color-label-default)"};

  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  transition: background 0.15s ease, border 0.15s ease;
`;

const SelectValue = styled.span<{ $placeholder?: boolean }>`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--typography-label-1-normal-font-size);

  color: ${({ $placeholder }) =>
    $placeholder
      ? "var(--color-semantic-label-alternative)"
      : "var(--color-semantic-line-normal-normal)"};
`;

const ErrorMessage = styled.div`
  margin-top: 4px;
  font-size: var(--typography-caption-1-font-size);
  color: var(--color-semantic-status-negative);
`;

/* ---- Native date/time input ---- */

const NativeInput = styled.input<{ $error?: boolean }>`
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;

  border: 1px solid
    ${({ $error }) =>
      $error ? "var(--color-semantic-status-negative)" : "var(--color-line-neutral)"};
  background: var(--color-semantic-background-normal-normal);
  color: var(--color-label-default);
  font-size: var(--typography-label-1-normal-font-size);

  &:disabled {
    background: var(--color-atomic-coolNeutral-50);
    color: var(--color-label-disabled);
    border-color: var(--color-line-disabled);
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
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;

  display: flex;
  justify-content: center;
  align-items: flex-end;

  animation: ${({ $closing }) => $closing ? overlayFadeOut : overlayFadeIn} 0.28s ease forwards;
`;

const Sheet = styled.div<{ $closing: boolean }>`
  width: 100%;
  max-width: 480px;
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
    background: var(--Fill-Strong, rgba(108, 101, 95, 0.16));
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

/* =========================
 *  Component
 * =======================*/

export function Select<T extends Primitive = string>(
  props: SelectProps<T>
) {
  console.log('[src/shared/ui/form/Select/Select.tsx] Select'); // __component_log__
  const {
    label,
    isessential,
    placeholder = "선택해주세요.",
    value,
    onChange,
    options,
    error,
    errorMessage,
    disabled,
    fieldType = "text",
    bottomSheetTitle,
  } = props;

  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 280);
  };

  const isDateOrTime = fieldType === "date" || fieldType === "time";
  const useBottomSheet = !isDateOrTime;

  const selectedLabels = useMemo(() => {
    if (value == null) return [];
    if (Array.isArray(value)) {
      return value
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter((v): v is string => Boolean(v));
    }
    const found = options.find((o) => o.value === value)?.label;
    return found ? [found] : [];
  }, [value, options]);

  const handleSelect = (item: SelectOption<T>) => {
    onChange(item.value);
    handleClose();
  };

  const displayText =
    selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder;

  /* ------------ 날짜/시간은 기본 input 사용 ------------- */
  if (isDateOrTime) {
    const stringValue =
      typeof value === "string" || typeof value === "number"
        ? String(value)
        : "";

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

  /* ------------ 그 외 타입: 바텀시트 Select ------------- */
  return (
    <SelectWrapper>
      {label && 
      <div style={{display: "flex", gap: "4px"}}>
      <FieldLabel>{label}</FieldLabel>
      {isessential && <Label1Normal $color="var(--color-semantic-status-destructive)">*</Label1Normal>}
      </div>}
      <SelectTrigger
        type="button"
        onClick={() => !disabled && setOpen(true)}
        $error={error}
        $disabled={disabled}
      >
        <SelectValue $placeholder={selectedLabels.length === 0}>
          {displayText}
        </SelectValue>
        <img 
          src="/icons/navigation/textfield-arrow.svg"
          alt=""
        />
      </SelectTrigger>

      {error && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      {useBottomSheet && open && (
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
          </Sheet>
        </SheetOverlay>
      )}
    </SelectWrapper>
  );
}
