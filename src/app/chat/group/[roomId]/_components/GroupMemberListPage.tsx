"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { GroupChatMember } from "@/lib/api/services/GroupChatService";
import {
  getUserProfile,
  type PublicProfileDto,
} from "@/features/profile/api/profileApi";
import { ProfileDetailService } from "@/lib/api";
import type { UserAnswersComparisonDto } from "@/lib/api/models/UserAnswersComparisonDto";
import { formatAgeRange } from "@/shared/lib/formatAge";
import {
  toLocationLabel,
  toOccupationLabel,
  toInterestLabel,
} from "@/shared/lib/profileLabels";
import { TopNavigation } from "@/shared/ui";

interface MemberData {
  member: GroupChatMember;
  profile: PublicProfileDto | null;
  comparison: UserAnswersComparisonDto | null;
}

interface GroupMemberListPageProps {
  members: GroupChatMember[];
  myUserId: string;
  onClose: () => void;
  onMemberClick: (member: GroupChatMember) => void;
}

function getCompatibilityInfo(
  comparison: UserAnswersComparisonDto | null,
  isTop: boolean,
): { label: string; isNegative: boolean } | null {
  if (!comparison) return null;
  if (isTop) {
    return { label: "🌟 당신과 가장 비슷해요", isNegative: true };
  }
  if (comparison.matchRate >= 70) {
    return { label: "😊 대부분 비슷하게 생각해요", isNegative: true };
  }
  return { label: "🙂 비슷하지만 새로운 관점도 있어요", isNegative: false };
}

export function GroupMemberListPage({
  members,
  myUserId,
  onClose,
  onMemberClick,
}: GroupMemberListPageProps) {
  const [myData, setMyData] = useState<MemberData | null>(null);
  const [otherData, setOtherData] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const myMember = members.find((m) => m.userId === myUserId);
    const otherMembers = members.filter((m) => m.userId !== myUserId);

    const fetchAll = async () => {
      // Fetch all profiles in parallel
      const profileResults = await Promise.allSettled(
        members.map((m) => getUserProfile(m.userId))
      );

      // Fetch quiz comparisons for other members
      const comparisonResults = await Promise.allSettled(
        otherMembers.map((m) =>
          ProfileDetailService.ratingControllerGetUserAnswers(m.userId)
        )
      );

      // Build my data
      const myIdx = members.findIndex((m) => m.userId === myUserId);
      if (myMember) {
        const myProfile =
          profileResults[myIdx].status === "fulfilled"
            ? (profileResults[myIdx] as PromiseFulfilledResult<PublicProfileDto>).value
            : null;
        setMyData({ member: myMember, profile: myProfile, comparison: null });
      }

      // Build other members' data
      const others: MemberData[] = otherMembers.map((m, i) => {
        const profileIdx = members.findIndex((mm) => mm.userId === m.userId);
        const profile =
          profileResults[profileIdx]?.status === "fulfilled"
            ? (profileResults[profileIdx] as PromiseFulfilledResult<PublicProfileDto>).value
            : null;
        const compResult = comparisonResults[i];
        const comparison =
          compResult.status === "fulfilled" && compResult.value.success && compResult.value.data
            ? compResult.value.data
            : null;
        return { member: m, profile, comparison };
      });

      // Sort others by matchRate descending (highest similarity first)
      others.sort((a, b) => {
        const rateA = a.comparison?.matchRate ?? -1;
        const rateB = b.comparison?.matchRate ?? -1;
        return rateB - rateA;
      });

      setOtherData(others);
      setLoading(false);
    };

    fetchAll();
  }, [members, myUserId]);

  function buildMetaText(profile: PublicProfileDto): string {
    return [
      formatAgeRange(profile.age),
      profile.gender === "FEMALE" ? "여성" : "남성",
      profile.location ? toLocationLabel(profile.location) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  return (
    <PageOverlay>
      <TopNavigation onBack={onClose} />

      <Body>
        {/* 멤버 전체보기 헤더 */}
        <PageTitle>멤버 전체보기</PageTitle>

        {/* 나 섹션 */}
        {myData && (
          <Section>
            <SectionLabel>나</SectionLabel>
            <CardWrapper>
              <MemberCard onClick={() => onMemberClick(myData.member)}>
                <CardRow>
                  <AvatarImg
                    src={
                      myData.profile?.profileImageUrl ||
                      myData.member.profileImageUrl ||
                      "/assets/avatar/m1.png"
                    }
                    alt={myData.member.nickname}
                  />
                  <MemberInfo>
                    <NameRow>
                      <MemberName>{myData.member.nickname}</MemberName>
                      <ChevronImg
                        src="/icons/navigation/chevron-right.svg"
                        alt=""
                        width={24}
                        height={24}
                      />
                    </NameRow>
                    {myData.profile && (
                      <>
                        <MetaText>{buildMetaText(myData.profile)}</MetaText>
                        {myData.profile.introduction && (
                          <BioText>{myData.profile.introduction}</BioText>
                        )}
                      </>
                    )}
                  </MemberInfo>
                </CardRow>
              </MemberCard>
            </CardWrapper>
          </Section>
        )}

        {/* 상대방 섹션 */}
        {!loading && otherData.length > 0 && (
          <Section>
            <SectionLabel>상대방({otherData.length}명)</SectionLabel>
            <OtherList>
              {otherData.map(({ member, profile, comparison }, idx) => {
                const compat = getCompatibilityInfo(comparison, idx === 0);
                return (
                  <OtherEntry key={member.userId}>
                    {/* 배지 행 */}
                    {compat && (
                      <BadgeRow>
                        <CompatBadge $isNegative={compat.isNegative}>
                          <CompatBadgeBg $isNegative={compat.isNegative} />
                          <CompatBadgeText $isNegative={compat.isNegative}>
                            {compat.label}
                          </CompatBadgeText>
                        </CompatBadge>
                        {comparison && (
                          <MatchCountText>
                            {comparison.totalCount}개중{" "}
                            {comparison.matchedCount}개 일치
                          </MatchCountText>
                        )}
                      </BadgeRow>
                    )}

                    {/* 멤버 카드 */}
                    <MemberCard onClick={() => onMemberClick(member)}>
                      <CardRow>
                        <AvatarImg
                          src={
                            profile?.profileImageUrl ||
                            member.profileImageUrl ||
                            "/assets/avatar/m1.png"
                          }
                          alt={member.nickname}
                        />
                        <MemberInfo>
                          <NameRow>
                            <MemberName>{member.nickname}</MemberName>
                            <ChevronImg
                              src="/icons/navigation/chevron-right.svg"
                              alt=""
                              width={24}
                              height={24}
                            />
                          </NameRow>
                          {profile && (
                            <>
                              <MetaText>{buildMetaText(profile)}</MetaText>
                              {profile.introduction && (
                                <BioText>{profile.introduction}</BioText>
                              )}
                            </>
                          )}
                        </MemberInfo>
                      </CardRow>
                    </MemberCard>
                  </OtherEntry>
                );
              })}
            </OtherList>
          </Section>
        )}

        {loading && <LoadingText>불러오는 중...</LoadingText>}
      </Body>
    </PageOverlay>
  );
}

const slideInRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const PageOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  background-color: var(--color-semantic-background-normal-normal);
  animation: ${slideInRight} 0.28s cubic-bezier(0.25, 1, 0.5, 1) forwards;
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 16px 32px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const PageTitle = styled.h1`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-title-3-font-size);
  font-weight: 700;
  line-height: 1.334;
  letter-spacing: -0.552px;
  color: var(--color-semantic-label-normal);
  margin: 0 0 20px;
  padding: 0;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
`;

const SectionLabel = styled.p`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  font-weight: 500;
  line-height: 1.429;
  letter-spacing: 0.203px;
  color: var(--color-semantic-label-neutral);
  margin: 0;
`;

const CardWrapper = styled.div`
  width: 100%;
`;

const OtherList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const OtherEntry = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/* 배지 행 */
const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const CompatBadge = styled.div<{ $isNegative: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 6px;
  border-radius: 6px;
  overflow: hidden;
`;

const CompatBadgeBg = styled.div<{ $isNegative: boolean }>`
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background-color: ${({ $isNegative }) =>
    $isNegative
      ? "var(--color-semantic-status-negative)"
      : "var(--color-semantic-status-cautionary)"};
  opacity: 0.08;
`;

const CompatBadgeText = styled.span<{ $isNegative: boolean }>`
  position: relative;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-caption-1-font-size);
  font-weight: 500;
  line-height: 1.334;
  letter-spacing: 0.3024px;
  color: ${({ $isNegative }) =>
    $isNegative
      ? "var(--color-semantic-status-negative)"
      : "var(--color-semantic-status-cautionary)"};
  white-space: nowrap;
`;

const MatchCountText = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-caption-1-font-size);
  font-weight: 500;
  line-height: 1.334;
  letter-spacing: 0.3024px;
  color: var(--color-semantic-label-alternative);
  white-space: nowrap;
`;

/* 멤버 카드 */
const MemberCard = styled.div`
  width: 100%;
  background-color: var(--color-semantic-fill-normal);
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }
`;

const CardRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
`;

const AvatarImg = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--color-semantic-line-normal-alternative);
  background-color: var(--color-semantic-background-normal-alternative);
  display: block;
`;

const MemberInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MemberName = styled.span`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-headline-2-font-size);
  font-weight: 600;
  line-height: 1.412;
  color: var(--color-semantic-label-normal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const ChevronImg = styled.img`
  flex-shrink: 0;
  opacity: 0.4;
`;

const MetaText = styled.p`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: 1.385;
  letter-spacing: 0.2522px;
  color: var(--color-semantic-label-alternative);
  margin: 0;
`;

const BioText = styled.p`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 500;
  line-height: 1.385;
  letter-spacing: 0.2522px;
  color: var(--color-semantic-label-alternative);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LoadingText = styled.p`
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-1-normal-font-size);
  color: var(--color-semantic-label-alternative);
  text-align: center;
  padding: 32px 0;
  margin: 0;
`;
