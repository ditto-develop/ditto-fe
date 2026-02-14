"use client";

import styled from "styled-components";
import { ReactNode } from "react";
import { Caption1, Heading2Bold, Label1Normal } from "../common/Text";

// --- Types ---
export type AlertStatus = 'positive' | 'cautionary' | 'destructive' | 'navy';

// --- Styled Components (Layout & Basic Structure) ---

export const CardContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 24px;
  background-color: var(--color-semantic-background-normal-normal);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
  overflow: visible; 
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// ✅ AlertBadge 스타일 수정 (Props에 따라 색상 변경)
const AlertBadge = styled.div<{ $status: AlertStatus }>`
  /* 상태에 따른 배경색 매핑 */
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'positive':
        return 'var(--color-semantic-status-positive, var(--color-atomic-olive-60))';
      case 'cautionary':
        return 'var(--color-semantic-status-cautionary, var(--color-atomic-brickOrange-60))';
      case 'destructive':
      default:
        return 'var(--color-semantic-status-destructive, var(--color-atomic-brickRed-60))';
    }
  }};
  
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 100%; /* Center text vertically */
`;

// ✅ Content Badge Row Styles
const BadgeRowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: -16px; /* 24px(gap) - 16px = 8px */
`;

// ✅ AlertBadge 스타일 수정 (Props에 따라 색상 변경)
// Reuse AlertStatus type for consistency
const ContentBadge = styled.div<{ $status: AlertStatus }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px 6px;
  gap: 4px;
  border-radius: 6px;
  /* Background color mapping based on status with opacity */
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'positive':
        return 'rgba(85, 122, 85, 0.08)'; // var(--color-semantic-status-positive) #557A55
      case 'cautionary':
        return 'rgba(235, 90, 60, 0.08)'; // var(--color-semantic-status-cautionary)
      case 'navy':
        return 'rgba(from var(--color-semantic-accent-foreground-Navy) r g b / 0.08)';
      case 'destructive':
      default:
        return 'rgba(179, 53, 40, 0.08)'; // var(--color-semantic-status-negative)
    }
  }};
  height: 24px;
`;

const ViewSectionWrapper = styled.div`
  width: 100%;
  border-radius: 12px;
  padding: 5px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
`;

const ViewCardWrapper = styled.div`
  width: 100%;
  border-radius: 12px;
  padding: 5px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  background-color: var(--color-semantic-fill-normal, rgba(108, 101, 95, 0.08));
`;

const ButtonSectionWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const DecoImg = styled.img`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    transform: translateY(-50%);
    pointer-events: none; 
`;

// --- Interface ---

interface CardProps {
  title: string;
  subTitle?: string | ReactNode;
  contentBadge?: string; // ✅ New Prop
  contentBadgeColor?: AlertStatus; // ✅ New Prop for Badge Color
  contentDescription?: string; // ✅ New Prop
  alert?: string | ReactNode;
  alertType?: AlertStatus; // ✅ 알림 뱃지 색상 타입 추가 (기본값 처리는 컴포넌트에서)
  viewSection?: ReactNode;
  viewCard?: ReactNode;
  buttonSection?: ReactNode;
}

// --- Component ---

export default function Card({
  title,
  subTitle,
  contentBadge,
  contentBadgeColor = 'destructive', // Default to destructive (red)
  contentDescription,
  alert,
  alertType = 'destructive', // ✅ 기본값 설정 (빨간색)
  viewSection,
  viewCard,
  buttonSection,
}: CardProps) {
  return (
    <CardContainer>
      {/* 0. Deco Image */}
      <DecoImg
        src='/display/deco.svg'
        alt="decoration"
      />

      {/* 1. Header Area */}
      <HeaderSection>
        <TitleGroup>
          <Heading2Bold $weight="bold">{title}</Heading2Bold>
          {subTitle && <Label1Normal $weight="medium">{subTitle}</Label1Normal>}
        </TitleGroup>

        {/* alert가 있을 때만 렌더링하며, alertType을 스타일로 전달 */}
        {alert && (
          <AlertBadge $status={alertType}>
            {alert}
          </AlertBadge>
        )}
      </HeaderSection>

      {/* 2. Content Badge Row (Optional) */}
      {(contentBadge || contentDescription) && (
        <BadgeRowContainer>
          {contentBadge && (
            <ContentBadge $status={contentBadgeColor}>
              <Caption1 $color={
                contentBadgeColor === 'positive' ? 'var(--color-semantic-status-positive)' :
                  contentBadgeColor === 'cautionary' ? 'var(--color-semantic-status-cautionary)' :
                    contentBadgeColor === 'navy' ? 'var(--color-semantic-accent-foreground-Navy)' :
                      'var(--color-semantic-status-negative)' // destructive
              }>{contentBadge}</Caption1>
            </ContentBadge>
          )}
          {contentDescription && (
            <Caption1 $color="var(--color-semantic-label-alternative)">{contentDescription}</Caption1>
          )}
        </BadgeRowContainer>
      )}

      {/* 3. View Section */}
      {viewSection && (
        <ViewSectionWrapper>
          {viewSection}
        </ViewSectionWrapper>
      )}

      {/* 4. View Section */}
      {viewCard && (
        <ViewCardWrapper>
          {viewCard}
        </ViewCardWrapper>
      )}

      {/* 5. Button Section */}
      {buttonSection && (
        <ButtonSectionWrapper>
          {buttonSection}
        </ButtonSectionWrapper>
      )}
    </CardContainer>
  );
}