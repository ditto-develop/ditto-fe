/**
 * 서버 기능 플래그 — 어드민 "시스템 → 기능 플래그"에서 켜고 끈 값을 그대로 따른다(ditto-server ADR 0051).
 *
 * 공개 전 화면은 플래그를 끈 채 배포하고, 서버에서 켜는 순간 모든 사용자에게 보인다. 재배포는 필요 없다.
 * - 화면이 쓰는 키만 서버에 묻는다(`?keys=RECORDS&keys=…`). 같은 순간 여러 화면이 물으면 한 요청으로 묶는다.
 * - 키마다 1분 캐시한다(서버도 1분 캐시). 켠 뒤 화면에 퍼지기까지 최대 2분 정도 걸린다.
 * - 키마다 마지막으로 받은 값을 기기(localStorage)에 남겨 첫 화면과 조회 실패 때 쓴다. 받은 적이 없으면 꺼진 것이다.
 * - 화면을 가릴 뿐 접근 제어가 아니다. API 는 서버가 따로 막는다.
 * - 쓰는 법은 CLAUDE.md §9.1. 화면에서는 `@/shared/lib/hooks/useFeatureFlag` 의 훅을 쓴다.
 */

import { fetchFeatureFlags } from "@/shared/lib/api/featureFlagsApi";

/** FE 가 쓰는 서버 플래그 키. 서버 `FeatureFlagKey` 에 먼저 추가한 뒤 여기에 넣는다. */
export type FeatureFlag = "QUIZ_CHAT" | "RECORDS";

export const FEATURE_FLAGS_TTL_MS = 60_000;

export const FEATURE_FLAGS_STORAGE_KEY = "ditto.featureFlags";

type Entry = {
  /** `null` = 아직 모름(받은 적도, 저장된 값도 없음). */
  value: boolean | null;
  /** 마지막으로 서버에 물어본 시각(성공·실패 모두). 0 이면 아직 안 물어봤다. */
  checkedAt: number;
};

const entries = new Map<FeatureFlag, Entry>();
/** 물어보는 중인 키 → 그 요청이 끝나면 풀리는 약속. */
const inflight = new Map<FeatureFlag, Promise<void>>();
/** 이번 마이크로태스크에 모아서 한 번에 물어볼 키. */
let pending: { keys: Set<FeatureFlag>; done: Promise<void> } | null = null;
let storageLoaded = false;
const listeners = new Set<() => void>();

/** 저장소 접근은 언제든 throw 할 수 있다(프라이빗 창 등). 못 읽으면 저장된 값이 없는 것으로 본다. */
function readStored(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((pair): pair is [string, boolean] => typeof pair[1] === "boolean"),
    );
  } catch {
    return {};
  }
}

function writeStored(): void {
  if (typeof window === "undefined") return;
  const values: Record<string, boolean> = {};
  entries.forEach((entry, key) => {
    if (entry.value !== null) values[key] = entry.value;
  });
  try {
    window.localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(values));
  } catch {
    // 못 적으면 다음 실행의 첫 화면만 한 박자 늦다. 화면을 막을 일은 아니다.
  }
}

function entryOf(key: FeatureFlag): Entry {
  if (!storageLoaded) {
    storageLoaded = true;
    Object.entries(readStored()).forEach(([storedKey, value]) => {
      entries.set(storedKey as FeatureFlag, { value, checkedAt: 0 });
    });
  }
  let entry = entries.get(key);
  if (!entry) {
    entry = { value: null, checkedAt: 0 };
    entries.set(key, entry);
  }
  return entry;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** useSyncExternalStore 용 한 키의 현재 값. `null` = 아직 모름. 처음 부를 때 저장된 값을 읽는다. */
export function getFeatureFlagSnapshot(key: FeatureFlag): boolean | null {
  return entryOf(key).value;
}

export function subscribeFeatureFlags(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function flush(keys: FeatureFlag[]): Promise<void> {
  try {
    const response = await fetchFeatureFlags(keys);
    keys.forEach((key) => {
      entryOf(key).value = response?.flags?.[key] === true;
    });
    writeStored();
  } catch {
    // 마지막 값을 유지한다. 받은 적도 저장된 값도 없는 키만 꺼짐으로 확정한다 — 화면 게이트가 기다리지 않게.
    keys.forEach((key) => {
      const entry = entryOf(key);
      if (entry.value === null) entry.value = false;
    });
  } finally {
    keys.forEach((key) => inflight.delete(key));
    notify();
  }
}

/**
 * 1분이 지났거나 모르는 키만 서버에 다시 묻는다. 같은 마이크로태스크에 들어온 키는 한 요청으로 묶고,
 * 이미 묻는 중인 키는 다시 묻지 않는다. 실패해도 던지지 않는다 — 마지막 값을 쓰고 1분 뒤에 다시 묻는다.
 */
export function refreshFeatureFlags(keys: readonly FeatureFlag[], now: number = Date.now()): Promise<void> {
  const waits: Promise<void>[] = [];

  keys.forEach((key) => {
    const running = inflight.get(key);
    if (running) {
      waits.push(running);
      return;
    }
    const entry = entryOf(key);
    if (entry.checkedAt !== 0 && now - entry.checkedAt < FEATURE_FLAGS_TTL_MS) return;

    entry.checkedAt = now;
    if (!pending) {
      const batch = { keys: new Set<FeatureFlag>(), done: Promise.resolve() };
      batch.done = Promise.resolve().then(() => {
        pending = null;
        return flush([...batch.keys]);
      });
      pending = batch;
    }
    pending.keys.add(key);
    inflight.set(key, pending.done);
    waits.push(pending.done);
  });

  return Promise.all(waits).then(() => undefined);
}

/** 테스트 전용 — 모듈 캐시를 처음 상태로 되돌린다. */
export function resetFeatureFlagsForTest(): void {
  entries.clear();
  inflight.clear();
  pending = null;
  storageLoaded = false;
  listeners.clear();
}
