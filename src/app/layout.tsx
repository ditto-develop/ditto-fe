/* tslint:disable */
/* eslint-disable */

import type { Metadata } from "next";
import "./globals.css";
import SplashLayout from "@/components/Splash";
import StyledComponentsRegistry from "./StyledComponentsRegistry";
import KakaoScript from '@/common/KakaoScript';
import Script from "next/script";

export const metadata: Metadata = {
  title: "Ditto - 수백만의 스침 속, 단 하나의 멈춤",
  description: "흔한 선택은 쉽게 잊히지만, 같은 답은 오래 남습니다",
  icons: {
		icon: "/icons/APPIcon.png",
	},
};

declare global {
  interface Window {
    Kakao: any;
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Script 
          src="https://developers.kakao.com/sdk/js/kakao.js"
          strategy="afterInteractive"
      />
      <body>
        <StyledComponentsRegistry>
          <SplashLayout>
              {children}
          </SplashLayout>
        </StyledComponentsRegistry>
      </body>
           <KakaoScript />
    </html>
  );
}
