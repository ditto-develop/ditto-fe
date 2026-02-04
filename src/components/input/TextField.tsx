"use client";

import React from "react";
import styled, { css } from "styled-components";
import {
  Headline1,
  Body1Normal,
  Caption1,
  Label1Normal,
  Label2,
} from "@/components/common/Text";

/* ──────────────────────────────── */
/* 공통 타입                        */
/* ──────────────────────────────── */

type InputStatus = "default" | "success" | "error" | "disabled";
type TextFieldVariant = "outlined" | "filled";

export type TextFieldStatus = InputStatus;

/* ──────────────────────────────── */
/* TextField (모든 상태 통합)       */
/* ──────────────────────────────── */

type RightAddonVariant = "button" | "text" | "error" | "success";

type TextFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  label?: string; // 상단 "주제"
  isessential?: boolean;
  message?: string; // 하단 헬퍼/성공 메시지
  errmessage?: Array<string>; // 하단 에러 메시지
  status?: TextFieldStatus;
  variant?: TextFieldVariant; // outlined | filled
  rightAddonText?: string; // 우측에 표시되는 텍스트
  rightAddonVariant?: RightAddonVariant; // 버튼 / 단순 텍스트
  onRightAddonClick?: () => void;
};

export const TextField: React.FC<TextFieldProps> = ({
  label,
  isessential,
  message,
  errmessage,
  status = "default",
  variant = "outlined",
  rightAddonText,
  rightAddonVariant = "button",
  onRightAddonClick,
  disabled,
  ...inputProps
}) => {
  const isDisabled = disabled || status === "disabled";

  const showRightAddon = Boolean(rightAddonText);

  return (
    <FieldRoot>
      {label && <div style={{display: "flex", gap: "4px"}}>
      <FieldLabel $weight="bold">{label}</FieldLabel>
      {isessential && <Label1Normal $color="var(--color-semantic-status-destructive)">*</Label1Normal>}
      </div>}

      <InputWrapper
        $status={status}
        $disabled={isDisabled}
        $variant={variant}
      >
        <StyledInput
          {...inputProps}
          disabled={isDisabled}
          $status={status}
        />
        {status==="error" && 
          <RightAddonImg
            src='/textfield/error.svg'
          />  
        }
        {showRightAddon && (
          <RightArea $isborder={rightAddonVariant === "text" || rightAddonVariant === "button"}>            
            {rightAddonVariant === "text" ? (
              <RightAddonTextOnly $weight="medium">
                {rightAddonText}
              </RightAddonTextOnly>
            ): 
            rightAddonVariant === "success" ?(
              <RightAddonImg
                src='/textfield/success.svg'
              />
            ) : rightAddonVariant === "button" ?(
              <RightAddonButton onClick={onRightAddonClick}>
                <Body1Normal $weight="bold">{rightAddonText}</Body1Normal>
              </RightAddonButton>
            ) : (
                <>
                </>
          )}
          </RightArea>
        )}
        
      </InputWrapper>

      {message && <HelperText $status={status}>{message}</HelperText>}

      {errmessage && 
        <>
          {errmessage.map((msg, index) => (
            /* 배열의 각 메시지(msg)를 하나씩 HelperText로 변환 */
            <HelperText key={index} $status="error">
              {msg}
            </HelperText>
          ))}
        </>
      }
    </FieldRoot>
  );
};

/* ──────────────────────────────── */
/* 공통 styled-components          */
/* ──────────────────────────────── */
/* 오른쪽 영역 공통 (구분선 포함, 높이 꽉 차게) */
const RightArea = styled.div<{ $isborder?: boolean }>`
  height: 100%;
  display: inline-flex;
  align-items: center;
  padding-left: 12px;
  margin-left: 8px;
  position: relative;

  border-left: ${({ $isborder }) => 
  $isborder ? "1px solid var(--color-semantic-line-solid-neutral)" : "none"};
`;

const FieldRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const FieldLabel = styled(Label1Normal)`
  color: var(--color-semantic-label-normal, #1a1815);
`;

const InputWrapper = styled.div<{
  $status: InputStatus;
  $disabled?: boolean;
  $variant: TextFieldVariant;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: 100%;
  min-height: 48px;
  border-radius: 12px;

  padding: 0px 16px;
  box-sizing: border-box;
  gap: 8px;

  border: 1px solid var(--Border-Normal, rgba(26, 24, 21, 0.16));

  /* 기본 배경: variant 에 따라 */
  background: transparent;

  transition: border-color 0.15s ease, background-color 0.15s ease,
    box-shadow 0.15s ease;

  /* 상태별 배경 & border (성공/에러는 우선 적용) */

  ${({ $status }) =>
    $status === "error" &&
    css`
      border-color: var(
        --Semantic-Status-Negative,
        var(--Status-Negative, #e03131)
      );
    `}

  ${({ $disabled }) =>
    $disabled &&
    css`
      border-color: rgba(26, 24, 21, 0.12);
    `}

  /* focus-within: 외곽선, 그림자, 오른쪽 구분선 진하게 */
  &:focus-within {
    border-color: var(--Primary-Normal, #1a1815);
    box-shadow: 0 0 0 1px rgba(26, 24, 21, 0.06);

    ${RightArea}::before {
      background: var(--Primary-Normal, #1a1815);
    }
  }
`;

// Body1Normal을 input으로 래핑
const StyledInput = styled(Body1Normal).attrs({ as: "input" })<{
  $status: InputStatus;
}>`
  flex: 1 1 auto;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;

  color: var(--Semantic-Label-Normal, #1a1815);

  &::placeholder {
    color: var(
      --Semantic-Label-Alternative,
      rgba(47, 43, 39, 0.35)
    );
  }

  &:disabled {
    color: rgba(47, 43, 39, 0.35);
    cursor: not-allowed;
  }
`;



// 버튼 버전 (알약형)
const RightAddonButton = styled.button`
  color: var(--Semantic-Label-Normal, #1a1815);
`;

//아이콘
const RightAddonImg = styled.img`
  
`;

// 단순 텍스트 버전
const RightAddonTextOnly = styled(Label2)`
  color: var(--Semantic-Label-Normal, #1a1815);
`;

// 헬퍼 텍스트
const HelperText = styled(Caption1)<{ $status: InputStatus }>`
  color: ${({ $status }) => {
    switch ($status) {
      case "success":
        return "var(--color-semantic-label-normal, #557a55)";
      case "error":
        return "var(--color-semantic-status-negative, #e03131)";
      case "disabled":
        return "rgba(47, 43, 39, 0.35)";
      default:
        return "var(--color-semantic-label-alternative, rgba(47, 43, 39, 0.61))";
    }
  }};
`;
