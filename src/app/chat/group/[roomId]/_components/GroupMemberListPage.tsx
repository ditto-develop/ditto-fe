"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { CounterpartProfile } from "@/features/chat";
import { getMatchBadgeInfo } from "@/features/matching";
import {
  getMyProfile,
  getUserAnswerMatch,
  getUserProfile,
  type PublicProfileDto,
} from "@/features/profile/api/profileApi";
import type { AnswerMatchSummary } from "@/features/profile/model/types";
import { formatAgeRange } from "@/shared/lib/formatAge";
import { toLocationLabel } from "@/shared/lib/profileLabels";
import { ContentBadge, TopNavigation } from "@/shared/ui";

interface MemberData {
  member: CounterpartProfile;
  profile: PublicProfileDto | null;
  answerMatch: AnswerMatchSummary | null;
}

interface GroupMemberListPageProps {
  /** 나를 제외한 참여자(counterpartMemberIds 기준). */
  members: CounterpartProfile[];
  onClose: () => void;
  onMemberClick: (member: CounterpartProfile) => void;
}

/**
 * 퀴즈 답변 비교 배지(`🌟 당신과 가장 비슷해요` 등)는 `GET /api/v1/users/{id}/answers`의
 * 일치 개수로 그린다. 서버는 상대가 무엇을 골랐는지도, 등급 문구도 주지 않는다 —
 * 문구는 `getMatchBadgeInfo`(FE)가 정본이다.
 *
 * 함께 완주한 퀴즈셋이 없으면 quizSetId가 null로 오고(403이 아니다) 배지를 숨긴다.
 */
export function GroupMemberListPage({
  members,
  onClose,
  onMemberClick,
}: GroupMemberListPageProps) {
  const [myProfile, setMyProfile] = useState<PublicProfileDto | null>(null);
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
    let active = true;

    void (async () => {
      const [mine, profiles, answerMatches] = await Promise.all([
        getMyProfile().catch(() => null),
        Promise.all(
          members.map((member) => getUserProfile(String(member.userId)).catch(() => null)),
        ),
        Promise.all(
          members.map((member) => getUserAnswerMatch(String(member.userId)).catch(() => null)),
        ),
      ]);

      if (!active) return;
      setMyProfile(mine);
      setOtherData(
        members.map((member, index) => ({
          member,
          profile: profiles[index],
          answerMatch: answerMatches[index],
        })),
      );
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [members]);

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
        {myProfile && (
          <Section>
            <SectionLabel>나</SectionLabel>
            <CardWrapper>
              <MemberCard as="div">
                <CardRow>
                  <AvatarImg
                    src={myProfile.profileImageUrl || "/assets/avatar/m1.png"}
                    alt={myProfile.nickname}
                  />
                  <MemberInfo>
                    <NameRow>
                      <MemberName>{myProfile.nickname}</MemberName>
                    </NameRow>
                    <MetaText>{buildMetaText(myProfile)}</MetaText>
                    {myProfile.introduction && <BioText>{myProfile.introduction}</BioText>}
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
              {otherData.map(({ member, profile, answerMatch }) => {
                const badge =
                  answerMatch && answerMatch.quizSetId && answerMatch.totalCount > 0
                    ? getMatchBadgeInfo(answerMatch.matchedCount, answerMatch.totalCount)
                    : null;

                return (
                  <OtherEntry key={member.userId}>
                    {badge && (
                      <BadgeRow>
                        <ContentBadge variant={badge.variant}>{badge.label}</ContentBadge>
                        <MatchCountText>{badge.matchDescription}</MatchCountText>
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

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const MatchCountText = styled.span`
  font-size: var(--typography-caption-1-font-size);
  font-weight: var(--typography-caption-1-font-weight);
  line-height: var(--typography-caption-1-line-height);
  letter-spacing: var(--typography-caption-1-letter-spacing);
  color: var(--color-semantic-label-alternative);
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
