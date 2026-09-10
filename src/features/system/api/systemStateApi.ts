import { getExternalSystemState } from "@/shared/lib/api/externalApi";
import type { SystemStateDto } from "@/shared/lib/api/generated";

/**
 * 서버가 판정한 현재 기간.
 *
 * 요일 계산이 아니라 이 값이 정본이다 — `GET /api/v1/system/state`는 어드민
 * '시간 임시 조정'(시각 오버라이드)이 반영된 기간을 내려준다(라이브 스펙 명시).
 * 클라이언트 시계로 기간을 파생하면 오버라이드가 통째로 무시된다.
 */
export type SystemPeriod = SystemStateDto["period"];

/**
 * 화면마다 따로 읽지 않도록 짧게 캐시한다.
 * 오버라이드는 어드민이 수동으로만 바꾸므로 이 정도 지연은 문제되지 않는다.
 */
const CACHE_TTL_MS = 30 * 1000;

let cached: { state: SystemStateDto; readAt: number } | null = null;
let inflight: Promise<SystemStateDto | null> | null = null;

/**
 * 현재 시스템 상태 전체(기간 + 연/월/주차)를 읽는다. 실패하면 null이다.
 *
 * 주차(year/month/week)는 계측의 코호트 키로 쓴다 — 주 단위로 도는 서비스라
 * "이번 주 퍼널이 지난주보다 나아졌나"가 기본 질문인데, 달력 날짜만으로는
 * 주차 경계가 맞지 않는다. 기간과 같은 응답에 실려 오므로 따로 부르지 않는다.
 */
export function getSystemState(): Promise<SystemStateDto | null> {
  if (cached && Date.now() - cached.readAt < CACHE_TTL_MS) {
    return Promise.resolve(cached.state);
  }
  if (inflight) return inflight;

  inflight = getExternalSystemState()
    .then((state) => {
      cached = { state, readAt: Date.now() };
      return state;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * 현재 기간을 읽는다. 실패하면 null이다.
 * 호출부는 null을 '모름'으로 보고 기존 동작(클라 시계 기준)을 유지해야 한다.
 */
export function getSystemPeriod(): Promise<SystemPeriod | null> {
  return getSystemState().then((state) => state?.period ?? null);
}

/** 어드민이 오버라이드를 바꾼 직후처럼 캐시를 버려야 할 때 쓴다. */
export function clearSystemPeriodCache(): void {
  cached = null;
  inflight = null;
}
