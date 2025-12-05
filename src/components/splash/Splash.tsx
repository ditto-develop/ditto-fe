"use client"

import { ImgContainer, MainContainer } from "@/styled/splash/Container";
import { SubAlterText } from "@/styled/Text";

export default function Splash() {
  return (
    <MainContainer>
      <ImgContainer>
        <img 
          src='/logo/dittologo.svg'
        />
      </ImgContainer>
      <SubAlterText>퀴즈로 연결되는 새로운 만남의 시작</SubAlterText>
    </MainContainer>
  );
}
