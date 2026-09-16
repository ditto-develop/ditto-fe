"use client";

import { Keyboard } from "@capacitor/keyboard";
import type { PluginListenerHandle } from "@capacitor/core";
import { useEffect, useState } from "react";

import { isNativeApp } from "@/shared/lib/native/platform";
import {
  getExpectedKeyboardInset,
  getKeyboardInset,
  rememberKeyboardInset,
} from "@/shared/lib/keyboardViewport";

/**
 * 키보드가 다 올라왔다고 볼 시점(ms).
 * iOS 애니메이션이 약 0.25초, 안드로이드가 그보다 조금 길다. 넉넉히 잡되 사용자가
 * 다음 동작을 하기 전에는 끝나야 해서 이 정도다.
 */
const SETTLE_MS = 700;

/**
 * 키보드가 화면 하단을 가린 높이(px)를 따라간다.
 *
 * 스크롤 콘텐츠 하단에 이 값만큼 여백을 주면 마지막 항목도 키보드 위로 끌어올릴 수
 * 있다. 여백이 없으면 스크롤이 끝에 닿아 아무리 스크롤해도 가려진 채로 남는다.
 *
 * **누른 순간부터** 값을 낸다. 키보드가 실제로 올라오길 기다렸다가 여백을 만들면,
 * 그때서야 스크롤할 자리가 생겨 화면이 키보드보다 한 박자 늦게 따라 움직인다.
 * 지난번에 잰 높이(`getExpectedKeyboardInset`)로 미리 자리를 만들어 두면 둘이 같이
 * 움직인다. 잰 적이 없으면 0 이라 예전과 똑같이 동작하고, 이번에 잰 값이 다음부터 쓰인다.
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

    /*
     * 네이티브 앱에서는 키보드 플러그인이 **정확한 높이를 애니메이션 시작과 함께** 준다.
     * visualViewport 로 재면 값이 여러 번(0 → 120 → 336…) 들어오고 마지막에 한 번 더
     * 보정하느라 화면이 두 번 움직여 번쩍인다. 이벤트는 한 번에 끝나므로 그쪽을 쓴다.
     */
    if (isNativeApp()) {
      const handles: PluginListenerHandle[] = [];
      let cancelled = false;

      void Keyboard.addListener("keyboardWillShow", (info) => {
        setInset(info.keyboardHeight);
        // 다음 번 웹 폴백이 쓸 수 있도록 실측을 남긴다.
        rememberKeyboardInset(info.keyboardHeight);
      }).then((handle) => {
        if (cancelled) void handle.remove();
        else handles.push(handle);
      });

      void Keyboard.addListener("keyboardWillHide", () => setInset(0)).then((handle) => {
        if (cancelled) void handle.remove();
        else handles.push(handle);
      });

      return () => {
        cancelled = true;
        handles.forEach((handle) => void handle.remove());
      };
    }

    /*
     * 키보드가 올라오는 동안은 예상치를 바닥값으로 깐다.
     * 실측은 애니메이션 중간값(0 → 120 → 336…)으로 들어오는데 그대로 반영하면 여백이
     * 늘었다 줄었다 하며 화면이 떨린다. 다 올라온 뒤에는 실측만 믿는다.
     */
    let floor = getExpectedKeyboardInset();
    setInset(floor);

    const update = () => setInset(Math.max(getKeyboardInset(), floor));

    const settle = window.setTimeout(() => {
      floor = 0;
      const settled = getKeyboardInset();
      // 0 도 기억한다 — 이 환경은 키보드가 뷰포트를 가리지 않는다는 뜻이다.
      rememberKeyboardInset(settled);
      setInset(settled);
    }, SETTLE_MS);

    const viewport = window.visualViewport;
    // iOS 는 키보드가 열리는 동안 resize 와 scroll 을 번갈아 낸다. 둘 다 듣는다.
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      window.clearTimeout(settle);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled]);

  return inset;
}
