"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import styled, { keyframes } from "styled-components";

import { avatarLabel } from "@/features/records/lib/roomAnswerText";
import type { RoomQuizMember } from "@/features/records/model/types";
import { NotebookCard } from "@/features/records/ui/NotebookCard";
import { useBackClose } from "@/shared/hooks/useBackClose";
import { Icon, TopNavigation } from "@/shared/ui";

/*
 * "우리의 답변"(1:1 · Figma 3257:52969) / "우리 그룹의 답변"(그룹 · Figma 3258:54028) 공통 조각.
 * 두 화면 모두 대화방 위에 전체 화면으로 덮이는 상태 화면이다(투표·멤버 목록 화면과 같은 방식).
 */

type RoomAnswersPageShellProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function RoomAnswersPageShell({ title, onClose, children }: RoomAnswersPageShellProps) {
  // 라우트가 아니라 상태로 떠 있는 화면이다. OS 뒤로가기가 채팅방 문서를 걷어내지 않게 등록한다.
  useBackClose(true, onClose);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <Overlay role="dialog" aria-label={title} data-cy="room-answers-page">
      <Header>
        <TopNavigation label={title} onBack={onClose} />
      </Header>
      <Body>{children}</Body>
    </Overlay>
  );
}

type RoomAnswersHeaderCardProps = {
  members: RoomQuizMember[];
  caption: string;
  headline: string;
  note?: string;
  children?: ReactNode;
};

/** 수첩 머리 카드 — 멤버 원 + "12개 질문 중 / 7개가 같아요". */
export function RoomAnswersHeaderCard({
  members,
  caption,
  headline,
  note,
  children,
}: RoomAnswersHeaderCardProps) {
  // 나를 맨 앞에 둔다(Figma: "나" 원이 가장 왼쪽, 밝은 색).
  const ordered = [...members].sort((a, b) => Number(b.isMe) - Number(a.isMe));

  return (
    <HeaderCard>
      <Avatars aria-hidden>
        {ordered.map((member) => (
          <AvatarCircle key={member.memberId} $isMe={member.isMe}>
            {avatarLabel(member)}
          </AvatarCircle>
        ))}
      </Avatars>
      <HeaderTexts>
        <Caption>{caption}</Caption>
        <Headline>{headline}</Headline>
        {note && <Note>{note}</Note>}
      </HeaderTexts>
      {children}
    </HeaderCard>
  );
}

type RoomAnswersSectionProps = {
  title: string;
  aside?: string;
  children: ReactNode;
};

/** "같은 답 7" + 카드. 문항 사이는 점선으로 나눈다. */
export function RoomAnswersSection({ title, aside, children }: RoomAnswersSectionProps) {
  return (
    <Section>
      <SectionHeading>
        <SectionTitle>{title}</SectionTitle>
        {aside && <SectionAside>{aside}</SectionAside>}
      </SectionHeading>
      <SectionCard>{children}</SectionCard>
    </Section>
  );
}

/**
 * 질문 보내기 버튼 상태(IMP-1 FE-4).
 * - `ready`: 보낼 수 있다.
 * - `sent`: 이 방에 이미 올린 문항 — 비활성.
 * - `locked`: 아직 보낼 수 없다(채팅 개방 전 등). 딤드 + 안내 문구.
 */
export type RoomShareState =
  | { kind: "ready" }
  | { kind: "sent" }
  | { kind: "locked"; message: string };

/** 문항 하나의 버튼 상태. 보낼 수 있는지는 서버 `canSendCard` 와 방 상태로 호출부가 정한다. */
export function shareStateOf(
  item: { sent: boolean },
  share: { canSend: boolean; lockedMessage: string },
): RoomShareState {
  if (item.sent) return { kind: "sent" };
  if (!share.canSend) return { kind: "locked", message: share.lockedMessage };
  return { kind: "ready" };
}

type RoomSameAnswerRowProps = {
  order: number;
  question: string;
  answer: string;
  /** 강조 문항(같은 답 중 가장 드문 답) — 빨간 글씨(Figma 3273:37181). */
  highlighted?: boolean;
  shareLabel: string;
  shareState: RoomShareState;
  onShare: () => void;
  /** 딤드 말풍선을 눌렀을 때 — 버튼 문구 대신 같은 안내를 토스트로 띄운다(IMP-1 FE-4). */
  onLockedTap: (message: string) => void;
};

/** 같은 답 한 줄 — 문항 + 답 + 오른쪽 말풍선 버튼(Chip/Action, Figma 3272:36852). */
export function RoomSameAnswerRow({
  order,
  question,
  answer,
  highlighted = false,
  shareLabel,
  shareState,
  onShare,
  onLockedTap,
}: RoomSameAnswerRowProps) {
  const locked = shareState.kind === "locked";
  return (
    <Row data-cy="room-same-answer">
      <RowTexts>
        <QuestionLabel $highlighted={highlighted}>
          Q{order}. {question}
        </QuestionLabel>
        <SameAnswer $highlighted={highlighted}>{answer}</SameAnswer>
      </RowTexts>
      <ChipAction
        type="button"
        aria-label={`Q${order} ${shareLabel}`}
        // 개방 전 딤드는 눌러서 이유를 볼 수 있어야 해 disabled 대신 aria-disabled 로 둔다.
        aria-disabled={locked || undefined}
        $dimmed={locked}
        disabled={shareState.kind === "sent"}
        onClick={() => {
          if (shareState.kind === "locked") onLockedTap(shareState.message);
          else onShare();
        }}
      >
        <Icon name="action.message" size={14} />
      </ChipAction>
    </Row>
  );
}

export function RoomQuestionLabel({ order, question }: { order: number; question: string }) {
  return (
    <QuestionLabel $highlighted={false}>
      Q{order}. {question}
    </QuestionLabel>
  );
}

type RoomShareButtonProps = {
  label: string;
  state: RoomShareState;
  onClick: () => void;
};

/**
 * "이 질문으로 말 걸기" · "대화방에 이 질문 올리기" 외곽선 버튼(Figma 3258:53465).
 * 보낸 문항은 "보냄", 열리기 전에는 버튼 안 문구가 "{열리는 시각}부터 보낼 수 있어요" 로 바뀐다.
 */
export function RoomShareButton({ label, state, onClick }: RoomShareButtonProps) {
  const text = state.kind === "sent" ? "보냄" : state.kind === "locked" ? state.message : label;
  return (
    <ShareButton type="button" disabled={state.kind !== "ready"} onClick={onClick}>
      {state.kind === "ready" && <Icon name="action.bubble" size={16} />}
      {text}
    </ShareButton>
  );
}

/** 문항 묶음(질문 + 답 + 버튼). 카드 안 문항 사이 점선 구분을 맡는다. */
export const RoomQuestionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0 var(--space-4);

  & + & {
    padding-top: var(--space-4);
    border-top: 1px dashed var(--color-semantic-line-solid-neutral);
    margin: 0 var(--space-4);
    padding-left: 0;
    padding-right: 0;
  }
`;

/* ─────────────────────────── styles ─────────────────────────── */

const slideInRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  background-color: var(--color-semantic-background-normal-normal);
  animation: ${slideInRight} 0.28s cubic-bezier(0.25, 1, 0.5, 1) forwards;
`;

const Header = styled.div`
  flex-shrink: 0;
  padding-top: env(safe-area-inset-top, 0px);
  background-color: var(--color-semantic-background-normal-normal);
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-6) + var(--spacing-2px));
  padding: var(--space-4) var(--space-4) calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
`;

const HeaderCard = styled(NotebookCard)`
  align-items: center;
  gap: var(--spacing-10px);
  padding: var(--space-8) var(--space-4) var(--space-5);
`;

const Avatars = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* 68px 원, 3px 테두리로 겹친다(Figma 3257:53373). */
const AvatarCircle = styled.span<{ $isMe: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--space-16) + var(--space-1));
  height: calc(var(--space-16) + var(--space-1));
  box-sizing: border-box;
  border: calc(var(--spacing-2px) + var(--spacing-1px)) solid
    var(--color-semantic-background-elevated-alternative);
  border-radius: 50%;
  background-color: ${({ $isMe }) =>
    $isMe ? "var(--color-semantic-background-elevated-normal)" : "var(--color-semantic-primary-normal)"};
  color: ${({ $isMe }) =>
    $isMe ? "var(--color-semantic-primary-normal)" : "var(--color-semantic-background-normal-normal)"};
  font-family: var(--typography-font-family);
  font-size: var(--typography-heading-2-font-size);
  font-weight: 600;
  line-height: var(--typography-heading-2-line-height);
  letter-spacing: var(--typography-heading-2-letter-spacing);

  & + & {
    margin-left: calc(-1 * var(--spacing-6px));
  }
`;

const HeaderTexts = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2px);
  width: 100%;
  text-align: center;
`;

const Caption = styled.p`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const Headline = styled.h2`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-heading-2-font-size);
  font-weight: 600;
  line-height: var(--typography-heading-2-line-height);
  letter-spacing: var(--typography-heading-2-letter-spacing);
  color: var(--color-semantic-label-normal);
`;

const Note = styled.p`
  margin: var(--spacing-2px) 0 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
  word-break: keep-all;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-3) + var(--spacing-2px));
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const SectionAside = styled.span`
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const SectionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5) 0;
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-background-elevated-alternative);
`;

const Row = styled(RoomQuestionBlock)`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
`;

const RowTexts = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-1);
`;

const QuestionLabel = styled.p<{ $highlighted: boolean }>`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: ${({ $highlighted }) =>
    $highlighted ? "var(--color-semantic-status-negative)" : "var(--color-semantic-label-alternative)"};
  word-break: keep-all;
`;

const SameAnswer = styled.p<{ $highlighted: boolean }>`
  margin: 0;
  padding: 0 var(--space-4);
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-1-reading-font-size);
  font-weight: 400;
  line-height: var(--typography-body-1-reading-line-height);
  letter-spacing: var(--typography-body-1-reading-letter-spacing);
  color: ${({ $highlighted }) =>
    $highlighted ? "var(--color-semantic-status-negative)" : "var(--color-semantic-label-normal)"};
`;

/* Chip/Action — 36px 정사각, line/solid/alternative 바탕(Figma 3272:36852). 보낸 문항은 흐리게(3276:34950). */
const ChipAction = styled.button<{ $dimmed: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  align-self: center;
  padding: calc(var(--spacing-10px) + var(--spacing-1px));
  border: none;
  border-radius: var(--spacing-10px);
  cursor: pointer;
  background-color: var(--color-semantic-line-solid-alternative);
  color: ${({ $dimmed }) =>
    $dimmed ? "var(--color-semantic-label-disable)" : "var(--color-semantic-label-normal)"};

  &:disabled {
    cursor: default;
    color: var(--color-semantic-label-disable);
  }
`;

/* 답과 버튼 사이 12px(문항 묶음 gap 8px + 4px, Figma 3258:53699). */
const ShareButton = styled.button`
  margin-top: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-6px);
  width: 100%;
  padding: var(--space-3) var(--space-7);
  box-sizing: border-box;
  border: 1px solid var(--color-semantic-label-normal);
  border-radius: var(--space-3);
  cursor: pointer;
  background-color: var(--color-semantic-background-elevated-alternative);
  color: var(--color-semantic-label-normal);
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);

  &:disabled {
    cursor: default;
    border-color: var(--color-semantic-line-normal-neutral);
    color: var(--color-semantic-label-disable);
  }
`;
