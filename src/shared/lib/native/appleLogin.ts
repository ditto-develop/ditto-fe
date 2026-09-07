import { getNativePlatform, isNativeApp } from "@/shared/lib/native/platform";

/**
 * Sign in with Apple (iOS 앱 전용).
 *
 * 왜 넣는가: App Store 가이드라인 4.8 은 제3자 소셜 로그인으로 계정을 만드는 앱에
 * **동등한 로그인 수단**을 하나 더 요구한다. 그 수단은 이름·이메일만 수집하고, 이메일을
 * 비공개로 둘 수 있어야 하며, 광고 목적으로 앱 내 행동을 수집하지 않아야 한다. 카카오는
 * 이메일 비공개를 제공하지 않아 요건을 못 채운다. 즉 이건 선택 기능이 아니라 **심사 통과
 * 조건**이다.
 *
 * 구조는 카카오 네이티브 로그인(kakaoLogin.ts)과 같다. 네이티브가 맡는 것은 애플
 * identityToken 을 받아오는 한 조각뿐이고, 우리 JWT 로 교환하는 요청은 웹뷰(JS)가 보낸다
 * (loginWithExternalAppleNative 주석 참고).
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
     * nonce 는 네이티브가 만든 **원본**이다(애플에는 그 SHA-256 이 갔다).
     */
    login(): Promise<{
        identityToken: string;
        authorizationCode?: string | null;
        nonce: string;
        fullName?: string | null;
    }>;
};

export type NativeAppleLoginOutcome =
    /** identityToken 확보. 이제 웹뷰가 우리 JWT 로 교환한다. */
    | {
          status: "success";
          identityToken: string;
          authorizationCode: string | null;
          nonce: string;
          fullName: string | null;
      }
    /** 사용자가 스스로 취소했다. **폴백하지 말 것** — 카카오 로그인으로 끌고 가면 안 된다. */
    | { status: "cancelled" }
    /** 웹이거나, iOS 가 아니거나, 플래그가 꺼져 있다. 버튼 자체를 감춘다. */
    | { status: "unavailable" }
    /** 네이티브에서 실패했다. 호출부가 안내만 하고 다른 로그인 수단을 남겨 둔다. */
    | { status: "failed"; message: string };

/**
 * 애플 로그인 킬 스위치.
 *
 * ⚠️ **BE 의 `/api/v1/users/social-login/apple/native` 가 배포되기 전에는 켜지 않는다.**
 * 켜면 버튼이 보이고, 누르면 교환 단계에서 실패한다 — 카카오와 달리 폴백할 다른 애플
 * 경로가 없어 사용자에게 그대로 실패로 보인다.
 *
 * 켜는 법은 푸시·카카오와 같다: 배포 워크플로 Build 스텝 `env:` 에
 * `NEXT_PUBLIC_NATIVE_APPLE_LOGIN_ENABLED: 'true'` 한 줄을 더하고, 되돌릴 때 그 줄을 지운다.
 */
const isNativeAppleLoginEnabled = (): boolean =>
    process.env.NEXT_PUBLIC_NATIVE_APPLE_LOGIN_ENABLED === "true";

/**
 * iOS 앱이면서 플래그가 켜져 있을 때만 노출한다.
 *
 * 안드로이드에서는 false 다 — Sign in with Apple 은 4.8 을 만족시키려고 넣는 것이고
 * 그 요구는 App Store 에만 있다. 안드로이드에 웹 흐름을 얹으면 계정 체계만 복잡해진다.
 * 웹에서도 항상 false — 웹은 카카오 리다이렉트 하나로 유지한다.
 */
export function isNativeAppleLoginAvailable(): boolean {
    return isNativeApp() && getNativePlatform() === "ios" && isNativeAppleLoginEnabled();
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
        const { identityToken, authorizationCode, nonce, fullName } = await plugin.login();

        if (!identityToken) {
            return { status: "failed", message: "Apple identityToken 이 비어 있습니다." };
        }

        return {
            status: "success",
            identityToken,
            authorizationCode: authorizationCode ?? null,
            nonce,
            fullName: fullName ?? null,
        };
    } catch (err: unknown) {
        const message = toMessage(err);
        if (message.includes(CANCELLED_MESSAGE)) return { status: "cancelled" };
        console.error("[appleLogin] Apple 로그인 실패:", err);
        return { status: "failed", message };
    }
}
