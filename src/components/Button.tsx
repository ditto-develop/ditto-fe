"use client";

import { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { keyframes, styled } from "styled-components";

/** 📌 Animation */
const fadeIn = keyframes`
  from { opacity: 0.4; }
  to { opacity: 1; }
`;

const BaseBox = styled.div<{ width?: number; height?: number; bg?: string }>`
  cursor: pointer;
  
  animation: ${fadeIn} 0.5s ease-in-out forwards;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  width: ${({ width }) => (width ? `${width}px` : "305px")};
  height: ${({ height }) => (height ? `${height}px` : "56px")};
  justify-self: center;

  &::before {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 1px;
    background-color: ${({ bg }) => bg || "transparent"};
    z-index: 0;
  }
`;

const BaseText = styled.span<{ color?: string }>`
  text-align: center;
  z-index: 1;
  color: ${({ color }) => color || "black"};
`;

const BaseImg = styled.img<{ w?: string }>`
  position: absolute;
  z-index: 0;
  width: ${({ w }) => w || "100%"};
`;

/** 📌 Prop 타입 */
type DivType = HTMLAttributes<HTMLDivElement>;
type BtnType = ButtonHTMLAttributes<HTMLButtonElement>;


/** 📌 quiz 버튼 */
type QuizType = DivType & { isblack: boolean };

/** 📌 QuizButton */
export const QuizButton = ({ isblack, children, ...props }: QuizType) => (
  <BaseBox {...props} width={305} bg={isblack ? 'black' : ''}>
    <BaseImg src="/buttons/button.svg" draggable="false"  />
    <BaseText color={isblack ? 'white' : ''}>{children}</BaseText>
  </BaseBox>
);

/** 📌 BlackButton */
export const Blackbutton = ({ children, ...props }: BtnType) => (
  <BaseBox as="button" {...props} width={345} height={62.8} bg="black">
    <BaseImg src="/buttons/button.svg" draggable="false"  />
    <BaseText color="white">{children}</BaseText>
  </BaseBox>
);

/** 📌 Small Black Button */
export const MiddleBlackbutton = ({ children, ...props }: DivType) => (
  <BaseBox {...props} width={281} height={52} bg="black">
    <BaseImg src="/buttons/button.svg" draggable="false" />
    <BaseText color="white">{children}</BaseText>
  </BaseBox>
);

/** 📌 Enable 상태가 있는 버튼 */
type EnableBtnProps = BtnType & { enable: boolean };

export const BlackEnablebutton = ({ enable, children, ...props }: EnableBtnProps) => (
  <BaseBox
    as={enable ? "button" : "div"}
    {...props}
    width={345}
    height={62.8}
    bg={enable ? "black" : "#9b9b9b"}
    style={{ cursor: enable ? "pointer" : "not-allowed", opacity: enable ? 1 : 0.6 }}
  >
    <BaseImg src={enable ? "/buttons/button.svg" : "/buttons/graybutton.svg"} draggable="false" />
    <BaseText color="white">{children}</BaseText>
  </BaseBox>
);

/** 📌 White Button */
export const Whitebutton = ({ children, ...props }: DivType) => (
  <BaseBox {...props} width={305} height={62.8}>
    <BaseImg src="/buttons/MiddleButton.svg" w="60%" draggable="false" />
    <BaseText color="black">{children}</BaseText>
  </BaseBox>
);
