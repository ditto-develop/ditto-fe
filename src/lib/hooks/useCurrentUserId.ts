"use client";

import { useMemo } from "react";

function parseJwtSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

export function useCurrentUserId(): string | null {
  return useMemo(() => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    return parseJwtSub(token);
  }, []);
}
