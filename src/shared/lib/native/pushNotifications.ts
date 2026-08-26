import type { PluginListenerHandle } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

import { externalApiFetch } from "@/shared/lib/api/externalClient";
import type { NativePlatform } from "@/shared/lib/native/platform";
import { getNativePlatform, isNativeApp } from "@/shared/lib/native/platform";
import { toInternalPath } from "@/shared/lib/native/appShell";

/**
 * 푸시 등록 기능 플래그.
 *
 * BE에 디바이스 토큰 등록 엔드포인트가 아직 없다(INTEGRATION-TODO.md §150 —
 * "FCM 인프라 자체가 없다"). 아래 호출부는 BE-Request 문서에 확정 요청한 계약을
 * 그대로 구현해 둔 것이고, BE가 배포되면 이 플래그만 켜면 동작한다.
 * 플래그가 꺼져 있으면 권한 요청조차 하지 않는다 — 받을 서버가 없는데 사용자에게
 * 알림 권한 팝업을 띄우면 승인률만 태운다.
 */
const isPushEnabled = (): boolean => process.env.NEXT_PUBLIC_PUSH_ENABLED === "true";

export type DevicePlatform = "IOS" | "ANDROID";

type DeviceRegistrationBody = {
    token: string;
    platform: DevicePlatform;
};

/**
 * Capacitor 플랫폼 문자열을 BE 계약의 enum으로 바꾼다.
 * BE는 대문자 IOS/ANDROID만 받는다(BE-Request-App §A-1).
 * 웹은 등록 대상이 아니므로 null이며, 호출부가 요청을 건너뛴다.
 */
export function toDevicePlatform(platform: NativePlatform): DevicePlatform | null {
    if (platform === "ios") return "IOS";
    if (platform === "android") return "ANDROID";
    return null;
}

/** BE 계약: 같은 토큰 재등록은 멱등이어야 한다. */
function registerDeviceToken(token: string): Promise<unknown> {
    const platform = toDevicePlatform(getNativePlatform());
    if (!platform) return Promise.resolve(null);

    const body: DeviceRegistrationBody = { token, platform };

    return externalApiFetch<unknown>("/api/v1/notifications/devices", {
        method: "POST",
        body,
    });
}

/** 로그아웃·탈퇴 시 호출. 기기에 다른 계정이 로그인해도 이전 계정 푸시가 가지 않게 한다. */
export async function unregisterDeviceToken(token: string): Promise<void> {
    if (!isNativeApp() || !isPushEnabled() || !token) return;
    await externalApiFetch<unknown>(
        `/api/v1/notifications/devices/${encodeURIComponent(token)}`,
        { method: "DELETE" },
    ).catch((err: unknown) => {
        // 실패해도 로그아웃 자체는 막지 않는다.
        console.error("[push] 디바이스 토큰 해제 실패:", err);
    });
}

type PushOptions = {
    navigate: (path: string) => void;
    /** 발급된 FCM/APNs 토큰. 로그아웃 시 해제하려면 호출부가 들고 있어야 한다. */
    onToken?: (token: string) => void;
};

/**
 * 푸시 권한 요청 + 토큰 등록 + 알림 탭 딥링크.
 *
 * 로그인 이후에 호출해야 한다. 토큰 등록 API가 인증을 요구하므로 비로그인
 * 상태에서 부르면 401이 난다.
 *
 * 반환값은 리스너 정리 함수다.
 */
export async function initPushNotifications({
    navigate,
    onToken,
}: PushOptions): Promise<() => void> {
    if (!isNativeApp() || !isPushEnabled()) return () => {};

    const handles: PluginListenerHandle[] = [];

    handles.push(
        await PushNotifications.addListener("registration", (token) => {
            onToken?.(token.value);
            registerDeviceToken(token.value).catch((err: unknown) => {
                console.error("[push] 디바이스 토큰 등록 실패:", err);
            });
        }),
    );

    handles.push(
        await PushNotifications.addListener("registrationError", (err) => {
            console.error("[push] 푸시 등록 실패:", err);
        }),
    );

    /**
     * 알림을 탭해서 앱이 열렸을 때.
     * BE가 payload에 `deepLink`(예: "/chat/one-on-one/12/")를 넣어주기로 한 계약이다.
     */
    handles.push(
        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
            const deepLink = action.notification.data?.deepLink;
            const path = typeof deepLink === "string" ? toInternalPath(deepLink) : null;
            if (path) navigate(path);
        }),
    );

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === "granted") {
        await PushNotifications.register();
    }

    return () => {
        handles.forEach((handle) => {
            handle.remove().catch(() => {});
        });
    };
}
