"use client";

import React, { useState } from 'react';
import styled from 'styled-components';
import FullScreenModal from '../display/FullScreenModal';
import Nav from '../display/Nav';
import AlertModal from '../display/AlertModal';
import Toast from '../display/Toast';
import {
    Body2Reading,
    Caption1,
    Heading2Bold,
    Headline2,
    Label2
} from '../common/Text';
import { AlertStatus } from '../display/Card';
import { ActionButton, ActionSheet } from '../input/Action';

interface ProfileDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: any; // Using 'any' for now to match MatchingResultModal's MatchProfile type loosely or define specifically
}

export default function ProfileDetailModal({
    isOpen,
    onClose,
    profile,
}: ProfileDetailModalProps) {
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    if (!profile) return null;

    const handleRequestClick = () => {
        setIsAlertOpen(true);
    };

    const handleConfirmRequest = () => {
        setIsAlertOpen(false);
        // Show Toast
        setToastMessage('대화 신청을 보냈어요');
        // Here allows logic to sync with backend if needed
    };

    return (
        <>
            <FullScreenModal isOpen={isOpen} onClose={onClose}>
                <Nav prev={onClose} />

                <ContentBody>
                    {/* Avatar Section */}
                    <AvatarSection>
                        <AvatarWrapper>
                            <AvatarImg src={profile.avatarUrl} alt={profile.name} />
                        </AvatarWrapper>
                    </AvatarSection>

                    {/* Info Section */}
                    <InfoSection>
                        <Heading2Bold style={{ textAlign: 'center' }}>{profile.name}</Heading2Bold>
                        <Body2Reading $color="var(--color-semantic-label-alternative)" style={{ marginTop: '8px', textAlign: 'center' }}>
                            {profile.ageRange} · {profile.gender} · {profile.location}
                        </Body2Reading>

                        {/* Badges */}
                        <BadgeRow>
                            <Badge>
                                <Caption1 $color="var(--color-semantic-label-alternative)">{profile.badgeText || '취미 공유'}</Caption1>
                            </Badge>
                            {/* Add more mocked badges if needed as per Figma */}
                        </BadgeRow>
                    </InfoSection>

                    {/* Q&A List (Mocked based on Figma) */}
                    <QnAList>
                        <QnAItem>
                            <Label2 $color="var(--color-semantic-label-alternative)">Q5. 최근 1년 내 가장 잘한 선택은?</Label2>
                            <Body2Reading style={{ marginTop: '8px' }}>
                                작년에 혼자 배낭여행 다녀온 거요! 새로운 사람들도 많이 만나고 시야가 넓어진 기분이었어요.
                            </Body2Reading>
                        </QnAItem>
                        <Divider />
                        <QnAItem>
                            <Label2 $color="var(--color-semantic-label-alternative)">Q6. 나를 가장 행복하게 만드는 순간은?</Label2>
                            <Body2Reading style={{ marginTop: '8px' }}>
                                퇴근하고 맥주 한 캔 하면서 넷플릭스 볼 때가 제일 행복해요 ㅎㅎ
                            </Body2Reading>
                        </QnAItem>
                        <Divider />
                        <QnAItem>
                            <Label2 $color="var(--color-semantic-label-alternative)">Q10. 나를 한 단어로 표현한다면?</Label2>
                            <Body2Reading style={{ marginTop: '8px' }}>
                                긍정파워! 힘든 일이 있어도 금방 털어내려고 노력하는 편이에요.
                            </Body2Reading>
                        </QnAItem>
                        <Divider />

                        <MoreSection>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                <Dot /> <Dot /> <Dot />
                            </div>
                        </MoreSection>
                        <Caption1 $color="var(--color-semantic-label-alternative)" style={{ textAlign: 'center', marginTop: '16px' }}>
                            대화가 시작되면 더 많은 질문과 답변을 볼 수 있어요
                        </Caption1>
                    </QnAList>
                </ContentBody>

                {/* Action Button at bottom */}
                <BottomActionContainer>
                    <ActionSheet>
                        <ActionButton
                            variant="primary"
                            onClick={handleRequestClick}
                            icon={<img src="/home/icons/send.svg" alt="send" />} // Reuse send icon
                        >
                            대화 신청하기
                        </ActionButton>
                    </ActionSheet>
                </BottomActionContainer>

                {/* Toast Overlay */}
                {toastMessage && (
                    <ToastContainer>
                        <Toast
                            id="request-toast"
                            message={toastMessage}
                            type="success"
                            onClose={() => setToastMessage(null)}
                            duration={3000}
                        />
                    </ToastContainer>
                )}
            </FullScreenModal>

            {/* Confirmation Alert */}
            <AlertModal
                isOpen={isAlertOpen}
                title="대화를 신청할까요?"
                message={<>상대방이 수락하면<br />대화가 시작돼요.</>}
                confirmParams={{
                    text: '신청하기',
                    onClick: handleConfirmRequest,
                }}
                cancelParams={{
                    text: '취소',
                    onClick: () => setIsAlertOpen(false),
                }}
                onClose={() => setIsAlertOpen(false)}
            />
        </>
    );
}

// --- Styled Components ---

const ContentBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 120px; // For bottom button space
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AvatarSection = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: center;
`;

const AvatarWrapper = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #ddd;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InfoSection = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0 16px;
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Badge = styled.div`
  background-color: var(--color-semantic-fill-normal);
  padding: 4px 8px;
  border-radius: 4px;
`;

const QnAList = styled.div`
  margin-top: 32px;
  width: 100%;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const QnAItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const Divider = styled.div`
  height: 1px;
  background-color: var(--color-semantic-line-normal, #eee);
  width: 100%;
`;

const BottomActionContainer = styled.div`
  position: absolute;
  bottom: 0px; // Nav height compensation if needed, but absolute bottom is fine
  left: 0;
  right: 0;
  padding: 0 16px 34px 16px; // Safe area
  background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 20%);
  pointer-events: none; // Let clicks pass through transparent part
  z-index: 10;
  
  & > * {
    pointer-events: auto; // Content clickable
  }
`;

const ToastContainer = styled.div`
  position: absolute;
  bottom: 100px; // Above button
  left: 16px;
  right: 16px;
  z-index: 20;
`;

const MoreSection = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 8px;
`;

const Dot = styled.div`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--color-semantic-label-alternative);
`;
