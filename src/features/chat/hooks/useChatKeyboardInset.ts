"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";

import { getNativePlatform } from "@/shared/lib/native/platform";

/** iOS 키보드의 기본 전환 시간과 맞춘 채팅 레이아웃 애니메이션 시간. */
export const CHAT_KEYBOARD_ANIMATION_MS = 260;

type NativeKeyboardEvent = Event & { keyboardHeight?: number };

/** 네이티브 이벤트에 잘못된 값이 들어와도 채팅방 높이가 뒤집히지 않게 정규화한다. */
export function normalizeKeyboardInset(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;
}

/**
 * iOS 키보드가 올라오기 시작하는 순간 높이를 받아 채팅방에 전달한다.
 *
 * Capacitor 8의 native resize는 키보드 애니메이션이 끝난 뒤 WebView 프레임을 줄여서
 * 입력창이 한 박자 늦게 따라온다. 채팅방에서는 그 리사이즈만 잠시 끄고, 플러그인이
 * 동시에 발생시키는 window 이벤트로 키보드와 레이아웃을 함께 움직인다.
 * 일반 웹에서는 해당 이벤트가 없어 항상 0이며 기존 레이아웃을 그대로 쓴다.
 */
export function useChatKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  const ownsResizeMode = useRef(false);

  useEffect(() => {
    const platform = getNativePlatform();
    const isIos = platform === "ios";
    // Android는 WebView의 adjustResize가 별도로 동작하므로 inset을 다시 빼면 이중 보정된다.
    const managesKeyboardInset = platform !== "android";

    const enableOverlayResize = () => {
      if (!isIos || ownsResizeMode.current) return;
      ownsResizeMode.current = true;
      void Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {});
    };

    const restoreNativeResize = () => {
      if (!isIos || !ownsResizeMode.current) return;
      ownsResizeMode.current = false;
      void Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});
    };

    const isComposer = (target: EventTarget | null) =>
      target instanceof Element && target.closest("[data-chat-composer]") !== null;

    const handleComposerInteraction = (event: Event) => {
      if (isComposer(event.target)) enableOverlayResize();
    };

    const handleShow = (event: Event) => {
      if (!managesKeyboardInset) return;
      setInset(normalizeKeyboardInset((event as NativeKeyboardEvent).keyboardHeight));
    };
    const handleHide = () => {
      if (!managesKeyboardInset) return;
      setInset(0);
      restoreNativeResize();
    };

    // touchstart/pointerdown은 focus보다 먼저 와서 네이티브 모드를 키보드 알림 전에 바꾼다.
    document.addEventListener("touchstart", handleComposerInteraction, true);
    document.addEventListener("pointerdown", handleComposerInteraction, true);
    document.addEventListener("focusin", handleComposerInteraction, true);
    window.addEventListener("keyboardWillShow", handleShow);
    window.addEventListener("keyboardDidShow", handleShow);
    window.addEventListener("keyboardWillHide", handleHide);
    window.addEventListener("keyboardDidHide", handleHide);

    return () => {
      document.removeEventListener("touchstart", handleComposerInteraction, true);
      document.removeEventListener("pointerdown", handleComposerInteraction, true);
      document.removeEventListener("focusin", handleComposerInteraction, true);
      window.removeEventListener("keyboardWillShow", handleShow);
      window.removeEventListener("keyboardDidShow", handleShow);
      window.removeEventListener("keyboardWillHide", handleHide);
      window.removeEventListener("keyboardDidHide", handleHide);
      restoreNativeResize();
    };
  }, []);

  return inset;
}
