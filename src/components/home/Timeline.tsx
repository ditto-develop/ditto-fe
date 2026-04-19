"use client";

import { Body1Normal } from "@/components/common/Text";
import { Card } from "@/components/display/Card";
import { useMemo } from "react";
import styled from "styled-components";
import Lottie from "lottie-react";
import rippleAnimation from "@/assets/ripple.json";

interface TimelineProps {
  currentStep: number; // 1, 2, 3 중 현재 단계
}

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px; /* 각 단계 사이의 간격 */
  position: relative;
`;

// 전체 수직선 (배경에 깔림)
const VerticalTrack = styled.div`
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 16px; /* Circle의 중심점(20px + padding 10px)과 일치 */
  width: 1px;
  background-color: rgba(26, 24, 21, 0.2); /* 은은한 선 색상 */
  z-index: 0;
`;

// 개별 단계 Row
const StepRow = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;

  /* ✅ 활성/비활성 상태에 따른 투명도 조절 */
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.4)};
  transition: opacity 0.3s ease;
`;

// 아이콘 영역 (원 + 후광)
const IconWrapper = styled.div`
  width: 34px;
  height: 34px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

// 로티 애니메이션 래퍼 (NumberCircle 중앙 정렬)
const RippleWrapper = styled.div`
  position: absolute;
  width: 60px;
  height: 60px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

// 숫자 원
const NumberCircle = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--color-semantic-primary-normal); /* 진한 검정/갈색 */
  color: var(--color-semantic-static-white);
  display: flex;
  justify-content: center;
  align-items: center;

  font-family: var(--font-pretendard); /* 폰트 설정 (필요시 변경) */
  font-size: var(--typography-caption-1-font-size);
  font-weight: 700;
  line-height: 100%;

  position: relative;
  z-index: 2; /* 선보다 위에 위치 */
`;

// --- Component ---

export function Timeline({ currentStep }: TimelineProps) {
  console.log('[src/components/home/Timeline.tsx] Timeline'); // __component_log__
  const steps = [
    { id: 1, label: "월~수 : 퀴즈 기간" },
    { id: 2, label: "목 : 매칭 기간" },
    { id: 3, label: "금~일 : 대화 기간" },
  ];

  return (
    <Container>
      {/* 배경 수직선 */}
      <VerticalTrack />

      {steps.map((step) => {
        const isActive = currentStep === step.id;

        return (
          <StepRow key={step.id} $isActive={isActive}>
            <IconWrapper>
              {/* 활성화된 상태일 때만 리플 애니메이션 표시 */}
              {isActive && (
                <RippleWrapper>
                  <Lottie animationData={rippleAnimation} loop autoplay />
                </RippleWrapper>
              )}
              <NumberCircle>{step.id}</NumberCircle>
            </IconWrapper>
            <Body1Normal>{step.label}</Body1Normal>
          </StepRow>
        );
      })}
    </Container>
  );
}

interface TimeLineProps {
  date?: Date; // date가 없으면 오늘 날짜를 사용
}

export function TimeLine({ date = new Date() }: TimeLineProps) {
  console.log('[src/components/home/Timeline.tsx] TimeLine'); // __component_log__
  const currentStep = useMemo(() => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(utc + kstOffset);

    const day = kstDate.getDay(); // 이제 무조건 한국 기준 요일입니다.
    // 월(1), 화(2), 수(3) -> Step 1
    if (day >= 1 && day <= 3) {
      return 1;
    }

    // 목(4) -> Step 2
    if (day === 4) {
      return 2;
    }

    // 금(5), 토(6), 일(0) -> Step 3
    return 3;
  }, [date]);

  return (
    <Card
      title="타임라인"
      viewSection={
        <>
          <Timeline currentStep={currentStep} />
        </>
      }
    />
  );
}
