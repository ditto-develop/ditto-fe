import { describe, expect, it } from "vitest";

import { containsForbiddenWord } from "@/features/chat/lib/chatSafety";

describe("containsForbiddenWord", () => {
  it.each([
    "2026년 3월에 만나요",
    "어제 자지 못했어요",
    "하루 세끼 챙겨 먹어요",
    "그 영화 보지 못했어요",
  ])("does not block ordinary sentence: %s", (content) => {
    expect(containsForbiddenWord(content)).toBe(false);
  });

  it.each(["시발", "시 발"])("blocks profanity and whitespace bypass: %s", (content) => {
    expect(containsForbiddenWord(content)).toBe(true);
  });
});
