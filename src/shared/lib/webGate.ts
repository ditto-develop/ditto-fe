import { isNativeApp } from "@/shared/lib/native/platform";

/**
 * 웹(브라우저) 차단. 디토는 앱으로만 쓰게 하고, 브라우저로 들어오면 어느 주소든 앱 다운로드 안내
 * (/download)를 보여 준다(2026-10-19).
 *
 * 앱도 같은 ditto.pics 를 원격 URL 로 불러오므로 사이트를 내릴 수는 없다. 그래서 Capacitor 가
 * 웹뷰에 넣어 주는 네이티브 브리지 유무(`isNativeApp`)로 앱과 브라우저를 가른다 — 지금 나가 있는
 * iOS·Android 앱 모두 해당해 앱 업데이트가 필요 없다. 화면만 가리는 것이라 API 는 그대로 열려 있다.
 *
 * 켜는 법은 다른 플래그와 같다: 배포 워크플로 deploy 잡의 Build 스텝 `env:` 에
 * `NEXT_PUBLIC_WEB_GATE_ENABLED: 'true'`. 로컬 개발·verify 잡(Cypress)에는 넣지 않는다.
 */
export function isWebGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WEB_GATE_ENABLED === "true";
}

/**
 * 브라우저에서도 그대로 열려야 하는 경로.
 *
 * - 다운로드 안내·Android 출시 알림 신청: 차단된 사람이 가는 곳이다.
 * - 약관 3종·고객 지원: App Store 심사에 개인정보처리방침·지원 URL 로 제출한 주소다.
 * - 계정 삭제 안내: Google Play 에 계정 삭제 URL 로 제출한 주소다. 앱을 지운 사람이 브라우저로 연다.
 * - OAuth 콜백: 앱 웹뷰에서만 쓰지만, 로그인 도중 브리지가 늦게 붙는 경우가 있어도 로그인이
 *   끊기지 않게 열어 둔다. 브라우저에서 들어와도 로그인 뒤 가는 화면에서 다시 막힌다.
 * - 어드민: 운영자가 브라우저로 쓴다.
 */
const WEB_OPEN_PATHS: readonly string[] = [
  "/download",
  "/download/android",
  "/settings/terms",
  "/settings/privacy",
  "/settings/location-terms",
  "/support",
  "/support/delete-account",
  "/auth/callback",
];

const WEB_OPEN_PATH_PREFIXES: readonly string[] = ["/admin", "/oauth"];

/** 브라우저에서도 열리는 경로인지. `path` 는 normalizePathname 을 거친 값이다. */
export function isWebOpenPath(path: string): boolean {
  if (WEB_OPEN_PATHS.includes(path)) return true;
  return WEB_OPEN_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isCypressRuntime(): boolean {
  return typeof window !== "undefined" && "Cypress" in window;
}

/**
 * 이 경로를 다운로드 안내로 덮어야 하는지. 하이드레이션 뒤에만 부른다 — 서버 렌더·첫 렌더에는
 * 브리지 유무를 알 수 없다.
 */
export function shouldShowWebDownload(path: string): boolean {
  if (!isWebGateEnabled()) return false;
  // Cypress 는 브라우저라 플래그가 켜진 빌드에서 돌면 모든 화면이 막힌다. MswProvider 와 같은 이유로 비켜 준다.
  if (isCypressRuntime()) return false;
  if (isNativeApp()) return false;
  return !isWebOpenPath(path);
}
