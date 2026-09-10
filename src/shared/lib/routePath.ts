/**
 * 경로 비교 유틸.
 *
 * `next.config.ts`가 `trailingSlash: true`라 정적 export를 하드 로드하면
 * `usePathname()`이 `/home/`처럼 끝 슬래시가 붙은 값을 돌려준다.
 * 반면 `router.push("/home")` 같은 클라이언트 내비게이션 뒤에는 슬래시가 없다.
 * 두 형태가 섞이므로 경로를 문자열로 비교하기 전에 반드시 정규화한다.
 */

/** 끝 슬래시를 떼어 낸 경로. 루트(`/`)는 그대로 둔다. */
export function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** `pathname`이 `target`이거나 그 하위 경로인지. 탭 활성 판정에 쓴다. */
export function isPathActive(pathname: string, target: string): boolean {
  const current = normalizePathname(pathname);
  const base = normalizePathname(target);
  return current === base || current.startsWith(`${base}/`);
}

/**
 * 콜드 스타트 스플래시가 덮어도 되는 화면인지. **루트와 홈 둘뿐이다.**
 *
 * 정적 export라 `/profile/{id}`·`/chat/...` 같은 동적 라우트는 클라이언트 내비게이션이
 * 되지 않고 진입할 때마다 문서가 새로 뜬다(RSC 페이로드 `.txt`가 S3에 없어 라우터가
 * 하드 내비게이션으로 폴백한다). 그런 화면까지 하이드레이션 전을 스플래시로 받으면,
 * 소개노트를 누를 때마다 스플래시가 떴다 사라져 **화면이 한 번 번쩍인다.**
 * 그 자리는 각 화면의 스켈레톤이 받는다.
 */
export function isBootSplashPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === "/" || path === "/home";
}
