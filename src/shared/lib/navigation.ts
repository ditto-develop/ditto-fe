import { normalizePathname } from "@/shared/lib/routePath";

/**
 * 화면 안 "뒤로" 버튼용 내비게이션 헬퍼.
 *
 * 뒤로 버튼을 `router.push("/home")` 으로 구현하면 히스토리가 **줄지 않고 쌓인다**.
 * 그러면 그 직후 OS 뒤로가기를 한 사용자가 방금 빠져나온 화면으로 되돌아가고,
 * 다시 뒤로 버튼을 누르면 또 홈이 쌓여 뒤로가기가 영원히 끝나지 않는다.
 * 뒤로 버튼은 히스토리를 **소비**해야 한다.
 */

/** `next/navigation` 의 라우터에서 이 헬퍼가 쓰는 부분만 구조적으로 받는다. */
type BackCapableRouter = {
  back: () => void;
  replace: (href: string) => void;
};

/**
 * 히스토리가 있으면 뒤로 가고, 없으면 `fallback` 으로 대체한다.
 *
 * 앱(웹뷰)은 항상 루트를 먼저 열기 때문에 실질적으로 늘 `back()` 이 된다.
 * fallback 은 웹에서 해당 URL 을 직접 열어 히스토리가 한 칸뿐인 경우를 위한 것이다 —
 * 그 상태에서 `back()` 만 부르면 버튼이 아무 반응도 하지 않는다.
 */
export function goBackOr(router: BackCapableRouter, fallback: string): void {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
    return;
  }
  router.replace(fallback);
}

/**
 * 알림 탭으로 들어온 화면 표시(sessionStorage). 동적 라우트(채팅방 등)는 문서를 새로 받는 이동이라 JS 메모리로는
 * 이어지지 않아 저장소에 둔다. 웹뷰가 살아 있는 동안만 남는다.
 */
export const PUSH_ENTRY_STORAGE_KEY = "ditto:push-entry-path";

/** 쿼리·해시·끝 슬래시를 떼어 경로끼리 비교할 수 있게 한다. */
function toComparablePath(path: string): string {
  return normalizePathname(path.split(/[?#]/)[0] || "/");
}

function readPushEntry(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(PUSH_ENTRY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function clearPushEntry(): void {
  try {
    window.sessionStorage.removeItem(PUSH_ENTRY_STORAGE_KEY);
  } catch {
    // 못 지우면 그 화면의 뒤로 버튼이 한 번 홈으로 갈 뿐이다.
  }
}

/** 알림 탭이 `path` 로 보낸다. 이동을 시작하기 직전에 부른다(pushNotifications.openNotification). */
export function markPushEntry(path: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PUSH_ENTRY_STORAGE_KEY, toComparablePath(path));
  } catch {
    // 저장소를 못 쓰면 뒤로가기가 예전처럼 히스토리를 소비한다.
  }
}

/** 지금 화면이 알림 탭으로 들어온 화면인가. */
export function isPushEntry(pathname: string): boolean {
  const entry = readPushEntry();
  return entry !== null && entry === toComparablePath(pathname);
}

/**
 * 알림으로 들어온 화면을 벗어났으면 표시를 지운다. ClientLayout 이 경로가 바뀔 때마다 부른다 —
 * 남겨 두면 나중에 목록에서 같은 방에 다시 들어갔을 때 뒤로 버튼이 목록 대신 홈으로 간다.
 */
export function clearPushEntryUnless(pathname: string): void {
  const entry = readPushEntry();
  if (entry !== null && entry !== toComparablePath(pathname)) clearPushEntry();
}

/**
 * 채팅방처럼 알림으로 바로 들어오는 화면의 뒤로 버튼.
 *
 * 알림으로 들어왔으면 히스토리를 되감지 않고 **홈으로 바꿔 간다**(`replace`). 이 화면들은 정적 export 의 동적
 * 라우트라 문서가 따로 떠 있어서, `back()` 은 이전 문서를 통째로 다시 받는 이동이 된다. 앱을 꺼 둔 채 알림을
 * 누른 경우 이전 문서는 부팅 화면("/")이라 스플래시·세션 확인·홈 리다이렉트를 처음부터 다시 탄다. 그 사이 이동이
 * 겹치면 iOS 가 로드를 취소(-999)하고 Capacitor 가 "연결할 수 없어요" 화면을 띄웠다(2026-11 QA). 홈은 정적
 * 라우트라 지금 문서에서 소프트 이동으로 간다.
 *
 * 알림으로 들어온 게 아니면 예전처럼 히스토리를 소비한다(`goBackOr`).
 */
export function goBackFromEntryScreen(router: BackCapableRouter, fallback: string): void {
  if (typeof window !== "undefined" && isPushEntry(window.location.pathname)) {
    clearPushEntry();
    router.replace("/home");
    return;
  }
  goBackOr(router, fallback);
}
