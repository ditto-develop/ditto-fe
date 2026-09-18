/**
 * "이 기기에서만 숨긴 항목" 목록.
 *
 * 알림·완료된 대화방을 사용자가 목록에서 치울 수 있게 하려면 삭제 API 가 필요한데,
 * 라이브 스펙에는 아직 없다(알림은 read/read-all, 채팅방은 end/leave 뿐 — 2026-09-18 확인).
 * 그래서 서버 대신 브라우저 저장소에 숨긴 id 를 적어 두고 목록에서만 빼는 방식으로 먼저 낸다.
 *
 * **서버 데이터는 그대로 남는다.** 다른 기기·재설치·저장소 삭제 시 다시 보인다 —
 * 삭제 API 가 생기면 이 모듈을 호출하는 자리를 API 호출로 갈아 끼우고 여기는 지운다.
 * 관련 요청서: docs/be-request-notification-chat-delete.md
 */

/** 무한정 자라지 않게 상한을 둔다. 넘으면 오래 전에 숨긴 것부터 버린다(다시 보이게 된다). */
const MAX_IDS = 500;

export type HiddenItemStore = {
  /**
   * 저장소를 읽을 수 없으면(사파리 프라이빗 등) 빈 Set.
   *
   * 내용이 안 바뀌면 **같은 Set 인스턴스**를 돌려준다 — useSyncExternalStore 가
   * 스냅샷 동일성으로 재렌더를 판단하므로, 매번 새 Set 을 만들면 무한 루프가 된다.
   */
  read: () => Set<string>;
  hide: (id: string | number) => void;
  hideAll: (ids: Array<string | number>) => void;
  clear: () => void;
  /** 값이 바뀔 때(다른 탭에서 바뀐 경우 포함) 호출된다. 해제 함수를 돌려준다. */
  subscribe: (listener: () => void) => () => void;
};

/**
 * 저장소를 못 읽는 환경과 SSR 이 함께 쓰는 빈 스냅샷.
 * useSyncExternalStore 의 `getServerSnapshot` 에 그대로 넘긴다 — 참조가 같아야 한다.
 */
export const EMPTY_HIDDEN_IDS: Set<string> = new Set<string>();

export function createHiddenItemStore(storageKey: string): HiddenItemStore {
  const listeners = new Set<() => void>();
  /** 마지막으로 읽은 원본 문자열과 그때 만든 Set. 스냅샷 동일성을 위한 캐시다. */
  let cache: { raw: string | null; value: Set<string> } | null = null;

  /** 저장소 접근은 언제든 throw 할 수 있다(프라이빗 창·사이트 데이터 차단). */
  const readStored = (): string | null => {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const parseIds = (stored: string | null): string[] => {
    if (!stored) return [];
    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
      return [];
    }
  };

  const readRaw = (): string[] => parseIds(readStored());

  const writeRaw = (ids: string[]): void => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(ids.slice(-MAX_IDS)));
    } catch {
      // 저장에 실패하면 캐시에만 반영돼 이번 세션 동안만 숨겨진다. 화면을 막을 일은 아니다.
      cache = { raw: null, value: new Set(ids.slice(-MAX_IDS)) };
    }
    listeners.forEach((listener) => listener());
  };

  const read = (): Set<string> => {
    if (typeof window === "undefined") return EMPTY_HIDDEN_IDS;

    const raw = readStored();
    // 원본이 그대로면 같은 인스턴스를 준다. 저장에 실패해 캐시만 갖고 있는 경우
    // (cache.raw === null, raw === null)도 이 비교에 걸려 캐시가 유지된다.
    if (cache && cache.raw === raw) return cache.value;

    cache = { raw, value: new Set(parseIds(raw)) };
    return cache.value;
  };

  const append = (ids: Array<string | number>): void => {
    if (typeof window === "undefined" || ids.length === 0) return;
    const next = readRaw();
    const seen = new Set(next);
    ids.forEach((id) => {
      const key = String(id);
      if (seen.has(key)) return;
      seen.add(key);
      next.push(key);
    });
    writeRaw(next);
  };

  return {
    read,
    hide: (id) => append([id]),
    hideAll: (ids) => append(ids),
    clear: () => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // 위와 같다.
      }
      cache = null;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      // 다른 탭에서 숨겼을 때도 맞춰 준다. 같은 탭에서는 storage 이벤트가 안 온다.
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === storageKey) listener();
      };
      window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
