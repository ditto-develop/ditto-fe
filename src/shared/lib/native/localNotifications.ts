import type { PluginListenerHandle } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

import { toInternalPath } from "@/shared/lib/native/appShell";
import { KST_WEEKDAY, upcomingKstWeekly } from "@/shared/lib/native/kstSchedule";
import { isNativeApp } from "@/shared/lib/native/platform";

/**
 * 로컬 알림 — **서버 없이** 기기가 스스로 예약해서 띄운다.
 *
 * Ditto의 주간 리추얼이 고정 일정이라 가능하다(이용약관 제11조). 지금 BE에는
 * 푸시 발송 인프라가 없지만(BE-Request-App §B), 아래 두 시점은 클라이언트가 이미
 * 알고 있어 대기 없이 붙일 수 있다.
 *
 * ⚠️ 원격 푸시를 대체하지 못한다. "새 채팅 메시지"처럼 **언제 올지 모르는** 알림은
 * 서버가 깨워주지 않으면 불가능하다 — 앱이 백그라운드면 JS가 아예 돌지 않는다.
 *
 * 📌 iOS에서 로컬 알림과 원격 푸시는 **같은 권한**(UNUserNotificationCenter)이다.
 * 여기서 승인을 받아두면 나중에 BE 푸시가 붙을 때 재요청이 필요 없다.
 */

/** 예약해 둘 주 수. 앱을 한동안 안 열어도 알림이 이어지도록 여유를 둔다. */
const WEEKS_AHEAD = 8;

/**
 * iOS는 대기 중인 로컬 알림을 **64개까지만** 유지한다.
 * 2종 × 8주 = 16개로 한참 여유가 있지만, 종류를 늘릴 때 이 한도를 기억할 것.
 */
const ID_BASE = {
    MATCHING_DAY: 1000,
    CHAT_CLOSING: 2000,
} as const;

type RitualNotification = {
    idBase: number;
    weekday: number;
    /** KST 기준 발송 시각(정각). */
    hour: number;
    title: string;
    body: string;
    deepLink: string;
};

/**
 * 예약 대상.
 *
 * 발송 시각은 제품 결정이며 바꿔도 된다. 지금 값의 근거:
 * - 매칭 결과는 목요일 00:00에 열리지만 **자정에 알림을 보낼 수는 없다.**
 *   창이 23:59에 닫히므로 아침에 보내야 하루를 온전히 쓴다.
 * - 채팅방은 일요일 23:59에 일괄 마감된다. 20:00이면 마지막 대화를 나눌 여유가 있다.
 */
const RITUALS: RitualNotification[] = [
    {
        idBase: ID_BASE.MATCHING_DAY,
        weekday: KST_WEEKDAY.THURSDAY,
        hour: 9,
        title: "매칭 결과가 나왔어요",
        body: "오늘 자정까지 확인하고 매칭을 신청할 수 있어요.",
        deepLink: "/matching/",
    },
    {
        idBase: ID_BASE.CHAT_CLOSING,
        weekday: KST_WEEKDAY.SUNDAY,
        hour: 20,
        title: "채팅방이 곧 닫혀요",
        body: "오늘 23:59에 대화가 마감돼요.",
        deepLink: "/chat/",
    },
];

/** 이 모듈이 관리하는 알림 id 전체. 재예약 전에 지우는 대상이다. */
function managedIds(): number[] {
    return RITUALS.flatMap((ritual) =>
        Array.from({ length: WEEKS_AHEAD }, (_, week) => ritual.idBase + week),
    );
}

/**
 * 주간 리추얼 알림을 다시 예약한다.
 *
 * 앱을 열 때마다 호출해도 안전하다 — 같은 id로 덮어쓰기 전에 기존 예약을 지우므로
 * 중복이 쌓이지 않고, 지나간 주가 자동으로 밀려난다.
 */
async function rescheduleRituals(now: Date = new Date()): Promise<void> {
    const pending = await LocalNotifications.getPending();
    const ours = new Set(managedIds());
    const toCancel = pending.notifications.filter((n) => ours.has(n.id));
    if (toCancel.length > 0) {
        await LocalNotifications.cancel({ notifications: toCancel.map(({ id }) => ({ id })) });
    }

    const notifications = RITUALS.flatMap((ritual) =>
        upcomingKstWeekly(ritual.weekday, ritual.hour, WEEKS_AHEAD, now).map((at, week) => ({
            id: ritual.idBase + week,
            title: ritual.title,
            body: ritual.body,
            schedule: { at },
            extra: { deepLink: ritual.deepLink },
        })),
    );

    await LocalNotifications.schedule({ notifications });
}

type LocalNotificationOptions = {
    navigate: (path: string) => void;
};

/**
 * 로컬 알림 초기화. 웹에서는 아무것도 하지 않는다.
 *
 * 로그인 이후에 호출한다 — 비로그인 사용자에게 매칭 알림을 예약할 이유가 없고,
 * 권한 요청은 앱의 가치를 이해한 뒤에 뜨는 편이 승인률이 높다.
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

    const permission = await LocalNotifications.requestPermissions();
    if (permission.display === "granted") {
        await rescheduleRituals();
    }
    // 거부됐다면 다시 묻지 않는다. iOS는 한 번 거부하면 앱에서 재요청이 불가능하고,
    // OS 설정으로 유도하는 것 외에 방법이 없다.

    return () => {
        handles.forEach((handle) => {
            handle.remove().catch(() => {});
        });
    };
}

/** 로그아웃·탈퇴 시 예약을 지운다. 다른 계정으로 로그인해도 남지 않도록. */
export async function clearScheduledNotifications(): Promise<void> {
    if (!isNativeApp()) return;
    try {
        const pending = await LocalNotifications.getPending();
        const ours = new Set(managedIds());
        const toCancel = pending.notifications.filter((n) => ours.has(n.id));
        if (toCancel.length > 0) {
            await LocalNotifications.cancel({ notifications: toCancel.map(({ id }) => ({ id })) });
        }
    } catch (err: unknown) {
        console.error("[localNotifications] 예약 정리 실패:", err);
    }
}
