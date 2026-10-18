import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isNativeApp = vi.fn(() => false);
vi.mock("@/shared/lib/native/platform", () => ({
  isNativeApp: () => isNativeApp(),
}));

const originalFlag = process.env.NEXT_PUBLIC_WEB_GATE_ENABLED;

async function load() {
  vi.resetModules();
  return import("@/shared/lib/webGate");
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_WEB_GATE_ENABLED = "true";
  isNativeApp.mockReset().mockReturnValue(false);
});

afterEach(() => {
  process.env.NEXT_PUBLIC_WEB_GATE_ENABLED = originalFlag;
  vi.unstubAllGlobals();
});

describe("shouldShowWebDownload", () => {
  it("브라우저에서는 앱 화면을 다운로드 안내로 덮는다", async () => {
    const { shouldShowWebDownload } = await load();

    expect(shouldShowWebDownload("/")).toBe(true);
    expect(shouldShowWebDownload("/home")).toBe(true);
    expect(shouldShowWebDownload("/chat/group/3")).toBe(true);
    expect(shouldShowWebDownload("/settings")).toBe(true);
  });

  /** 앱이 막히면 App Store 심사부터 실패한다. 플래그가 켜져 있어도 앱은 통과해야 한다. */
  it("앱 웹뷰에서는 덮지 않는다", async () => {
    isNativeApp.mockReturnValue(true);
    const { shouldShowWebDownload } = await load();

    expect(shouldShowWebDownload("/home")).toBe(false);
    expect(shouldShowWebDownload("/")).toBe(false);
  });

  it("플래그가 꺼져 있으면(로컬 개발·verify 잡) 덮지 않는다", async () => {
    process.env.NEXT_PUBLIC_WEB_GATE_ENABLED = "";
    const { shouldShowWebDownload } = await load();

    expect(shouldShowWebDownload("/home")).toBe(false);
  });

  it("Cypress 안에서는 덮지 않는다", async () => {
    vi.stubGlobal("window", { Cypress: {} });
    const { shouldShowWebDownload } = await load();

    expect(shouldShowWebDownload("/home")).toBe(false);
  });

  /** 심사에 제출한 개인정보처리방침·지원 URL 과 다운로드 안내 자체는 브라우저에서 열려야 한다. */
  it("다운로드 안내·약관·고객 지원·OAuth 콜백·어드민은 브라우저에서도 연다", async () => {
    const { shouldShowWebDownload } = await load();

    for (const path of [
      "/download",
      "/download/android",
      "/settings/terms",
      "/settings/privacy",
      "/settings/location-terms",
      "/support",
      "/auth/callback",
      "/oauth/kakao",
      "/admin",
      "/admin/users",
    ]) {
      expect(shouldShowWebDownload(path), path).toBe(false);
    }
  });

  it("열린 경로와 이름만 비슷한 경로는 막는다", async () => {
    const { shouldShowWebDownload } = await load();

    expect(shouldShowWebDownload("/administrator")).toBe(true);
    expect(shouldShowWebDownload("/download/other")).toBe(true);
    expect(shouldShowWebDownload("/settings/feedback")).toBe(true);
  });
});
