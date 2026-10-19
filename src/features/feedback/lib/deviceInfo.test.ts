import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parseUserAgent } from "@/features/feedback/lib/deviceInfo";

const isNativeApp = vi.fn(() => false);
const getNativePlatform = vi.fn<() => "ios" | "android" | "web">(() => "web");
const getAppVersion = vi.fn(async () => "1.0.0 (6)");

vi.mock("@/shared/lib/native/platform", () => ({
  isNativeApp: () => isNativeApp(),
  getNativePlatform: () => getNativePlatform(),
}));
vi.mock("@/shared/lib/native/appVersion", () => ({
  getAppVersion: () => getAppVersion(),
}));

const isPluginAvailable = vi.fn<(name: string) => boolean>(() => false);
vi.mock("@capacitor/core", () => ({
  Capacitor: { isPluginAvailable: (name: string) => isPluginAvailable(name) },
}));

type DeviceInfoLike = { operatingSystem: string; osVersion: string; model: string };
const getInfo = vi.fn<() => Promise<DeviceInfoLike>>();
vi.mock("@capacitor/device", () => ({
  Device: { getInfo: () => getInfo() },
}));

const IPHONE_APP =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPAD_DESKTOP_CLASS =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const ANDROID_WEBVIEW =
  "Mozilla/5.0 (Linux; Android 15; SM-S928N Build/AP3A.240905.015; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36";
const ANDROID_CHROME_REDUCED =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36";
const WINDOWS_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15";

beforeEach(() => {
  isNativeApp.mockReset().mockReturnValue(false);
  getNativePlatform.mockReset().mockReturnValue("web");
  getAppVersion.mockClear();
  isPluginAvailable.mockReset().mockReturnValue(false);
  getInfo.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseUserAgent", () => {
  it("iPhone 은 OS 버전을 점으로 바꾸고 기기 종류를 모델로 싣는다", () => {
    expect(parseUserAgent(IPHONE_APP, "ios")).toEqual({ os: "iOS 18.2", deviceModel: "iPhone" });
  });

  /** iPad 앱 웹뷰는 데스크톱 UA 라 macOS 로 읽히면 안 된다. 그 UA 의 버전(10_15_7)은 고정값이다. */
  it("iOS 앱인데 데스크톱 UA 면 버전 없이 iOS 로만 싣는다", () => {
    expect(parseUserAgent(IPAD_DESKTOP_CLASS, "ios")).toEqual({ os: "iOS" });
  });

  it("안드로이드 웹뷰는 버전과 모델을 읽는다(Build 이후는 버린다)", () => {
    expect(parseUserAgent(ANDROID_WEBVIEW, "android")).toEqual({
      os: "Android 15",
      deviceModel: "SM-S928N",
    });
  });

  /** 크롬이 줄인 UA 는 버전이 10, 모델이 K 로 고정이라 둘 다 믿을 수 없다. */
  it("줄인 UA(모델 K)면 버전·모델을 버리고 Android 로만 싣는다", () => {
    expect(parseUserAgent(ANDROID_CHROME_REDUCED, "web")).toEqual({ os: "Android" });
  });

  it("데스크톱 웹은 OS 이름만 싣는다", () => {
    expect(parseUserAgent(WINDOWS_CHROME, "web")).toEqual({ os: "Windows" });
    expect(parseUserAgent(MAC_SAFARI, "web")).toEqual({ os: "macOS" });
  });

  it("모르는 UA 는 아무것도 싣지 않는다", () => {
    expect(parseUserAgent("curl/8.0", "web")).toEqual({});
  });
});

describe("getFeedbackDeviceInfo", () => {
  async function load() {
    vi.resetModules();
    return import("@/features/feedback/lib/deviceInfo");
  }

  function stubNavigator(userAgent: string, userAgentData?: unknown) {
    vi.stubGlobal("navigator", { userAgent, userAgentData });
  }

  it("기기 플러그인이 있는 앱이면 OS 가 주는 버전과 모델 식별자를 싣는다", async () => {
    isNativeApp.mockReturnValue(true);
    getNativePlatform.mockReturnValue("ios");
    isPluginAvailable.mockImplementation((name) => name === "Device");
    getInfo.mockResolvedValue({ operatingSystem: "ios", osVersion: "18.2.1", model: "iPhone15,2" });
    stubNavigator(IPHONE_APP);

    const { getFeedbackDeviceInfo } = await load();

    expect(await getFeedbackDeviceInfo()).toEqual({
      appVersion: "1.0.0 (6)",
      os: "iOS 18.2.1",
      deviceModel: "iPhone15,2",
    });
  });

  it("안드로이드 앱이면 플러그인 값을 Client Hints 보다 먼저 쓴다", async () => {
    isNativeApp.mockReturnValue(true);
    getNativePlatform.mockReturnValue("android");
    isPluginAvailable.mockImplementation((name) => name === "Device");
    getInfo.mockResolvedValue({ operatingSystem: "android", osVersion: "16", model: "SM-S938N" });
    stubNavigator(ANDROID_WEBVIEW, {
      platform: "Android",
      getHighEntropyValues: async () => ({ platformVersion: "15.0.0", model: "SM-S928N" }),
    });

    const { getFeedbackDeviceInfo } = await load();

    expect(await getFeedbackDeviceInfo()).toMatchObject({ os: "Android 16", deviceModel: "SM-S938N" });
  });

  /** 원격 URL 로드라 플러그인이 없는 옛 빌드(iOS 1.0 (7) 이하)에서도 같은 코드가 돈다. */
  it("플러그인이 없는 옛 앱이면 셸 버전과 UA 의 OS·모델을 싣는다", async () => {
    isNativeApp.mockReturnValue(true);
    getNativePlatform.mockReturnValue("ios");
    stubNavigator(IPHONE_APP);

    const { getFeedbackDeviceInfo } = await load();

    expect(await getFeedbackDeviceInfo()).toEqual({
      appVersion: "1.0.0 (6)",
      os: "iOS 18.2",
      deviceModel: "iPhone",
    });
    expect(getInfo).not.toHaveBeenCalled();
  });

  it("플러그인이 실패하면 UA 로 돌아간다", async () => {
    isNativeApp.mockReturnValue(true);
    getNativePlatform.mockReturnValue("ios");
    isPluginAvailable.mockImplementation((name) => name === "Device");
    getInfo.mockRejectedValue(new Error("not implemented"));
    stubNavigator(IPHONE_APP);

    const { getFeedbackDeviceInfo } = await load();

    expect(await getFeedbackDeviceInfo()).toMatchObject({ os: "iOS 18.2", deviceModel: "iPhone" });
  });

  /** 웹에는 셸이 없다. 설정 화면의 표시용 웹 버전(1.0.0)을 실으면 앱에서 보낸 것처럼 보인다. */
  it("웹에서는 appVersion 을 싣지 않는다", async () => {
    stubNavigator(MAC_SAFARI);

    const { getFeedbackDeviceInfo } = await load();

    const info = await getFeedbackDeviceInfo();
    expect(info.appVersion).toBeUndefined();
    expect(getAppVersion).not.toHaveBeenCalled();
    expect(getInfo).not.toHaveBeenCalled();
  });

  it("안드로이드 Client Hints 가 있으면 UA 보다 먼저 쓴다", async () => {
    stubNavigator(ANDROID_CHROME_REDUCED, {
      platform: "Android",
      getHighEntropyValues: async () => ({ platformVersion: "15.0.0", model: "Pixel 9" }),
    });

    const { getFeedbackDeviceInfo } = await load();

    expect(await getFeedbackDeviceInfo()).toMatchObject({ os: "Android 15", deviceModel: "Pixel 9" });
  });

  it("Client Hints 가 실패하면 UA 로 돌아간다", async () => {
    stubNavigator(ANDROID_WEBVIEW, {
      platform: "Android",
      getHighEntropyValues: async () => {
        throw new Error("not allowed");
      },
    });

    const { getFeedbackDeviceInfo } = await load();

    expect(await getFeedbackDeviceInfo()).toMatchObject({ os: "Android 15", deviceModel: "SM-S928N" });
  });

  it("BE 길이 제한(os 30자·모델 50자)을 넘으면 자른다", async () => {
    stubNavigator(`Mozilla/5.0 (Linux; Android 15; ${"M".repeat(60)}) Chrome/129`);

    const { getFeedbackDeviceInfo } = await load();

    const info = await getFeedbackDeviceInfo();
    expect(info.deviceModel).toHaveLength(50);
    expect(info.os?.length).toBeLessThanOrEqual(30);
  });
});
