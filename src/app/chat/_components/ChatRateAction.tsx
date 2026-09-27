"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";

import { useMemberReview } from "@/features/rating/hooks/useMemberReview";
import type { ReviewMatchType } from "@/features/rating/model/types";
import { BottomActionArea, Button } from "@/shared/ui";

interface ChatRateActionProps {
  roomId: number;
  matchType: ReviewMatchType;
}

/**
 * 종료된 방 하단의 평가 진입 버튼.
 *
 * 평가 목록에는 완료하지 않은 평가만 담기므로, 이 방의 평가가 목록에 없으면 완료로 본다
 * (완료된 평가를 다시 조회할 API는 없다). 목록 조회가 실패하면 기존처럼 평가 화면으로
 * 보내 그쪽 오류 처리에 맡긴다. 종료된 방에서만 렌더해 진행 중인 방에서는 조회하지 않는다.
 */
export function ChatRateAction({ roomId, matchType }: ChatRateActionProps) {
  const router = useRouter();
  const { state } = useMemberReview(String(roomId), matchType);
  const segment = matchType === "GROUP" ? "group" : "one-on-one";
  const isCompleted = state === "missing";

  return (
    <ChatBottomActionArea>
      <RateButton
        type="button"
        $size="large"
        disabled={state === "loading" || isCompleted}
        onClick={() => router.push(`/chat/${segment}/${roomId}/rate`)}
      >
        {isCompleted ? "완료된 평가입니다" : "평가하기"}
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
