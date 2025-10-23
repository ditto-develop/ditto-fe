import styled, { keyframes } from "styled-components";
import { useEffect, useState } from "react";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const SubtitleText = styled.p`
    color: var(--primary-40, rgba(0, 0, 0, 0.40));
    text-align: center;
    font-family: Pretendard;
    font-size: 18px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%; 
    letter-spacing: -0.27px;
    opacity: 0;
    animation: ${fadeIn} 1.5s ease forwards;
`;

export const TitleText = styled.p`
    color: var(--Color-Red, #C93D2E);
    text-align: center;
    -webkit-text-stroke-width: 2px;
    -webkit-text-stroke-color: var(--Color-Red, #C93D2E);
    font-family: Pretendard;
    font-size: 48px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    opacity: 0;
    animation: ${fadeIn} 0.6s ease forwards;
`;

export const ButtonTitleText = styled.p`
    color: var(--Primary-Primary, #000);
    text-align: center;
    font-family: Pretendard;
    font-size: 18px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%; /* 27px */
    letter-spacing: -0.27px;  
`;

export const ShareText = styled.p`
    padding-top: 16px;
    text-align: center;
    color: #0000005c;
`;

export const BottomTitle = styled.h1`
    font-weight: 700;
    font-weight: bold;
    font-size: 24px;
`

export const BottomSubTitle = styled.p`
    font-size: 14px;
    font-weight: 500;
    color: #0000005c;
`

const TypingWrapper = styled.div`
    text-align: center;
    font-family: Pretendard;
    font-size: 18px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%; /* 27px */
    letter-spacing: -0.27px;
    animation: blink 0.8s step-end infinite;

    @keyframes blink {
        50% {
            border-color: transparent;
        }
    }
`;

type TypingProps = {
  text: string;
  speed?: number;
  onFinish?: () => void;
};

export default function TypingEffect({ text, speed = 50, onFinish }: TypingProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        if (onFinish){
            setTimeout(()=>{onFinish();},1000);
        }
    }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <TypingWrapper>{displayedText}</TypingWrapper>;
}