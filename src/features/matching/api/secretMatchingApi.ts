import { SECRET_MATCHING_STATES } from "@/features/matching/model/secretMatching";
import type { SecretMatchingState, SecretMatchingStatus } from "@/features/matching/model/secretMatching";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

/**
 * 시크릿 매칭 홈 상태 API(IMP-2, 서버 #383). `/api/v1` 뒤의 경로다 — MSW 핸들러(src/mocks/handlers.ts)도 이 상수로
 * 경로를 만든다(핸들러와 호출부가 어긋나면 목업만 조용히 비껴간다).
 *
 * 계약은 ditto-server 위키 `Frontend-Secret-Matching-Guide` §1. 서버 `SECRET_MATCHING` 플래그가 꺼져 있으면 항상
 * `NONE` 이다. 화면은 같은 이름의 FE 플래그(서버 플래그 또는 테스터 모드) 뒤에 있고, 실패하면 홈은 지금 화면을 그린다.
 */
export const SECRET_MATCHING_STATE_PATH = "/matching/secret-state";

type ExternalSecretMatchingState = {
  state: string;
  nextRoundAt: string | null;
  quizSetId: number | null;
  weekStartedOn: string;
};

const KNOWN_STATES: ReadonlySet<string> = new Set<SecretMatchingState>(SECRET_MATCHING_STATES);

/** 모르는 `state` 는 `NONE` — 서버가 값을 늘려도 홈이 지금 화면으로 떨어질 뿐 깨지지 않는다. */
export async function getSecretMatchingStatus(): Promise<SecretMatchingStatus> {
  const data = await externalApiFetch<ExternalSecretMatchingState>(`/api/v1${SECRET_MATCHING_STATE_PATH}`);
  const state = KNOWN_STATES.has(data.state) ? (data.state as SecretMatchingState) : "NONE";
  return {
    state,
    quizSetId: data.quizSetId === null || data.quizSetId === undefined ? null : String(data.quizSetId),
    nextRoundAt: data.nextRoundAt ?? null,
  };
}
