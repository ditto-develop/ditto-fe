import { describe, expect, it } from "vitest";

import { calculateAge, isEligibleAge, toAgeBucket } from "@/shared/lib/age";

const NOW = new Date(2026, 7, 30); // 2026-08-30

describe("calculateAge", () => {
  it("생일이 지났으면 그해 나이", () => {
    expect(calculateAge("2000-08-30", NOW)).toBe(26);
    expect(calculateAge("2000-01-01", NOW)).toBe(26);
  });

  it("생일이 아직이면 한 살 적다", () => {
    expect(calculateAge("2000-08-31", NOW)).toBe(25);
    expect(calculateAge("2000-12-31", NOW)).toBe(25);
  });

  it("형식이 아니거나 없는 날짜면 null", () => {
    expect(calculateAge("", NOW)).toBeNull();
    expect(calculateAge("2000/08/30", NOW)).toBeNull();
    expect(calculateAge("2026-02-31", NOW)).toBeNull();
  });

  it("미래 생년월일은 null", () => {
    expect(calculateAge("2027-01-01", NOW)).toBeNull();
  });
});

describe("isEligibleAge", () => {
  it("만 19세 생일 당일부터 통과한다", () => {
    expect(isEligibleAge("2007-08-30", NOW)).toBe(true);
    expect(isEligibleAge("2007-08-31", NOW)).toBe(false);
  });

  it("값이 없으면 false", () => {
    expect(isEligibleAge(null, NOW)).toBe(false);
    expect(isEligibleAge("", NOW)).toBe(false);
  });
});

describe("toAgeBucket", () => {
  it("연령대 하한으로 내린다", () => {
    expect(toAgeBucket(20)).toBe(20);
    expect(toAgeBucket(24)).toBe(20);
    expect(toAgeBucket(27)).toBe(25);
    expect(toAgeBucket(44)).toBe(40);
    expect(toAgeBucket(59)).toBe(50);
    expect(toAgeBucket(80)).toBe(60);
  });

  it("만 19세는 구간이 없어 20으로 올라간다", () => {
    expect(toAgeBucket(19)).toBe(20);
  });
});
