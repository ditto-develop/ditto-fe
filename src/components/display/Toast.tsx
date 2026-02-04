"use client";

import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Scan } from 'lucide-react';
import { Body2Normal } from '@/components/common/Text';

// ... (ToastType, Props 정의는 비슷하지만 id 추가 필요)

interface BottomToastProps {
  id: string; // ✅ 식별자 추가
  message: React.ReactNode;
  type?: 'default' | 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
  actionLabel?: React.ReactNode;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}

const slideUpFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translate(0, 20px); /* X축 이동 제거 (컨테이너가 중앙 정렬함) */
  }
  to {
    opacity: 1; 
    transform: translate(0, 0);
  }
`;

// ✅ 스타일 대폭 수정: fixed 제거
const ToastItemWrapper = styled.div`
    position: relative; 
    pointer-events: auto;
    
    display: flex;
    align-items: center;      
    justify-content: space-between;
  
    width: 100%; 
    min-height: 32px;

    padding: 11px 16px;
    gap: 12px;
    border-radius: 12px;
  
    /* ✅ 핵심 수정: 패딩을 포함해서 너비를 계산하도록 설정 */
    box-sizing: border-box; 
  
    background: rgba(47, 43, 39, 0.52); 
    backdrop-filter: blur(32px);
    
    animation: ${slideUpFadeIn} 0.4s ease-out forwards;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 1; 
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #93c5fd;
  transition: background-color 0.2s, transform 0.1s;
  flex-shrink: 0; /* 버튼이 찌그러지지 않게 */
  
  &:hover { background-color: rgba(255, 255, 255, 0.1); }
  &:active { transform: scale(0.96); }
`;

// --- Main Component ---

const BottomToast: React.FC<BottomToastProps> = ({
  id,
  message,
  type = 'default',
  duration = 3000,
  onClose,
  actionLabel,
  actionIcon,
  onAction,
}) => {
  const getToastIcon = (type: unknown) => {
    switch (type) {
      case 'success':
        return <img src="/toast/success.svg" alt="success" />;
      case 'warning':
        return <img src="/toast/warning.svg" alt="warning" />;
      case 'error':
        return <img src="/toast/error.svg" alt="error" />;
      case 'info':
        return <Scan size={20} color="#d1d5db" />;
      default:
        // For 'default' type, show a close button if no other icon is specified
        return (
          <CloseButton onClick={onClose}>
            <img src="/nav/x.svg" alt="close" width="16" height="16" />
          </CloseButton>
        );
    }
  };

  const iconNode = getToastIcon(type);

  // Timer logic
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <ToastItemWrapper>
      <LeftSection>
        {iconNode}
        {typeof message === 'string' ? (
          <Body2Normal $color="white">{message}</Body2Normal>
        ) : (
          message
        )}
      </LeftSection>

      {(actionLabel || actionIcon) && (
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            if (onAction) onAction();
          }}
        >
          {actionIcon}
          {actionLabel}
        </ActionButton>
      )}
    </ToastItemWrapper>
  );
};

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default BottomToast;