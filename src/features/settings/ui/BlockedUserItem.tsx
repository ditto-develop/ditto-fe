"use client";

import styled from "styled-components";
import { Avatar } from "@/shared/ui";
import { formatBlockedDate } from "@/features/settings/lib/formatPhone";
import type { BlockedUser } from "@/features/settings/model/types";

type BlockedUserItemProps = {
  user: BlockedUser;
  onUnblock: (user: BlockedUser) => void;
};

export function BlockedUserItem({ user, onUnblock }: BlockedUserItemProps) {
  return (
    <Item>
      <Avatar src={user.profileImageUrl ?? undefined} alt={user.nickname} size="md" />
      <Info>
        <Nickname>{user.nickname}</Nickname>
        <BlockedDate>{formatBlockedDate(user.blockedAt)}</BlockedDate>
      </Info>
      <UnblockButton type="button" onClick={() => onUnblock(user)}>
        차단 해제
      </UnblockButton>
    </Item>
  );
}

const Item = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-1);
`;

const Info = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-1);
`;

const Nickname = styled.strong`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--typography-body-1-normal-font-size);
  font-weight: var(--typography-body-1-normal-font-weight);
  line-height: var(--typography-body-1-normal-line-height);
  letter-spacing: var(--typography-body-1-normal-letter-spacing);
  color: var(--color-semantic-label-strong);
`;

const BlockedDate = styled.span`
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const UnblockButton = styled.button`
  min-height: var(--space-8);
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-radi-4);
  background-color: var(--color-semantic-primary-normal);
  color: var(--color-semantic-static-white);
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
  cursor: pointer;
`;
