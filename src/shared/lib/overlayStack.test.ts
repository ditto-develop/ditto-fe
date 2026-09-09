import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as OverlayStack from "@/shared/lib/overlayStack";

/**
 * 열린 오버레이 등록소.
 *
 * Android 뒤로가기가 이걸 보고 "모달만 닫을지 / 화면을 떠날지"를 정하므로, 중첩
 * 오버레이에서 **맨 위 하나만** 닫히는지가 핵심이다. 여기가 틀리면 안쪽 시트를
 * 닫으려던 뒤로가기가 바깥 모달까지 닫는다.
 */

let registerOverlay: typeof OverlayStack.registerOverlay;
let unregisterOverlay: typeof OverlayStack.unregisterOverlay;
let closeTopOverlay: typeof OverlayStack.closeTopOverlay;
let hasOpenOverlay: typeof OverlayStack.hasOpenOverlay;

beforeEach(async () => {
  // 등록소는 모듈 상태다. 초기화하지 않으면 앞 테스트가 남긴 오버레이가 따라온다.
  vi.resetModules();
  ({ registerOverlay, unregisterOverlay, closeTopOverlay, hasOpenOverlay } = await import(
    "@/shared/lib/overlayStack"
  ));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("closeTopOverlay", () => {
  it("열린 오버레이가 없으면 false 를 돌려준다 — 호출부가 원래 뒤로가기를 진행한다", () => {
    expect(hasOpenOverlay()).toBe(false);
    expect(closeTopOverlay()).toBe(false);
  });

  it("맨 위 하나만 닫는다", () => {
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    registerOverlay(closeOuter);
    registerOverlay(closeInner);

    expect(closeTopOverlay()).toBe(true);

    expect(closeInner).toHaveBeenCalledTimes(1);
    expect(closeOuter).not.toHaveBeenCalled();
  });

  it("닫힌 오버레이가 목록에서 빠지면 다음 뒤로가기가 그 아래를 닫는다", () => {
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    registerOverlay(closeOuter);
    const inner = registerOverlay(closeInner);

    closeTopOverlay();
    unregisterOverlay(inner); // 언마운트

    expect(closeTopOverlay()).toBe(true);
    expect(closeOuter).toHaveBeenCalledTimes(1);
  });

  it("닫는 즉시 목록에서 빼지 않는다 — 닫힘 애니메이션 중 연타가 아래를 닫으면 안 된다", () => {
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    registerOverlay(closeOuter);
    registerOverlay(closeInner);

    closeTopOverlay();
    closeTopOverlay();

    expect(closeInner).toHaveBeenCalledTimes(2);
    expect(closeOuter).not.toHaveBeenCalled();
  });

  it("버튼으로 닫힌(등록 해제된) 오버레이는 뒤로가기 대상이 아니다", () => {
    const close = vi.fn();
    const handle = registerOverlay(close);

    unregisterOverlay(handle);

    expect(hasOpenOverlay()).toBe(false);
    expect(closeTopOverlay()).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });
});
