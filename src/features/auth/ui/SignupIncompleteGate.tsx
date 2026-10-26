"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SIGNUP_INCOMPLETE_EVENT } from "@/shared/lib/api/apiError";
import { normalizePathname } from "@/shared/lib/routePath";

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
      /*
       * 로그인 화면(루트)에서도 보내지 않는다. 루트는 가입 미완료 세션을 로그인 버튼 화면에
       * 그대로 두기로 했다(ClientLayout 의 루트 진입 확인) — 버튼을 누르면 로그인이 새로 시작돼
       * 가입으로 이어진다. 여기서 보내면 가입을 포기하고 나온 사람이 늦게 도착한 3001 하나에
       * 포기한 계정의 가입 화면으로 끌려가 다른 수단(애플)으로 로그인할 수 없다(QA 2026-10-26).
       */
      if (pathname && normalizePathname(pathname) === "/") return;
      router.replace("/auth/callback?signupRequired=true");
    };

    window.addEventListener(SIGNUP_INCOMPLETE_EVENT, handle);
    return () => window.removeEventListener(SIGNUP_INCOMPLETE_EVENT, handle);
  }, [pathname, router]);

  return null;
}
