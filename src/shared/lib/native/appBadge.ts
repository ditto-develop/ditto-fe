import { Capacitor } from "@capacitor/core";

import { getUnreadNotificationCount } from "@/features/notification/api/notificationApi";
import { getNativePlatform } from "@/shared/lib/native/platform";

/**
 * iOS 앱 아이콘 배지(숫자).
 *
 * 숫자를 **올리는** 쪽은 BE 다 — 푸시 payload 의 `badge` 값을 iOS 가 그대로 박는다.
 * 그런데 앱 안에서 알림을 읽어도 그 숫자를 **내리는** 쪽이 없어서, 다음 푸시가 올 때까지
 * 아이콘에 남아 있었다(2026-10-07). 여기서 알림 센터 미읽음 수(`unread-count`)로 다시 맞춘다.
 * BE 의 payload 배지도 같은 기준(최근 30일 미읽음)이라 둘이 어긋나지 않는다.
 *
 * - iOS 만 맞춘다. 안드로이드 런처 배지는 알림창에 남은 알림 수를 따라가서 이 숫자와
 *   의미가 다르다.
 * - 원격 URL 로드라 **배지 플러그인이 없는 옛 앱 빌드(1.0 (6) 이하)에서도 이 코드가 돈다.**
 *   `isPluginAvailable` 로 막지 않으면 호출마다 "not implemented" 로 실패한다.
 * - 플러그인은 정적 import 하지 않는다 — 웹 방문자 전원이 그 청크를 내게 된다
 *   (pushNotifications.ts 의 `loadMessaging` 과 같은 이유).
 */

const PLUGIN_NAME = "Badge";

function canUseBadge(): boolean {
    return getNativePlatform() === "ios" && Capacitor.isPluginAvailable(PLUGIN_NAME);
}

async function loadBadge() {
    // 플러그인 Proxy 를 그대로 반환하면 Promise 가 가상의 then() 을 호출해 멈춘다.
    return import("@capawesome/capacitor-badge");
}

/**
 * 알림 권한이 이미 허용된 상태인가.
 *
 * ⚠️ 플러그인의 `set()` 은 매번 `requestAuthorization(.badge)` 를 부른다. 권한을 아직 묻지
 * 않은 상태(prompt)에서 부르면 **배지만 달라는** 시스템 권한 창이 먼저 떠 버리고, iOS 는
 * 권한을 한 번만 묻기 때문에 FCM 의 알림·소리 권한은 다시 물을 수 없게 된다.
 * 권한 요청은 `initPushNotifications` 한 곳만 하고, 여기서는 허용된 뒤에만 숫자를 바꾼다.
 */
async function isBadgeGranted(): Promise<boolean> {
    const { Badge } = await loadBadge();
    const { display } = await Badge.checkPermissions();
    return display === "granted";
}

/**
 * 동기화 호출 순번. 앱 복귀·방 입장·읽음 처리가 겹쳐 여러 번 불리면 **마지막 호출의
 * 숫자만** 쓴다 — 먼저 나간 조회가 늦게 돌아와 방금 줄인 숫자를 되돌리지 않게 한다.
 */
let syncSeq = 0;

/** 아이콘 배지를 서버 미읽음 수에 맞춘다. 실패해도 조용히 넘어간다. */
export async function syncAppBadge(): Promise<void> {
    if (!canUseBadge()) return;
    const seq = ++syncSeq;

    try {
        if (!(await isBadgeGranted())) return;
        const count = await getUnreadNotificationCount();
        if (seq !== syncSeq) return;
        const { Badge } = await loadBadge();
        await Badge.set({ count });
    } catch (err: unknown) {
        console.error("[badge] 앱 아이콘 배지 동기화 실패:", err);
    }
}

/** 로그아웃·탈퇴 시 아이콘 배지를 지운다. 이전 계정의 숫자가 남지 않게 한다. */
export async function clearAppBadge(): Promise<void> {
    if (!canUseBadge()) return;
    // 진행 중인 동기화가 끝나서 이전 계정의 숫자를 다시 박지 못하게 한다.
    ++syncSeq;

    try {
        if (!(await isBadgeGranted())) return;
        const { Badge } = await loadBadge();
        await Badge.clear();
    } catch (err: unknown) {
        console.error("[badge] 앱 아이콘 배지 초기화 실패:", err);
    }
}
