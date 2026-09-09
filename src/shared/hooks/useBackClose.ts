"use client";

import { useEffect, useRef } from "react";

import { registerOverlay, unregisterOverlay } from "@/shared/lib/overlayStack";

/**
 * 열려 있는 동안 OS 뒤로가기를 화면 이탈이 아니라 "닫기"로 소비한다.
 *
 * 오버레이를 직접 그리는 컴포넌트(공용 `AlertModal` / `BottomSheet` /
 * `FullScreenModal` 과 자체 오버레이를 가진 모달들)에서 부른다. 중첩된 오버레이는
 * 맨 위 하나만 닫힌다.
 *
 * 적용 범위와 한계(특히 iOS 스와이프 백)는 `@/shared/lib/overlayStack` 주석을 볼 것.
 *
 * @param enabled 오버레이가 실제로 화면에 떠 있는 동안만 true.
 * @param onClose 뒤로가기로 닫을 때 부를 핸들러. 렌더마다 새로 만들어져도 된다 —
 *   ref 로만 참조하므로 등록을 다시 하지 않는다.
 */
export function useBackClose(enabled: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);

  // 렌더 중에 ref 를 쓰면 react-hooks/refs 에 걸린다. 매 렌더 뒤에 갱신한다 —
  // 아래 effect 보다 먼저 선언돼 있어 뒤로가기 핸들러는 항상 최신 onClose 를 본다.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!enabled) return;

    const handle = registerOverlay(() => onCloseRef.current());
    return () => unregisterOverlay(handle);
  }, [enabled]);
}
