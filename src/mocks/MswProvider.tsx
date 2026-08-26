"use client";

import { Splash } from "@/components/splash/Splash";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type MswProviderProps = {
  children: ReactNode;
};

function isCypressRuntime(): boolean {
  return typeof window !== "undefined" && "Cypress" in window;
}

const isMockingConfigured = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

export function MswProvider({ children }: MswProviderProps) {
  const [mockReady, setMockReady] = useState(!isMockingConfigured);

  useEffect(() => {
    if (!isMockingConfigured) return;

    if (isCypressRuntime()) {
      setMockReady(true);
      return;
    }

    let cancelled = false;

    import("@/mocks/browser")
      .then(({ worker }) =>
        worker.start({
          onUnhandledRequest: "bypass",
        }),
      )
      .catch((err: unknown) => {
        // 목업 기동 실패로 앱 전체가 Splash에 갇히면 안 된다. 실패해도 화면은 띄우고
        // 요청은 실제 백엔드로 나가게 둔다.
        // 대표 사례: secure context가 아닌 곳(폰에서 http://192.168.x.x:3000 같은 LAN 주소)에서는
        // navigator.serviceWorker가 없어 worker.start()가 거부된다 — 데스크톱 localhost만 무사하다.
        console.error("[msw] 목업 워커를 시작하지 못했습니다. 실제 API로 요청합니다:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setMockReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!mockReady) {
    return <Splash />;
  }

  return children;
}
