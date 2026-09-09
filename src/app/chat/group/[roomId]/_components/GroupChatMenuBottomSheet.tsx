"use client";

import { useEffect } from "react";
import styled, { keyframes } from "styled-components";

import { useBackClose } from "@/shared/hooks/useBackClose";

interface GroupChatMenuBottomSheetProps {
  /**
   * 투표 생성 진입점 노출 여부.
   * 방당 열린 투표는 하나뿐이라 진행 중이면 숨긴다(그대로 만들면 서버가 8202로 거절한다).
   */
  canCreateVote: boolean;
  onClose: () => void;
  onMemberList: () => void;
  onCreateVote?: () => void;
  onReport: () => void;
  /** 나가기. 이미 나간 방·종료된 방에서는 넘기지 않아 진입점이 사라진다. */
  onLeave?: () => void;
}

export function GroupChatMenuBottomSheet({
  canCreateVote,
  onClose,
  onMemberList,
  onCreateVote,
  onReport,
  onLeave,
}: GroupChatMenuBottomSheetProps) {
  // 열려 있는 동안만 마운트된다 — OS 뒤로가기로도 닫히게 한다.
  useBackClose(true, onClose);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        <Navigation>
          <Handle />
        </Navigation>
        <Contents>
          <MenuItem
            onClick={() => {
              onMemberList();
              onClose();
            }}
          >
            <MenuText>멤버 목록</MenuText>
          </MenuItem>

          {canCreateVote && onCreateVote && (
            <MenuItem
              onClick={() => {
                onCreateVote();
                onClose();
              }}
            >
              <MenuText>투표 만들기</MenuText>
            </MenuItem>
          )}

          <MenuItem
            onClick={() => {
              onReport();
              onClose();
            }}
          >
            <MenuText>신고하기</MenuText>
          </MenuItem>

          {onLeave && (
            <MenuItem
              onClick={() => {
                onLeave();
                onClose();
              }}
            >
              <MenuText $destructive>대화방 나가기</MenuText>
            </MenuItem>
          )}
        </Contents>
      </Sheet>
    </Overlay>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(26, 24, 21, 0.52);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: ${fadeIn} 0.2s ease-out forwards;
`;

const Sheet = styled.div`
  width: 100%;
  background-color: var(--color-semantic-background-elevated-normal);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
`;

const Navigation = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 12px;
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
`;

const Handle = styled.div`
  width: 40px;
  height: 5px;
  background-color: var(--color-semantic-fill-strong);
  border-radius: 1000px;
`;

const Contents = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px calc(20px + env(safe-area-inset-right, 0px))
    calc(20px + env(safe-area-inset-bottom, 0px))
    calc(20px + env(safe-area-inset-left, 0px));
  box-sizing: border-box;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 12px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  position: relative;

  &:active {
    opacity: 0.72;
  }
`;

const MenuText = styled.span<{ $destructive?: boolean }>`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.0912px;
  color: ${({ $destructive }) =>
    $destructive
      ? "var(--color-semantic-status-destructive)"
      : "var(--color-semantic-label-normal)"};
`;
