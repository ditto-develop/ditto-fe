"use client"

import { BetaBadge, ImgContainer, MainContainer } from "@/components/splash/SplashContainer";
import { Body1Normal } from "@/shared/ui";

export function Splash() {
  return (
    <MainContainer>
      <ImgContainer>
        <img
          src="/assets/logo/ditto.svg"
          alt="Ditto"
        />
        <BetaBadge />
      </ImgContainer>
      <Body1Normal $weight="medium" $color="var(--color-semantic-label-alternative)">
        퀴즈로 만나는 새로운 인연
      </Body1Normal>
    </MainContainer>
  );
}
