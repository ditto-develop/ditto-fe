"use client"

import { ImgContainer, MainContainer } from "@/components/splash/SplashContainer";
import { Body1Normal } from "@/components/common/Text";

export default function Splash() {
  return (
    <MainContainer>
      <ImgContainer>
        <img 
          src='/logo/dittologo.svg'
        />
      </ImgContainer>
      <Body1Normal>우연일까? 운명일까?</Body1Normal>
    </MainContainer>
  );
}
