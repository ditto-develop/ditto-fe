import { describe, expect, it } from "vitest";

import { isPinnedToBottom } from "@/features/chat/hooks/useStayAtBottom";

/**
 * 키보드가 닫히면 목록의 clientHeight 만 커지고 scrollTop 은 그대로라 마지막 메시지가
 * 화면 밖으로 밀린다. 다시 붙이려면 "밀려나기 전에 바닥에 있었는지"를 알아야 하는데,
 * 위로 올려 과거를 읽는 중이라면 끌어내리면 안 된다.
 */
describe("isPinnedToBottom", () => {
  it("바닥에 정확히 붙어 있으면 true", () => {
    expect(isPinnedToBottom({ scrollHeight: 1000, scrollTop: 600, clientHeight: 400 })).toBe(true);
  });

  it("몇 px 모자라도 붙은 것으로 본다 — 스무스 스크롤이 소수점을 남긴다", () => {
    expect(isPinnedToBottom({ scrollHeight: 1000, scrollTop: 590, clientHeight: 400 })).toBe(true);
  });

  it("위로 올려 과거를 읽는 중이면 false — 읽던 자리를 뺏지 않는다", () => {
    expect(isPinnedToBottom({ scrollHeight: 1000, scrollTop: 100, clientHeight: 400 })).toBe(false);
  });

  it("스크롤이 없는 짧은 목록은 항상 붙은 것으로 본다", () => {
    expect(isPinnedToBottom({ scrollHeight: 300, scrollTop: 0, clientHeight: 300 })).toBe(true);
  });
});
