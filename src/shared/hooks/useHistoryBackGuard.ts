"use client";

import { useEffect, useRef } from "react";

/**
 * 히스토리 뒤로가기(popstate)를 이 화면 안의 "뒤로"로 바꾼다.
 *
 * iOS 앱의 가장자리 스와이프는 WKWebView 가 네이티브로 처리하는 뒤로가기라 JS 가 미리 가로챌 수
 * 없다(SceneDelegate.swift · overlayStack 주석). 그대로 두면 가입 화면처럼 화면 안에 단계가 있는
 * 곳에서 스와이프가 단계를 건너뛰고 웹뷰 히스토리의 이전 항목(로그인 전에 보던 화면, 리다이렉트
 * 로그인의 카카오 페이지 등)으로 나가 버린다. 들어올 때 같은 주소의 항목을 하나 더 쌓아 두고,
 * 그 항목이 소비되면(popstate) `onBack` 을 부른다.
 *
 * 화면 단위로만 쓴다. 모달·바텀시트마다 히스토리를 쌓으면 라우팅과 경합한다(overlayStack 주석).
 * 화면을 떠날 때 남는 가드 항목은 같은 주소라, 다시 돌아오면 그 화면이 한 번 더 열린다.
 *
 * @param enabled 가드를 쌓아 둘 동안만 true.
 * @param onBack 뒤로가기를 처리하고, 이 화면에 그대로 남으면 true(가드를 다시 쌓는다),
 *   화면을 떠나면 false 를 돌려준다. 렌더마다 새로 만들어져도 된다 — ref 로만 참조한다.
 */
export function useHistoryBackGuard(enabled: boolean, onBack: () => boolean): void {
  const onBackRef = useRef(onBack);

  // 렌더 중에 ref 를 쓰면 react-hooks/refs 에 걸린다. 매 렌더 뒤에 갱신한다(useBackClose 와 같은 방식).
  useEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    if (!enabled) return;

    // 주소를 넘기지 않는다 — Next 의 history 패치는 주소가 있을 때만 라우터 상태를 다시 맞추고,
    // 없으면 지금 항목의 라우터 상태만 복사해 쌓는다.
    const arm = () => window.history.pushState(null, "");
    arm();

    const onPopState = () => {
      if (onBackRef.current()) arm();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [enabled]);
}
