// components/onboarding/OnboardingLayout.tsx
import { ActionContainer, BodyContainer, HeadContainer, HeaderTop, PageContainer } from "@/styled/onboarding/Container";
import { Label1Normal, Title3 } from "@/styled/Text";
import Nav from "../Nav";
import { ActionButton, ActionSheet } from "../Action";

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  title: React.ReactNode;  
  description: React.ReactNode; // 줄바꿈 등을 위해 Node로 받음
  buttonText: string;
  isButtonDisabled?: boolean;
  subbuttonText?: string;
  variant?: "primary" | "secondary" | "tertiary" | "disabled" | undefined;
  onNext: () => void;
  children: React.ReactNode; // 여기가 폼(Body)이 들어갈 자리
}

export default function OnboardingLayout({
  step,
  totalSteps,
  title,
  description,
  buttonText,
  isButtonDisabled,
  subbuttonText,
  variant,
  onNext,
  children,
}: OnboardingLayoutProps) {
  return (
    <PageContainer>
      <Nav />
      
      {/* 1. 헤더 영역 (동적 데이터 바인딩) */}
      <HeadContainer>
        <HeaderTop>
          <Title3 $weight="bold">{title}</Title3>
          <Label1Normal $color="var(--color-status-positive)">
            {step}/{totalSteps}단계
          </Label1Normal>
        </HeaderTop>
        <div>{description}</div>
      </HeadContainer>

      {/* 2. 바디 영역 (각 단계별 인풋 컴포넌트가 여기 들어옴) */}
      <BodyContainer>
        {children}
      </BodyContainer>

      {/* 3. 액션 영역 (버튼) */}
      <ActionContainer>
        <ActionSheet>
          <ActionButton 
            variant={variant ? variant : "disabled" }
            onClick={onNext} 
            disabled={isButtonDisabled}
          >
            {buttonText}
          </ActionButton>
        </ActionSheet>
        {subbuttonText && 
        <ActionSheet>
          <ActionButton 
            variant="tertiary"
            onClick={onNext} 
          >
            {subbuttonText}
          </ActionButton>
        </ActionSheet>
        }
        
      </ActionContainer>
    </PageContainer>
  );
}