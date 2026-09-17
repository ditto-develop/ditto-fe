"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";

import { getNativePlatform } from "@/shared/lib/native/platform";

/** iOS 키보드의 기본 전환 시간과 맞춘 채팅 레이아웃 애니메이션 시간. */
export const CHAT_KEYBOARD_ANIMATION_MS = 260;

type NativeKeyboardEvent = Event & { keyboardHeight?: number };

interface KeyboardResizeCoordinatorOptions {
  eventTarget: EventTarget;
  setOverlayResize: () => void;
  setNativeResize: () => void;
}

interface KeyboardResizeCoordinator {
  getInset: () => number;
  claim: (owner: symbol) => void;
  show: (owner: symbol, inset: number) => void;
  hide: (owner: symbol) => void;
  release: (owner: symbol) => void;
}

/** 네이티브 이벤트에 잘못된 값이 들어와도 채팅방 높이가 뒤집히지 않게 정규화한다. */
export function normalizeKeyboardInset(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;
}

/**
 * 채팅 화면 사이에서 iOS 키보드 리사이즈 모드의 소유권을 넘긴다.
 *
 * 키보드가 열린 채 화면이 사라질 때 Native 모드를 즉시 복원하면, 플러그인에 예약되어
 * 있던 WebView 축소와 다음 화면의 CSS inset이 함께 적용된다. 키보드가 닫힐 때까지
 * 복원을 미루되 다음 채팅 화면이 먼저 열리면 예약을 취소하고 overlay 모드를 이어 쓴다.
 */
export function createKeyboardResizeCoordinator({
  eventTarget,
  setOverlayResize,
  setNativeResize,
}: KeyboardResizeCoordinatorOptions): KeyboardResizeCoordinator {
  let inset = 0;
  let keyboardVisible = false;
  let owner: symbol | null = null;
  let overlayResizeEnabled = false;
  let cancelDeferredRestore: (() => void) | null = null;

  const cancelRestore = () => {
    cancelDeferredRestore?.();
    cancelDeferredRestore = null;
  };

  const restoreNativeResize = () => {
    cancelRestore();
    if (!overlayResizeEnabled) return;
    overlayResizeEnabled = false;
    setNativeResize();
  };

  const restoreWhenKeyboardHides = () => {
    cancelRestore();

    const handleHide = () => {
      inset = 0;
      keyboardVisible = false;
      if (owner === null) restoreNativeResize();
    };

    eventTarget.addEventListener("keyboardWillHide", handleHide, { once: true });
    eventTarget.addEventListener("keyboardDidHide", handleHide, { once: true });
    cancelDeferredRestore = () => {
      eventTarget.removeEventListener("keyboardWillHide", handleHide);
      eventTarget.removeEventListener("keyboardDidHide", handleHide);
    };
  };

  const claim = (nextOwner: symbol) => {
    cancelRestore();
    owner = nextOwner;
    if (overlayResizeEnabled) return;
    overlayResizeEnabled = true;
    setOverlayResize();
  };

  const release = (currentOwner: symbol) => {
    if (owner !== currentOwner) return;
    owner = null;
    if (keyboardVisible) restoreWhenKeyboardHides();
    else restoreNativeResize();
  };

  return {
    getInset: () => inset,
    claim,
    show: (currentOwner, nextInset) => {
      inset = nextInset;
      keyboardVisible = true;
      claim(currentOwner);
    },
    hide: (currentOwner) => {
      inset = 0;
      keyboardVisible = false;
      release(currentOwner);
    },
    release,
  };
}

let iosResizeCoordinator: KeyboardResizeCoordinator | null = null;

function getIosResizeCoordinator(): KeyboardResizeCoordinator {
  if (iosResizeCoordinator) return iosResizeCoordinator;

  iosResizeCoordinator = createKeyboardResizeCoordinator({
    eventTarget: window,
    setOverlayResize: () => {
      void Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {});
    },
    setNativeResize: () => {
      void Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});
    },
  });
  return iosResizeCoordinator;
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
  const owner = useRef(Symbol("chat-keyboard-resize"));
  const [inset, setInset] = useState(() =>
    getNativePlatform() === "ios" ? getIosResizeCoordinator().getInset() : 0,
  );

  useEffect(() => {
    const currentOwner = owner.current;
    const platform = getNativePlatform();
    const isIos = platform === "ios";
    const resizeCoordinator = isIos ? getIosResizeCoordinator() : null;
    // Android는 WebView의 adjustResize가 별도로 동작하므로 inset을 다시 빼면 이중 보정된다.
    const managesKeyboardInset = platform !== "android";

    const enableOverlayResize = () => {
      resizeCoordinator?.claim(currentOwner);
    };

    const isComposer = (target: EventTarget | null) =>
      target instanceof Element && target.closest("[data-chat-composer]") !== null;

    const handleComposerInteraction = (event: Event) => {
      if (isComposer(event.target)) enableOverlayResize();
    };

    const handleShow = (event: Event) => {
      if (!managesKeyboardInset) return;
      const nextInset = normalizeKeyboardInset(
        (event as NativeKeyboardEvent).keyboardHeight,
      );
      resizeCoordinator?.show(currentOwner, nextInset);
      setInset(nextInset);
    };
    const handleHide = () => {
      if (!managesKeyboardInset) return;
      resizeCoordinator?.hide(currentOwner);
      setInset(0);
    };

    // 직전 채팅 화면에서 키보드가 열린 채 넘어왔으면 같은 inset과 overlay 모드를 이어 쓴다.
    if (resizeCoordinator) {
      const currentInset = resizeCoordinator.getInset();
      setInset(currentInset);
      if (currentInset > 0) enableOverlayResize();
    }

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
      resizeCoordinator?.release(currentOwner);
    };
  }, []);

  return inset;
}
