"use client";

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

interface FullScreenModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string; // Optional title for accessibility or simple header
}

const ANIMATION_DURATION = 300;

export default function FullScreenModal({
    isOpen,
    onClose,
    children,
}: FullScreenModalProps) {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling

            // Slight delay to allow DOM render before starting animation
            timeoutId = setTimeout(() => {
                setIsAnimating(true);
            }, 10);
        } else {
            setIsAnimating(false);
            document.body.style.overflow = 'unset';

            timeoutId = setTimeout(() => {
                setShouldRender(false);
            }, ANIMATION_DURATION);
        }

        return () => {
            clearTimeout(timeoutId);
            document.body.style.overflow = 'unset'; // Cleanup on unmount
        };
    }, [isOpen]);

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
                {children}
            </ModalContainer>
        </Overlay>
    );
}

// --- Animations ---

const slideUp = keyframes`
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
`;

// --- Styled Components ---

const Overlay = styled.div<{ $isAnimating: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-semantic-background-normal-normal); // Match theme background
  z-index: 2000; // High z-index to cover everything
  display: flex;
  flex-direction: column;
  
  /* Transition for opacity/transform if needed, but mainly we slide up the container */
  opacity: ${({ $isAnimating }) => ($isAnimating ? 1 : 0)};
  transition: opacity ${ANIMATION_DURATION}ms ease-in-out;
`;

const ModalContainer = styled.div<{ $isAnimating: boolean }>`
  width: 100%;
  height: 100%;
  background-color: var(--color-semantic-background-normal-normal);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto; // Allow content scrolling

  /* Slide up animation */
  transform: ${({ $isAnimating }) => ($isAnimating ? 'translateY(0)' : 'translateY(100%)')};
  transition: transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1);
`;
