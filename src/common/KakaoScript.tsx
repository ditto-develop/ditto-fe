'use client';

import Script from 'next/script';

declare global {
  interface Window {
    Kakao: Record<string, unknown>;
  }
}

function KakaoScript() {
  const onLoad = () => {
    if (window.Kakao && typeof window.Kakao.init === 'function') {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY as string);
    }
  };

  return (
    <Script
      src="https://developers.kakao.com/sdk/js/kakao.js"
      async
      onLoad={onLoad}
    />
  );
}

export default KakaoScript;
