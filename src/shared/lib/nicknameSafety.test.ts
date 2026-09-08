import { describe, expect, it } from "vitest";

import { containsForbiddenNicknameWord } from "@/shared/lib/nicknameSafety";

describe("containsForbiddenNicknameWord", () => {
  it("정상 닉네임은 통과한다", () => {
    expect(containsForbiddenNicknameWord("정상닉네임")).toBe(false);
    expect(containsForbiddenNicknameWord("홍길동")).toBe(false);
    expect(containsForbiddenNicknameWord("펭수")).toBe(false);
  });

  it("금지어를 그대로 포함하면 막는다", () => {
    expect(containsForbiddenNicknameWord("시발놈")).toBe(true);
    expect(containsForbiddenNicknameWord("디토운영자")).toBe(true);
    expect(containsForbiddenNicknameWord("admin")).toBe(true);
  });

  it("특수문자/공백 삽입 우회를 막는다", () => {
    expect(containsForbiddenNicknameWord("시!발")).toBe(true);
    expect(containsForbiddenNicknameWord("시 발")).toBe(true);
  });

  it("자모 분리 우회를 막는다", () => {
    expect(containsForbiddenNicknameWord("ㅅㅣㅂㅏㄹ")).toBe(true);
  });

  it("숫자-문자 치환 우회를 막는다", () => {
    expect(containsForbiddenNicknameWord("4dmin")).toBe(true);
    expect(containsForbiddenNicknameWord("관리자1")).toBe(true);
  });

  it("음절 경계에서 우연히 생기는 2자모 축약 오탐은 막지 않는다", () => {
    expect(containsForbiddenNicknameWord("고양이집사")).toBe(false);
    expect(containsForbiddenNicknameWord("밥솥")).toBe(false);
  });

  it("실제로 타이핑한 2자모 축약 금지어는 막는다", () => {
    expect(containsForbiddenNicknameWord("안녕ㅅㅂ")).toBe(true);
  });
});
