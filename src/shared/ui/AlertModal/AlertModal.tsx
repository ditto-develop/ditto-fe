"use client";

import React from 'react';
import styled from 'styled-components';
import { Body2Normal, Headline1, Body1Bold } from "@/shared/ui";
import { useBackClose } from "@/shared/hooks/useBackClose";

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmParams: {
        text: string;
        onClick: () => void;
        isDestructive?: boolean;
    };
    cancelParams?: {
        text: string;
        onClick: () => void;
        isDestructive?: boolean;
    };
    onClose?: () => void; // Optional if handled by buttons
}

export function AlertModal({
    isOpen,
    title,
    message,
    confirmParams,
    cancelParams,
    onClose,
}: AlertModalProps) {
    // OS 뒤로가기는 "취소"로 취급한다. 닫을 수단이 아예 없는 알럿(확인 버튼만 있고
    // onClose 도 cancel 도 없는 경우)은 가로채지 않는다 — 뒤로가기를 삼키기만 하고
    // 아무 일도 일어나지 않으면 화면이 멈춘 것처럼 보인다.
    const dismiss = onClose ?? cancelParams?.onClick;
    useBackClose(isOpen && Boolean(dismiss), () => dismiss?.());

    if (!isOpen) return null;

    return (
        <Overlay onClick={onClose}> {/* Click outside to close if onClose provided */}
            <AlertContainer onClick={(e) => e.stopPropagation()}>
                <ContentContainer>
                    <Headline1 style={{ marginBottom: '6px' }}>
                        {title}
                    </Headline1>
                    <Body2Normal
                        $color="var(--color-semantic-label-alternative)"
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                        {message}
                    </Body2Normal>
                </ContentContainer>

                <ButtonContainer>
                    {cancelParams && (
                        <ActionButton
                            onClick={cancelParams.onClick}
                            $variant={cancelParams.isDestructive ? 'destructive' : 'cancel'}
                        >
                            {cancelParams.text}
                        </ActionButton>
                    )}
                    <ActionButton
                        onClick={confirmParams.onClick}
                        $variant={confirmParams.isDestructive ? 'destructive' : 'confirm'}
                    >
                        {confirmParams.text}
                    </ActionButton>
                </ButtonContainer>
            </AlertContainer>
        </Overlay>
    );
}

// --- Styled Components ---

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-semantic-material-dimmer);
  z-index: 3000; // Higher than FullScreenModal
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
`;

const AlertContainer = styled.div`
  width: 100%;
  max-width: 400px;
  min-width: 320px;
  background-color: var(--color-semantic-background-elevated-normal);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ContentContainer = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const ButtonContainer = styled.div`
  padding: 0 20px 12px 20px;
  display: flex;
  gap: 24px;
  justify-content: flex-end;
  align-items: center;
`;

const ActionButton = styled(Body1Bold).attrs({ as: 'button' }) <{ $variant: 'confirm' | 'cancel' | 'destructive' }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  
  color: ${({ $variant }) => {
        switch ($variant) {
            case 'destructive': return 'var(--color-semantic-status-destructive)';
            case 'cancel': return 'var(--color-semantic-label-alternative)';
            default: return 'var(--color-semantic-primary-normal)';
        }
    }};

  &:active {
    opacity: 0.7;
  }
`;
