import { useEffect, useRef } from "react";
import { ActionContainer, BodyContainer, DescriptionGroup, HeadContainer, HeaderTop, PageContainer, ScrollingHeadContainer } from "@/components/onboarding/OnboardingContainer";
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
  /**
   * 제목·설명을 본문과 함께 스크롤한다. 소개 노트처럼 진행 카드만 상단에 남겨야 하는 화면용
   * (2026-09-27 QA — 고정 머리말이 화면을 차지해 입력 영역이 좁았다).
   */
  scrollHeader?: boolean;
  /**
   * 설명만 본문과 함께 스크롤하고 제목·단계는 상단에 고정한다. 프로필 작성처럼 입력 항목이
   * 길어 설명 문구까지 고정하면 입력 영역이 좁아지는 화면용(2026-10-07).
   * `scrollHeader` 와 함께 주면 `scrollHeader` 가 우선한다.
   */
  scrollDescription?: boolean;

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
  scrollHeader = false,
  scrollDescription = false,
  onNext,
  onPrev,
  onClose,
  onSubAction, // ✅ 구조 분해 할당
  children,
}: OnboardingLayoutProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  /*
   * 단계가 바뀌면 본문 스크롤을 맨 위로 되돌린다.
   * 프로필 → 소개 노트처럼 같은 레이아웃 안에서 내용만 갈아끼우면 스크롤 컨테이너가 그대로
   * 남아, 앞 단계에서 내려 둔 스크롤 위치로 다음 단계가 열린다.
   */
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const headerTop = (
    <HeaderTop>
      <Title3 $weight="bold">{title}</Title3>
      <Label1Normal $color="var(--color-semantic-status-positive)">
        {step}/{totalSteps}단계
      </Label1Normal>
    </HeaderTop>
  );
  const descriptionGroup = <DescriptionGroup>{description}</DescriptionGroup>;
  const descriptionScrolls = !scrollHeader && scrollDescription;

  return (
    <>
    <PageContainer>
    <Nav prev={onPrev} close={onClose} label={navTitle} />

      {!scrollHeader && (
        <HeadContainer>
          {headerTop}
          {!descriptionScrolls && descriptionGroup}
        </HeadContainer>
      )}

      <BodyContainer ref={bodyRef}>
        {scrollHeader && (
          <ScrollingHeadContainer>
            {headerTop}
            {descriptionGroup}
          </ScrollingHeadContainer>
        )}
        {descriptionScrolls && <ScrollingHeadContainer>{descriptionGroup}</ScrollingHeadContainer>}
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
