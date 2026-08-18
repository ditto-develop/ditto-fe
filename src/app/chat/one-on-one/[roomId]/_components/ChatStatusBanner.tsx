import styled from "styled-components";

import type { ChatRoomNotice } from "@/features/chat";

interface ChatStatusBannerProps {
  message: ChatRoomNotice["message"];
  action?: Omit<ChatRoomNotice, "message">;
  showWarningIcon?: boolean;
  className?: string;
}

export function ChatStatusBanner({
  message,
  action,
  showWarningIcon = false,
  className,
}: ChatStatusBannerProps) {
  return (
    <Banner className={className} role="status">
      <Content>
        {showWarningIcon && (
          <WarningIcon src="/icons/status/warning.svg" alt="" aria-hidden="true" />
        )}
        <Message>{message}</Message>
      </Content>
      {action && (
        <ActionButton type="button" onClick={action.onAction}>
          {action.actionLabel}
        </ActionButton>
      )}
    </Banner>
  );
}

const Banner = styled.div`
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: var(--space-8);
  overflow: clip;
  margin: 0 var(--space-4);
  padding: var(--spacing-6px) var(--space-4);
  border-radius: var(--space-3);
  box-sizing: border-box;
  color: var(--color-semantic-inverse-label);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background-color: var(--color-semantic-inverse-background);
    opacity: var(--color-atomic-opacity-52);
  }
`;

const Content = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--space-8);
  min-width: 0;
  flex: 1;
`;

const WarningIcon = styled.img`
  width: var(--space-5);
  height: var(--space-5);
  flex-shrink: 0;
`;

const Message = styled.p`
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-inverse-label);
`;

const ActionButton = styled.button`
  flex-shrink: 0;
  padding: var(--space-1) var(--spacing-2px);
  border: 0;
  background: transparent;
  color: var(--color-semantic-inverse-primary);
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  cursor: pointer;
`;
