"use client";

import styled from "styled-components";

interface VoteBannerProps {
  label?: string;
  /** 진행 중이면 '투표하기', 마감 뒤에는 '확인하기'. Figma 4.2.4 [2232:40174]. */
  buttonLabel?: string;
  onVoteClick: () => void;
}

export function VoteBanner({
  label = "만남 투표 진행 중",
  buttonLabel = "투표하기",
  onVoteClick,
}: VoteBannerProps) {
  return (
    <BannerWrapper>
      <BannerBackground />
      <BannerContent>
        <IconWrapper>
          <InboxIcon src="/icons/content/inbox.svg" alt="" />
        </IconWrapper>
        <BannerText>{label}</BannerText>
        <VoteButton onClick={onVoteClick}>{buttonLabel}</VoteButton>
      </BannerContent>
    </BannerWrapper>
  );
}

const BannerWrapper = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  margin: 0 10px;
  flex-shrink: 0;
`;

const BannerBackground = styled.div`
  position: absolute;
  inset: 0;
  background-color: var(--color-semantic-static-white);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--color-semantic-label-assistive);
    opacity: 0.05;
  }
`;

const BannerContent = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
`;

const IconWrapper = styled.div`
  width: 20px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const InboxIcon = styled.img`
  display: block;
  width: 20px;
  height: 20px;
`;

const BannerText = styled.p`
  flex: 1;
  margin: 0;
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-body-2-normal-font-size);
  font-weight: 500;
  line-height: 1.467;
  letter-spacing: 0.144px;
  color: var(--color-semantic-label-normal);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const VoteButton = styled.button`
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background-color: var(--color-semantic-primary-normal);
  font-family: "Pretendard JP", sans-serif;
  font-size: var(--typography-label-2-font-size);
  font-weight: 600;
  line-height: 1.385;
  letter-spacing: 0.252px;
  color: var(--color-semantic-static-white);

  &:active {
    opacity: 0.8;
  }
`;
