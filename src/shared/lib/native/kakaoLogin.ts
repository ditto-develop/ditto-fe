import { isNativeApp } from "@/shared/lib/native/platform";

/**
 * 네이티브 카카오 SDK 로그인.
 *
 * 앱에서만 쓰인다. 웹의 리다이렉트 로그인(startExternalSocialLogin)은 **유일한 웹 경로라
 * 대체하지 않는다** — 여기는 분기만 추가한다.
 *
 * 역할 분담이 중요하다. 네이티브가 맡는 것은 **카카오 SDK 로그인 한 조각뿐**이고,
 * 받아온 카카오 accessToken 을 우리 JWT 로 교환하는 요청은 웹뷰(JS)가 보낸다.
 * 네이티브가 교환까지 하면 refreshToken 쿠키가 네이티브 쿠키 저장소로 들어가
 * 웹뷰가 보지 못한다(loginWithExternalKakaoNative 주석 참고).
 *
 * 네이티브 구현은 리포 안의 로컬 플러그인이다: native-plugins/capacitor-kakao-login/
 */

/** 네이티브 플러그인 이름. Swift 의 jsName, Kotlin 의 @CapacitorPlugin(name=) 과 같아야 한다. */
const PLUGIN_NAME = "KakaoLogin";

/** 네이티브 플러그인이 취소를 알리는 약속된 문자열. 폴백 여부를 이걸로 가른다. */
const CANCELLED_MESSAGE = "USER_CANCELLED";

type KakaoLoginPlugin = {
    /** 카카오 SDK 로그인. 성공하면 카카오가 발급한 accessToken 을 준다. */
    login(): Promise<{ accessToken: string }>;
    /** 카카오 세션 로그아웃. 우리 세션과는 무관하다. */
    logout(): Promise<void>;
};

export type NativeKakaoLoginOutcome =
    /** 카카오 accessToken 확보. 이제 웹뷰가 우리 JWT 로 교환한다. */
    | { status: "success"; accessToken: string }
    /** 사용자가 스스로 취소했다. **폴백하지 말 것** — 리다이렉트 로그인으로 끌고 가면 안 된다. */
    | { status: "cancelled" }
    /** 웹이거나 플래그가 꺼져 있다. 기존 리다이렉트 로그인을 쓴다. */
    | { status: "unavailable" }
    /** 네이티브에서 실패했다. 기존 리다이렉트 로그인으로 폴백한다. */
    | { status: "failed"; message: string };

/**
 * 네이티브 로그인 킬 스위치.
 *
 * 카카오 개발자 콘솔의 네이티브 앱 키 발급과 플랫폼(iOS bundle id / Android 패키지·키해시)
 * 등록이 끝나기 전에는 켜면 안 된다 — 켜도 런타임에만 실패하고 폴백으로 흘러가지만,
 * 사용자가 실패 한 번을 겪게 된다. 절차는 docs/app-shell-runbook.md 참고.
 *
 * 푸시(NEXT_PUBLIC_PUSH_ENABLED)와 같은 방식이다: 배포 워크플로에 한 줄을 더하면 켜지고,
 * 그 줄을 지우면 되돌아간다.
 */
const isNativeKakaoLoginEnabled = (): boolean =>
    process.env.NEXT_PUBLIC_NATIVE_KAKAO_LOGIN_ENABLED === "true";

/** 앱이면서 플래그가 켜져 있을 때만 네이티브 경로를 탄다. 웹에서는 항상 false. */
export function isNativeKakaoLoginAvailable(): boolean {
    return isNativeApp() && isNativeKakaoLoginEnabled();
}

/**
 * 플러그인 프록시. 웹 번들에도 같은 코드가 실려 있으므로 **게이트를 통과한 뒤에만** 만든다.
 * registerPlugin 은 정적 평가 시점에 Capacitor 전역을 건드리므로 모듈 최상단에 두지 않는다.
 */
let pluginPromise: Promise<KakaoLoginPlugin> | null = null;

function loadPlugin(): Promise<KakaoLoginPlugin> {
    if (!pluginPromise) {
        pluginPromise = import("@capacitor/core").then(({ registerPlugin }) =>
            registerPlugin<KakaoLoginPlugin>(PLUGIN_NAME),
        );
    }
    return pluginPromise;
}

function toMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return "네이티브 카카오 로그인에 실패했습니다.";
}

/**
 * 카카오 SDK 로그인을 시도한다. **던지지 않는다** — 호출부가 분기로 처리하도록
 * 모든 실패를 outcome 으로 돌려준다. 로그인 버튼이 예외로 죽는 일이 없어야 한다.
 */
export async function loginWithKakaoSdk(): Promise<NativeKakaoLoginOutcome> {
    if (!isNativeKakaoLoginAvailable()) return { status: "unavailable" };

    try {
        const plugin = await loadPlugin();
        const { accessToken } = await plugin.login();
        if (!accessToken) return { status: "failed", message: "카카오 accessToken 이 비어 있습니다." };
        return { status: "success", accessToken };
    } catch (err: unknown) {
        const message = toMessage(err);
        if (message.includes(CANCELLED_MESSAGE)) return { status: "cancelled" };
        console.error("[kakaoLogin] 네이티브 카카오 로그인 실패:", err);
        return { status: "failed", message };
    }
}
