import type { PluginListenerHandle } from "@capacitor/core";

import { markNotificationRead } from "@/features/notification/api/notificationApi";
import { API_ERROR_CODE, hasApiErrorCode } from "@/shared/lib/api/apiError";
import { externalApiFetch } from "@/shared/lib/api/externalClient";
import { trackEvent } from "@/shared/lib/analytics";
import { toInternalPath } from "@/shared/lib/native/appShell";
import type { NativePlatform } from "@/shared/lib/native/platform";
import { getNativePlatform, isNativeApp } from "@/shared/lib/native/platform";

/**
 * 원격 푸시(FCM). BE가 발송한다.
 *
 * 계약 정본은 BE 위키 `Frontend-Push-Guide` 다. 이 파일이 구현하는 항목:
 *   §1 토큰 등록 · §2 토큰 해제 · §3 payload(`deepLink` 이동 + `notificationId` 읽음 처리)
 *
 * 로컬 알림(`localNotifications.ts`)과 역할이 다르다 — 로컬은 고정 일정을 기기가
 * 스스로 예약하고, 이쪽은 **언제 올지 모르는 이벤트**(새 채팅 메시지, 매칭 성사 등)를
 * 서버가 밀어 넣는다. 백그라운드에서는 JS가 돌지 않으므로 이건 서버 없이 불가능하다.
 *
 * 웹 푸시는 쓰지 않는다. `getToken`의 `vapidKey`/서비스워커 경로는 웹 전용인데,
 * 아래 모든 진입점이 `isNativeApp()`으로 막혀 있어 웹에서는 아무 일도 일어나지 않는다.
 *
 * ⚠️ 서버로 보내는 토큰은 **FCM 등록 토큰**이어야 한다. BE는 iOS/Android 모두 FCM
 * Admin SDK 한 경로로 쏘기 때문에, iOS에서 APNs 디바이스 토큰(64자 hex)을 올리면
 * 등록은 성공하고 발송만 전부 실패한다. `@capacitor-firebase/messaging`의
 * `getToken()`이 주는 값이 FCM 토큰이다(콜론이 섞인 150~170자).
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
 * 진행 중인 기기 토큰 폐기(`deleteToken`).
 *
 * 폐기는 FCM 서버 왕복이라 초 단위로 걸릴 수 있는데, 로그아웃 화면 전환을 여기에
 * 매달 이유가 없다(2026-09-08: 로그아웃이 몇 초씩 멈춰 보이던 원인 중 하나).
 * 대신 promise를 들고 있다가 **다음 토큰 발급이 시작되기 전에** 기다린다 —
 * 폐기와 재발급이 겹치면 방금 받은 새 토큰이 지워질 수 있다.
 */
let tokenDeletion: Promise<void> | null = null;

/** 폐기가 진행 중이면 끝날 때까지 기다린다. 실패는 발급을 막지 않는다. */
async function awaitTokenDeletion(): Promise<void> {
    if (!tokenDeletion) return;
    await tokenDeletion;
}

/** 네이티브 브리지가 응답하지 않아도 로그아웃·탈퇴를 이 이상 붙잡지 않는다. */
const RELEASE_TIMEOUT_MS = 3000;

/**
 * `promise`를 최대 `ms`만큼만 기다린다.
 *
 * 넘어가면 **기다리기를 포기할 뿐 요청을 취소하지는 않는다** — 이미 나간 해제
 * 요청은 그대로 BE에서 처리된다. 네이티브 브리지(APNs 미배선 등)가 응답하지
 * 않을 때 로그아웃·탈퇴가 통째로 멈추는 것만 막는 장치다.
 */
function waitAtMost(promise: Promise<unknown>, ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        const done = () => {
            clearTimeout(timer);
            resolve();
        };
        promise.then(done, done);
    });
}

/**
 * 푸시 등록 기능 플래그 겸 킬 스위치.
 *
 * BE 디바이스 토큰 API는 2026-08-27 라이브 스펙에서 확인된다
 * (`POST/DELETE /api/v1/notifications/devices`). 배포 워크플로의 Build 스텝이
 * `NEXT_PUBLIC_PUSH_ENABLED=true` 를 넣어 프로덕션에서는 켜져 있고,
 * 문제가 생기면 그 값만 빼서 되돌릴 수 있다.
 */
const isPushEnabled = (): boolean => process.env.NEXT_PUBLIC_PUSH_ENABLED === "true";

/**
 * 포그라운드에서 푸시를 받았을 때 쏘는 인앱 이벤트.
 *
 * 앱이 떠 있는 동안에는 OS가 배너를 띄우지 않을 수 있어(BE 위키 §앱 구현 노트)
 * 화면이 스스로 다시 읽어야 한다. 네이티브 레이어가 feature/라우터를 직접 알지
 * 않도록 이벤트만 쏜다 — `SANCTION_EVENT`와 같은 방식이다.
 */
export const PUSH_RECEIVED_EVENT = "ditto:push-received";

/** 열려 있는 화면(알림 센터 등)에 "다시 읽어라"고 알린다. 웹에서는 호출되지 않는다. */
function notifyPushReceived(): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(PUSH_RECEIVED_EVENT));
}

export type DevicePlatform = "IOS" | "ANDROID";

type DeviceRegistrationBody = {
    token: string;
    platform: DevicePlatform;
};

/**
 * 등록 응답.
 *
 * `registered`는 "이번 호출로 이 토큰이 내 소유가 됐는지"다. 이미 내 토큰이던
 * 재호출이면 `false`인데 **이것도 실패가 아니다**(BE 위키 §1). 성공/실패는
 * `success`가 말하고, 그건 `externalApiFetch`가 이미 예외로 갈라 준다.
 */
type DeviceRegisterResponse = {
    registered: boolean;
};

/**
 * Capacitor 플랫폼 문자열을 BE 계약의 enum으로 바꾼다.
 * BE는 대문자 IOS/ANDROID만 받는다(BE 위키 §1).
 * 웹은 등록 대상이 아니므로 null이며, 호출부가 요청을 건너뛴다.
 */
export function toDevicePlatform(platform: NativePlatform): DevicePlatform | null {
    if (platform === "ios") return "IOS";
    if (platform === "android") return "ANDROID";
    return null;
}

/** BE 계약: 같은 토큰 재등록은 멱등이다(행이 늘지 않는다). */
function postDeviceToken(token: string): Promise<DeviceRegisterResponse | null> {
    const platform = toDevicePlatform(getNativePlatform());
    if (!platform) return Promise.resolve(null);

    const body: DeviceRegistrationBody = { token, platform };

    return externalApiFetch<DeviceRegisterResponse>("/api/v1/notifications/devices", {
        method: "POST",
        body,
    });
}

/**
 * 현재 기기의 FCM 토큰을 BE에 (재)등록한다.
 *
 * 권한을 새로 묻지도, 리스너를 달지도 않는다 — 이미 초기화가 끝난 뒤 등록만
 * 되돌려야 할 때 쓴다(예: 탈퇴를 시도했다가 실패해서 해제를 취소해야 할 때).
 * 최초 초기화는 `initPushNotifications`가 담당한다.
 */
export async function registerDeviceToken(): Promise<void> {
    if (!isNativeApp() || !isPushEnabled()) return;

    try {
        // 직전 로그아웃/탈퇴의 폐기가 아직 돌고 있으면 새 토큰이 그 폐기에 휩쓸린다.
        await awaitTokenDeletion();
        const FirebaseMessaging = await loadMessaging();
        const { token } = await FirebaseMessaging.getToken();
        if (!token) return;
        await postDeviceToken(token);
    } catch (err: unknown) {
        console.error("[push] 디바이스 토큰 등록 실패:", err);
    }
}

/** 로그아웃·탈퇴 시 호출. 기기에 다른 계정이 로그인해도 이전 계정 푸시가 가지 않게 한다. */
export async function unregisterDeviceToken(token: string): Promise<void> {
    if (!isNativeApp() || !isPushEnabled() || !token) return;
    await externalApiFetch<null>(
        `/api/v1/notifications/devices/${encodeURIComponent(token)}`,
        { method: "DELETE" },
    ).catch((err: unknown) => {
        // 8301은 계정 전환 뒤 이전 계정의 로그아웃에서 나오는 정상 경로다. 무시한다.
        if (hasApiErrorCode(err, API_ERROR_CODE.DEVICE_NOT_OWNED)) return;
        // 나머지 실패도 로그아웃 자체는 막지 않는다.
        console.error("[push] 디바이스 토큰 해제 실패:", err);
    });
}

/** 알림 payload에서 딥링크를 꺼낸다. BE 계약: `data.deepLink` (BE 위키 §3). */
export function extractDeepLink(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const deepLink = (data as Record<string, unknown>).deepLink;
    return typeof deepLink === "string" ? toInternalPath(deepLink) : null;
}

/**
 * 알림 payload에서 알림 센터 행 id를 꺼낸다. BE 계약: `data.notificationId`.
 *
 * FCM 규격상 `data` 값은 **전부 문자열**이라 숫자로 되돌린다. 값이 없거나
 * 숫자가 아니면 읽음 처리를 건너뛴다 — 이동까지 막을 이유는 없다.
 */
export function extractNotificationId(data: unknown): number | null {
    if (!data || typeof data !== "object") return null;
    const raw = (data as Record<string, unknown>).notificationId;
    if (typeof raw !== "string" && typeof raw !== "number") return null;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
}

type PushOptions = {
    navigate: (path: string) => void;
};

/**
 * 푸시 권한 요청 + 토큰 등록 + 알림 탭 처리.
 *
 * 로그인 이후에 호출해야 한다. 토큰 등록 API가 인증을 요구하므로 비로그인
 * 상태에서 부르면 401이 난다.
 *
 * 반환값은 리스너 정리 함수다.
 */
export async function initPushNotifications({ navigate }: PushOptions): Promise<() => void> {
    if (!isNativeApp() || !isPushEnabled()) return () => {};

    const FirebaseMessaging = await loadMessaging();
    const handles: PluginListenerHandle[] = [];

    const submitToken = (token: string) => {
        if (!token) return;
        postDeviceToken(token).catch((err: unknown) => {
            console.error("[push] 디바이스 토큰 등록 실패:", err);
        });
    };

    // FCM 토큰은 앱 재설치·데이터 삭제·주기적 갱신으로 바뀐다. 바뀔 때마다 다시 등록한다.
    handles.push(
        await FirebaseMessaging.addListener("tokenReceived", ({ token }) => submitToken(token)),
    );

    /**
     * 앱이 떠 있는 동안 도착한 푸시.
     * 배너가 안 뜰 수 있으므로 화면이 목록·미읽음 수를 다시 읽도록 알린다.
     * 읽음 처리는 하지 않는다 — 사용자가 본 게 아니다.
     */
    handles.push(
        await FirebaseMessaging.addListener("notificationReceived", () => notifyPushReceived()),
    );

    /**
     * 알림을 탭해서 앱이 열렸을 때.
     * 탭은 곧 확인이므로 알림 센터의 행도 읽음으로 넘긴다(BE 위키 §앱 구현 노트).
     */
    handles.push(
        await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
            const { data } = event.notification;

            const notificationId = extractNotificationId(data);
            // 읽음 처리는 화면 이동을 막을 만한 작업이 아니므로 실패해도 조용히 넘어간다.
            if (notificationId !== null) {
                void markNotificationRead(notificationId)
                    // 알림 센터가 떠 있다면(딥링크가 없어 이동하지 않는 경우 등)
                    // 방금 바뀐 읽음 상태를 반영해야 한다.
                    .then(() => notifyPushReceived())
                    .catch(() => undefined);
            }

            // `deepLink` 키가 아예 없을 수 있다(BE 위키 §3) — 그때는 앱만 열고 끝낸다.
            const path = extractDeepLink(data);
            // 딥링크 경로 자체는 싣지 않는다 — 방 번호가 그대로 들어 있다. 유무만 본다.
            trackEvent("notification_open", { has_deep_link: path !== null });
            if (path) navigate(path);
        }),
    );

    try {
        const permission = await FirebaseMessaging.requestPermissions();
        /*
         * 거절률이 높으면 재방문이 통째로 막힌다 — 이 서비스는 주 단위 이벤트(매칭 결과,
         * 대화 시작)를 푸시로 알리기 때문에, 권한이 없으면 돌아올 계기 자체가 사라진다.
         */
        trackEvent("push_permission_result", { granted: permission.receive === "granted" });
        if (permission.receive === "granted") {
            // 계정 전환 직후라면 이전 계정의 토큰 폐기가 끝난 뒤에 발급받아야 한다.
            await awaitTokenDeletion();
            // tokenReceived 는 갱신 시에만 오므로, 최초 1회는 직접 가져와야 한다.
            const { token } = await FirebaseMessaging.getToken();
            submitToken(token);
        }
    } catch (err: unknown) {
        /**
         * iOS는 APNs 배선(GoogleService-Info.plist 번들 등록 + APNs 키 업로드)이
         * 끝나기 전까지 `getToken()`이 실패한다. 여기서 그대로 던지면 위에서 등록한
         * 리스너를 정리할 방법이 사라지므로(정리 함수를 못 돌려준다) 삼킨다.
         */
        console.error("[push] 토큰 발급 실패:", err);
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
 * ⚠️ **세션이 아직 살아 있을 때 호출해야 한다.** 1번이 인증을 요구하므로
 * 로그아웃/탈퇴 요청보다 **먼저** 불러야 한다. 순서가 뒤집히면 401 → refresh
 * 재시도 → 실패로 끝나 BE에 토큰이 남고, 이 기기로 이전 계정 알림이 계속 온다.
 *
 * 기다리는 것은 1번뿐이다(2번은 세션과 무관해 백그라운드로 넘긴다).
 * 어느 쪽이 실패해도, 응답이 없어도(3초 상한) 로그아웃 자체는 막지 않는다.
 */
export async function releasePushToken(): Promise<void> {
    if (!isNativeApp()) return;
    await waitAtMost(unlinkThenDiscardToken(), RELEASE_TIMEOUT_MS);
}

async function unlinkThenDiscardToken(): Promise<void> {
    try {
        const FirebaseMessaging = await loadMessaging();
        // 해제 요청에 토큰이 필요하므로 폐기 전에 먼저 읽는다.
        const { token } = await FirebaseMessaging.getToken();
        // BE 해제는 **세션이 살아 있는 동안** 끝내야 하므로 여기서 기다린다.
        await unregisterDeviceToken(token);
        // 기기 토큰 폐기는 세션과 무관하다. 기다리지 않는다(위 tokenDeletion 주석).
        tokenDeletion = FirebaseMessaging.deleteToken()
            .catch((err: unknown) => {
                console.error("[push] 기기 토큰 폐기 실패:", err);
            })
            .finally(() => {
                tokenDeletion = null;
            });
    } catch (err: unknown) {
        console.error("[push] 토큰 해제 실패:", err);
    }
}
