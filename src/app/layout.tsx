/* tslint:disable */
/* eslint-disable */

import type { Metadata } from "next";
import "./globals.css";
import SplashLayout from "@/components/Splash";
import StyledComponentsRegistry from "./StyledComponentsRegistry";
import KakaoScript from '@/common/KakaoScript';
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "Ditto - 수백만의 스침 속, 단 하나의 멈춤",
  description: "흔한 선택은 쉽게 잊히지만, 같은 답은 오래 남습니다",
  icons: {
		icon: "/icons/APPIcon.png",
	},
  openGraph: {
    title: "Ditto - 수백만의 스침 속, 단 하나의 멈춤",
    description: "흔한 선택은 쉽게 잊히지만, 같은 답은 오래 남습니다",
    url: process.env.NEXT_PUBLIC_DNS,
    siteName: "Ditto",
    images: [
      {
        url: "https://i.postimg.cc/wvZsfRjj/OG-Image.png",
        width: 3600,
        height: 1890,
      },
    ],
    locale: "ko_KR",
    type: "website",
    },
    twitter: { //현재 적용되지 않는 상황. 추후 수정
      card: "summary_large_image",
      title: "Ditto - 수백만의 스침 속, 단 하나의 멈춤",
      description: "흔한 선택은 쉽게 잊히지만, 같은 답은 오래 남습니다",
      images: ["https://i.postimg.cc/wvZsfRjj/OG-Image.png"],
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
      <body>
        <Providers>
          <StyledComponentsRegistry>
            <SplashLayout>
                {children}
            </SplashLayout>
          </StyledComponentsRegistry>
        </Providers>
      </body>
           <KakaoScript />
    </html>
  );
}
