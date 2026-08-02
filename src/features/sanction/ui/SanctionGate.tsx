"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SANCTION_EVENT } from "@/shared/lib/api/apiError";

/**
 * 제재(6006/6007)는 특정 화면이 아니라 세션 전체에 걸린다.
 * API 레이어가 쏘는 전역 이벤트를 받아 제재 안내 화면으로 보낸다.
 * 렌더링은 하지 않고 리스너만 붙인다.
 */
export function SanctionGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handle = () => {
      // 제재 화면 자체에서 부르는 내 제재 조회로 무한 이동하지 않도록 막는다.
      if (pathname?.startsWith("/sanction")) return;
      router.replace("/sanction");
    };

    window.addEventListener(SANCTION_EVENT, handle);
    return () => window.removeEventListener(SANCTION_EVENT, handle);
  }, [pathname, router]);

  return null;
}
