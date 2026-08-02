"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { getAccessToken } from "@/shared/lib/auth";
import { ChatService } from "@/shared/lib/api/generated";
import { getUserProfile } from "@/features/profile/api/profileApi";
import { BottomActionArea, Button } from "@/shared/ui";
import { useToast } from "@/context/ToastContext";
import { useGroupRating } from "@/features/rating/hooks/useGroupRating";
import { GroupMemberRatingCard } from "@/features/rating/ui/GroupMemberRatingCard";
import { RematchHelpBottomSheet } from "@/features/rating/ui/RematchHelpBottomSheet";
import type { GroupMemberProfile } from "@/features/rating";

interface GroupRatingContainerProps {
  roomId: string;
}

function getCurrentUserId(): string | null {
  try {
    const payload = getAccessToken().split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload)) as { sub?: string; userId?: string };
    return decoded.sub ?? decoded.userId ?? null;
  } catch {
    return null;
  }
}

export function GroupRatingContainer({ roomId }: GroupRatingContainerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [members, setMembers] = useState<GroupMemberProfile[] | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMembers = async () => {
      try {
        const response = await ChatService.chatControllerGetGroupRoomDetail(roomId);
        if (!response.success || !response.data) throw new Error("Missing group room");

        const currentUserId = getCurrentUserId();
        const targets = response.data.members.filter((member) => member.userId !== currentUserId);
        const profiles = await Promise.all(
          targets.map((member) => getUserProfile(member.userId).catch(() => null)),
        );
        if (!active) return;

        setMembers(
          targets.map((member, index) => ({
            userId: member.userId,
            nickname: member.nickname,
            avatarUrl: member.avatarUrl ?? profiles[index]?.profileImageUrl,
            age: profiles[index]?.age,
            gender: profiles[index]?.gender,
            location: profiles[index]?.location,
          })),
        );
      } catch {
        if (active) {
          setMembers([]);
          showToast("그룹 평가 정보를 불러오지 못했어요.", "error");
        }
      }
    };

    loadMembers();
    return () => {
      active = false;
    };
  }, [roomId, showToast]);

  if (members === null) return <StateMessage>불러오는 중...</StateMessage>;
  if (members.length === 0) return <StateMessage>평가할 그룹 멤버가 없어요.</StateMessage>;

  return (
    <GroupRatingContent
      roomId={roomId}
      members={members}
      helpOpen={helpOpen}
      setHelpOpen={setHelpOpen}
      onComplete={() => router.replace("/chat")}
    />
  );
}

interface GroupRatingContentProps {
  roomId: string;
  members: GroupMemberProfile[];
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  onComplete: () => void;
}

function GroupRatingContent({
  roomId,
  members,
  helpOpen,
  setHelpOpen,
  onComplete,
}: GroupRatingContentProps) {
  const { showToast } = useToast();
  const rating = useGroupRating(roomId, members);
  const currentMember = members[rating.currentIndex];

  const handleAction = async () => {
    if (!rating.isLast) {
      rating.next();
      return;
    }

    try {
      const result = await rating.submit();
      if (!result) return;
      showToast("그룹 멤버 평가가 제출됐어요.", "success");
      onComplete();
    } catch {
      showToast("평가를 제출하지 못했어요. 다시 시도해 주세요.", "error");
    }
  };

  return (
    <Page>
      <ScrollArea>
        <PageHeader>
          <Title>그룹 멤버 평가</Title>
          <Subtitle>{members.length}명의 멤버를 평가해 주세요.</Subtitle>
        </PageHeader>

        <GroupMemberRatingCard
          member={currentMember}
          rating={rating.currentRating}
          current={rating.currentIndex + 1}
          total={members.length}
          onRatingChange={rating.setCurrentForm}
          onRematchChange={rating.setWantRematch}
          onHelpClick={() => setHelpOpen(true)}
        />
      </ScrollArea>

      <BottomActionArea>
        <SubmitButton
          type="button"
          $size="large"
          disabled={!rating.canContinue}
          onClick={handleAction}
        >
          {rating.submitting
            ? "제출 중..."
            : rating.isLast
              ? "평가 제출하기"
              : "다음 멤버 평가하기"}
        </SubmitButton>
      </BottomActionArea>

      {helpOpen && <RematchHelpBottomSheet onClose={() => setHelpOpen(false)} />}
    </Page>
  );
}

const Page = styled.main`
  width: 100%;
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-normal);
`;

const ScrollArea = styled.div`
  width: 100%;
  padding: var(--space-16) var(--space-4) var(--space-32);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const PageHeader = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--typography-heading-1-font-size);
  font-weight: var(--typography-heading-1-font-weight);
  line-height: var(--typography-heading-1-line-height);
  letter-spacing: var(--typography-heading-1-letter-spacing);
  color: var(--color-semantic-label-strong);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;

const SubmitButton = styled(Button)`
  width: 100%;
`;

const StateMessage = styled.div`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: var(--typography-label-1-normal-font-weight);
  line-height: var(--typography-label-1-normal-line-height);
  letter-spacing: var(--typography-label-1-normal-letter-spacing);
  color: var(--color-semantic-label-alternative);
`;
