"use client"
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translate(-50%, 100%);
  }
  to {
    transform: translate(-50%, 0);
  }
`;

const MainContainer = styled.div`
  padding: 64px 0;
  width: 100%;
  height: 100vh; /* 화면 전체 높이 */
  display: flex;
  flex-direction: column;
  justify-content: center; /* 가로 중앙 정렬 */
  align-items: center;     /* 세로 중앙 정렬 */
  overflow-y: scroll;
`

export const TextContainer = styled.div<{ hidden?: boolean }>`
  padding: 64px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  opacity: ${({ hidden }) => (hidden ? 0 : 1)};
  transition: opacity 1s ease;
`


const TextContiner = styled.div`
  display: grid;
  justify-content: center;
`

const LoadingContainer = styled.div`
    position: fixed;
    
    top: 0;                  
    left: 0;
    width: 100%;              
    z-index: 1000;
    height: 100%;
    
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;

    background-color: #F3F1EF;
`;

const ButtonContainer = styled.div`
  display: flex;
  padding: 32px 24px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  align-self: stretch;
  animation: ${fadeIn} 0.6s ease-in-out;
`;



const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998; 
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const BottomSheetContainer = styled.div`
  position: fixed;
  top: 50px;
  left: 50%;                       
  width: 100%;   
  max-width: 640px;
  transform: translateX(-50%);

  height: calc(100% - 50px);  
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  z-index: 999;
  background-color: #F3F1EF;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  animation: ${slideUp} 0.5s ease-out;

  overflow-y: auto;
  overflow-x: auto;
`;

const ShareImgContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ShareIconContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
`

const IconContainer = styled.div`
  background-image: url('/icons/iconbox.svg');
  background-size: contain;
  display: grid;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
`

const CaptuerContainer = styled.div`
  background-color: var(--Background);
  display: grid;
  gap: 32px;
  padding: 24px 0px;
  place-items: center;
`

export {CaptuerContainer,IconContainer,ShareIconContainer,ShareImgContainer,Backdrop,BottomSheetContainer,LoadingContainer,MainContainer,TextContiner,ButtonContainer}