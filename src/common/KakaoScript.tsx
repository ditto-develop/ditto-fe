/** 카카오톡 SDK init
 * 문제 : 주소로 호출하면 CORS에 걸리는지 Safari 환경에서는 적용되지 않음.
 * 해결 : 정적 파일로 업로드해서 활용
 */
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
