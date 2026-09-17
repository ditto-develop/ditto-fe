import { describe, expect, it } from "vitest";

import { normalizeKeyboardInset } from "@/features/chat/hooks/useChatKeyboardInset";

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
