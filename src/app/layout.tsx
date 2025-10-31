/* tslint:disable */
/* eslint-disable */

import type { Metadata } from "next";
import "./globals.css";
import SplashLayout from "@/components/Splash";
import StyledComponentsRegistry from "./StyledComponentsRegistry";
import KakaoScript from '@/common/KakaoScript';
import Providers from "./Providers";
import SessionTracker from "@/components/Sessiontracker";

export const metadata: Metadata = {
  title: "Ditto - 12개의 선택, 하나의 만남",
  description: "",
  icons: {
		icon: "/icons/APPIcon.png",
	},
  openGraph: {
    title: "Ditto - 12개의 선택, 하나의 만남",
    description: "",
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
      title: "Ditto - 12개의 선택, 하나의 만남",
      description: "",
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
                <SessionTracker />
                {children}
            </SplashLayout>
          </StyledComponentsRegistry>
        </Providers>
      </body>
           <KakaoScript />
    </html>
  );
}
