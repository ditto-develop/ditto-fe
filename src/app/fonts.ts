// app/fonts.ts
import localFont from "next/font/local";

export const pretendard = localFont({
  src: [
    {
      path: "/fonts/pretendard/PretendardJPVariable.woff2",
      weight: "100 900",          // 이 폰트가 지원하는 wght 범위
      style: "normal",
    },
  ],
  variable: "--font-pretendard",  // CSS 변수 이름
  display: "swap",
});
