"use client";
import Script from "next/script";

export default function KakaoScript() {
  const onLoad = () => {
    const timer = setInterval(() => {
      if (window.Kakao) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
        clearInterval(timer);
      }
    }, 50);
  };

  return (
    <Script
      src='/scripts/kakao.js'
      strategy="afterInteractive"
      onLoad={() => {onLoad}}
      onError={() => console.log("❌ Kakao SDK 로드 실패")}
    />
  );
}
