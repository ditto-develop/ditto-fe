"use client";

import styled from "styled-components";
import { MainHeader } from "./MainHeader";
import { MainSection } from "./MainSection";
import { MainBottomNav } from "./MainBottomNav";
import { Suspense } from "react";
import { usePendingReviewPrompt } from "@/features/rating/hooks/usePendingReviewPrompt";
import { PendingReviewPromptModal } from "@/features/rating/ui/PendingReviewPromptModal";

const MainContainer = styled.div`
  width: 100%;
  min-height: 100dvh;
  background-color: var(--color-semantic-background-normal-alternative);
  padding: 0 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

export default function Main() {
  const reviewPrompt = usePendingReviewPrompt();

  return (
    <MainContainer>
      <MainHeader />
      <Suspense>
        <MainSection />
      </Suspense>
      <MainBottomNav />
      <PendingReviewPromptModal
        review={reviewPrompt.review}
        onStart={reviewPrompt.start}
        onSkip={reviewPrompt.skip}
      />
    </MainContainer>
  );
}