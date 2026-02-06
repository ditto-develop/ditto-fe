"use client";

import Splash from "@/components/splash/Splash";
import { OpenAPI } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      // If token exists, user is logged in.
      console.log("Access token found, bypassing splash screen.");
      
      setShowSplash(false); // Immediately hide splash screen

      // Redirect to home if user is on a page they shouldn't see when logged in
      if (pathname === "/" || pathname.startsWith('/oauth')) {
        router.push("/home");
      }
    } else {
      // No token, user is not logged in. Show splash screen.
      const timer = setTimeout(() => setShowSplash(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pathname, router]);

  const kakaoInit = () => {
    // window.Kakao가 있고 아직 초기화되지 않았을 때만 실행
    if (window.Kakao && !window.Kakao.isInitialized()) {
      // ✅ [수정] REST API 키가 아니라 JavaScript 키를 사용해야 합니다.
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