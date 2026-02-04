"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import styled from 'styled-components';
import BottomToast from '@/components/display/Toast';

// --- 타입 정의 ---
type ToastType = 'default' | 'info' | 'success' | 'warning' | 'error';

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