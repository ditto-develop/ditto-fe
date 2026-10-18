import { describe, expect, it } from "vitest";

import {
  LAUNCH_NOTIFICATION_EMAIL_MAX_LENGTH,
  isValidEmail,
} from "@/features/download/model/launchNotification";

describe("isValidEmail", () => {
  it("일반적인 이메일은 통과한다", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail(" user.name+tag@sub.example.co.kr ")).toBe(true);
  });

  it("형식이 틀리거나 비면 막는다", () => {
    for (const value of ["", "   ", "user", "user@", "@example.com", "user@example", "us er@example.com"]) {
      expect(isValidEmail(value), value).toBe(false);
    }
  });

  it("254자를 넘으면 막는다", () => {
    const local = "a".repeat(LAUNCH_NOTIFICATION_EMAIL_MAX_LENGTH);
    expect(isValidEmail(`${local}@example.com`)).toBe(false);
  });
});
