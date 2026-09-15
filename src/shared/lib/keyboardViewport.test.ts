import { describe, expect, it } from "vitest";

import { computeScrollDelta, expectedVisibleViewport } from "@/shared/lib/keyboardViewport";

// 키보드가 하단 300px 을 덮은, 높이 800px 화면.
const VIEWPORT = { top: 0, height: 500 };
const MARGIN = 16;

describe("computeScrollDelta", () => {
  it("가시 영역 안에 있으면 스크롤하지 않는다", () => {
    expect(computeScrollDelta({ top: 100, bottom: 200 }, VIEWPORT, MARGIN)).toBe(0);
  });

  it("키보드에 가린 요소는 그만큼 위로 끌어올린다", () => {
    // bottom 600 > 가시 하단 484 → 116px 만큼 스크롤을 내린다.
    expect(computeScrollDelta({ top: 500, bottom: 600 }, VIEWPORT, MARGIN)).toBe(116);
  });

  it("끌어올리다 위가 잘리지는 않게 위쪽 여유분까지만 올린다", () => {
    // 위쪽 여유는 30 - 16 = 14px 뿐이라 아래가 잘려도 14px 만 올린다.
    expect(computeScrollDelta({ top: 30, bottom: 600 }, VIEWPORT, MARGIN)).toBe(14);
  });

  it("요소가 가시 영역보다 크면 움직이지 않는다", () => {
    expect(computeScrollDelta({ top: 0, bottom: 900 }, VIEWPORT, MARGIN)).toBe(0);
  });

  it("위로 잘린 요소는 아래로 내린다", () => {
    expect(computeScrollDelta({ top: -40, bottom: 60 }, VIEWPORT, MARGIN)).toBe(-56);
  });

  it("visualViewport 가 밀려 있으면(offsetTop) 그 기준으로 계산한다", () => {
    // 화면이 100px 밀려 올라간 상태: 가시 영역은 100 ~ 600.
    expect(
      computeScrollDelta({ top: 500, bottom: 620 }, { top: 100, height: 500 }, MARGIN),
    ).toBe(36);
  });
});

/**
 * 누른 순간에는 키보드가 아직 없어 실측 가시 영역이 화면 전체다.
 * 그대로 목표를 계산하면 "가릴 것이 없다"가 되어 화면이 움직이지 않고, 키보드가 다
 * 올라온 뒤에야 뒤따라 움직인다 — 두 박자로 끊겨 보이던 원인이다.
 */
describe("expectedVisibleViewport", () => {
  const FULL = { top: 0, height: 800 };

  it("아직 안 올라온 키보드가 가릴 높이를 미리 뺀다", () => {
    expect(expectedVisibleViewport(300, FULL, 0)).toEqual({ top: 0, height: 500 });
  });

  it("이미 올라와 있으면 실측이 답이다(두 번 빼지 않는다)", () => {
    const measured = { top: 0, height: 500 };
    expect(expectedVisibleViewport(300, measured, 300)).toEqual(measured);
  });

  it("잰 적이 없으면(0) 지금 보이는 영역 그대로다 — 넘겨짚지 않는다", () => {
    expect(expectedVisibleViewport(0, FULL, 0)).toEqual(FULL);
  });

  it("예상이 화면보다 커도 음수 높이를 내지 않는다", () => {
    expect(expectedVisibleViewport(900, FULL, 0)).toEqual({ top: 0, height: 0 });
  });
});
