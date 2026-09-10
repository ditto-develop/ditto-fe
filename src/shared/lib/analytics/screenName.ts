import { normalizePathname } from "@/shared/lib/routePath";

/**
 * 경로 → 화면 이름.
 *
 * **동적 세그먼트를 반드시 패턴으로 접는다.** 접지 않으면 두 가지가 터진다:
 *   1. 카디널리티 — roomId 하나에 화면 하나가 생겨 GA4 리포트가 `(other)` 로 뭉개진다.
 *   2. 준식별자 유출 — roomId/memberId 가 GA4 에 그대로 적재된다.
 * 방별·사람별 분석이 필요하면 GA4 가 아니라 BigQuery 에서 한다.
 */

export interface ScreenInfo {
  /** 리포트에서 보는 이름. snake_case. */
  screenName: string;
  /** 라우트 패턴. 어느 코드에서 온 화면인지 되짚을 때 쓴다. */
  screenPath: string;
}

/**
 * 정적 경로 표. **동적 패턴보다 먼저** 조회한다 —
 * `/profile/edit` 이 `/profile/[id]` 로, `/quiz/current` 가 `/quiz/[id]` 로
 * 잘못 접히는 걸 막는다.
 */
const STATIC_SCREENS: Record<string, string> = {
  // 가입 퍼널(Tutorial)이 이 경로 안에서 step 0~2 로 돌아간다. 그래서 화면 이름만으로는
  // 어느 단계인지 알 수 없고, 단계는 별도 이벤트로 봐야 한다.
  "/": "landing",
  "/home": "home",
  "/matching": "matching",
  "/notifications": "notifications",
  "/chat": "chat_list",
  "/profile": "profile",
  "/profile/edit": "profile_edit",
  "/profile/intro-note": "profile_intro_note",
  "/quiz/current": "quiz_current",
  "/onboarding/intro": "onboarding_intro",
  "/onboarding/complete": "onboarding_complete",
  "/settings": "settings",
  "/settings/blocks": "settings_blocks",
  "/settings/business": "settings_business",
  "/settings/location-terms": "settings_location_terms",
  "/settings/privacy": "settings_privacy",
  "/settings/terms": "settings_terms",
  "/settings/withdraw": "settings_withdraw",
  "/auth/callback": "auth_callback",
  "/oauth/kakao": "oauth_kakao",
  "/localogin": "localogin",
  "/report": "report",
  "/sanction": "sanction",
  // 404. 정적 export + CloudFront 조합에서는 잘 도달하지 않지만, 찍히면 깨진 링크나
  // rewrite 함수 누락 신호라 이름을 붙여 둔다.
  "/_not-found": "not_found",
  "/404": "not_found",
};

/** 동적 경로. 더 긴 것(`/rate`)을 먼저 둔다 — 위에서부터 처음 맞는 것을 쓴다. */
const DYNAMIC_SCREENS: ReadonlyArray<{ pattern: RegExp } & ScreenInfo> = [
  {
    pattern: /^\/chat\/one-on-one\/[^/]+\/rate$/,
    screenName: "chat_one_on_one_rate",
    screenPath: "/chat/one-on-one/[roomId]/rate",
  },
  {
    pattern: /^\/chat\/one-on-one\/[^/]+$/,
    screenName: "chat_one_on_one",
    screenPath: "/chat/one-on-one/[roomId]",
  },
  {
    pattern: /^\/chat\/group\/[^/]+\/rate$/,
    screenName: "chat_group_rate",
    screenPath: "/chat/group/[roomId]/rate",
  },
  {
    pattern: /^\/chat\/group\/[^/]+$/,
    screenName: "chat_group",
    screenPath: "/chat/group/[roomId]",
  },
  {
    pattern: /^\/profile\/[^/]+$/,
    screenName: "profile_detail",
    screenPath: "/profile/[id]",
  },
  {
    pattern: /^\/quiz\/[^/]+$/,
    screenName: "quiz_detail",
    screenPath: "/quiz/[id]",
  },
];

/** 숫자·UUID 처럼 "값"으로 보이는 세그먼트. 모르는 경로에서도 식별자는 걷어낸다. */
const ID_LIKE = /^(\d+|[0-9a-f]{8}-[0-9a-f-]{27}|[0-9a-f]{16,})$/i;

/**
 * 표에 없는 경로의 보루.
 *
 * 라우트가 추가됐는데 위 표를 안 고쳐도 **식별자만은 새어 나가지 않게** 한다.
 * 표를 고치는 걸 잊는 일은 반드시 생기므로, 잊었을 때의 피해를 줄여 둔다.
 */
function fallbackScreen(path: string): ScreenInfo {
  const segments = path.split("/").filter(Boolean);
  const masked = segments.map((segment) => (ID_LIKE.test(segment) ? "[id]" : segment));
  return {
    screenName: masked.map((s) => s.replace(/-/g, "_")).join("_") || "unknown",
    screenPath: `/${masked.join("/")}`,
  };
}

/**
 * 추적할 화면인지 판정하고 이름을 돌려준다.
 *
 * `null` 이면 **추적하지 않는다** — 지금은 관리자 화면이 여기 해당한다.
 * 운영자가 하루에도 수십 번 드나드는 화면이라 그대로 섞이면 실사용 지표가 오염된다.
 */
export function resolveScreen(pathname: string): ScreenInfo | null {
  // trailingSlash: true 라 하드 로드는 "/home/", 클라이언트 내비게이션은 "/home" 이다.
  // 정규화하지 않으면 같은 화면이 리포트에서 둘로 쪼개진다.
  const path = normalizePathname(pathname);

  if (path === "/admin" || path.startsWith("/admin/")) return null;

  const staticName = STATIC_SCREENS[path];
  if (staticName) return { screenName: staticName, screenPath: path };

  const dynamic = DYNAMIC_SCREENS.find(({ pattern }) => pattern.test(path));
  if (dynamic) return { screenName: dynamic.screenName, screenPath: dynamic.screenPath };

  return fallbackScreen(path);
}
