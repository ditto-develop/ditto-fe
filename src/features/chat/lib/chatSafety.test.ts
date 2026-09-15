import { describe, expect, it } from "vitest";

import {
  containsForbiddenWord,
  containsMoneyRequest,
  containsRiskyLink,
} from "@/features/chat/lib/chatSafety";

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

/**
 * 1:1 방에만 있던 주의 카드를 그룹 방과 함께 쓰려고 패턴을 이 모듈로 옮겼다.
 * **전송은 막지 않는다** — 정상 대화가 같은 낱말을 훨씬 많이 쓴다.
 */
describe("containsRiskyLink", () => {
  it("스킴이 없는 링크도 잡는다 — 피싱 링크는 대개 http를 떼고 붙여 넣는다", () => {
    expect(containsRiskyLink("여기 봐 bit-ly.com/abc")).toBe(true);
    expect(containsRiskyLink("https://example.org")).toBe(true);
    expect(containsRiskyLink("www.naver.com")).toBe(true);
  });

  it("평범한 문장은 잡지 않는다", () => {
    expect(containsRiskyLink("내일 저녁 7시에 만나요")).toBe(false);
  });
});

describe("containsMoneyRequest", () => {
  it("계좌번호 모양을 잡는다", () => {
    expect(containsMoneyRequest("110-123-456789 로 부탁해")).toBe(true);
  });

  it("계좌번호 없이 말로만 요구해도 잡는다 — 이쪽이 더 흔하다", () => {
    expect(containsMoneyRequest("먼저 입금해 주세요")).toBe(true);
    expect(containsMoneyRequest("수수료가 있어요")).toBe(true);
  });

  it("평범한 문장은 잡지 않는다", () => {
    expect(containsMoneyRequest("내일 뭐 해요?")).toBe(false);
  });
});
