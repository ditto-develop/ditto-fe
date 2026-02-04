import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Body1Normal, Body2Normal, Heading1Bold } from '../common/Text';

interface QuizResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onContinue: () => void;
}

const ANIMATION_DURATION = 300; // ms

export default function QuizModal({
  isOpen,
  onClose,
  onRestart,
  onContinue,
}: QuizResumeModalProps) {
  // shouldRender: 컴포넌트가 DOM에 존재하는지 여부 (Mount/Unmount 제어)
  const [shouldRender, setShouldRender] = useState(isOpen);
  // isAnimating: 투명도 및 위치 애니메이션 제어 (CSS Transition 제어)
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isOpen) {
      // 1. 모달이 열리면 일단 DOM에 렌더링합니다.
      setShouldRender(true);
      
      // 2. 브라우저가 DOM을 그릴 시간을 아주 잠깐(tick) 준 뒤 애니메이션을 시작합니다.
      // 이렇게 해야 opacity: 0 -> 1 트랜지션이 먹힙니다.
      timeoutId = setTimeout(() => {
        setIsAnimating(true);
      }, 10); 
    } else {
      // 1. 모달이 닫히면 애니메이션을 먼저 끕니다 (opacity: 1 -> 0)
      setIsAnimating(false);

      // 2. 애니메이션 시간(300ms)만큼 기다린 뒤 DOM에서 제거합니다.
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, ANIMATION_DURATION);
    }

    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  // DOM에 그리지 않아야 할 때는 null 반환
  if (!shouldRender) return null;

  return (
    <Overlay 
      $isAnimating={isAnimating} 
      onClick={onClose}
    >
      <ModalContainer 
        $isAnimating={isAnimating} 
        onClick={(e) => e.stopPropagation()}
      >
        <TextGroup>
          <Heading1Bold>퀴즈를 이어서 풀까요?</Heading1Bold>
          <Body2Normal $color='var(--color-semantic-label-alternative)'>
            처음부터 다시 선택하려면 새로 풀기를 눌러주세요.
          </Body2Normal>
        </TextGroup>

        <ButtonGroup>
          <RestartButtonWrapper onClick={onRestart}>
             <Body1Normal $weight='bold' $color='var(--color-semantic-status-negative)'>
              새로 풀기
            </Body1Normal>
          </RestartButtonWrapper>
          
          <ContinueButtonWrapper onClick={onContinue}>
             <Body1Normal $weight='bold'>
              이어서 풀기
            </Body1Normal>
          </ContinueButtonWrapper>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>
  );
}

/* ------------------------------------------------------
 * STYLES
 * ------------------------------------------------------ */

const Overlay = styled.div<{ $isAnimating: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
  
  /* 등장/퇴장 애니메이션 */
  opacity: ${({ $isAnimating }) => ($isAnimating ? 1 : 0)};
  transition: opacity ${ANIMATION_DURATION}ms ease-in-out;
  
  /* 퇴장 애니메이션 중에는 클릭 막기 (선택사항) */
  pointer-events: ${({ $isAnimating }) => ($isAnimating ? 'auto' : 'none')};
`;

const ModalContainer = styled.div<{ $isAnimating: boolean }>`
  background-color: var(--color-semantic-background-elevated-normal); 
  
  border-radius: 20px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.12);

  padding: 0 20px 12px 20px;
  width: 320px; /* 너비를 고정하거나 min-width를 주는 것이 안전합니다 */
  
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
  
  /* 슬라이드 업 & 페이드 효과 */
  opacity: ${({ $isAnimating }) => ($isAnimating ? 1 : 0)};
  transform: ${({ $isAnimating }) => ($isAnimating ? 'translateY(0)' : 'translateY(20px)')};
  transition: opacity ${ANIMATION_DURATION}ms ease-in-out, transform ${ANIMATION_DURATION}ms ease-out;
`;

const TextGroup = styled.div`
  display: flex;
  padding: 20px 0 0 0; /* 디자인에 맞게 상단 패딩 조정 */
  flex-direction: column;
  align-items: flex-start; /* 텍스트 중앙 정렬을 위해 center로 변경 */
  gap: 6px;
  align-self: stretch;
`;

const ButtonGroup = styled.div`
display: flex;
justify-content: flex-end;
align-items: center;
gap: 24px;
align-self: stretch;
`;

// 버튼 클릭 영역 확보를 위해 div로 감싸거나 styled component 확장
const RestartButtonWrapper = styled.div`
  cursor: pointer;
  padding: 8px;
`;

const ContinueButtonWrapper = styled.div`
  cursor: pointer;
  padding: 8px;
`;