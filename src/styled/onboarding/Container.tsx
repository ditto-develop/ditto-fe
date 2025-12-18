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
  gap: 20px;
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
    top: 23px;                /* 아이콘 크기에 맞춰 조정 */
    width: 2px;
    height: calc(100%); /* 다음 아이콘까지 연결되도록 */
    background: #C7C1B9;       /* 라인 색상 (토큰으로 변경 가능) */
  }

  /* 마지막 아이템은 라인 제거 */
  &:last-child::after {
    display: none;
  }
`;

/** Tutorial Styled */
export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 99dvh;
`;

export const BodyContainer = styled.div`
    display: flex;
    padding: var(--space-8, 32px) 16px;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    flex: 1 0 0;
    align-self: stretch;
`;

export const HeadContainer = styled.div`
  display: flex;
  padding: 0 var(--space-4, 16px);
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2, 8px);
  align-self: stretch;

`

export const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center; 
  gap: 12px;
  width: 100%;
`;

export const ActionContainer = styled.div`
  flex: 0 0 auto;
`;

/** */
export const ProfileContainer = styled.div`
  display: flex;
  padding: 0 var(--space-5, 20px);
  flex-direction: column;
  align-items: center;
  gap: var(--space-6, 24px);
  align-self: stretch;
`;

export const ProfileWrapper = styled.div`
  position: relative;      /* ProfileImg 기준점 */
  width: 100px;
  height: 100px;
`;

interface ProfileImgProps {
  imageUrl: string;
}

export const ProfileImg = styled.div<ProfileImgProps>`
  display: flex;
  width: 100px;
  height: 100px;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  overflow: hidden;

  background: ${({ imageUrl }) =>
    `url(${imageUrl}) var(--color-bg-normal-alt) 50% / cover no-repeat`};
`;


export const ProfileEdit = styled.div`
  position: absolute;
  bottom: 0;   /* 오른쪽 아래 붙이기 */
  right: 0;

  width: 18px;
  height: 18px;
  padding: 7px;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: black;
  border-radius: 50%;

  background-image: url('/onboarding/profileimg/edit.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 16px 16px; 
`;


export const DefaultContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
`;

export const DivideContainer = styled.div`
  display: flex;
  align-self: stretch;
  gap: 24px;
  align-items: flex-start;
`;

export const DividedInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex: 1 0 0;
`;

/** */
export const IntroContainer = styled.div`
  display: flex;
  width: 393px;
  padding: var(--space-8, 32px) var(--space-4, 16px);
  flex-direction: column;
  align-items: center;
  gap: var(--space-8, 32px);
`;

export const QuestionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;   // ⭐️ 전체 폭 채우기
  gap: 8px;
  width: 100%;           // ⭐️ 부모도 채우기
`;
