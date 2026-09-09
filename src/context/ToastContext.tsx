"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import { Scan } from 'lucide-react';
import { Body2Normal } from '@/shared/ui';
import { DEFAULT_TOAST_DURATION, isScreenBoundToast, isStickyToast } from '@/shared/lib/toastScope';

// --- 타입 정의 ---
type ToastType = 'default' | 'info' | 'success' | 'warning' | 'error' | 'none';

interface ToastOptions {
  id?: string; // ✅ 직접 ID 지정 가능 (옵션)
  actionLabel?: ReactNode;
  actionIcon?: ReactNode;
  /** 액션 버튼 텍스트 색상. 지정하지 않으면 기본 색상을 쓴다. */
  actionColor?: string;
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

interface ToastControls extends ToastContextType {
  /**
   * 주어진 id 중 **스스로 사라지지 않는** 토스트만 지운다.
   * 토스트를 띄운 컴포넌트가 사라질 때 호출된다 — 시간이 정해진 토스트는 남긴다.
   */
  dismissSticky: (ids: string[]) => void;
}

const ToastContext = createContext<ToastControls | undefined>(undefined);

interface BottomToastProps {
  id: string;
  message: React.ReactNode;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  actionLabel?: React.ReactNode;
  actionIcon?: React.ReactNode;
  actionColor?: string;
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

const ActionButton = styled.button<{ $color?: string }>`
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
  color: ${({ $color }) => $color ?? 'var(--color-semantic-accent-foreground-lightBlue)'};
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
  actionColor,
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
          $color={actionColor}
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
  const pathname = usePathname();
  const [shownPath, setShownPath] = useState(pathname);

  /*
   * 화면이 바뀌면 그 화면에 묶인 토스트도 같이 걷는다.
   * 라우트가 바뀌어도 토스트를 띄운 컴포넌트가 살아남는 경우(레이아웃·상시 마운트 모달)까지
   * 잡는 안전망이다.
   *
   * 이펙트가 아니라 렌더 중에 처리한다. Provider 는 자식보다 먼저 렌더되고 이펙트는 자식이
   * 먼저 돌기 때문에, 이펙트로 지우면 새 화면이 마운트되자마자 띄운 토스트까지 쓸어버린다.
   */
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setToasts((prev) => prev.filter((toast) => !isScreenBoundToast(toast.options)));
  }

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissSticky = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setToasts((prev) =>
      prev.filter((toast) => !(ids.includes(toast.id) && isStickyToast(toast.options))),
    );
  }, []);

  const showToast = useCallback((message: ReactNode, type: ToastType = 'default', options?: ToastOptions) => {
    // 1. ID 결정: 옵션으로 받은 ID가 있으면 그걸 쓰고, 없으면 랜덤 생성
    const id = options?.id ?? (Date.now().toString() + Math.random().toString(36).substr(2, 9));
    
    const newToast: ToastItem = {
      id,
      message,
      type,
      duration: options?.duration ?? DEFAULT_TOAST_DURATION,
      options,
    };

    setToasts((prev) => {
      // 2. 스택 방지: 이미 떠 있는 토스트가 있으면 새 호출은 무시하고 기존 토스트를 유지
      if (prev.length > 0) {
        return prev;
      }
      return [newToast];
    });
    
    return id; 
  }, []);

  const controls = useMemo<ToastControls>(
    () => ({ showToast, removeToast, dismissSticky }),
    [showToast, removeToast, dismissSticky],
  );

  return (
    <ToastContext.Provider value={controls}>
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
            actionColor={toast.options?.actionColor}
            onAction={toast.options?.onAction}
          />
        ))}
      </ToastListContainer>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');

  const { showToast: show, removeToast, dismissSticky } = context;

  /*
   * 이 컴포넌트가 띄운, 스스로 사라지지 않는 토스트의 id.
   * 컴포넌트가 사라지면(라우트 이동, 온보딩 단계 전환 등) 같이 정리한다. 액션 핸들러가
   * 이미 사라진 화면을 가리키고 있어서, 남겨 두면 눌러도 아무 일이 일어나지 않는다.
   */
  const ownedIdsRef = useRef<string[]>([]);

  const showToast = useCallback<ToastContextType['showToast']>(
    (message, type, options) => {
      const id = show(message, type, options);
      if (isStickyToast(options) && !ownedIdsRef.current.includes(id)) {
        ownedIdsRef.current.push(id);
      }
      return id;
    },
    [show],
  );

  useEffect(() => () => dismissSticky(ownedIdsRef.current), [dismissSticky]);

  return useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);
};
