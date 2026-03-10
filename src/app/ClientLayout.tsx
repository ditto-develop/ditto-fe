"use client";

import Splash from "@/components/splash/Splash";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  console.log('[src/app/ClientLayout.tsx] ClientLayout'); // __component_log__
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      // 로그인 상태: 스플래시를 다음 틱에 즉시 숨김 (setState를 콜백 안으로 이동해 lint 규칙 준수)
      const timer = setTimeout(() => {
        setShowSplash(false);
        if (pathname === "/" || pathname.startsWith('/oauth')) {
          router.push("/home");
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      // 비로그인: 3초 후 스플래시 숨김
      const timer = setTimeout(() => setShowSplash(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pathname, router]);

  const kakaoInit = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      console.log("Kakao SDK Initialized");
    }
  };

  return showSplash ? (
    <Splash />
  ) : (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" // ✅ 최신 SDK URL 권장 (선택사항)
        strategy="lazyOnload"
        onLoad={kakaoInit}
      />
      {children}
    </>
  );
}