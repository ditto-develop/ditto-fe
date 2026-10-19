import { Capacitor } from "@capacitor/core";

import type { FeedbackDeviceInfo } from "@/features/feedback/model/types";
import { getAppVersion } from "@/shared/lib/native/appVersion";
import type { NativePlatform } from "@/shared/lib/native/platform";
import { getNativePlatform, isNativeApp } from "@/shared/lib/native/platform";

/**
 * 의견에 실을 기기 정보를 모은다. 정확한 값부터 쓰고, 없으면 웹뷰가 아는 만큼으로 내려간다.
 *
 * 1. `@capacitor/device`(iOS 1.0.1 (8) · Android 1.0.1 (1) 부터 앱에 들어 있다) — OS 버전과 모델
 *    식별자(`iPhone15,2`, `SM-S928N`)를 OS 에서 직접 읽는다.
 * 2. User-Agent Client Hints(안드로이드 크롬·웹뷰) — 정확한 버전·모델.
 * 3. User-Agent — iOS 는 OS 버전과 기기 종류(iPhone·iPad)까지만. 모델 식별자는 웹에 노출되지 않는다.
 *    데스크톱 웹은 OS 이름만(브라우저가 UA 의 버전을 고정값으로 내보내 믿을 수 없다).
 *
 * 원격 URL 로드라 **플러그인이 없는 옛 앱 빌드(iOS 1.0 (7) 이하)에서도 이 코드가 돈다.**
 * `isPluginAvailable` 로 막고 2·3 으로 내려간다.
 *
 * `appVersion` 은 앱 셸에서만 싣는다. 웹에는 셸이 없으므로 이 값이 없으면 웹에서 보낸 의견이다.
 */

const MAX_APP_VERSION_LENGTH = 30;
const MAX_OS_LENGTH = 30;
const MAX_DEVICE_MODEL_LENGTH = 50;

/** 크롬이 UA 를 줄일 때 모델 자리에 넣는 값. 이게 보이면 버전도 고정값이라 믿을 수 없다. */
const REDUCED_UA_MODEL = "K";

type UserAgentInfo = Pick<FeedbackDeviceInfo, "os" | "deviceModel">;

/** "15.0.0" → "15", "14.1.0" → "14.1" */
function trimTrailingZeros(version: string): string {
  return version.replace(/(\.0)+$/, "");
}

/** User-Agent 문자열에서 OS·모델을 읽는다. 읽지 못한 값은 빠진다. */
export function parseUserAgent(userAgent: string, nativePlatform: NativePlatform): UserAgentInfo {
  const ios = /\b(iPhone|iPad|iPod)\b.*?\bOS (\d+(?:_\d+)*)/.exec(userAgent);
  if (ios) {
    return { os: `iOS ${ios[2].replace(/_/g, ".")}`, deviceModel: ios[1] };
  }

  const android = /\bAndroid (\d+(?:\.\d+)*)(?:; ([^;)]+?))?(?: Build\/[^;)]*)?[;)]/.exec(userAgent);
  if (android) {
    const model = android[2]?.trim();
    if (!model || model === REDUCED_UA_MODEL) return { os: "Android" };
    return { os: `Android ${android[1]}`, deviceModel: model };
  }

  // iPad 앱 웹뷰는 기본이 데스크톱 UA(Macintosh)라 위 iOS 패턴에 걸리지 않는다.
  if (nativePlatform === "ios") return { os: "iOS" };

  if (/\bWindows\b/.test(userAgent)) return { os: "Windows" };
  if (/\bCrOS\b/.test(userAgent)) return { os: "ChromeOS" };
  if (/\bMac OS X\b/.test(userAgent)) return { os: "macOS" };
  if (/\bLinux\b/.test(userAgent)) return { os: "Linux" };
  return {};
}

type HighEntropyValues = { platformVersion?: string; model?: string };

type UserAgentDataLike = {
  platform: string;
  getHighEntropyValues: (hints: string[]) => Promise<HighEntropyValues>;
};

/** Chromium(안드로이드 크롬·웹뷰)의 Client Hints. 다른 브라우저·플랫폼은 null. */
async function readAndroidClientHints(): Promise<UserAgentInfo | null> {
  const userAgentData = (navigator as Navigator & { userAgentData?: UserAgentDataLike }).userAgentData;
  if (userAgentData?.platform !== "Android") return null;

  try {
    const { platformVersion, model } = await userAgentData.getHighEntropyValues([
      "platformVersion",
      "model",
    ]);
    return {
      os: platformVersion ? `Android ${trimTrailingZeros(platformVersion)}` : undefined,
      deviceModel: model || undefined,
    };
  } catch {
    return null;
  }
}

const DEVICE_PLUGIN = "Device";

const OS_NAMES: Partial<Record<string, string>> = { ios: "iOS", android: "Android" };

/** 앱에 들어 있는 `@capacitor/device` 로 읽는다. 웹·옛 앱 빌드·실패는 null. */
async function readNativeDevice(): Promise<UserAgentInfo | null> {
  if (!isNativeApp() || !Capacitor.isPluginAvailable(DEVICE_PLUGIN)) return null;

  try {
    // 정적 import 하지 않는다 — 웹 방문자 전원이 그 청크를 내게 된다(appBadge.ts 와 같은 이유).
    const { Device } = await import("@capacitor/device");
    const { operatingSystem, osVersion, model } = await Device.getInfo();
    const osName = OS_NAMES[operatingSystem];
    return {
      os: osName && osVersion ? `${osName} ${osVersion}` : osName,
      deviceModel: model || undefined,
    };
  } catch {
    return null;
  }
}

function limit(value: string | undefined, maxLength: number): string | undefined {
  return value ? value.slice(0, maxLength) : undefined;
}

/** 던지지 않는다 — 기기 정보를 못 읽어도 의견은 보내져야 한다. */
export async function getFeedbackDeviceInfo(): Promise<FeedbackDeviceInfo> {
  const [appVersion, native, hints] = await Promise.all([
    isNativeApp() ? getAppVersion() : Promise.resolve(undefined),
    readNativeDevice(),
    readAndroidClientHints(),
  ]);
  const parsed = parseUserAgent(navigator.userAgent, getNativePlatform());

  return {
    appVersion: limit(appVersion, MAX_APP_VERSION_LENGTH),
    os: limit(native?.os ?? hints?.os ?? parsed.os, MAX_OS_LENGTH),
    deviceModel: limit(
      native?.deviceModel ?? hints?.deviceModel ?? parsed.deviceModel,
      MAX_DEVICE_MODEL_LENGTH,
    ),
  };
}
