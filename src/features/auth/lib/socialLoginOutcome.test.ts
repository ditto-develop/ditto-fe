import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildSanctionQuery,
  resolveSocialLogin,
} from "@/features/auth/lib/socialLoginOutcome";
import { ACCESS_TOKEN_KEY, getAccessToken } from "@/shared/lib/auth";

// 이 테스트는 토큰 저장까지 확인해야 해서 node 환경에 최소한의 브라우저 전역을 심는다.
// auth.ts 는 `typeof window` 로 브라우저를 판정하고 전역 localStorage 를 쓴다.
const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.assign(globalThis, {
    window: {},
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
  vi.restoreAllMocks();
});

/**
 * 리다이렉트 콜백과 앱의 네이티브 로그인이 공유하는 결말 분기.
 * 한쪽만 고쳐지는 사고를 막으려고 로직을 여기 한 곳에 모아 뒀다.
 */
describe("resolveSocialLogin", () => {
  it("제재 회원은 토큰을 저장하지 않고 남은 토큰까지 비운다", () => {
    store.set(ACCESS_TOKEN_KEY, "예전-토큰");

    const outcome = resolveSocialLogin({
      sanctioned: true,
      sanctionCode: "MEMBER_SUSPENDED",
      suspendedUntil: "2026-09-10 01:00:00",
      // 제재인데 토큰이 섞여 오더라도 저장하면 안 된다.
      accessToken: "지급되면-안-되는-토큰",
    });

    expect(outcome).toEqual({
      kind: "sanctioned",
      query: "sanctioned=true&sanctionCode=MEMBER_SUSPENDED&suspendedUntil=2026-09-10+01%3A00%3A00",
    });
    expect(getAccessToken()).toBe("");
  });

  it("신규 회원은 토큰을 저장하고 가입으로 보낸다", () => {
    const outcome = resolveSocialLogin({ accessToken: "새-토큰", signupRequired: true });

    expect(outcome).toEqual({ kind: "signup" });
    expect(getAccessToken()).toBe("새-토큰");
  });

  it("기존 회원은 토큰을 저장하고 홈으로 보낸다", () => {
    const outcome = resolveSocialLogin({ accessToken: "새-토큰", signupRequired: false });

    expect(outcome).toEqual({ kind: "home" });
    expect(getAccessToken()).toBe("새-토큰");
  });

  it("직전 계정의 토큰은 새 토큰으로 덮인다", () => {
    store.set(ACCESS_TOKEN_KEY, "예전-토큰");

    resolveSocialLogin({ accessToken: "새-토큰" });

    expect(getAccessToken()).toBe("새-토큰");
  });

  it("accessToken 이 없으면 저장된 토큰을 건드리지 않는다 (네이티브 경로가 미리 저장해 둔 경우)", () => {
    store.set(ACCESS_TOKEN_KEY, "네이티브가-저장한-토큰");

    const outcome = resolveSocialLogin({ signupRequired: true });

    expect(outcome).toEqual({ kind: "signup" });
    expect(getAccessToken()).toBe("네이티브가-저장한-토큰");
  });
});

describe("buildSanctionQuery", () => {
  it("영구 차단은 suspendedUntil 이 없다", () => {
    expect(buildSanctionQuery({ sanctioned: true, sanctionCode: "MEMBER_BANNED" })).toBe(
      "sanctioned=true&sanctionCode=MEMBER_BANNED",
    );
  });

  it("빈 값은 쿼리에 넣지 않는다", () => {
    expect(buildSanctionQuery({ sanctioned: true, sanctionCode: null, suspendedUntil: null })).toBe(
      "sanctioned=true",
    );
  });
});

/**
 * 빈 응답에서 `result.sanctioned` 를 읽다 TypeError 로 터지면, 그 예외가 호출부의
 * "교환 실패" catch 로 떨어지고 콘솔에는 `{}` 로만 남아 원인을 추적할 수 없다.
 * 2026-09-07 기기 디버깅에서 실제로 겪은 실패 모드다.
 */
describe("resolveSocialLogin — 빈 응답", () => {
  it("null 응답은 읽을 수 있는 메시지로 던진다", () => {
    expect(() => resolveSocialLogin(null)).toThrow(/비어 있습니다/);
  });

  it("undefined 응답도 같다", () => {
    expect(() => resolveSocialLogin(undefined)).toThrow(/비어 있습니다/);
  });
});
