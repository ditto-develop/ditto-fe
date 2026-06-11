"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useToast } from "@/context/ToastContext";
import { useBlockedUsers } from "@/features/settings/hooks/useBlockedUsers";
import type { BlockedUser } from "@/features/settings/model/types";
import { BlockedUserItem } from "@/features/settings/ui/BlockedUserItem";
import { AlertModal, TopNavigation } from "@/shared/ui";

export function BlockListContainer() {
  const router = useRouter();
  const { showToast } = useToast();
  const { blockedUsers, loading, error, removeBlockedUser } = useBlockedUsers();
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  const handleConfirmUnblock = async () => {
    if (!selectedUser) return;

    const removed = await removeBlockedUser(selectedUser.id);
    if (!removed) showToast("차단 해제에 실패했어요.", "error");
    setSelectedUser(null);
  };

  return (
    <Page>
      <TopNavigation label="차단 목록" onBack={() => router.push("/settings")} />
      <Content>
        <Description>
          차단한 사용자는 나의 프로필을 볼 수 없고,
          <br />
          매칭에서 제외돼요. 언제든지 해제할 수 있어요.
        </Description>
        {loading && <StateText>차단 목록을 불러오는 중...</StateText>}
        {error && <StateText>차단 목록을 불러오지 못했어요.</StateText>}
        <CountText>{blockedUsers.length}명 차단 중</CountText>
        <List>
          {blockedUsers.map((user) => (
            <BlockedUserItem key={user.id} user={user} onUnblock={setSelectedUser} />
          ))}
        </List>
      </Content>

      <AlertModal
        isOpen={Boolean(selectedUser)}
        title="차단을 해제할까요?"
        message={`${selectedUser?.nickname ?? ""}님의 차단을 해제하면 다시 매칭 대상에 포함될 수 있어요.`}
        onClose={() => setSelectedUser(null)}
        cancelParams={{ text: "아니요", onClick: () => setSelectedUser(null) }}
        confirmParams={{ text: "네, 해제할게요", onClick: handleConfirmUnblock }}
      />
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const Content = styled.main`
  width: 100%;
  max-width: var(--space-max);
  margin: 0 auto;
  padding: var(--space-4) var(--space-4) var(--space-12);
  box-sizing: border-box;
`;

const Description = styled.p`
  margin: 0 0 var(--space-6);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const CountText = styled.p`
  margin: 0 0 var(--space-3);
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-neutral);
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const StateText = styled.p`
  margin: 0 0 var(--space-3);
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: var(--typography-body-2-normal-font-weight);
  line-height: var(--typography-body-2-normal-line-height);
  letter-spacing: var(--typography-body-2-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
