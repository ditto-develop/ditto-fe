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
  title: "ditto - 12개의 선택, 하나의 만남",
  description: "",
   icons: [
      { url: "/icons/APPICON.png", sizes: "48x48", type: "image/png" },
  ],
  openGraph: {
    title: "ditto - 12개의 선택, 하나의 만남",
    description: "",
    url: process.env.NEXT_PUBLIC_DNS,
    siteName: "ditto",
    images: [
      {
        url: "https://i.ibb.co/wFZmv6ZD/APP-Icon.png",
        width: 304,
        height: 304,
      },
    ],
    locale: "ko_KR",
    type: "website",
    },
    twitter: { //현재 적용되지 않는 상황. 추후 수정
      card: "summary_large_image",
      title: "ditto - 12개의 선택, 하나의 만남",
      description: "",
      images: ["https://i.ibb.co/wFZmv6ZD/APP-Icon.png"],
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
