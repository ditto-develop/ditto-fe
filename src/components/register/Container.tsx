import styled from "styled-components"

export const LogoContainer = styled.img`
    margin: auto;
    padding-bottom: 16px;
`;

export const MainContainer = styled.div`
  padding: 64px 0px;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr 2fr 1fr;
  align-items: center;        /* 각 row content 중앙 */
  justify-items: center;      /* 가로 중앙 유지 */
  justify-content: center;    /* grid 트랙을 전체 가운데로 */
  row-gap: 0;                 /* 필요 시 */
`;


export const CheckContainer = styled.div`
    display: flex;
    gap: 10px;
    align-items: center; 
`;


export const BottomContainer = styled.div`
    padding: 0px 24px;
    display: grid;
    gap: 12px;
`;

export const SubContainer = styled.div`
    position: fixed;
    background-color: #F3F1EF;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;

    display: flex;
    justify-content: center;
    align-items: center;
`;

export const AlertContainer = styled.div`
    padding: 32px;
    display: grid;
    gap: 17px;
`;

export const Imgbox = styled.img`
    position: absolute;
`;

