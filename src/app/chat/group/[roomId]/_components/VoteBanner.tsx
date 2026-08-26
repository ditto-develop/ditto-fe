"use client";

import type React from "react";
import styled from "styled-components";

interface VoteBannerProps {
  label?: string;
  onVoteClick: () => void;
}

export function VoteBanner({
  label = "만남 투표 진행 중",
  onVoteClick,
}: VoteBannerProps) {
  return (
    <BannerWrapper>
      <BannerBackground />
      <BannerContent>
        <IconWrapper>
          <InboxIcon aria-hidden="true" />
        </IconWrapper>
        <BannerText>{label}</BannerText>
        <VoteButton onClick={onVoteClick}>투표하기</VoteButton>
      </BannerContent>
    </BannerWrapper>
  );
}

function InboxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M3.333 10.833V15a1.667 1.667 0 0 0 1.667 1.667h10A1.667 1.667 0 0 0 16.667 15v-4.167M3.333 10.833l1.942-5.825A1.667 1.667 0 0 1 6.858 3.75h6.284a1.667 1.667 0 0 1 1.583 1.258l1.942 5.825M3.333 10.833h3.334l1.25 2.5h3.333l1.25-2.5h3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
