import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

import { getNativePlatform, isNativeApp } from "@/shared/lib/native/platform";
import { closeTopOverlay } from "@/shared/lib/overlayStack";
import { normalizePathname } from "@/shared/lib/routePath";

/**
 * 앱 웹뷰가 여는 정본 호스트. 딥링크 URL에서 경로만 뽑아낼 때 기준이 된다.
 *
 * 접두사 매칭(`startsWith`/앵커 없는 정규식)을 쓰면 `ditto.pics.evil.com` 같은
 * 호스트가 통과해 공격자가 앱을 임의 경로로 끌고 갈 수 있다. 반드시 호스트
 * 전체를 정확히 비교한다.
 */
const ALLOWED_HOSTS = new Set([
    "ditto.pics",       // 정본. 앱·웹 모두 이 호스트를 본다
    "www.ditto.pics",   // CloudFront 에서 아펙스로 301 되지만 링크가 이 형태로 올 수 있다
    // alpha.ditto.pics 를 도입하면 여기에 추가한다(2026-08-26 시점에는 없다).
    // 존재하지 않는 호스트를 미리 넣지 않는다 — 딥링크 payload 가 통과하는 집합이라
    // 그대로 공격 표면이 된다.
]);

/**
 * 뒤로가기가 "앱 종료"로 끝나야 하는 뿌리 화면.
 *
 * 여기서 `canGoBack` 만 믿고 `history.back()` 을 부르면 **웹뷰 히스토리**를 소비한다.
 * 그 히스토리에는 우리 화면만 있는 게 아니다 — 리다이렉트 로그인(네이티브 카카오
 * 로그인이 실패했을 때의 폴백)은 웹뷰가 kauth.kakao.com 을 직접 열기 때문에, 그
 * 세션에서는 홈에서 뒤로가기를 누른 사용자가 **카카오 로그인 페이지로 되돌아간다**.
 * 로그인 화면(`/`)도 마찬가지로 뒤에 아무것도 없어야 한다.
 *
 * 뿌리 화면에서 뒤로가기 = 앱 종료는 Android 의 표준 동작이기도 하다.
 */
const ROOT_PATHS = new Set(["/", "/home"]);

type AppShellOptions = {
    /** 앱 내부 라우팅. Next 라우터의 push를 넘긴다. */
    navigate: (path: string) => void;
};

/**
 * 딥링크 URL을 앱 내부 경로로 바꾼다.
 *
 * 푸시 알림 탭이나 유니버설 링크로 들어오는 값은 전체 URL(`https://ditto.pics/chat/...`)
 * 이거나 이미 경로(`/chat/...`)일 수 있다. 우리 도메인이 아니면 null을 돌려주고
 * 호출부가 무시한다 — 외부 URL을 앱 라우터에 그대로 먹이지 않기 위함이다.
 */
export function toInternalPath(url: string): string | null {
    if (!url) return null;
    if (url.startsWith("/")) return url;

    try {
        const parsed = new URL(url);
        // 스킴까지 확인한다 — javascript:, data: 등이 호스트 검사를 우회하지 못하게.
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
        if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) return null;
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return null;
    }
}

/**
 * 네이티브 셸 초기화. 웹에서는 아무것도 하지 않는다.
 *
 * 반환값은 정리 함수이며 등록한 리스너를 모두 해제한다.
 */
export async function initAppShell({ navigate }: AppShellOptions): Promise<() => void> {
    if (!isNativeApp()) return () => {};

    const handles: PluginListenerHandle[] = [];

    // iOS는 상태바가 웹뷰 위에 겹치지 않도록 기본값을 쓰고, 밝은 배경이므로
    // 아이콘은 어둡게(Style.Light = 어두운 콘텐츠) 둔다.
    if (getNativePlatform() === "ios") {
        await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    }

    /**
     * Android 하드웨어 뒤로가기.
     * 기본 동작은 "앱 종료"라서, 연결하지 않으면 채팅방에서 뒤로가기를 누른
     * 사용자가 앱 밖으로 튕긴다. 웹 히스토리가 남아 있으면 히스토리를 먼저 소비한다.
     *
     * 판정 순서가 중요하다:
     *  1. 오버레이(모달·바텀시트)가 떠 있으면 그것만 닫고 히스토리는 건드리지 않는다.
     *     `ROOT_PATHS` 보다 먼저 봐야 한다 — 홈에도 모달이 여러 개 있고, 순서가
     *     뒤집히면 모달을 닫으려던 뒤로가기가 앱을 종료시킨다.
     *  2. 뿌리 화면이면 앱을 종료한다. 자세한 이유는 `ROOT_PATHS` 주석을 볼 것.
     *  3. 그 밖에는 히스토리를 소비한다.
     */
    handles.push(
        await App.addListener("backButton", ({ canGoBack }) => {
            if (closeTopOverlay()) return;
            if (ROOT_PATHS.has(normalizePathname(window.location.pathname))) {
                App.exitApp().catch(() => {});
                return;
            }
            if (canGoBack) {
                window.history.back();
                return;
            }
            App.exitApp().catch(() => {});
        }),
    );

    /** 푸시 알림 탭·유니버설 링크로 앱이 열릴 때의 딥링크. */
    handles.push(
        await App.addListener("appUrlOpen", ({ url }) => {
            const path = toInternalPath(url);
            if (path) navigate(path);
        }),
    );

    return () => {
        handles.forEach((handle) => {
            handle.remove().catch(() => {});
        });
    };
}
