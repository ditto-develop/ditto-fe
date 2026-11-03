"use client";

import styled from "styled-components";

import type { QuizChip } from "@/features/records/lib/roomAnswerText";
import { ChatQuizChips } from "@/features/records/ui/ChatQuizChips";
import { Icon } from "@/shared/ui";

type RoomQuizAttachmentPreviewProps = {
  order: number;
  question: string;
  chips: QuizChip[];
  onRemove: () => void;
};

/**
 * 질문 보내기 — 입력창 위에 붙는 문항 미리보기(Figma 3279:35057). ×로 떼면 평소 입력창으로 돌아간다.
 */
export function RoomQuizAttachmentPreview({
  order,
  question,
  chips,
  onRemove,
}: RoomQuizAttachmentPreviewProps) {
  return (
    <Card data-cy="room-quiz-attachment">
      <TitleRow>
        <Title>
          Q{order}. {question}
        </Title>
        <RemoveButton
          type="button"
          aria-label="보낼 질문 빼기"
          // 입력창 포커스를 지켜 키보드가 닫히지 않게 한다(ChatInput 전송 버튼과 같은 이유).
          onMouseDown={(event) => event.preventDefault()}
          onClick={onRemove}
        >
          <Icon name="navigation.close" size={18} />
        </RemoveButton>
      </TitleRow>
      <ChatQuizChips chips={chips} />
    </Card>
  );
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) calc(var(--space-4) + var(--spacing-2px));
  box-sizing: border-box;
  border-radius: var(--space-3);
  background-color: var(--color-semantic-static-white);
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
`;

const Title = styled.p`
  flex: 1;
  min-width: 0;
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
  font-feature-settings: "ss10" 1;
`;

const RemoveButton = styled.button`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2px);
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-semantic-label-normal);
`;
