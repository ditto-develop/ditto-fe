 import styled, { keyframes } from "styled-components";
import { useEffect, useState } from "react";

/** keyframes */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const blink = keyframes`
  50% {
    border-color: transparent;
  }
`;

const pureFadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px);}
  to { opacity: 1; transform: translateY(0px);}
`;

/** styled Text */
export const BaseText = styled.p`
  color: var(--Primary-Primary, #000);
  text-align: center;
  font-family: Pretendard;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%; /* 27px */
  letter-spacing: -0.27px;
`;

export const ShareText = styled.div`
  display: flex;
  width: 297px;
  height: 52px;
  padding: 16px;
  justify-content: center;
  align-items: center;
  gap: 10px;
 
  color: var(--primary-40, rgba(0, 0, 0, 0.40));
  text-align: center;
  font-family: Pretendard;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  cursor: pointer;
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
    color: var(--Primary-Primary, #000);
    text-align: center;
    font-family: Pretendard;
    font-size: 18px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%; /* 27px */
    letter-spacing: -0.27px;
    animation: ${blink} 0.8s step-end infinite;

    opacity: 0;
    transform: translateY(10px);
    animation: ${fadeIn} 0.6s ease-out forwards;
`;

/** Typeing Effect */
type TypingProps = {
  text: string;
  speed?: number;
  onFinish?: () => void;
};

export function TypingEffect({ text, speed = 50, onFinish }: TypingProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        if (onFinish){
            setTimeout(()=>{
                onFinish();
            },1000);
        }
    }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <TypingWrapper>{displayedText}</TypingWrapper>;
}

/** Color Typeing Effect */
type TypingColorProps = TypingProps & {
    color: string
};

const TypingColorWrapper = styled.div<{color: string}>`
    color: ${(props)=>props.color};
    text-align: center;
    font-family: Pretendard;
    font-size: 18px;
    font-style: normal;
    font-weight: 700;
    line-height: 150%; /* 27px */
    letter-spacing: -0.27px;
    animation: ${blink} 0.8s step-end infinite;
  
    opacity: 0;
    transform: translateY(10px);
    animation: ${fadeIn} 0.6s ease-out forwards;
`;

/** typing 시간 = 1000 / speed = count 글자/초 */
export function TypingColorEffect({ text, color, speed = 50, onFinish }: TypingColorProps) {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i === text.length) { 
        clearInterval(interval);
        if (onFinish){
            setTimeout(()=>{
                onFinish();
            },1000); //딜레이 타이밍 1초
        }
    }
    }, speed); //speed 마다 1글자씩 실행

    return () => clearInterval(interval);
  }, [text, speed]);

  return <TypingColorWrapper color={color}>{displayedText}</TypingColorWrapper>;
}


/** Styled Counter Span */
const AnimatedNumber = styled.span`
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
    animation: ${pureFadeIn} 1.2s ease-in-out forwards;
`;
/** Integer Counter Effect */
type IntegerCounterProps = {
  target: number;
  duration?: number;
  onFinish?: () => void;
};

export function IntegerCounter({ target, duration = 1800, onFinish }: IntegerCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    Array.from({ length: target + 1 }, (_, i) => i).forEach((num, idx) => {
      setTimeout(() => {
        setCount(num);
        if (num === target && onFinish) {
          setTimeout(() => onFinish(), 1500); // 1.5초 유지 후 콜백
        }
      }, idx * (duration / target));
    });
  }, [target, duration]);

  return <AnimatedNumber>{count}명</AnimatedNumber>;
}

/** Float Counter Effect */
type FloatCounterProps = {
  target: number;
  duration?: number;
  onFinish?: () => void;
};

export function FloatCounter({ target, duration = 1800, onFinish }: FloatCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fps = 60;
    const totalSteps = Math.round((duration / 1000) * fps);
    const increment = target / totalSteps;

    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += increment;
      if (step >= totalSteps) {
        current = target;
        clearInterval(interval);

        if (onFinish) {
          setTimeout(() => onFinish(), 1500);
        }
      }
      setCount(parseFloat(current.toFixed(2)));
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [target, duration]);

  return <AnimatedNumber>{count.toFixed(2)}%</AnimatedNumber>;
}

/** */
export const ResultNormal = styled.p`
  color: var(--Primary-Primary, #000);
  text-align: center;
  font-family: Pretendard;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%; /* 27px */
  letter-spacing: -0.27px;
`;

export const ResultSmallColor = styled.p`
  color: var(--Color-Brown, #775E4F);
  text-align: center;
  font-family: Pretendard;
  font-size: 18px;
  font-style: normal;
  font-weight: 700;
  line-height: 150%; /* 27px */
  letter-spacing: -0.27px;
`;

export const ResultBigColor = styled.p`
  color: var(--Color-Red, #C93D2E);
  text-align: center;
  -webkit-text-stroke-width: 2px;
  -webkit-text-stroke-color: var(--Color-Red, #C93D2E);
  font-family: Pretendard;
  font-size: 48px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
`;
