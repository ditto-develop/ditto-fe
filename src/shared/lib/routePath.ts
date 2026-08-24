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
