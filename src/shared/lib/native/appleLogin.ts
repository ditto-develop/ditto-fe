import { getNativePlatform, isNativeApp } from "@/shared/lib/native/platform";

/**
 * Sign in with Apple.
 *
 * 왜 넣는가: App Store 가이드라인 4.8 은 제3자 소셜 로그인으로 계정을 만드는 앱에
 * **동등한 로그인 수단**을 하나 더 요구한다. 카카오는 이메일 비공개를 제공하지 않아 요건을
 * 못 채운다. 즉 이건 선택 기능이 아니라 **심사 통과 조건**이다.
 *
 * 경로가 둘이다 (BE 위키 `Frontend-Apple-Login-Guide`):
 * - **iOS 앱** — 네이티브 SDK 로 identityToken 을 받아 웹뷰(JS)가 교환한다. 이 파일이 그 몫이다.
 * - **웹 · 안드로이드 앱** — 카카오와 똑같은 리다이렉트(`startExternalSocialLogin("APPLE")`).
 *   네이티브 조각이 필요 없어 이 파일을 거치지 않는다.
 *
 * 네이티브 구현은 리포 안의 로컬 플러그인이다: native-plugins/capacitor-apple-login/
 */

/** 네이티브 플러그인 이름. Swift 의 jsName 과 같아야 한다. */
const PLUGIN_NAME = "AppleLogin";

/** 네이티브 플러그인이 취소를 알리는 약속된 문자열. 폴백 여부를 이걸로 가른다. */
const CANCELLED_MESSAGE = "USER_CANCELLED";

type AppleLoginPlugin = {
    /**
     * 애플 인증 시트를 띄운다. 성공하면 서버가 검증할 재료를 준다.
     * `rawNonce` 는 네이티브가 만든 **원본**이다(애플에는 그 SHA-256 이 갔다).
     */
    login(): Promise<{
        identityToken: string;
        rawNonce: string;
        /** 최초 인가 1회만 값이 있다. 재로그인에서는 null. */
        name?: string | null;
        /** 서버가 쓰지 않는다. 폐기(revoke) 정책이 생기면 쓰려고 남겨 둔 값. */
        authorizationCode?: string | null;
    }>;
};

export type NativeAppleLoginOutcome =
    /** identityToken 확보. 이제 웹뷰가 우리 JWT 로 교환한다. */
    | { status: "success"; identityToken: string; rawNonce: string; name: string | null }
    /** 사용자가 스스로 취소했다. **폴백하지 말 것** — 다른 로그인 창을 띄우면 안 된다. */
    | { status: "cancelled" }
    /** 웹이거나, iOS 가 아니거나, 플래그가 꺼져 있다. */
    | { status: "unavailable" }
    /** 네이티브에서 실패했다. 호출부가 안내만 하고 다른 로그인 수단을 남겨 둔다. */
    | { status: "failed"; message: string };

/**
 * 애플 로그인 킬 스위치. **앱·웹 양쪽에 함께 적용된다.**
 *
 * ⚠️ **BE 가 배포되기 전에는 켜지 않는다.** 2026-09-07 기준 라이브 스펙
 * (`https://api.ditto.pics/docs/openapi.yaml`)에 `apple` 이 아직 없다 —
 * 앱(PR #164)·웹(PR #166) 둘 다 리뷰 중이다.
 *
 * 웹 경로는 그 위에 조건이 하나 더 있다: 애플 개발자 콘솔에 **Services ID 와 Return URL**
 * 이 등록돼야 애플이 인가 요청을 받아 준다(BE 위키 §6). 등록 전에 켜면 버튼이 보이고
 * 누르면 애플 화면에서 거절된다.
 *
 * 켜는 법은 푸시·카카오와 같다: 배포 워크플로 Build 스텝 `env:` 에
 * `NEXT_PUBLIC_APPLE_LOGIN_ENABLED: 'true'` 한 줄을 더하고, 되돌릴 때 그 줄을 지운다.
 */
export function isAppleLoginEnabled(): boolean {
    return process.env.NEXT_PUBLIC_APPLE_LOGIN_ENABLED === "true";
}

/**
 * 네이티브 SDK 경로를 탈 수 있는지. **iOS 앱에서만 true.**
 *
 * 안드로이드 앱과 웹은 false 다 — 리다이렉트 경로를 탄다. 안드로이드에서 네이티브
 * Sign in with Apple 은 존재하지 않는다.
 */
export function isNativeAppleLoginAvailable(): boolean {
    return isNativeApp() && getNativePlatform() === "ios" && isAppleLoginEnabled();
}

/**
 * 플러그인 프록시. 웹 번들에도 같은 코드가 실려 있으므로 **게이트를 통과한 뒤에만** 만든다.
 * registerPlugin 은 정적 평가 시점에 Capacitor 전역을 건드리므로 모듈 최상단에 두지 않는다.
 */
let pluginPromise: Promise<AppleLoginPlugin> | null = null;

function loadPlugin(): Promise<AppleLoginPlugin> {
    if (!pluginPromise) {
        pluginPromise = import("@capacitor/core").then(({ registerPlugin }) =>
            registerPlugin<AppleLoginPlugin>(PLUGIN_NAME),
        );
    }
    return pluginPromise;
}

function toMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return "Apple 로그인에 실패했습니다.";
}

/**
 * 애플 인증을 시도한다. **던지지 않는다** — 호출부가 분기로 처리하도록 모든 실패를
 * outcome 으로 돌려준다. 로그인 버튼이 예외로 죽는 일이 없어야 한다.
 */
export async function loginWithAppleSdk(): Promise<NativeAppleLoginOutcome> {
    if (!isNativeAppleLoginAvailable()) return { status: "unavailable" };

    try {
        const plugin = await loadPlugin();
        const { identityToken, rawNonce, name } = await plugin.login();

        if (!identityToken) {
            return { status: "failed", message: "Apple identityToken 이 비어 있습니다." };
        }

        return { status: "success", identityToken, rawNonce, name: name ?? null };
    } catch (err: unknown) {
        const message = toMessage(err);
        if (message.includes(CANCELLED_MESSAGE)) return { status: "cancelled" };
        console.error("[appleLogin] Apple 로그인 실패:", err);
        return { status: "failed", message };
    }
}
