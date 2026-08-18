import type { ReactNode } from "react";
import styled from "styled-components";

interface RoomNoticeCardProps {
  children: ReactNode;
}

export function RoomNoticeCard({ children }: RoomNoticeCardProps) {
  return (
    <Card>
      <Content>
        <Icon aria-hidden="true">i</Icon>
        <Message>{children}</Message>
      </Content>
    </Card>
  );
}

const Card = styled.div`
  position: relative;
  overflow: clip;
  border-radius: var(--space-3);
  width: 100%;
  margin-top: var(--space-1);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--color-semantic-background-normal-normal);
    opacity: var(--color-atomic-opacity-88);
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--color-semantic-primary-normal);
    opacity: var(--color-atomic-opacity-5);
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  box-sizing: border-box;
`;

const Icon = styled.span`
  width: var(--space-5);
  height: var(--space-5);
  flex-shrink: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--spacing-1px);
  background-color: var(--color-semantic-label-normal);
  color: var(--color-semantic-static-white);
  font-family: var(--typography-font-family);
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
`;

const Message = styled.p`
  flex: 1;
  margin: 0;
  font-family: var(--typography-font-family);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-normal);
  font-feature-settings: "ss10" on;
`;
