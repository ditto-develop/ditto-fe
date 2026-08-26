import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HomeReadyProvider } from "@/context/HomeReadyContext";
import { ToastProvider } from "@/context/ToastContext";
import { ClientLayout } from "./ClientLayout";

const pretendardJP = localFont({
  src: "../styles/fonts/pretendard/PretendardJPVariable.woff2",
  variable: "--font-pretendard-jp",
  display: "swap",
  preload: true,
});

/**
 * `viewport-fit: cover`가 있어야 `env(safe-area-inset-*)`가 실제 인셋을 돌려준다.
 * 이 선언이 없으면 하단 고정 요소(MainBottomNav, BottomActionArea 등)에 이미
 * 작성돼 있는 safe-area 패딩이 전부 0으로 계산되어, 노치/홈 인디케이터가 있는
 * 기기에서 버튼이 제스처 바에 가린다. 웹·앱 공통으로 적용된다.
 *
 * 확대(user-scalable)는 막지 않는다 — 같은 번들이 웹에서도 돌기 때문에
 * 확대를 막으면 웹 접근성(WCAG 1.4.4)이 함께 깨진다.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#E9E6E2", // --color-atomic-neutral-95, 네이티브/브라우저 크롬 배경
};

export const metadata: Metadata = {
  title: "Ditto",
  description: "Ditto Description",
  icons: {
    icon: "/assets/app/icon.svg",
    apple: "/assets/app/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="ko" className={pretendardJP.variable}>
      <head>
        <link rel="preload" as="image" href="/assets/logo/ditto.svg" />
      </head>
      <body>
        <HomeReadyProvider>
          <ClientLayout>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ClientLayout>
        </HomeReadyProvider>
      </body>
    </html>
  );
}
