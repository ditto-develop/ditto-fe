"use client"

import { ImgContainer, MainContainer } from "@/components/splash/SplashContainer";
import { Body1Normal } from "@/shared/ui";

export function Splash() {
  console.log('[src/components/splash/Splash.tsx] Splash'); // __component_log__
  return (
    <MainContainer>
      <ImgContainer>
        <img 
          src="/assets/logo/ditto.svg"
          alt="Ditto"
        />
      </ImgContainer>
      <Body1Normal>우연일까? 운명일까?</Body1Normal>
    </MainContainer>
  );
}
