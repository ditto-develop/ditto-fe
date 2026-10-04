"use client";

import { Body1Normal } from "@/shared/ui";
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
  /*
   * 각 단계 사이의 간격. 행 높이(IconWrapper 28px)와 합쳐 단계 간 중심거리가
   * Figma Progress Tracker 와 같은 40px 이 된다 — 8px 이던 때는 36px 이라
   * 세 단계가 위로 4px 씩 당겨 붙어 보였다(QA BUG-053 '타임라인 상하 간격').
   */
  gap: var(--space-3);
  position: relative;
`;

/**
 * 단계 사이를 잇는 선. 원과 원 **사이 구간만** 그린다.
 *
 * 예전에는 1번부터 3번 원 안쪽까지 한 줄로 깔았는데, 지금 단계가 아닌 행은 opacity 0.4라
 * 숫자 원도 반투명해져 그 밑을 지나는 선이 원을 뚫고 위아래로 튀어나와 보였다(2026-10-04 QA).
 *
 * 위치는 행 높이(IconWrapper 28px = --space-7)·행 간격(--space-3)·원 지름(20px)에서 나온다.
 * 원은 행 안에서 위아래 4px 여백을 두고 가운데 놓이므로 `index` 번째 원의 아래끝은
 * `index * (행 높이 + 간격) + 24px`, 다음 원의 위끝까지는 `간격 + 8px` 이다.
 */
const StepConnector = styled.div<{ $index: number }>`
  position: absolute;
  top: calc(${({ $index }) => $index} * (var(--space-7) + var(--space-3)) + var(--space-6));
  height: calc(var(--space-3) + var(--space-2));
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
  /* 행 높이를 정하는 값이다. 가로 34px은 VerticalTrack(left:16px) 정렬 기준이라 유지. */
  height: 28px;
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

function Timeline({ currentStep }: TimelineProps) {
  const steps = [
    { id: 1, label: "월~수 : 퀴즈 기간" },
    { id: 2, label: "목 : 매칭 기간" },
    { id: 3, label: "금~일 : 대화 기간" },
  ];

  return (
    <Container>
      {/* 원 사이를 잇는 선 */}
      {steps.slice(1).map((step, index) => (
        <StepConnector key={step.id} $index={index} />
      ))}

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
