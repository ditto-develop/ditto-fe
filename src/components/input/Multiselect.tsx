// MultiSelectChip.tsx
import { Body2Normal, Caption1, Label1Normal } from "@/components/common/Text";
import React from "react";
import styled from "styled-components";

type ChipSize = "xsmall" | "small" | "medium" | "large";

export interface ChipOption {
  label: string;
  value: string;
}

export interface SizeConfig {
  width?: number | string;
  height?: number | string;
  padding?: string
}

export interface MultiSelectChipProps {
  option: ChipOption;              // label + value를 한 번만 전달
  size?: ChipSize;
  selectedValues: string[];        // 현재 선택된 값 리스트
  disabled?: boolean;
  onClick?: (value: string) => void;
  sizeConfig?: SizeConfig;         // width/height/padding 묶음 override
}

export const MultiSelectChip: React.FC<MultiSelectChipProps> = ({
  option,
  size = "medium",
  selectedValues,
  disabled = false,
  onClick,
  sizeConfig,
}) => {
  const selected = selectedValues.includes(option.value);

  const handleClick = () => {
    if (disabled) return;
    onClick?.(option.value);
  };

  return (
    <ChipButton
      type="button"
      $size={size}
      $selected={selected}
      $sizeConfig={sizeConfig}
      disabled={disabled}
      onClick={handleClick}
    >
      {size === "xsmall" ? (
        <Caption1 $weight="medium">{option.label}</Caption1>
      ) : size === "small" ? (
        <Label1Normal>{option.label}</Label1Normal>
      ) : (
        <Body2Normal
          $color={
            selected
              ? "var(--Semantic-Inverse-Label, var(--Inverse-Label, #F3F1EF))"
              : "var(--Semantic-Label-Alternative, var(--Label-Alternative, rgba(47, 43, 39, 0.61)))"
          }
        >
          {option.label}
        </Body2Normal>
      )}
    </ChipButton>
  );
};

// ------------------------------
// 기본 Size Tokens
// ------------------------------
const sizeTokens: Record<
  ChipSize,
  { width: string; height: string; padding: string; borderRadius: string }
> = {
  xsmall: {
    width: "48px",
    height: "24px",
    padding: "4px 7px",
    borderRadius: "6px",
  },
  small: {
    width: "57px",
    height: "32px",
    padding: "6px 8px",
    borderRadius: "8px",
  },
  medium: {
    width: "66px",
    height: "36px",
    padding: "7px 11px",
    borderRadius: "10px",
  },
  large: {
    width: "68px",
    height: "40px",
    padding: "9px 12px",
    borderRadius: "10px",
  },
};

const toCssSize = (v?: number | string) =>
  typeof v === "number" ? `${v}px` : v;

// ------------------------------
// ChipButton Styled Component
// ------------------------------
const ChipButton = styled.button<{
  $size: ChipSize;
  $selected: boolean;
  $sizeConfig?: SizeConfig;
}>`
  box-sizing: border-box;

  /* width → min-width */
  min-width: ${({ $size, $sizeConfig }) =>
    toCssSize($sizeConfig?.width) ?? sizeTokens[$size].width};

  /* height → min-height */
  min-height: ${({ $size, $sizeConfig }) =>
    toCssSize($sizeConfig?.height) ?? sizeTokens[$size].height};

  /* padding 유지 → 자동 확장 가능 */
  padding: ${({ $size, $sizeConfig }) =>
    $sizeConfig?.padding ?? sizeTokens[$size].padding};

  border-radius: ${({ $size }) => sizeTokens[$size].borderRadius};

  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;

  background-color: ${({ $selected }) =>
    $selected
      ? "var(--Primary-Hover, #8E867F)"
      : "var(--Fill-Alternative, rgba(108, 101, 95, 0.05))"};

  color: ${({ $selected }) =>
    $selected
      ? "#F3F1EF"
      : "var(--color-semantic-label-alternative, var(--color-semantic-label-alternative, rgba(47, 43, 39, 0.61)))"};

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    cursor: default;
    background-color: var(--chip-bg-disabled, #dedede);
    color: var(--chip-text-disabled, #aaaaaa);
  }
`;
