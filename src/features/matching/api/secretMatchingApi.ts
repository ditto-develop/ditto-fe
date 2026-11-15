import type { SecretMatchingState, SecretMatchingStatus } from "@/features/matching/model/secretMatching";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

/**
 * 시크릿 매칭 홈 상태 API(IMP-2). `/api/v1` 뒤의 경로다 — MSW 핸들러(src/mocks/handlers.ts)도 이 상수로
 * 경로를 만든다(핸들러와 호출부가 어긋나면 목업만 조용히 비껴간다).
 *
 * ⚠️ 2026-11-16 기준 **서버에 아직 없다.** 계약은 ditto-fe 위키 `BE-Request-Secret-Matching` 으로 요청했다.
 * 경로·필드가 바뀌면 이 파일과 `secretMatching.ts` 만 고친다. 서버에 뜨기 전에는 부르지 않는다
 * (`SECRET_MATCHING_STATUS_API_LIVE`). 뜬 뒤에도 화면은 `SECRET_MATCHING` 플래그 뒤에 있고, 실패하면 `NONE` 으로
 * 보고 지금 화면을 그린다.
 */
export const SECRET_MATCHING_STATUS_PATH = "/matching/secret-status";

type ExternalSecretMatchingStatus = {
  state: string;
  quizSetId?: number | string | null;
  nextRoundAt?: string | null;
};

const KNOWN_STATES: ReadonlySet<string> = new Set<SecretMatchingState>([
  "NONE",
  "TARGET",
  "WAITING",
  "AUTO_JOINED",
  "CANDIDATES",
  "MATCHED",
  "CLOSED",
]);

/**
 * 서버가 이 API 를 운영에 올렸는지. **올라오면 true 로 바꿔 배포한다**(위키 BE-Request-Secret-Matching §1).
 *
 * CLAUDE.md §9.1: 숨긴 화면이 부르는 BE API 는 운영에 먼저 떠 있어야 한다. 테스터 모드 기기는 서버 플래그와
 * 상관없이 이 화면을 그리므로, API 가 없는 동안 그대로 부르면 모르는 `/api/v1` 경로라 401 → refresh → 401 이
 * 홈에 들어올 때마다 반복된다. 그동안은 네트워크를 타지 않고 `NONE`(지금 화면 그대로)으로 본다.
 * Cypress·MSW 목업에서는 목업이 답하므로 부른다.
 */
const SECRET_MATCHING_STATUS_API_LIVE = false;

const NONE_STATUS: SecretMatchingStatus = { state: "NONE", quizSetId: null, nextRoundAt: null };

function canCallStatusApi(): boolean {
  if (SECRET_MATCHING_STATUS_API_LIVE) return true;
  if (process.env.NEXT_PUBLIC_API_MOCKING === "enabled") return true;
  return typeof window !== "undefined" && "Cypress" in window;
}

/** 모르는 `state` 는 `NONE` — 서버가 값을 늘려도 홈이 지금 화면으로 떨어질 뿐 깨지지 않는다. */
export async function getSecretMatchingStatus(): Promise<SecretMatchingStatus> {
  if (!canCallStatusApi()) return NONE_STATUS;
  const data = await externalApiFetch<ExternalSecretMatchingStatus>(`/api/v1${SECRET_MATCHING_STATUS_PATH}`);
  const state = KNOWN_STATES.has(data.state) ? (data.state as SecretMatchingState) : "NONE";
  return {
    state,
    quizSetId: data.quizSetId === null || data.quizSetId === undefined ? null : String(data.quizSetId),
    nextRoundAt: data.nextRoundAt ?? null,
  };
}
