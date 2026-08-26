import type { PluginListenerHandle } from "@capacitor/core";

import { externalApiFetch } from "@/shared/lib/api/externalClient";
import { toInternalPath } from "@/shared/lib/native/appShell";
import type { NativePlatform } from "@/shared/lib/native/platform";
import { getNativePlatform, isNativeApp } from "@/shared/lib/native/platform";

/**
 * 원격 푸시(FCM). BE가 발송한다.
 *
 * 로컬 알림(`localNotifications.ts`)과 역할이 다르다 — 로컬은 고정 일정을 기기가
 * 스스로 예약하고, 이쪽은 **언제 올지 모르는 이벤트**(새 채팅 메시지, 매칭 성사 등)를
 * 서버가 밀어 넣는다. 백그라운드에서는 JS가 돌지 않으므로 이건 서버 없이 불가능하다.
 *
 * 웹 푸시는 쓰지 않는다. `getToken`의 `vapidKey`/서비스워커 경로는 웹 전용인데,
 * 아래 모든 진입점이 `isNativeApp()`으로 막혀 있어 웹에서는 아무 일도 일어나지 않는다.
 *
 * ⚠️ 플러그인을 **정적 import 하지 않는다.** 정적으로 걸면 firebase 웹 구현이
 * 초기 로드 청크(약 44KB)에 들어가는데, 같은 번들이 웹에서도 돌기 때문에
 * 푸시를 쓸 일이 없는 브라우저 방문자 전원이 그 비용을 낸다.
 * 아래 `loadMessaging()`으로 **네이티브 게이트를 통과한 뒤에만** 불러온다.
 */

/** 네이티브에서만 호출된다. 웹 번들의 초기 로드에서 firebase를 떼어내기 위한 지연 로딩. */
async function loadMessaging() {
    const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
    return FirebaseMessaging;
}

/**
 * 푸시 등록 기능 플래그.
 *
 * BE에 디바이스 토큰 등록 엔드포인트가 아직 없다(2026-08-26 라이브 스펙 확인 —
 * `/api/v1/notifications/devices` 부재). BE-Request-App §A의 계약대로 호출부를
 * 구현해 뒀고, 엔드포인트가 배포되면 이 플래그만 켜면 된다.
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

/** 알림 payload에서 딥링크를 꺼낸다. BE 계약: `data.deepLink` (BE-Request-App §B-2). */
export function extractDeepLink(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const deepLink = (data as Record<string, unknown>).deepLink;
    return typeof deepLink === "string" ? toInternalPath(deepLink) : null;
}

type PushOptions = {
    navigate: (path: string) => void;
    /** 발급된 FCM 토큰. 로그아웃 시 해제하려면 호출부가 들고 있어야 한다. */
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

    const FirebaseMessaging = await loadMessaging();
    const handles: PluginListenerHandle[] = [];

    const submitToken = (token: string) => {
        if (!token) return;
        onToken?.(token);
        registerDeviceToken(token).catch((err: unknown) => {
            console.error("[push] 디바이스 토큰 등록 실패:", err);
        });
    };

    // FCM 토큰은 앱 재설치·데이터 삭제·주기적 갱신으로 바뀐다. 바뀔 때마다 다시 등록한다.
    handles.push(
        await FirebaseMessaging.addListener("tokenReceived", ({ token }) => submitToken(token)),
    );

    /**
     * 알림을 탭해서 앱이 열렸을 때.
     * BE가 payload에 `deepLink`(예: "/chat/one-on-one/12/")를 넣어주기로 한 계약이다.
     */
    handles.push(
        await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
            const path = extractDeepLink(event.notification.data);
            if (path) navigate(path);
        }),
    );

    const permission = await FirebaseMessaging.requestPermissions();
    if (permission.receive === "granted") {
        // tokenReceived 는 갱신 시에만 오므로, 최초 1회는 직접 가져와야 한다.
        const { token } = await FirebaseMessaging.getToken();
        submitToken(token);
    }

    return () => {
        handles.forEach((handle) => {
            handle.remove().catch(() => {});
        });
    };
}

/**
 * 로그아웃·탈퇴 시 푸시 수신을 완전히 끊는다.
 *
 * 두 단계 모두 필요하다:
 *   1. BE에서 토큰-회원 연결 해제 — 안 하면 이 기기로 이전 계정의 알림이 계속 온다
 *   2. 기기의 FCM 토큰 폐기 — 다음 로그인 때 새 토큰을 받는다
 *
 * 어느 쪽이 실패해도 로그아웃 자체는 막지 않는다.
 */
export async function releasePushToken(): Promise<void> {
    if (!isNativeApp()) return;

    try {
        const FirebaseMessaging = await loadMessaging();
        // 해제 요청에 토큰이 필요하므로 폐기 전에 먼저 읽는다.
        const { token } = await FirebaseMessaging.getToken();
        await unregisterDeviceToken(token);
        await FirebaseMessaging.deleteToken();
    } catch (err: unknown) {
        console.error("[push] 토큰 해제 실패:", err);
    }
}
