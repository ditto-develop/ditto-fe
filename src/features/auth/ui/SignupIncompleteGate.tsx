"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SIGNUP_INCOMPLETE_EVENT } from "@/shared/lib/api/apiError";

/**
 * 회원가입 미완료(3001)는 특정 화면이 아니라 세션 전체에 걸린다 — 로그인 응답이
 * signupRequired:false로 홈에 보내도 이후 보호 API가 전부 이 코드로 막혀, 홈이 카드
 * 없이 빈 화면으로 보이는 원인이었다(2026-09-08). SanctionGate와 같은 구조로,
 * API 레이어가 쏘는 전역 이벤트를 받아 회원가입 화면으로 보낸다.
 */
export function SignupIncompleteGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handle = () => {
      // 회원가입 화면 자체에서는 무한 이동하지 않도록 막는다.
      if (pathname?.startsWith("/auth/callback")) return;
      router.replace("/auth/callback?signupRequired=true");
    };

    window.addEventListener(SIGNUP_INCOMPLETE_EVENT, handle);
    return () => window.removeEventListener(SIGNUP_INCOMPLETE_EVENT, handle);
  }, [pathname, router]);

  return null;
}
