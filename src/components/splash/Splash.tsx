"use client"

import { ImgContainer, MainContainer } from "@/components/splash/SplashContainer";
import { Body1Normal } from "@/shared/ui";

export function Splash() {
  return (
    <MainContainer>
      <ImgContainer>
        <img 
          src="/assets/logo/ditto.svg"
          alt="Ditto"
        />
      </ImgContainer>
      <Body1Normal>퀴즈로 만나는 새로운 인연</Body1Normal>
    </MainContainer>
  );
}
