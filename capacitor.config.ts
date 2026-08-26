import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor 앱 셸 설정.
 *
 * 이 앱은 **원격 URL 로드** 방식이다. 웹 번들을 앱에 넣지 않고 이미 배포된
 * CloudFront 도메인을 웹뷰가 그대로 연다. 그래서:
 *   - 화면 수정은 기존 S3/CloudFront 파이프라인 배포만으로 앱에도 즉시 반영된다.
 *   - 카카오맵 JS SDK의 도메인 등록(ditto.pics)이 앱에서도 그대로 유효하다.
 *   - BE CORS/쿠키 설정에 capacitor://localhost 같은 새 origin을 추가할 필요가 없다.
 *
 * `webDir`은 Capacitor CLI가 요구해서 남겨둔 값이고 실제로 서빙되지 않는다.
 */

/** 빌드 대상 환경. staging 앱은 test.ditto.pics를 본다. */
const SERVER_URL = process.env.CAPACITOR_SERVER_URL ?? "https://ditto.pics";

const config: CapacitorConfig = {
    appId: "pics.ditto.app",
    appName: "Ditto",
    webDir: "out",
    server: {
        url: SERVER_URL,
        // 원격 로드지만 전 구간 https라 cleartext는 불필요하다.
        cleartext: false,
        androidScheme: "https",
        /**
         * 웹뷰 안에서 그대로 열려야 하는 도메인.
         * 카카오 소셜 로그인은 BE(api.ditto.pics) → 카카오 → /auth/callback 으로
         * 이어지는 리다이렉트 체인이라, 중간 도메인이 외부 브라우저로 빠지면
         * 콜백이 앱으로 돌아오지 못한다. 체인 전체를 웹뷰에 묶어둔다.
         */
        allowNavigation: [
            "ditto.pics",
            "*.ditto.pics",
            "kauth.kakao.com",
            "accounts.kakao.com",
            "*.kakao.com",
        ],
    },
    ios: {
        // 노치/홈 인디케이터는 CSS의 env(safe-area-inset-*)로 처리한다(globals.css).
        contentInset: "never",
    },
    android: {
        /**
         * 웹뷰가 그려지기 전 배경색. 네이티브 셸이라 CSS 토큰을 읽을 수 없어
         * --color-atomic-neutral-95 (= --color-semantic-background-normal-normal)
         * 값을 복제한다. 토큰이 바뀌면 여기도 같이 바꿔야 한다.
         */
        backgroundColor: "#E9E6E2",
    },
    plugins: {
        PushNotifications: {
            presentationOptions: ["badge", "sound", "alert"],
        },
    },
};

export default config;
