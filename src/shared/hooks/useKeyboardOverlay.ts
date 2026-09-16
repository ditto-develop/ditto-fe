"use client";

import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { useEffect } from "react";

import { isNativeApp } from "@/shared/lib/native/platform";

/**
 * 이 화면이 떠 있는 동안 **네이티브가 웹뷰 프레임을 건드리지 않게** 한다.
 *
 * 기본값(`native`)은 키보드가 뜰 때 프레임을 줄인다. 그러면 `100dvh` 가 뒤늦게 다시
 * 계산되며 레이아웃이 한 박자 늦게 접혀 화면이 번쩍인다 — 목록이 바닥에 붙어 있는
 * 채팅방에서 특히 눈에 띈다(2026-09-17 QA).
 *
 * 끄고 나면 키보드 높이를 `useKeyboardInset` 이 받아 CSS 로 한 번에 접는다.
 * 움직이는 주체가 하나라 어긋날 일이 없다.
 *
 * **전역으로 끄지 않는다.** 다른 화면들은 네이티브가 프레임을 줄여 주는 전제로 만들어져
 * 있어, 전역으로 바꾸면 입력이 있는 모든 화면을 다시 봐야 한다. 이 훅을 쓴 화면에서만
 * 끄고 떠날 때 되돌린다.
 */
export function useKeyboardOverlay(): void {
  useEffect(() => {
    if (!isNativeApp()) return;

    void Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {});

    return () => {
      // 기본값으로 되돌린다. 실패해도 다음 화면이 알아서 자기 모드를 건다.
      void Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});
    };
  }, []);
}
