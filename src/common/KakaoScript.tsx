"use client";

import Script from "next/script";
import { useEffect } from "react";

export default function KakaoScript() {
  const onLoad = () => {
      if (typeof window !== "undefined" && window.Kakao) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
      }
  };
  useEffect(() => {
    if (typeof window !== "undefined" && window.Kakao) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
    }
  }, []);


  
  return (
    <Script
      src="https://developers.kakao.com/sdk/js/kakao.js"
      async
      onLoad={onLoad}
    />
  );
}