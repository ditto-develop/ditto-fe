"use client";
import Script from "next/script";

export default function KakaoScript() {
  return (
    <Script
      src="https://developers.kakao.com/sdk/js/kakao.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
        }
      }}
      onError={() => console.log("❌ Kakao SDK 로드 실패")}
    />
  );
}
