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
      .then(() => {
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
