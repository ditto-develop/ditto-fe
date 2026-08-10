import type { SubmitReviewBody } from "@/features/rating/model/types";

/**
 * 서버가 담당하지 않아 FE가 들고 있어야 하는 두 가지.
 *
 * 1. 내가 낸 재매칭 의사 — 되돌려주는 조회가 없고 완료된 평가는 목록에서 사라진다.
 *    성사 회수용 재전송(멱등)을 하려면 제출한 값을 그대로 기억해야 한다.
 * 2. 성사 축하 노출 여부 — rematch는 재전송에도 다시 실려 오므로,
 *    "이미 알렸음" 플래그가 없으면 재시도마다 축하 화면이 반복된다.
 */
const SUBMITTED_KEY = "ditto:review:submitted";
const ANNOUNCED_KEY = "ditto:rematch:announced";

type SubmittedMap = Record<string, SubmitReviewBody>;

function targetKey(reviewId: number, memberId: number): string {
  return `${reviewId}:${memberId}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 기능을 막지 않는다(사파리 프라이빗 모드 등).
  }
}

export function rememberSubmittedReview(
  reviewId: number,
  memberId: number,
  body: SubmitReviewBody,
): void {
  const map = readJson<SubmittedMap>(SUBMITTED_KEY, {});
  map[targetKey(reviewId, memberId)] = body;
  writeJson(SUBMITTED_KEY, map);
}

/** 성사를 놓쳤을 때 같은 값으로 다시 PUT 하려면 이 값을 쓴다. */
export function getSubmittedReview(
  reviewId: number,
  memberId: number,
): SubmitReviewBody | null {
  return readJson<SubmittedMap>(SUBMITTED_KEY, {})[targetKey(reviewId, memberId)] ?? null;
}

/** 상대 memberId 기준. 같은 두 사람이 다른 주에 또 성사되면 matchedAt이 달라 다시 알린다. */
function rematchKey(matchedMemberId: number, matchedAt: string): string {
  return `${matchedMemberId}@${matchedAt}`;
}

export function isRematchAnnounced(matchedMemberId: number, matchedAt: string): boolean {
  return readJson<string[]>(ANNOUNCED_KEY, []).includes(rematchKey(matchedMemberId, matchedAt));
}

export function markRematchAnnounced(matchedMemberId: number, matchedAt: string): void {
  const key = rematchKey(matchedMemberId, matchedAt);
  const announced = readJson<string[]>(ANNOUNCED_KEY, []);
  if (announced.includes(key)) return;
  writeJson(ANNOUNCED_KEY, [...announced, key]);
}
