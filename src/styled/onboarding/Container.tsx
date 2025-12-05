import styled from "styled-components";


export const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    flex: 1 0 0;
    align-self: stretch;
`;

export const TopConatiner = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--space-8, 32px);
    flex: 1 0 0;
    align-self: stretch;
`;

export const ButtonContainer = styled.div`
    display: flex;
    height: 160px;
    padding: 0 var(--space-4, 16px);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--space-4, 16px);
    align-self: stretch;
`;

/** */
export const TopTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
`;

export const TopImgContainer = styled.img`
    width: 100px;
    height: 47.5px;
`;

export const TopCarousleContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1, 4px);
`;

export const TopProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 335px;
  align-items: flex-start;
  position: relative;
`;

export const TopStepperContainer = styled.div`
    display: flex;
    align-items: flex-start;
    gap: var(--space-2, 8px);
    align-self: stretch;
`;

export const StepperImgContainer = styled.img`
    z-index: 2; 
    padding-top: 0px;
    padding-right: 8px;
`;

export const StepItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: left;
  gap: 12px;
  position: relative;

  /* 각 StepItem 아래에 세로 라인을 자동으로 추가 */
  &::after {
    content: "";
    position: absolute;
    left: 9px;               /* 아이콘 중심 위치에 맞춰 조정 */
    top: 34px;                /* 아이콘 크기에 맞춰 조정 */
    width: 2px;
    height: calc(100%); /* 다음 아이콘까지 연결되도록 */
    background: #C7C1B9;       /* 라인 색상 (토큰으로 변경 가능) */
  }

  /* 마지막 아이템은 라인 제거 */
  &:last-child::after {
    display: none;
  }
`;

/** */