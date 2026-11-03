"use client";

import { useCallback, useRef } from "react";

import { useToast } from "@/context/ToastContext";
import {
  INITIAL_TAP_STATE,
  SECRET_TAP_COUNT,
  nextTapState,
  readTesterMode,
  setTesterMode,
} from "@/shared/lib/featureFlags";

/**
 * 로고를 7번 연달아 누르면 테스터 모드를 켜고 끄는 클릭 핸들러(featureFlags.ts).
 * 켜고 끌 때마다 토스트로 알린다 — 숨은 동작이라 알려 주지 않으면 눌렸는지 알 수 없다.
 */
export function useTesterModeTap(): () => void {
  const { showToast } = useToast();
  const tapsRef = useRef(INITIAL_TAP_STATE);

  return useCallback(() => {
    const next = nextTapState(tapsRef.current, Date.now());
    if (next.count < SECRET_TAP_COUNT) {
      tapsRef.current = next;
      return;
    }
    tapsRef.current = INITIAL_TAP_STATE;
    const on = !readTesterMode();
    setTesterMode(on);
    showToast(on ? "테스터 모드를 켰어요." : "테스터 모드를 껐어요.", "default");
  }, [showToast]);
}
