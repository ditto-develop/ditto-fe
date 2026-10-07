"use client";

import type { ReactNode } from "react";
import styled from "styled-components";
import { Button } from "@/shared/ui";

interface RatingSubmitButtonProps {
  looksDisabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

/**
 * 평가 하단 CTA. `disabled` 속성을 쓰지 않는다 — 클릭이 막히면 "별점은 필수로 선택해야 해요"
 * 같은 이유를 보여줄 수 없다. 소개 노트 수정 CTA와 같은 방식이라, 조건 확인은 onClick 쪽이 한다.
 */
export function RatingSubmitButton({ looksDisabled, onClick, children }: RatingSubmitButtonProps) {
  return (
    <SubmitButton
      type="button"
      $size="large"
      $looksDisabled={looksDisabled}
      aria-disabled={looksDisabled}
      onClick={onClick}
    >
      {children}
    </SubmitButton>
  );
}

const SubmitButton = styled(Button)<{ $looksDisabled: boolean }>`
  width: 100%;

  ${({ $looksDisabled }) =>
    $looksDisabled &&
    `
    background-color: var(--color-semantic-interaction-disable);
    color: var(--color-semantic-label-disable);
    cursor: not-allowed;

    &:hover,
    &:active {
      background-color: var(--color-semantic-interaction-disable);
    }
  `}
`;
