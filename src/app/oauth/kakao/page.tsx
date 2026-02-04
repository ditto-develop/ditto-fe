"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Body1Normal } from "@/components/common/Text";
import styled from "styled-components";
import Tutorial from "@/components/onboarding/Tutorial"; // 경로 확인 필요

const LoadingContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
`;

function KakaoLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [kakaoData, setKakaoData] = useState<any>(null);
  const isFetched = useRef(false);

  useEffect(() => {
    if (!code) return; 
    if (isFetched.current) return;
    
    isFetched.current = true; // 중복 호출 방지

    const fetchKakaoUser = async () => {
      try {
        const res = await fetch("/api/kakao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          console.log("카카오 로그인 데이터 수신 성공:", data);
          // 성공 시 kakaoData State 업데이트 -> 아래 return문에서 Tutorial 렌더링됨
          setKakaoData(data);
        } else {
          console.error("카카오 로그인 실패:", data);
          alert(`로그인 실패: ${data.error || "알 수 없는 오류"}`);
          router.push("/"); // 실패 시 홈으로
        }
      } catch (err) {
        console.error("Fetch 에러:", err);
        alert("네트워크 오류가 발생했습니다.");
        router.push("/");
      }
    };

    fetchKakaoUser();
  }, [code, router]);

  // ✅ 데이터가 로드되면 Tutorial을 렌더링 (initialData 전달)
  // Tutorial 컴포넌트는 initialData를 받으면 Step 1부터 시작하도록 수정되었습니다.
  if (kakaoData) {
    return <Tutorial initialData={kakaoData} />;
  }

  return (
    <LoadingContainer>
      <Body1Normal>카카오 로그인 처리 중입니다...</Body1Normal>
    </LoadingContainer>
  );
}

export default function KakaoRedirectPage() {
  return (
    <Suspense 
      fallback={
        <LoadingContainer>
          <Body1Normal>페이지 로딩 중...</Body1Normal>
        </LoadingContainer>
      }
    >
      <KakaoLoginContent />
    </Suspense>
  );
}