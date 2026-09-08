import { ActionContainer, BodyContainer, DescriptionGroup, HeadContainer, HeaderTop, PageContainer } from "@/components/onboarding/OnboardingContainer";
import { Label1Normal, Title3 } from "@/shared/ui";
import { Nav } from "@/shared/ui";
import { ActionButton, ActionSheet } from "@/components/input/Action";

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  title: React.ReactNode;
  navTitle?: string;
  description: React.ReactNode;
  buttonText: string;
  isButtonDisabled?: boolean;
  subbuttonText?: string;
  variant?: "primary" | "secondary" | "tertiary" | "disabled" | undefined;

  onNext: () => void;
  onPrev?: () => void;
  onClose?: () => void;
  onSubAction?: () => void; // ✅ 추가: 서브 버튼 함수 (검증 건너뛰기용)

  children: React.ReactNode;
}

export function OnboardingLayout({
  step,
  totalSteps,
  title,
  navTitle,
  description,
  buttonText,
  isButtonDisabled,
  subbuttonText,
  variant,
  onNext,
  onPrev,
  onClose,
  onSubAction, // ✅ 구조 분해 할당
  children,
}: OnboardingLayoutProps) {
  return (
    <>
    <PageContainer>
    <Nav prev={onPrev} close={onClose} label={navTitle} />

      <HeadContainer>
        <HeaderTop>
          <Title3 $weight="bold">{title}</Title3>
          <Label1Normal $color="var(--color-semantic-status-positive)">
            {step}/{totalSteps}단계
          </Label1Normal>
        </HeaderTop>
        <DescriptionGroup>{description}</DescriptionGroup>
      </HeadContainer>

      <BodyContainer>
        {children}
      </BodyContainer>

      <ActionContainer>
        {/* 버튼 하단 여백이 과했다는 피드백으로 세이프에어리어 여유분을 16→8px로 줄인다. */}
        <ActionSheet safeAreaExtra={8}>
          {/* 메인 버튼: onNext 실행 */}
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
          {/* ✅ 서브 버튼: onSubAction이 있으면 실행, 없으면 onNext 실행(기존 호환) */}
          <ActionButton 
            variant="tertiary"
            onClick={onSubAction || onNext} 
          >
            {subbuttonText}
          </ActionButton>
        </ActionSheet>
        }
        
      </ActionContainer>
    </PageContainer>
    </>
  );
}
