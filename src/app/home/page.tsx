"use client";

import styled from "styled-components";
import MainHeader from "./MainHeader";
import MainSection from "./MainSection";
import MainBottomNav from "./MainBottomNav";

const MainContainer = styled.div`
  width: 100%;
  height: 100vh; /* 화면 전체 높이 사용 */
  background-color: var(--color-semantic-background-normal-alternative);
  padding: 0 16px;
  box-sizing: border-box; /* padding으로 인한 사이즈 초과 방지 */

  /* 스크롤 방지 */
  overflow: hidden;

  /* 내부 콘텐츠 가운데 정렬 */
  display: flex;
  flex-direction: column; /* 요소들을 세로로 배치 */
`;

export default function Main() {
  return (
    <MainContainer>
      <MainHeader />
      <MainSection />
      <MainBottomNav />
    </MainContainer>
  );
}