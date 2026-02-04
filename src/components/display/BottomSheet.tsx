"use client";

import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Heading2Bold, Label1Normal } from '../common/Text';

interface BottomSheetProps {
  title: string;
  subTitle?: string;
  detail: React.ReactNode;
  closer: () => void;
}

const BottomSheet = ({ title, subTitle, detail, closer }: BottomSheetProps) => {
  
  // 스크롤 잠금 처리만 남깁니다. (state 불필요)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <Overlay onClick={closer}>
      <SheetContainer onClick={(e) => e.stopPropagation()}>
        {/* 상단 핸들바 */}
        <HandleBar />

        {/* 헤더 */}
        <Header>
          <TextGroup>
            <Heading2Bold>{title}</Heading2Bold>
            <Label1Normal $color='var(--color-semantic-label-neutral)'>{subTitle}</Label1Normal>
          </TextGroup>
          <CloseButton onClick={closer}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </CloseButton>
        </Header>

        {/* 내용 */}
        <ContentBody>
          {detail}
        </ContentBody>
      </SheetContainer>
    </Overlay>
  );
};

export default BottomSheet;

// --- Animations ---

const slideUp = keyframes`
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// --- Styled Components ---

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  // 마운트 시 자동으로 페이드인 실행
  animation: ${fadeIn} 0.3s ease-out forwards;
`;

const SheetContainer = styled.div`
  width: 100%;
  max-width: 600px;
  background-color: var(--color-semantic-background-normal-normal);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 24px 20px 40px 20px;
  box-shadow: var(--style-semantic-shadow-heavy);
  
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;

  // 마운트 시 자동으로 슬라이드 업 실행 (state 의존성 제거)
  animation: ${slideUp} 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
`;

const HandleBar = styled.div`
  width: 40px;
  height: 4px;
  background-color: #E0E0E0;
  border-radius: 2px;
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 10px;
`;

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: var(--color-semantic-label-strong, #1A1A1A);
  margin: 0;
  line-height: 1.4;
`;

const SubTitle = styled.p`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-semantic-label-neutral, #666666);
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; 
  height: 32px; 
`;

const ContentBody = styled.div`
  width: 100%;
`;