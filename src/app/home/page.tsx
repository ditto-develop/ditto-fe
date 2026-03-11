"use client";

import styled from "styled-components";
import MainHeader from "./MainHeader";
import MainSection from "./MainSection";
import MainBottomNav from "./MainBottomNav";

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
  console.log('[src/app/home/page.tsx] Main'); // __component_log__
  return (
    <MainContainer>
      <MainHeader />
      <MainSection />
      <MainBottomNav />
    </MainContainer>
  );
}