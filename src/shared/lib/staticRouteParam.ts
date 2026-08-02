/**
 * 정적 export(`output: 'export'`) 환경에서 동적 라우트는 빌드 시
 * `generateStaticParams`의 더미값(`placeholder`) 페이지만 생성된다.
 * `/profile/18`을 직접(하드) 로드하면 placeholder 페이지가 서빙되어
 * `useParams()`가 실제 세그먼트가 아닌 `"placeholder"`를 반환한다.
 * 따라서 클라이언트에서 실제 pathname의 세그먼트로 값을 보정한다.
 *
 * @param segment 동적 세그먼트 바로 앞의 경로 조각. 예) `/profile/[id]` → `"profile"`
 * @param paramValue `useParams()`가 돌려준 값
 */
export function resolveStaticRouteParam(segment: string, paramValue: string): string {
  if (typeof window === "undefined") return paramValue;

  const segments = window.location.pathname.split("/").filter(Boolean);
  const index = segments.indexOf(segment);
  const actual = index >= 0 ? segments[index + 1] : undefined;

  if (actual && actual !== "placeholder") return decodeURIComponent(actual);
  return paramValue;
}
