import styled from "styled-components";

/**
 * 폰 그림(앱 화면 + 상태 표시줄 + 테두리). 그림자가 투명한 모서리가 아니라 폰 모양을 따라가도록
 * 둥글기를 폰 테두리에 맞춘다 — 바깥 반지름 62 pt / 폰 417×876 pt 를 가로·세로 비율로.
 */
export const PhoneImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  border-radius: 14.9% / 7.1%;
  box-shadow: var(--style-semantic-shadow-strong);
`;
