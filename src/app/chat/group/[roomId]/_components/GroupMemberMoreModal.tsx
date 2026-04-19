"use client";

import { useEffect } from "react";
import styled, { keyframes } from "styled-components";

interface GroupMemberMoreModalProps {
  onClose: () => void;
  onReport: () => void;
}

export function GroupMemberMoreModal({
  onClose,
  onReport,
}: GroupMemberMoreModalProps) {
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
          <MenuItem onClick={onReport}>
            <MenuText>신고하기</MenuText>
          </MenuItem>
          <MenuItem onClick={onClose}>
            <MenuText>취소</MenuText>
          </MenuItem>
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
  z-index: 3000;
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
  padding-bottom: 0;
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

const MenuText = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.0912px;
  color: var(--color-semantic-label-normal);
`;
