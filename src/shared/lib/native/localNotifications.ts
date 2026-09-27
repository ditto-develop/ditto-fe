import type { PluginListenerHandle } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

import { toInternalPath } from "@/shared/lib/native/appShell";
import { isNativeApp } from "@/shared/lib/native/platform";

/**
 * 서버 FCM을 포그라운드에서 표시하기 위한 로컬 알림 보조 모듈.
 *
 * 알림 발송과 일정 판단은 모두 서버가 담당한다. 이 모듈은 서버에서 이미 도착한
 * 메시지를 Android 포그라운드에서도 배너로 보이게 하고, 탭 딥링크를 처리할 뿐이다.
 */

/**
 * 이전 버전이 기기에 예약한 주간 알림 id.
 *
 * 예약 코드를 삭제하는 것만으로는 이미 등록된 알림이 사라지지 않아 최대 8주 동안
 * 서버 푸시와 중복될 수 있다. 업데이트한 앱을 한 번 열면 이 id들을 찾아 취소한다.
 */
const LEGACY_SCHEDULED_NOTIFICATION_IDS = [
    ...Array.from({ length: 8 }, (_, week) => 1000 + week),
    ...Array.from({ length: 8 }, (_, week) => 2000 + week),
];

type LocalNotificationOptions = {
    navigate: (path: string) => void;
};

/**
 * 포그라운드 푸시를 로컬 배너로 표시했을 때의 탭 동작을 초기화한다.
 * 웹에서는 아무것도 하지 않는다.
 *
 * 반환값은 리스너 정리 함수다.
 */
export async function initLocalNotifications({
    navigate,
}: LocalNotificationOptions): Promise<() => void> {
    if (!isNativeApp()) return () => {};

    const handles: PluginListenerHandle[] = [];

    handles.push(
        await LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
            const deepLink = action.notification.extra?.deepLink;
            const path = typeof deepLink === "string" ? toInternalPath(deepLink) : null;
            if (path) navigate(path);
        }),
    );

    return () => {
        handles.forEach((handle) => {
            handle.remove().catch(() => {});
        });
    };
}

/** 이전 버전이 예약한 프론트 자체 알림을 제거한다. */
export async function clearLegacyScheduledNotifications(): Promise<void> {
    if (!isNativeApp()) return;
    try {
        const pending = await LocalNotifications.getPending();
        const legacyIds = new Set(LEGACY_SCHEDULED_NOTIFICATION_IDS);
        const toCancel = pending.notifications.filter(({ id }) => legacyIds.has(id));
        if (toCancel.length > 0) {
            await LocalNotifications.cancel({ notifications: toCancel.map(({ id }) => ({ id })) });
        }
    } catch (err: unknown) {
        console.error("[localNotifications] 이전 예약 정리 실패:", err);
    }
}

/**
 * 앱이 떠 있는 동안 도착한 원격 푸시를 눈에 보이게 띄운다.
 *
 * FCM 은 포그라운드 메시지를 **OS 가 대신 그려 주지 않는다.** iOS 는
 * `presentationOptions`(capacitor.config.ts)로 배너가 뜨지만 그 옵션은 플러그인 문서상
 * iOS 전용이라, **안드로이드에서는 앱을 켜 둔 채 채팅 메시지를 받으면 아무것도 뜨지 않았다**
 * (2026-09-15 QA "채팅 알림이 안 감"). 받은 내용을 그대로 로컬 알림으로 한 번 더 그려
 * 두 플랫폼을 같게 만든다.
 *
 * 이전 버전의 예약 알림 id와 겹치지 않게 3000번대를 쓴다.
 */
const FOREGROUND_ID_BASE = 3000;
const FOREGROUND_ID_SPAN = 100;
let foregroundCounter = 0;

export async function showForegroundNotification({
    title,
    body,
    deepLink,
}: {
    title: string;
    body: string;
    deepLink: string | null;
}): Promise<void> {
    if (!isNativeApp()) return;

    try {
        // schedule 을 빼면 즉시 발송이다.
        await LocalNotifications.schedule({
            notifications: [
                {
                    id: FOREGROUND_ID_BASE + (foregroundCounter++ % FOREGROUND_ID_SPAN),
                    title,
                    body,
                    extra: deepLink ? { deepLink } : undefined,
                },
            ],
        });
    } catch (err: unknown) {
        // 알림이 안 떠도 화면은 이미 PUSH_RECEIVED_EVENT 로 갱신된다 — 조용히 넘어간다.
        console.error("[localNotifications] 포그라운드 알림 표시 실패:", err);
    }
}
