import type { SubmitReviewBody } from "@/features/rating/model/types";

/**
 * 서버가 담당하지 않아 FE가 들고 있어야 하는 세 가지.
 *
 * 1. 내가 낸 재매칭 의사 — 되돌려주는 조회가 없고 완료된 평가는 목록에서 사라진다.
 *    성사 회수용 재전송(멱등)을 하려면 제출한 값을 그대로 기억해야 한다.
 * 2. 성사 축하 노출 여부 — rematch는 재전송에도 다시 실려 오므로,
 *    "이미 알렸음" 플래그가 없으면 재시도마다 축하 화면이 반복된다.
 * 3. 미평가 유도에서 건너뛴 평가 — 건너뛰어도 평가는 미완료로 목록에 남으므로,
 *    기억하지 않으면 앱을 다시 켤 때마다 같은 평가를 또 안내한다.
 */
const SUBMITTED_KEY = "ditto:review:submitted";
const ANNOUNCED_KEY = "ditto:rematch:announced";
const PROMPT_SKIPPED_KEY = "ditto:review:prompt-skipped";

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

function readPromptSkipped(): number[] {
  const value = readJson<unknown>(PROMPT_SKIPPED_KEY, []);
  return Array.isArray(value) ? value.filter((id): id is number => typeof id === "number") : [];
}

/** 미평가 유도에서 이미 건너뛴 평가인지. 건너뛴 평가는 앱을 다시 켜도 다시 안내하지 않는다. */
export function isReviewPromptSkipped(reviewId: number): boolean {
  return readPromptSkipped().includes(reviewId);
}

/** 평가를 건너뛰었다고 기록한다. 평가하기 진입점(채팅방 목록)은 그대로 남는다. */
export function markReviewPromptSkipped(reviewIds: number[]): void {
  const skipped = readPromptSkipped();
  const added = reviewIds.filter((id) => !skipped.includes(id));
  if (added.length === 0) return;
  writeJson(PROMPT_SKIPPED_KEY, [...skipped, ...added]);
}
