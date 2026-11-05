"use client";

import styled from "styled-components";

import { formatRecordMeta, formatRevealMoment } from "@/features/records/lib/recordFormat";
import type { QuizHistoryCurrentWeek, QuizHistoryWeek } from "@/features/records/model/types";
import { NotebookCard } from "@/features/records/ui/NotebookCard";
import { RecordCardHeading } from "@/features/records/ui/RecordCardHeading";
import { RecordStatusChip } from "@/features/records/ui/RecordStatusChip";
import { Button, Icon } from "@/shared/ui";

type ThisWeekRecordCardProps = {
  record: QuizHistoryWeek;
  /** 공개 여부·공개 시각. 서버가 이번 주에만 준다. */
  currentWeek: QuizHistoryCurrentWeek;
  onOpen: (quizSetId: number) => void;
};

/**
 * 기록 탭의 이번 주 카드(Figma 3254:37067). 통계 공개 전에는 "통계는 목요일 0시에 공개돼요"
 * 안내를 두고 버튼은 "내 답변 보기", 공개 뒤에는 안내 없이 "결과 보기" 다.
 */
export function ThisWeekRecordCard({ record, currentWeek, onOpen }: ThisWeekRecordCardProps) {
  const revealed = currentWeek.resultOpen;
  const revealMoment = revealed ? null : formatRevealMoment(currentWeek.resultOpensAt);

  return (
    <Card>
      <RecordCardHeading
        meta={formatRecordMeta(record, { withWeek: true })}
        title={record.title}
        // 시안은 "제출 완료 · 12개 답변" 인데 기록 목록 응답에 답변 수가 없다(IMP-1 BE-2).
        subtitle="제출 완료"
        chip={<RecordStatusChip tone="primary">이번 주</RecordStatusChip>}
      />

      {revealMoment && (
        <RevealNotice>
          <ClockIcon name="status.time" size={20} />
          <RevealText>
            통계는 <strong>{revealMoment}</strong>에 공개돼요
          </RevealText>
        </RevealNotice>
      )}

      <OpenButton
        type="button"
        $variant="solid"
        $size="large"
        onClick={() => onOpen(record.quizSetId)}
      >
        {revealed ? "결과 보기" : "내 답변 보기"}
      </OpenButton>
    </Card>
  );
}

const Card = styled(NotebookCard)`
  gap: var(--space-4);
  padding: var(--space-8) var(--space-4);
`;

const RevealNotice = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-4);
  border-radius: var(--space-3);
  background-color: var(--color-semantic-fill-normal);
`;

const ClockIcon = styled(Icon)`
  color: var(--color-semantic-status-negative);
`;

const RevealText = styled.p`
  margin: 0;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);

  strong {
    font-weight: 600;
    color: var(--color-semantic-label-normal);
  }
`;

const OpenButton = styled(Button)`
  width: 100%;
`;
