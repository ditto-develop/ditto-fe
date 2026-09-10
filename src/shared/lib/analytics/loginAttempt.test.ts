import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { rememberLoginAttempt, takeLoginAttempt } from "@/shared/lib/analytics/loginAttempt";

/**
 * 리다이렉트 로그인의 제공자 기억.
 *
 * BE 콜백 쿼리에는 provider 가 없다. 이 값이 없으면 **웹 사용자 전원의 로그인 성공이
 * 제공자 미상**으로 잡혀, 카카오와 애플 중 무엇이 더 잘 전환되는지 알 수 없다.
 */

function stubSessionStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  });
  return store;
}

beforeEach(() => {
  stubSessionStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rememberLoginAttempt / takeLoginAttempt", () => {
  it("적어 둔 시도를 그대로 돌려준다", () => {
    rememberLoginAttempt({ provider: "apple", method: "redirect" });

    expect(takeLoginAttempt()).toEqual({ provider: "apple", method: "redirect" });
  });

  it("한 번 꺼내면 사라진다", () => {
    // 지우지 않으면 다음 세션의 콜백이 지난 시도를 자기 것으로 읽는다.
    rememberLoginAttempt({ provider: "kakao", method: "redirect" });

    expect(takeLoginAttempt()).not.toBeNull();
    expect(takeLoginAttempt()).toBeNull();
  });

  it("적어 둔 것이 없으면 null 이다", () => {
    expect(takeLoginAttempt()).toBeNull();
  });

  it("깨진 값은 null 로 떨어뜨린다", () => {
    // 다른 버전이 남긴 값이나 손으로 건드린 값이 들어와도 계측만 흐려질 뿐,
    // 로그인 자체는 절대 막지 않아야 한다.
    const store = stubSessionStorage();
    store.set("analytics:loginAttempt", "{ not json");

    expect(takeLoginAttempt()).toBeNull();
  });

  it("모르는 provider 는 받아들이지 않는다", () => {
    const store = stubSessionStorage();
    store.set("analytics:loginAttempt", JSON.stringify({ provider: "naver", method: "redirect" }));

    expect(takeLoginAttempt()).toBeNull();
  });

  it("sessionStorage 가 던져도 로그인을 막지 않는다", () => {
    // 사파리 프라이빗 모드 등에서 실제로 던진다.
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: () => {
          throw new Error("denied");
        },
        setItem: () => {
          throw new Error("denied");
        },
        removeItem: () => {},
      },
    });

    expect(() => rememberLoginAttempt({ provider: "kakao", method: "redirect" })).not.toThrow();
    expect(takeLoginAttempt()).toBeNull();
  });
});
