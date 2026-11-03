"use client";

import styled from "styled-components";
import { selectableContent } from "@/shared/styles/selection";
import { ChatImage } from "@/app/chat/_components/ChatImage";
import { ChatMessageText } from "@/app/chat/_components/ChatMessageText";
import type { ChatMessage } from "@/features/chat";
import { ChatQuizCardView } from "@/features/records/ui/ChatQuizCardView";

interface GroupMessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  /** 방 목록의 counterpartMemberIds로 따로 조회한 보낸 사람. 못 찾으면 대체 표시한다. */
  senderNickname: string;
  senderAvatarUrl: string | null;
  onImageClick?: (imageUrl: string) => void;
  /** 보낸 사람 아바타를 누르면 그 사람 프로필을 연다. 보낸 사람을 못 찾으면 비운다. */
  onAvatarClick?: () => void;
  /** QUIZ 카드용. 1:1 처럼 고른 사람이 실려 오면 "나"·이름을 가린다. */
  myUserId?: number | null;
  nameOf?: (memberId: number) => string;
  /** QUIZ 카드에서 밝게 칠할 내 선택지·이어서 던질 질문. 방 답변을 읽었을 때만(테스터 모드) 있다. */
  quizMyChoiceId?: number | null;
  quizPrompt?: string | null;
}

function formatTime(date: string): string {
  // BE는 `yyyy-MM-dd HH:mm:ss`로 내려준다. Safari에서 파싱되도록 T로 바꾼다.
  const d = new Date(date.includes("T") ? date : date.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function GroupMessageBubble({
  message,
  isMine,
  isFirstInGroup,
  senderNickname,
  senderAvatarUrl,
  onImageClick,
  onAvatarClick,
  myUserId = null,
  nameOf = () => "알 수 없음",
  quizMyChoiceId = null,
  quizPrompt = null,
}: GroupMessageBubbleProps) {
  // IMAGE는 content가 S3 key라 그대로 그리면 안 된다. 표시는 항상 imageUrl을 쓴다.
  const body =
    message.messageType === "IMAGE" ? (
      <ImageButton
        type="button"
        onClick={() => message.imageUrl && onImageClick?.(message.imageUrl)}
        disabled={!message.imageUrl}
      >
        {message.imageUrl ? (
          <ChatImage key={message.imageUrl} src={message.imageUrl} alt="보낸 이미지" />
        ) : (
          <ImageFallback>이미지를 불러오지 못했어요</ImageFallback>
        )}
      </ImageButton>
    ) : (
      <BubbleText><ChatMessageText content={message.content} /></BubbleText>
    );

  /*
   * 8.1 질문 보내기(QUIZ) — 문항 카드 + 덧붙인 한마디(Figma 그룹 카드 3273:37755 · 3273:37774).
   * 테스터 모드와 상관없이 그린다. 카드 스냅샷이 없으면(예전 서버) 본문만 글로 남는다.
   */
  const quizCard =
    message.messageType === "QUIZ" && message.quiz ? (
      <ChatQuizCardView
        card={message.quiz}
        myUserId={myUserId}
        nameOf={nameOf}
        myChoiceId={quizMyChoiceId}
        prompt={message.quiz.prompt ?? quizPrompt}
      />
    ) : null;

  if (isMine) {
    if (quizCard) {
      return (
        <SentRow data-chat-message-id={message.id}>
          <SentMeta>
            {message.unreadCount > 0 && (
              <TimeLabel aria-label={`안 읽은 사람 ${message.unreadCount}명`}>
                {message.unreadCount}
              </TimeLabel>
            )}
            <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
          </SentMeta>
          <QuizStack $align="end">
            {quizCard}
            {message.content && <SentBubble $isFirstInGroup={false}>{body}</SentBubble>}
          </QuizStack>
        </SentRow>
      );
    }

    return (
      <SentRow data-chat-message-id={message.id}>
        {(
          <SentMeta>
            {message.unreadCount > 0 && (
              <TimeLabel aria-label={`안 읽은 사람 ${message.unreadCount}명`}>
                {message.unreadCount}
              </TimeLabel>
            )}
            <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
          </SentMeta>
        )}
        <SentBubble $isFirstInGroup={isFirstInGroup}>{body}</SentBubble>
      </SentRow>
    );
  }

  return (
    <ReceivedRow $isFirstInGroup={isFirstInGroup} data-chat-message-id={message.id}>
      {isFirstInGroup ? (
        <AvatarSlot
          type="button"
          onClick={onAvatarClick}
          disabled={!onAvatarClick}
          aria-label={`${senderNickname} 프로필 보기`}
        >
          <Avatar src={senderAvatarUrl ?? "/assets/avatar/f1.webp"} alt="" />
        </AvatarSlot>
      ) : (
        <AvatarPlaceholder />
      )}
      <ReceivedContainer>
        {isFirstInGroup && <NicknameLabel>{senderNickname}</NicknameLabel>}
        <ReceivedBubbleRow>
          {quizCard ? (
            <QuizStack $align="start">
              {quizCard}
              {message.content && <ReceivedBubble $isFirstInGroup={false}>{body}</ReceivedBubble>}
            </QuizStack>
          ) : (
            <ReceivedBubble $isFirstInGroup={isFirstInGroup}>{body}</ReceivedBubble>
          )}
          {(
            <ReceivedMeta>
              {message.unreadCount > 0 && <TimeLabel aria-label={`안 읽은 사람 ${message.unreadCount}명`}>{message.unreadCount}</TimeLabel>}
              <TimeLabel>{formatTime(message.createdAt)}</TimeLabel>
            </ReceivedMeta>
          )}
        </ReceivedBubbleRow>
      </ReceivedContainer>
    </ReceivedRow>
  );
}

/* 문항 카드 + 덧붙인 한마디. 둘 사이 10px(Figma 3256:38421). */
const QuizStack = styled.div<{ $align: "start" | "end" }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $align }) => ($align === "end" ? "flex-end" : "flex-start")};
  gap: var(--spacing-10px);
  min-width: 0;
  max-width: var(--space-64);
`;

const SentRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 2px;
  width: 100%;
`;

const ReceivedRow = styled.div<{ $isFirstInGroup: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 2px;
`;

const AvatarSlot = styled.button`
  width: 40px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-semantic-line-normal-alternative);
  background-color: var(--color-semantic-background-normal-alternative);
`;

const ReceivedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const NicknameLabel = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  line-height: 1.429;
  color: var(--color-semantic-label-alternative);
`;

const ReceivedBubbleRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
`;

const SentBubble = styled.div<{ $isFirstInGroup: boolean }>`
  max-width: 240px;
  background-color: var(--color-semantic-fill-strong);
  border-radius: ${({ $isFirstInGroup }) =>
    $isFirstInGroup ? "12px 0 12px 12px" : "12px"};
  padding: 8px;
  word-break: break-word;
  ${selectableContent}
`;

const ReceivedBubble = styled.div<{ $isFirstInGroup: boolean }>`
  max-width: 255px;
  background-color: var(--color-semantic-static-white);
  border-radius: ${({ $isFirstInGroup }) =>
    $isFirstInGroup ? "0 12px 12px 12px" : "12px"};
  padding: 8px;
  word-break: break-word;
  ${selectableContent}
`;

const BubbleText = styled.p`
  white-space: pre-wrap;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-normal);
  margin: 0;
`;

const SentMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0;
  flex-shrink: 0;
`;

const ReceivedMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 0;
  flex-shrink: 0;
`;

const ImageButton = styled.button`
  display: block;
  padding: 0;
  border: none;
  background: none;
  cursor: ${({ disabled }) => (disabled ? "default" : "zoom-in")};
  line-height: 0;
`;


// 로드된 ChatImage와 같은 칸 크기여야 전송 완료 시 버블이 튀지 않는다.
const ImageFallback = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  background-color: var(--color-semantic-fill-normal);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  color: var(--color-semantic-label-alternative);
`;

const TimeLabel = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-caption-2-font-size);
  font-weight: 500;
  line-height: 1.273;
  letter-spacing: 0.342px;
  color: var(--color-semantic-label-alternative);
  white-space: nowrap;
`;
