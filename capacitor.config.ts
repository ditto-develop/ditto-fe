import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
 * staging 환경은 두지 않는다(2026-08-26). `npm run cap:sync` 가 이 값을 그대로 쓴다.
 * alpha.ditto.pics 를 도입하면 그때는
 * `CAPACITOR_SERVER_URL=https://alpha.ditto.pics npm run cap:sync` 로 빌드한다.
 */
const SERVER_URL = process.env.CAPACITOR_SERVER_URL ?? "https://ditto.pics";

/**
 * 카카오 네이티브 앱 키를 읽는다.
 *
 * `npx cap sync` 는 Next 가 아니라 Capacitor CLI 가 이 파일을 평가하므로 `.env.local`
 * 이 자동으로 로드되지 않는다(dotenv 미설치). 키를 매번 인라인 환경변수로 넘기게 하면
 * 빠뜨리기 쉬워서 — 빠뜨려도 빌드는 통과하고 런타임에만 실패한다 — 프로젝트 관례대로
 * `.env.local` 한 곳을 보게 한다. 환경변수가 있으면 그쪽이 항상 우선한다(CI).
 *
 * 이름에 `NEXT_PUBLIC_` 을 붙이지 않는다 — 이 앱은 원격 URL 로드라 웹 번들이 곧 공개
 * 자산이고, 이 키는 클라이언트 코드에서 절대 참조하지 않는다.
 *
 * 같은 값을 android/app/build.gradle 이 한 번 더 읽는다(리다이렉트 스킴용).
 * 두 곳이 어긋나면 카카오톡에서 앱으로 돌아오지 못하므로 우선순위를 똑같이 맞췄다.
 */
const KAKAO_APP_KEY_VAR = "KAKAO_NATIVE_APP_KEY";

function readKakaoNativeAppKey(): string {
    const fromEnv = process.env[KAKAO_APP_KEY_VAR];
    if (fromEnv) return fromEnv;

    try {
        const lines = readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n");
        const hit = lines.find((line) => line.trimStart().startsWith(`${KAKAO_APP_KEY_VAR}=`));
        if (hit) {
            return hit.slice(hit.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
        }
    } catch {
        // .env.local 이 없는 환경(CI 등)에서는 환경변수만 쓴다.
    }

    return "";
}

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
         * 원격 URL 을 열지 못했을 때 대신 띄우는 **번들 안** 화면.
         *
         * 없으면 웹뷰의 기본 오류 페이지(흰 화면 + 영문 에러)가 그대로 보인다. 심사망이
         * 느리거나 CloudFront 가 흔들리는 순간이 하필 리뷰 시점이면 "앱이 실행되지 않는다"
         * (가이드라인 2.1)로 리젝된다 — 원격 URL 로드 앱에서 가장 흔한 사고다.
         *
         * `public/app-offline.html` → 빌드 시 `out/` 로 복사되고 `cap sync` 가 네이티브
         * 번들에 넣는다. 경로는 webDir 기준이다.
         */
        errorPath: "app-offline.html",
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
        /**
         * 카카오 네이티브 로그인(native-plugins/capacitor-kakao-login)의 앱 키.
         *
         * 값의 출처와 우선순위는 readKakaoNativeAppKey() 를 볼 것. 이 앱은 **원격 URL
         * 로드**라 웹 번들이 곧 공개 자산이므로, 이 키는 클라이언트 코드에서 절대
         * 참조하지 않는다 — `npm run cap:sync` 시점에 네이티브 프로젝트 안의
         * capacitor.config.json 으로만 들어간다.
         *
         * 값이 비어 있으면 플러그인이 초기화를 거부하고 JS 는 기존 리다이렉트 로그인으로
         * 폴백한다. 카카오 개발자 콘솔에서 네이티브 앱 키를 발급받고 플랫폼(iOS bundle id /
         * Android 패키지·키해시)을 등록한 뒤에 채운다 — docs/app-shell-runbook.md §5 참고.
         */
        KakaoLogin: {
            appKey: readKakaoNativeAppKey(),
        },
        /**
         * 원격 푸시는 `@capacitor-firebase/messaging` 이 담당한다.
         * `@capacitor/push-notifications` 는 설치돼 있지 않다 — iOS 에서 APNs
         * 디바이스 토큰을 주는데 BE 는 FCM 등록 토큰만 받기 때문이다
         * (BE 위키 Frontend-Push-Guide 경고).
         *
         * `presentationOptions` 는 **앱이 떠 있는 동안** 알림을 어떻게 보여줄지다.
         * 비워 두면 포그라운드에서 아무것도 안 뜬다.
         */
        FirebaseMessaging: {
            presentationOptions: ["badge", "sound", "alert"],
        },
    },
};

export default config;
