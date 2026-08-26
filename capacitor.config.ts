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

/**
 * 빌드 대상 환경.
 *
 * Route53 이전(2026-08-26)으로 아펙스 `ditto.pics` 가 살아났다. 아펙스가 정본이며
 * `www` 는 CloudFront 에서 아펙스로 301 된다. 앱도 같은 호스트를 본다.
 *
 * 앱 전용 서브도메인(`app.ditto.pics`)은 두지 않기로 했다. 원래 명분이
 * "CloudFront 함수를 안 건드리고 앱을 붙인다" 였는데, 아펙스 정본이면 함수를
 * 건드릴 이유가 없어 명분이 사라졌다. CloudFront 별칭 등록도 아낀다.
 *
 * 개발·테스트는 `npm run cap:staging`(→ `test.ditto.pics`).
 * ⚠️ 단 `test.ditto.pics` 는 Route53 이전 때 누락되어 현재 죽어 있다 —
 *    Route53 에 A(Alias) 레코드를 다시 만들어야 한다.
 */
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
