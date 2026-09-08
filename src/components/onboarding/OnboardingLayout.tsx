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
  /**
   * 하단 CTA 영역을 통째로 숨긴다.
   * 소개 노트처럼 화면 안에서 긴 글을 입력하는 동안 CTA가 키보드 위에 겹쳐
   * 입력 영역이 좁아지는 것을 막기 위한 옵션이다.
   */
  hideActions?: boolean;

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
  hideActions = false,
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

      {!hideActions && (
      <ActionContainer>
        {/*
         * 메인/서브 버튼은 한 ActionSheet 안에 세로로 쌓는다.
         * 시트를 둘로 나누면 위 시트의 하단 패딩(세이프에어리어 포함)과 아래 시트의
         * 상단 패딩이 겹쳐 두 버튼 사이가 과하게 벌어졌다.
         * 버튼 하단 여백이 과했다는 피드백으로 세이프에어리어 여유분은 16→8px로 줄인다.
         */}
        <ActionSheet safeAreaExtra={8} layout="column">
          {/* 메인 버튼: onNext 실행 */}
          <ActionButton
            variant={variant ? variant : "disabled" }
            onClick={onNext}
            disabled={isButtonDisabled}
          >
            {buttonText}
          </ActionButton>

          {/* ✅ 서브 버튼: onSubAction이 있으면 실행, 없으면 onNext 실행(기존 호환) */}
          {subbuttonText && (
            <ActionButton
              variant="tertiary"
              onClick={onSubAction || onNext}
            >
              {subbuttonText}
            </ActionButton>
          )}
        </ActionSheet>
      </ActionContainer>
      )}
    </PageContainer>
    </>
  );
}
