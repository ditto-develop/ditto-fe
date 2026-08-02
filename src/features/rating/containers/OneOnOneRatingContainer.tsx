"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { getChatRooms, getCounterpartProfile } from "@/features/chat";
import { Avatar, BottomActionArea, Button, Checkbox } from "@/shared/ui";
import { useToast } from "@/context/ToastContext";
import { useOneOnOneRating } from "@/features/rating/hooks/useOneOnOneRating";
import { RatingFormFields } from "@/features/rating/ui/RatingFormFields";

interface Partner {
  nickname: string;
  profileImageUrl?: string | null;
}

interface OneOnOneRatingContainerProps {
  roomId: string;
}

export function OneOnOneRatingContainer({ roomId }: OneOnOneRatingContainerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const rating = useOneOnOneRating(roomId);

  // 방 상세 API가 없어져 상대 정보는 방 목록의 counterpartMemberIds로 찾아 프로필을 조회한다.
  useEffect(() => {
    let active = true;

    getChatRooms()
      .then(async (rooms) => {
        const room = rooms.find((item) => String(item.roomId) === String(roomId));
        const counterpartId = room?.counterpartMemberIds[0];
        if (counterpartId === undefined) return;

        const profile = await getCounterpartProfile(counterpartId);
        if (active) setPartner(profile);
      })
      .catch(() => {
        if (active) showToast("평가 정보를 불러오지 못했어요.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roomId, showToast]);

  const handleSubmit = async () => {
    try {
      const result = await rating.submit();
      if (!result) return;
      showToast("평가가 제출됐어요.", "success");
      router.replace("/chat");
    } catch {
      showToast("평가를 제출하지 못했어요. 다시 시도해 주세요.", "error");
    }
  };

  if (loading) return <StateMessage>불러오는 중...</StateMessage>;
  if (!partner) return <StateMessage>평가할 사용자를 찾을 수 없어요.</StateMessage>;

  return (
    <Page>
      <ScrollArea>
        <ProfileHeader>
          <Avatar
            src={partner.profileImageUrl ?? undefined}
            alt={`${partner.nickname} 프로필`}
            size="xl"
          />
          <HeaderText>
            <Title>{partner.nickname}님 평가</Title>
            <Subtitle>솔직한 피드백이 더 나은 매칭을 만듭니다</Subtitle>
          </HeaderText>
        </ProfileHeader>

        <RatingFormFields value={rating.form} onChange={rating.setForm} />

        <Checkbox
          checked={rating.reportUser}
          onChange={rating.setReportUser}
          label="사용자 신고하기"
          helperText="불쾌하거나 부적절한 행동이 있었나요?"
        />
      </ScrollArea>

      <BottomActionArea>
        <SubmitButton
          type="button"
          $size="large"
          disabled={!rating.canSubmit}
          onClick={handleSubmit}
        >
          {rating.submitting ? "제출 중..." : "평가 제출하기"}
        </SubmitButton>
      </BottomActionArea>
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
  padding: var(--space-18) var(--space-5) var(--space-32);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-9);
`;

const ProfileHeader = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
`;

const HeaderText = styled.div`
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
  font-size: var(--typography-label-2-font-size);
  font-weight: var(--typography-label-2-font-weight);
  line-height: var(--typography-label-2-line-height);
  letter-spacing: var(--typography-label-2-letter-spacing);
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
