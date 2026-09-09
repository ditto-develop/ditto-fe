"use client";

import { useEffect, useState } from "react";

import { getKeyboardInset } from "@/shared/lib/keyboardViewport";

/**
 * 키보드가 화면 하단을 가린 높이(px)를 따라간다.
 *
 * 스크롤 콘텐츠 하단에 이 값만큼 여백을 주면 마지막 항목도 키보드 위로 끌어올릴 수
 * 있다. 여백이 없으면 스크롤이 끝에 닿아 아무리 스크롤해도 가려진 채로 남는다.
 *
 * 네이티브가 웹뷰 프레임을 줄이는 환경(Capacitor iOS 기본)에서는 항상 0 이다.
 *
 * @param enabled 입력 중일 때만 켠다. 꺼지면 0 으로 되돌아간다.
 */
export function useKeyboardInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setInset(0);
      return;
    }

    const update = () => setInset(getKeyboardInset());
    update();

    const viewport = window.visualViewport;
    // iOS 는 키보드가 열리는 동안 resize 와 scroll 을 번갈아 낸다. 둘 다 듣는다.
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled]);

  return inset;
}
