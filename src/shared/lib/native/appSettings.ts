import { Capacitor, registerPlugin } from "@capacitor/core";

import { isNativeApp } from "@/shared/lib/native/platform";

/**
 * OS 설정 앱의 디토 알림 화면을 연다. 네이티브 구현: native-plugins/capacitor-app-settings/
 *
 * 알림 권한을 한 번 거절한 사람에게는 OS 가 시스템 권한 창을 다시 띄우지 않는다(iOS 는 설치당 1회,
 * Android 13+ 는 두 번 거절하면 끝). 그 사람이 알림을 다시 켤 길은 설정 앱뿐이다.
 *
 * ⚠️ 이 플러그인은 **2026-11 앱 빌드부터** 들어 있다. 앱이 원격 URL 을 로드하므로 이 코드는 옛 바이너리에서도
 * 돈다. 그래서 부르기 전에 반드시 `canOpenNotificationSettings()` 로 확인한다 — 없는 플러그인을 부르면
 * Capacitor 가 "not implemented" 로 거절한다.
 */

/** 네이티브 플러그인 이름. Swift 의 jsName · Kotlin 의 @CapacitorPlugin(name) 과 같아야 한다. */
const PLUGIN_NAME = "AppSettings";

type AppSettingsPlugin = {
    openNotificationSettings(): Promise<void>;
};

/**
 * 플러그인 프록시. 동적 import 로 만들지 않는다 — `import("@capacitor/core")` 가 앱 웹뷰에서 resolve 되지
 * 않아 버튼이 죽은 적이 있다(kakaoLogin.ts 의 같은 주석).
 */
const plugin = registerPlugin<AppSettingsPlugin>(PLUGIN_NAME);

/** 이 앱 바이너리에 플러그인이 들어 있는지. 웹과 옛 바이너리는 false 다. */
export function canOpenNotificationSettings(): boolean {
    return isNativeApp() && Capacitor.isPluginAvailable(PLUGIN_NAME);
}

/** 설정 화면을 열었으면 true. 열 수 없거나 실패하면 false 다. 던지지 않는다. */
export async function openNotificationSettings(): Promise<boolean> {
    if (!canOpenNotificationSettings()) return false;
    try {
        await plugin.openNotificationSettings();
        return true;
    } catch (err: unknown) {
        console.error("[appSettings] 알림 설정 화면 열기 실패:", err);
        return false;
    }
}
