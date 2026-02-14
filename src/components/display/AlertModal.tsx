"use client";

import React from 'react';
import styled from 'styled-components';
import { Body2Reading, Heading2Bold } from '../common/Text';

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
    if (!isOpen) return null;

    return (
        <Overlay onClick={onClose}> {/* Click outside to close if onClose provided */}
            <AlertContainer onClick={(e) => e.stopPropagation()}>
                <ContentContainer>
                    <Heading2Bold style={{ textAlign: 'center', marginBottom: '8px' }}>
                        {title}
                    </Heading2Bold>
                    <Body2Reading
                        $color="var(--color-semantic-label-alternative)"
                        style={{ textAlign: 'center', whiteSpace: 'pre-wrap' }}
                    >
                        {message}
                    </Body2Reading>
                </ContentContainer>

                <ButtonContainer>
                    {cancelParams && (
                        <Button
                            onClick={cancelParams.onClick}
                            $variant="cancel"
                        >
                            {cancelParams.text}
                        </Button>
                    )}
                    <Divider orientation={cancelParams ? 'vertical' : 'none'} />
                    <Button
                        onClick={confirmParams.onClick}
                        $variant={confirmParams.isDestructive ? 'destructive' : 'confirm'}
                    >
                        {confirmParams.text}
                    </Button>
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
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 3000; // Higher than FullScreenModal
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40px;
`;

const AlertContainer = styled.div`
  width: 100%;
  max-width: 320px;
  background-color: var(--color-semantic-background-normal-normal, #fff);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
`;

const ContentContainer = styled.div`
  padding: 32px 16px 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
`;

const ButtonContainer = styled.div`
  display: flex;
  border-top: 0.5px solid var(--color-semantic-line-normal, #E5E5E5);
  height: 52px;
`;

const Button = styled.button<{ $variant: 'confirm' | 'cancel' | 'destructive' }>`
  flex: 1;
  background: none;
  border: none;
  font-size: 17px;
  font-family: inherit;
  font-weight: 500; // Medium
  cursor: pointer;
  padding: 0;
  
  color: ${({ $variant }) => {
        switch ($variant) {
            case 'destructive': return 'var(--color-semantic-status-destructive, #FF3B30)';
            case 'cancel': return 'var(--color-semantic-label-alternative, #8A8A8A)';
            default: return 'var(--color-semantic-label-strong, #007AFF)'; // Blue/Primary
        }
    }};

  &:active {
    background-color: rgba(0,0,0,0.05);
  }
`;

const Divider = styled.div<{ orientation: string }>`
  width: 1px;
  background-color: var(--color-semantic-line-normal, #E5E5E5);
  display: ${({ orientation }) => (orientation === 'vertical' ? 'block' : 'none')};
`;
