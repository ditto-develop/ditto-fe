import { describe, expect, it } from "vitest";

import {
  createKeyboardResizeCoordinator,
  normalizeKeyboardInset,
} from "@/features/chat/hooks/useChatKeyboardInset";

describe("normalizeKeyboardInset", () => {
  it("반올림한 양수 키보드 높이를 반환한다", () => {
    expect(normalizeKeyboardInset(312.6)).toBe(313);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, "312", null])(
    "유효하지 않은 높이 %s는 0으로 만든다",
    (value) => {
      expect(normalizeKeyboardInset(value)).toBe(0);
    },
  );
});

describe("createKeyboardResizeCoordinator", () => {
  it("키보드가 열린 채 화면을 나가면 닫힘 이벤트까지 native 복원을 미룬다", () => {
    const events = new EventTarget();
    const modes: string[] = [];
    const owner = Symbol("room-a");
    const coordinator = createKeyboardResizeCoordinator({
      eventTarget: events,
      setOverlayResize: () => modes.push("overlay"),
      setNativeResize: () => modes.push("native"),
    });

    coordinator.claim(owner);
    coordinator.show(owner, 300);
    coordinator.release(owner);

    expect(modes).toEqual(["overlay"]);

    events.dispatchEvent(new Event("keyboardWillHide"));

    expect(modes).toEqual(["overlay", "native"]);
    expect(coordinator.getInset()).toBe(0);
  });

  it("다음 채팅 화면이 먼저 열리면 이전 화면의 native 복원 예약을 취소한다", () => {
    const events = new EventTarget();
    const modes: string[] = [];
    const previousRoom = Symbol("room-a");
    const nextRoom = Symbol("room-b");
    const coordinator = createKeyboardResizeCoordinator({
      eventTarget: events,
      setOverlayResize: () => modes.push("overlay"),
      setNativeResize: () => modes.push("native"),
    });

    coordinator.show(previousRoom, 300);
    coordinator.release(previousRoom);
    coordinator.claim(nextRoom);
    events.dispatchEvent(new Event("keyboardWillHide"));

    expect(modes).toEqual(["overlay"]);
    expect(coordinator.getInset()).toBe(300);

    coordinator.hide(nextRoom);

    expect(modes).toEqual(["overlay", "native"]);
    expect(coordinator.getInset()).toBe(0);
  });
});
