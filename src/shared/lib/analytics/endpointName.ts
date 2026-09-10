/**
 * API 경로를 리포트에 쓸 수 있는 모양으로 정규화한다.
 *
 * 경로를 그대로 실으면 `/api/v1/chat/rooms/8421/messages` 처럼 방 번호가 붙은 경로가
 * 사람 수만큼 생겨 (1) 카디널리티가 터지고 (2) 식별자가 GA4 로 새어 나간다.
 * 화면 이름을 라우트 패턴으로 접는 것과 같은 이유다(`screenName.ts`).
 *
 * 의존성이 없는 순수 함수다 — API 클라이언트가 이 파일만 직접 가져갈 수 있어야 한다
 * (배럴을 통하면 analytics → features/system → externalApi → externalClient 로 순환한다).
 */

/** 숫자·UUID 처럼 "값"으로 보이는 세그먼트. */
const ID_LIKE = /^(\d+|[0-9a-f]{8}-[0-9a-f-]{27}|[0-9a-f]{16,})$/i;

/** 쿼리스트링을 떼고 식별자 세그먼트를 `[id]` 로 바꾼다. */
export function normalizeEndpoint(path: string): string {
  const withoutQuery = path.split("?")[0];
  const masked = withoutQuery
    .split("/")
    .map((segment) => (ID_LIKE.test(segment) ? "[id]" : segment));
  return masked.join("/");
}
