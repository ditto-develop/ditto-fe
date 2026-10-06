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
    // suppressHydrationWarning: 아래 head 스크립트가 하이드레이션 전에 data-native-app 을 단다.
    <html lang="ko" className={pretendardJP.variable} suppressHydrationWarning>
      <head>
        {/*
          앱(Capacitor 웹뷰)이면 첫 페인트 전에 <html data-native-app> 을 단다. 앱에서만 달라야
          하는 정적 화면(스플래시 베타 배지 등)을 CSS 로 가르는 표식이다(globals.css).
          Capacitor 네이티브 브릿지는 문서 시작 시점에 주입되므로 여기서 이미 읽을 수 있다.
          일반 브라우저에는 window.Capacitor 가 없어 아무 일도 하지 않는다.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(window.Capacitor&&window.Capacitor.isNativePlatform())document.documentElement.setAttribute('data-native-app','')}catch(e){}",
          }}
        />
        <link rel="preload" as="image" href="/assets/logo/ditto.svg" />
        <link rel="preload" as="image" href="/assets/logo/beta-badge.svg" />
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
