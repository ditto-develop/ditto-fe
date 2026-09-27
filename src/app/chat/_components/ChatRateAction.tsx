"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";

import type { ChatRoomReviewStatus } from "@/features/chat/model/types";
import { useMemberReview } from "@/features/rating/hooks/useMemberReview";
import type { ReviewMatchType } from "@/features/rating/model/types";
import { BottomActionArea, Button } from "@/shared/ui";

interface ChatRateActionProps {
  roomId: number;
  matchType: ReviewMatchType;
  /**
   * 채팅방 목록의 평가 상태(BE 위키 Frontend-QA-Fixes-Guide §3). 서버가 아직 내려주지 않으면
   * null 이고, 그때는 평가 목록으로 판단하던 기존 방식을 쓴다.
   */
  reviewStatus: ChatRoomReviewStatus | null;
}

type RateButtonView = { label: string; enabled: boolean } | null;

/** reviewStatus → 버튼. NOT_APPLICABLE(재매칭 방)은 진입점을 숨긴다. */
function toButtonView(reviewStatus: ChatRoomReviewStatus): RateButtonView {
  switch (reviewStatus) {
    case "NOT_APPLICABLE":
      return null;
    case "NOT_OPENED":
      return { label: "평가가 곧 열려요", enabled: false };
    case "NOT_STARTED":
      return { label: "평가하기", enabled: true };
    case "IN_PROGRESS":
      return { label: "이어서 평가하기", enabled: true };
    case "COMPLETED":
      return { label: "평가 완료", enabled: false };
  }
}

/** 종료된 방 하단의 평가 진입 버튼. 종료된 방에서만 렌더한다. */
export function ChatRateAction({ roomId, matchType, reviewStatus }: ChatRateActionProps) {
  if (reviewStatus === null) return <LegacyChatRateAction roomId={roomId} matchType={matchType} />;

  const view = toButtonView(reviewStatus);
  if (!view) return null;
  return <RateButtonArea roomId={roomId} matchType={matchType} {...view} />;
}

/**
 * reviewStatus 가 없는 서버용. 평가 목록에는 완료하지 않은 평가만 담기므로, 이 방의 평가가
 * 목록에 없으면 완료로 본다. 목록 조회가 실패하면 평가 화면으로 보내 그쪽 오류 처리에 맡긴다.
 */
function LegacyChatRateAction({ roomId, matchType }: Omit<ChatRateActionProps, "reviewStatus">) {
  const { state } = useMemberReview(String(roomId), matchType);
  const isCompleted = state === "missing";

  return (
    <RateButtonArea
      roomId={roomId}
      matchType={matchType}
      label={isCompleted ? "완료된 평가입니다" : "평가하기"}
      enabled={state !== "loading" && !isCompleted}
    />
  );
}

function RateButtonArea({
  roomId,
  matchType,
  label,
  enabled,
}: Omit<ChatRateActionProps, "reviewStatus"> & { label: string; enabled: boolean }) {
  const router = useRouter();
  const segment = matchType === "GROUP" ? "group" : "one-on-one";

  return (
    <ChatBottomActionArea>
      <RateButton
        type="button"
        $size="large"
        disabled={!enabled}
        onClick={() => router.push(`/chat/${segment}/${roomId}/rate`)}
      >
        {label}
      </RateButton>
    </ChatBottomActionArea>
  );
}

const RateButton = styled(Button)`
  width: 100%;
`;

const ChatBottomActionArea = styled(BottomActionArea)`
  position: static;
  flex-shrink: 0;
`;
