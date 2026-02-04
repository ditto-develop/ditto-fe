"use client";

import Splash from "@/components/splash/Splash";
import Script from "next/script";
import { useEffect, useState } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

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