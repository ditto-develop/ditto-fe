"use client";

import styled from "styled-components";

import { Button, SkeletonBlock } from "@/shared/ui";

/** 기록 탭 첫 로딩 — 요약 3칸(86px)과 이번 주 카드 자리를 같은 크기로 깐다. */
export function RecordsTabSkeleton() {
  return (
    <SkeletonStack aria-busy="true" aria-label="기록을 불러오는 중">
      <TileRow>
        <SkeletonBlock $width="100%" $height="86px" $radius="var(--radius-radi-4)" />
        <SkeletonBlock $width="100%" $height="86px" $radius="var(--radius-radi-4)" />
        <SkeletonBlock $width="100%" $height="86px" $radius="var(--radius-radi-4)" />
      </TileRow>
      <SkeletonBlock $width="100%" $height="280px" $radius="var(--radius-radi-4)" />
    </SkeletonStack>
  );
}

/** 내 답변/퀴즈 결과 첫 로딩 — 머리 카드와 문항 카드 자리. */
export function RecordDetailSkeleton() {
  return (
    <SkeletonStack aria-busy="true" aria-label="기록을 불러오는 중">
      <SkeletonBlock $width="100%" $height="262px" $radius="var(--radius-radi-4)" />
      <SkeletonBlock $width="100%" $height="480px" $radius="var(--radius-radi-4)" />
    </SkeletonStack>
  );
}

type RecordsLoadErrorProps = {
  message: string;
  onRetry?: () => void;
};

/** 불러오기 실패. 아직 운영 BE 에 없는 API 라(위키 BE-Request-Quiz-Records) 테스터 기기에서는 여기로 온다. */
export function RecordsLoadError({ message, onRetry }: RecordsLoadErrorProps) {
  return (
    <ErrorBox role="alert">
      <ErrorText>{message}</ErrorText>
      {onRetry && (
        <Button type="button" $variant="outlined" $size="small" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </ErrorBox>
  );
}

const SkeletonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: 0 var(--space-4);
`;

const TileRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
`;

const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-4);
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
  text-align: center;
`;
