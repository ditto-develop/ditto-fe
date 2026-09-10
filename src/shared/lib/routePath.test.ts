import { describe, expect, it } from "vitest";

import { isBootSplashPath, isPathActive, normalizePathname } from "@/shared/lib/routePath";

describe("normalizePathname", () => {
  it("끝 슬래시를 떼어 낸다 (하드 로드 · 클라이언트 내비게이션을 같은 값으로 본다)", () => {
    expect(normalizePathname("/home/")).toBe("/home");
    expect(normalizePathname("/home")).toBe("/home");
  });

  it("루트는 슬래시를 유지한다", () => {
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("//")).toBe("/");
  });
});

describe("isPathActive", () => {
  it("자기 자신과 하위 경로에서만 활성이다", () => {
    expect(isPathActive("/settings/blocks", "/settings")).toBe(true);
    expect(isPathActive("/settings/", "/settings")).toBe(true);
    expect(isPathActive("/settings-x", "/settings")).toBe(false);
  });
});

/**
 * 소개노트를 누를 때마다 스플래시가 번쩍였다. 정적 export라 `/profile/{id}`는 진입할
 * 때마다 문서가 새로 뜨는데, ClientLayout이 하이드레이션 전을 무조건 스플래시로 받았다.
 */
describe("isBootSplashPath", () => {
  it("루트와 홈만 스플래시를 받는다", () => {
    expect(isBootSplashPath("/")).toBe(true);
    expect(isBootSplashPath("/home")).toBe(true);
    expect(isBootSplashPath("/home/")).toBe(true);
  });

  it("동적 라우트(소개노트·채팅방)는 스플래시를 받지 않는다", () => {
    expect(isBootSplashPath("/profile/501")).toBe(false);
    expect(isBootSplashPath("/profile/501/")).toBe(false);
    expect(isBootSplashPath("/chat/one-on-one/12/")).toBe(false);
    expect(isBootSplashPath("/chat/group/12/rate/")).toBe(false);
  });

  it("자체 로딩 UI가 있거나 기다릴 것이 없는 화면도 받지 않는다", () => {
    expect(isBootSplashPath("/auth/callback")).toBe(false);
    expect(isBootSplashPath("/sanction")).toBe(false);
    expect(isBootSplashPath("/settings/terms")).toBe(false);
    expect(isBootSplashPath("/admin/matches")).toBe(false);
  });
});
