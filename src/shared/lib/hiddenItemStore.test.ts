import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createHiddenItemStore, EMPTY_HIDDEN_IDS } from "./hiddenItemStore";

const KEY = "ditto.test.hidden";

/**
 * 기본 테스트 환경은 node 라 window/localStorage 가 없고, jsdom 은 의존성에 없다.
 * 이 모듈이 window 에서 쓰는 것은 localStorage 와 storage 이벤트 리스너뿐이라
 * EventTarget + 최소 저장소 구현으로 충분하다(pushNotifications.test.ts 와 같은 방식).
 */
function createFakeWindow() {
  const entries = new Map<string, string>();
  const target = new EventTarget();

  return Object.assign(target, {
    localStorage: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => void entries.set(key, value),
      removeItem: (key: string) => void entries.delete(key),
    },
  });
}

beforeEach(() => {
  Object.assign(globalThis, { window: createFakeWindow() });
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(globalThis, "window");
});

describe("createHiddenItemStore", () => {
  it("숨긴 id 를 저장하고 다시 읽는다", () => {
    const store = createHiddenItemStore(KEY);

    store.hide(1);
    store.hide("abc");

    expect([...store.read()]).toEqual(["1", "abc"]);
    // 새 인스턴스도 같은 키를 읽는다 — 새로고침 후에도 유지된다는 뜻이다.
    expect([...createHiddenItemStore(KEY).read()]).toEqual(["1", "abc"]);
  });

  it("같은 id 를 두 번 숨겨도 한 번만 쌓인다", () => {
    const store = createHiddenItemStore(KEY);

    store.hide(7);
    store.hide(7);

    expect([...store.read()]).toEqual(["7"]);
  });

  it("내용이 그대로면 같은 Set 인스턴스를 돌려준다", () => {
    // useSyncExternalStore 가 스냅샷 동일성으로 재렌더를 판단한다 — 매번 새 Set 이면 무한 루프.
    const store = createHiddenItemStore(KEY);
    store.hide(1);

    expect(store.read()).toBe(store.read());

    const before = store.read();
    store.hide(2);
    expect(store.read()).not.toBe(before);
  });

  it("hideAll 은 여러 id 를 한 번에 숨긴다", () => {
    const store = createHiddenItemStore(KEY);

    store.hideAll([3, 1, 2]);

    expect([...store.read()].sort()).toEqual(["1", "2", "3"]);
  });

  it("값이 바뀌면 구독자에게 알린다", () => {
    const store = createHiddenItemStore(KEY);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.hide(1);
    expect(listener).toHaveBeenCalledTimes(1);

    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.read().size).toBe(0);

    unsubscribe();
    store.hide(2);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("저장소를 읽을 수 없으면 빈 스냅샷을 준다", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(createHiddenItemStore(KEY).read().size).toBe(0);
  });

  it("깨진 JSON 은 빈 목록으로 취급한다", () => {
    window.localStorage.setItem(KEY, "{not json");

    expect(createHiddenItemStore(KEY).read().size).toBe(0);
  });

  it("SSR 스냅샷은 공유 상수다", () => {
    // 참조가 같아야 하이드레이션이 어긋나지 않는다.
    expect(EMPTY_HIDDEN_IDS.size).toBe(0);
    expect(EMPTY_HIDDEN_IDS).toBe(EMPTY_HIDDEN_IDS);
  });
});
