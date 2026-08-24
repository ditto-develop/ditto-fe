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

let cached: { period: SystemPeriod; readAt: number } | null = null;
let inflight: Promise<SystemPeriod | null> | null = null;

/**
 * 현재 기간을 읽는다. 실패하면 null이다.
 * 호출부는 null을 '모름'으로 보고 기존 동작(클라 시계 기준)을 유지해야 한다.
 */
export function getSystemPeriod(): Promise<SystemPeriod | null> {
  if (cached && Date.now() - cached.readAt < CACHE_TTL_MS) {
    return Promise.resolve(cached.period);
  }
  if (inflight) return inflight;

  inflight = getExternalSystemState()
    .then((state) => {
      cached = { period: state.period, readAt: Date.now() };
      return state.period;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** 어드민이 오버라이드를 바꾼 직후처럼 캐시를 버려야 할 때 쓴다. */
export function clearSystemPeriodCache(): void {
  cached = null;
  inflight = null;
}
