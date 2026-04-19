"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Scan } from 'lucide-react';
import { Body2Normal } from '@/components/common/Text';

// --- 타입 정의 ---
type ToastType = 'default' | 'info' | 'success' | 'warning' | 'error' | 'none';

interface ToastOptions {
  id?: string; // ✅ 직접 ID 지정 가능 (옵션)
  actionLabel?: ReactNode;
  actionIcon?: ReactNode;
  onAction?: () => void;
  duration?: number;
}

interface ToastItem {
  id: string;
  message: ReactNode;
  type: ToastType;
  duration: number;
  options?: ToastOptions;
}

interface ToastContextType {
  // id를 반환하긴 하지만, 직접 지정했다면 그 id가 반환됩니다.
  showToast: (message: ReactNode, type?: ToastType, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface BottomToastProps {
  id: string;
  message: React.ReactNode;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  actionLabel?: React.ReactNode;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}

const slideUpFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translate(0, 20px);
  }
  to {
    opacity: 1;
    transform: translate(0, 0);
  }
`;

const ToastListContainer = styled.div`
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 335px;
  max-width: 420px;
  pointer-events: none;
`;

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
  box-sizing: border-box;

  background: var(--color-semantic-material-dimmer);
  backdrop-filter: blur(32px);

  animation: ${slideUpFadeIn} 0.4s ease-out forwards;
  box-shadow: var(--style-semantic-shadow-normal);
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
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 600;
  color: var(--color-semantic-accent-foreground-lightBlue);
  transition: background-color 0.2s, transform 0.1s;
  flex-shrink: 0;

  &:hover { background-color: rgb(from var(--color-semantic-static-white) r g b / 0.1); }
  &:active { transform: scale(0.96); }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BottomToast = ({
  id: _id,
  message,
  type = 'default',
  duration = 3000,
  onClose,
  actionLabel,
  actionIcon,
  onAction,
}: BottomToastProps) => {
  const getToastIcon = (toastType: ToastType) => {
    switch (toastType) {
      case 'success':
        return <img src="/icons/status/success.svg" alt="success" />;
      case 'warning':
        return <img src="/icons/status/warning.svg" alt="warning" />;
      case 'error':
        return <img src="/icons/status/error.svg" alt="error" />;
      case 'info':
        return <Scan size={20} color="var(--color-semantic-line-solid-neutral)" />;
      case 'none':
        return null;
      default:
        return (
          <CloseButton onClick={onClose}>
            <img src="/icons/navigation/close.svg" alt="close" width="16" height="16" />
          </CloseButton>
        );
    }
  };

  const iconNode = getToastIcon(type);

  useEffect(() => {
    if (!duration || duration <= 0) return undefined;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <ToastItemWrapper>
      <LeftSection>
        {iconNode}
        {typeof message === 'string' ? (
          <Body2Normal $color="white" $weight="semibold" style={{ opacity: 0.88 }}>{message}</Body2Normal>
        ) : (
          message
        )}
      </LeftSection>

      {(actionLabel || actionIcon) && (
        <ActionButton
          onClick={(event) => {
            event.stopPropagation();
            onAction?.();
          }}
        >
          {actionIcon}
          {actionLabel}
        </ActionButton>
      )}
    </ToastItemWrapper>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: ReactNode, type: ToastType = 'default', options?: ToastOptions) => {
    // 1. ID 결정: 옵션으로 받은 ID가 있으면 그걸 쓰고, 없으면 랜덤 생성
    const id = options?.id ?? (Date.now().toString() + Math.random().toString(36).substr(2, 9));
    
    const newToast: ToastItem = {
      id,
      message,
      type,
      duration: options?.duration ?? 3000,
      options,
    };

    setToasts((prev) => {
      // 2. 중복 방지: 같은 ID가 이미 있다면 제거하고 새로 추가 (내용 갱신 효과)
      const filtered = prev.filter((t) => t.id !== id);
      return [...filtered, newToast];
    });
    
    return id; 
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastListContainer>
        {toasts.map((toast) => (
          <BottomToast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
            actionLabel={toast.options?.actionLabel}
            actionIcon={toast.options?.actionIcon}
            onAction={toast.options?.onAction}
          />
        ))}
      </ToastListContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
