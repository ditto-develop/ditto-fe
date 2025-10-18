"use client";
import Script from "next/script";
import { useEffect } from "react";

let kakaoInitialized = false;

export default function KakaoScript() {
      useEffect(() => {
      if (typeof window === "undefined" || window.Kakao) return;

      const script = document.createElement("script");
      script.src = "https://developers.kakao.com/sdk/js/kakao.js";
      script.onload = () => {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
          console.log("✅ Kakao SDK initialized");
        }
      };
      script.onerror = () => console.log("❌ Kakao SDK load failed");
      document.head.appendChild(script);
    }, []);


  return (
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Kakao script loaded, window.Kakao:", window.Kakao);
          if (window.Kakao && !kakaoInitialized) {
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
            kakaoInitialized = true;
            console.log("Kakao SDK initialized");
          }
        }}
        onError={() => console.log("❌ Kakao SDK 로드 실패")}
      />
  );
}
