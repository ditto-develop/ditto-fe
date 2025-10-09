"use client"
import styled, { keyframes } from "styled-components";

const MainContainer = styled.div`
  padding: 64px 0px;
  display: grid;
  gap: 32px;
  place-items: center;
`

const TextContiner = styled.div`
  display: grid;
  justify-content: center;
`

const LoadingContainer = styled.div`
    height: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
`;

const ButtonContainer = styled.div`
  padding: 0px 24px 64px 24px;
  display: grid;
  place-items: center;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
`;

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
    transform: translateY(100%); 
  }
  to {
    transform: translateY(0);
  }
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
    padding: 32px 24px;
    display: grid;
    grid-template-rows: 1fr 8fr 2fr;
    gap: 32px;

    z-index: 999; 
    top: 50px;
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: #F3F1EF;
    
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    animation: ${slideUp} 0.5s ease-out;
`;

const ShareImgContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ShareIconContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
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