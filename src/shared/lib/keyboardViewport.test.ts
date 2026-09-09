import { describe, expect, it } from "vitest";

import { computeScrollDelta } from "@/shared/lib/keyboardViewport";

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
