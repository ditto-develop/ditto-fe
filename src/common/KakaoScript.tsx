"use client";
import Script from "next/script";

let kakaoInitialized = false;

export default function KakaoScript() {
  const onLoadKakao = () => {
    if (typeof window !== "undefined" && window.Kakao && !kakaoInitialized) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
      kakaoInitialized = true;
      console.log("Kakao SDK initialized");
    }
  };

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
