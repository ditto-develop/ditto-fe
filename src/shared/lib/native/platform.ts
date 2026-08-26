import { Capacitor } from "@capacitor/core";

export type NativePlatform = "ios" | "android" | "web";

/**
 * Capacitor 네이티브 셸(웹뷰) 안에서 실행 중인지 여부.
 *
 * User-Agent 스니핑이 아니라 Capacitor가 웹뷰에 주입하는 네이티브 브릿지 유무로
 * 판정한다. 일반 브라우저에서는 항상 false이므로 이 값으로 감싼 모든 분기는
 * 웹 동작에 영향을 주지 않는다.
 *
 * 원격 URL 로드(capacitor.config.ts의 server.url) 방식이라 같은 번들이 웹과 앱
 * 양쪽에서 실행된다. 웹 경로를 절대 교체하지 말고 분기만 추가할 것.
 */
export function isNativeApp(): boolean {
    if (typeof window === "undefined") return false;
    return Capacitor.isNativePlatform();
}

export function getNativePlatform(): NativePlatform {
    if (typeof window === "undefined") return "web";
    const platform = Capacitor.getPlatform();
    return platform === "ios" || platform === "android" ? platform : "web";
}
