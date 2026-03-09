"use client";

import React from 'react';
import styled from 'styled-components';
import { Body2Normal, Headline1, Body1Bold } from '../common/Text';

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
    };
    onClose?: () => void; // Optional if handled by buttons
}

export default function AlertModal({
    isOpen,
    title,
    message,
    confirmParams,
    cancelParams,
    onClose,
}: AlertModalProps) {
  console.log('[src/components/display/AlertModal.tsx] AlertModal'); // __component_log__
    if (!isOpen) return null;

    return (
        <Overlay onClick={onClose}> {/* Click outside to close if onClose provided */}
            <AlertContainer onClick={(e) => e.stopPropagation()}>
                <ContentContainer>
                    <Headline1 style={{ marginBottom: '6px' }}>
                        {title}
                    </Headline1>
                    <Body2Normal
                        $color="var(--color-semantic-label-alternative, rgba(47, 43, 39, 0.61))"
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                        {message}
                    </Body2Normal>
                </ContentContainer>

                <ButtonContainer>
                    {cancelParams && (
                        <ActionButton
                            onClick={cancelParams.onClick}
                            $variant="cancel"
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
  background-color: rgba(26, 24, 21, 0.43);
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
  background-color: var(--color-semantic-background-elevated-normal, #E9E6E2);
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
            case 'destructive': return 'var(--color-semantic-status-destructive, #FF3B30)';
            case 'cancel': return 'var(--color-semantic-label-alternative, rgba(47, 43, 39, 0.61))';
            default: return 'var(--color-semantic-primary-normal, #1A1815)';
        }
    }};

  &:active {
    opacity: 0.7;
  }
`;
