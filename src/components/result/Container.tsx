"use client"
import { motion } from "framer-motion";
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

const MainContainer = styled.div<{isFinsih?: boolean}>`
  padding: ${(props)=>props.isFinsih?178:108}px 0 64px 0;
  width: 100%; 
  height: 100vh; /* 화면 전체 높이 */ 
  display: flex; 
  flex-direction: column; 
  justify-content: center; /* 가로 중앙 정렬 */ 
  align-items: center; /* 세로 중앙 정렬 */ 
  overflow-y: auto;
`

export const TextContainer = styled.div<{ padding?: number }>`
  padding-bottom: ${(props)=>props.padding}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  transition: padding-bottom 0.5s ease-in-out; 
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

const ButtonfadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0px);
  }
`;
const ButtonContainer = styled.div`
  display: flex;
  padding-bottom: 73px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  align-self: stretch;
  animation: ${ButtonfadeIn} 0.6s ease-in-out;
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
  bottom: 0px;
  left: 50%;                       
  width: 100%;   
  max-width: 640px;
  transform: translateX(-50%);

  height: 280px;  
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

export const Line = styled(motion.div)`
  display: flex;
  justify-content: center;
`;

export const variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export {CaptuerContainer,IconContainer,ShareIconContainer,ShareImgContainer,Backdrop,BottomSheetContainer,LoadingContainer,MainContainer,TextContiner,ButtonContainer}