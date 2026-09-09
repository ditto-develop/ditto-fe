"use client";

import styled from "styled-components";

import { SkeletonBlock } from "@/shared/ui";

/** 소개 노트 미리보기는 문답 3쌍까지 보여 준다. */
const QA_COUNT = 3;

/**
 * 상대 프로필(소개 노트) 화면의 로딩 자리.
 *
 * 여백·카드 shell은 ProfileIntroView에서 그대로 가져왔다.
 * 하단 버튼 영역은 로딩과 무관하게 이미 떠 있으므로 여기서는 다루지 않는다.
 */
export function ProfileIntroSkeleton() {
    return (
        <div aria-hidden="true" data-cy="profile-intro-skeleton">
            <ProfileSection>
                <SkeletonBlock $width="100px" $height="100px" $circle />
                <NameRow>
                    <SkeletonBlock $width="120px" $height="24px" />
                    <SkeletonBlock $width="52px" $height="24px" />
                </NameRow>
                <MetaRow>
                    <SkeletonBlock $width="200px" $height="20px" />
                </MetaRow>
                <InterestRow>
                    <SkeletonBlock $width="64px" $height="26px" />
                    <SkeletonBlock $width="80px" $height="26px" />
                    <SkeletonBlock $width="56px" $height="26px" />
                </InterestRow>
            </ProfileSection>

            <QnACard>
                <QnABody>
                    {Array.from({ length: QA_COUNT }).map((_, index) => (
                        <QnAItem key={index}>
                            <SkeletonBlock $width="140px" $height="20px" />
                            <Answer>
                                <SkeletonBlock $width="100%" $height="20px" />
                                <SkeletonBlock $width="70%" $height="20px" />
                            </Answer>
                        </QnAItem>
                    ))}
                </QnABody>
            </QnACard>
        </div>
    );
}

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 4px;
`;

const InterestRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
`;

const QnACard = styled.div`
  width: calc(100% - 32px);
  margin: 32px 16px 0;
  background-color: var(--color-semantic-background-elevated-alternative);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
`;

const QnABody = styled.div`
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const QnAItem = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Answer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 16px;
`;
