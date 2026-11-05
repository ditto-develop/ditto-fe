"use client";

import styled from "styled-components";

import { formatParticipantCount } from "@/components/home/_parts/participantCount";
import { formatRecordMeta } from "@/features/records/lib/recordFormat";
import type { QuizHistoryDetail } from "@/features/records/model/types";
import { NotebookCard } from "@/features/records/ui/NotebookCard";
import { RecordCardHeading } from "@/features/records/ui/RecordCardHeading";
import { RecordStatusChip } from "@/features/records/ui/RecordStatusChip";
import { Icon } from "@/shared/ui";

type RecordDetailHeaderCardProps = {
  record: QuizHistoryDetail;
  /** 공개 전 카운트다운 문구("10:49:25"). 공개 후에는 쓰지 않는다. */
  countdownLabel: string;
  /** 이 기기 시계로 공개 시각이 지났지만 서버가 아직 공개 전이라고 할 때. */
  countdownExpired: boolean;
};

/**
 * 내 답변 보기 [3254:37956] · 퀴즈 결과 [3255:37090] 의 머리 수첩 카드.
 * 아래 두 칸이 공개 전에는 "통계 공개까지 / 지금까지 참여한 사람", 공개 후에는
 * "나와 N개 이상 답이 겹친 사람 / 나만의 소수 의견" 이다.
 */
export function RecordDetailHeaderCard({
  record,
  countdownLabel,
  countdownExpired,
}: RecordDetailHeaderCardProps) {
  const result = record.phase === "CLOSED" ? (record.result ?? null) : null;
  const meta = formatRecordMeta(record);

  return (
    <Card>
      <RecordCardHeading
        meta={meta}
        title={record.title}
        // 시안의 "10월 27일 21:14 제출" 은 응답에 제출 시각이 없어 뺀다(IMP-1 BE-2).
        subtitle={null}
        chip={
          result ? (
            <RecordStatusChip tone="positive">결과 공개</RecordStatusChip>
          ) : (
            <RecordStatusChip tone="neutral">결과 공개 전</RecordStatusChip>
          )
        }
      />

      {result ? (
        <TileRow>
          <Tile>
            <TileLabel>
              나와 {result.overlapThreshold}개 이상
              <br />
              답이 겹친 사람
            </TileLabel>
            <TileValue>{result.overlapCount.toLocaleString("ko-KR")}명</TileValue>
          </Tile>
          <Tile>
            <TileLabel>
              나만의
              <br />
              소수 의견
            </TileLabel>
            <TileValue $negative>{result.minorityCount}개</TileValue>
          </Tile>
        </TileRow>
      ) : (
        <StatsBox>
          <Stat>
            <ClockIcon name="status.time" size={20} />
            <StatLabel>통계 공개까지</StatLabel>
            <StatValue data-testid="record-reveal-countdown">
              {countdownExpired ? "곧 공개돼요" : countdownLabel}
            </StatValue>
          </Stat>
          <Stat>
            <PeopleIcon name="content.people" size={20} />
            <StatLabel>지금까지 참여한 사람</StatLabel>
            <StatValue>{formatParticipantCount(record.participantCount)}</StatValue>
          </Stat>
        </StatsBox>
      )}
    </Card>
  );
}

const Card = styled(NotebookCard)`
  gap: var(--space-4);
  padding: var(--space-8) var(--space-4);
`;

const StatsBox = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: var(--space-3);
  background-color: var(--color-semantic-fill-normal);
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  min-width: 0;
`;

const ClockIcon = styled(Icon)`
  color: var(--color-semantic-status-negative);
`;

const PeopleIcon = styled(Icon)`
  color: var(--color-semantic-status-positive);
`;

const StatLabel = styled.span`
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const StatValue = styled.strong`
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
  font-variant-numeric: tabular-nums;
`;

const TileRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
`;

const Tile = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border-radius: var(--space-3);
  background-color: var(--color-semantic-fill-normal);
`;

const TileLabel = styled.span`
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const TileValue = styled.strong<{ $negative?: boolean }>`
  font-size: var(--typography-heading-2-font-size);
  font-weight: var(--typography-heading-2-font-weight);
  line-height: var(--typography-heading-2-line-height);
  letter-spacing: var(--typography-heading-2-letter-spacing);
  color: ${({ $negative }) =>
    $negative ? "var(--color-semantic-status-negative)" : "var(--color-semantic-label-normal)"};
`;
