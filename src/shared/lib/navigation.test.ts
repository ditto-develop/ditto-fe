import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearPushEntryUnless,
  goBackFromEntryScreen,
  isPushEntry,
  markPushEntry,
  PUSH_ENTRY_STORAGE_KEY,
} from "@/shared/lib/navigation";

/** node 환경이라 window 를 직접 만든다. 쓰는 것은 sessionStorage · location · history.length 뿐이다. */
function installWindow(pathname: string, historyLength = 2) {
  const store = new Map<string, string>();
  Object.assign(globalThis, {
    window: {
      location: { pathname },
      history: { length: historyLength },
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
      },
    },
  });
  return store;
}

const router = () => ({ back: vi.fn(), replace: vi.fn() });

describe("알림으로 들어온 화면의 뒤로 버튼", () => {
  beforeEach(() => {
    installWindow("/chat/one-on-one/305/");
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("알림 탭이 보낸 경로면 끝 슬래시·쿼리가 달라도 같은 화면으로 본다", () => {
    markPushEntry("/chat/one-on-one/305?from=push");
    expect(isPushEntry("/chat/one-on-one/305/")).toBe(true);
    expect(isPushEntry("/chat/one-on-one/306/")).toBe(false);
  });

  it("알림으로 들어왔으면 히스토리를 되감지 않고 홈으로 바꿔 간다. 표시는 한 번 쓰면 지운다", () => {
    markPushEntry("/chat/one-on-one/305/");
    const r = router();

    goBackFromEntryScreen(r, "/chat");

    expect(r.replace).toHaveBeenCalledWith("/home");
    expect(r.back).not.toHaveBeenCalled();
    expect(isPushEntry("/chat/one-on-one/305/")).toBe(false);
  });

  it("알림으로 들어온 게 아니면 예전처럼 히스토리를 소비한다", () => {
    const r = router();
    goBackFromEntryScreen(r, "/chat");
    expect(r.back).toHaveBeenCalledTimes(1);
    expect(r.replace).not.toHaveBeenCalled();
  });

  it("히스토리가 한 칸뿐이면(웹에서 주소로 바로 연 경우) fallback 으로 간다", () => {
    installWindow("/chat/one-on-one/305/", 1);
    const r = router();
    goBackFromEntryScreen(r, "/chat");
    expect(r.replace).toHaveBeenCalledWith("/chat");
  });

  it("다른 화면으로 옮기면 표시를 지운다 — 나중에 목록에서 같은 방에 들어오면 목록으로 돌아간다", () => {
    const store = installWindow("/chat/one-on-one/305/");
    markPushEntry("/chat/one-on-one/305/");

    clearPushEntryUnless("/chat/one-on-one/305");
    expect(store.has(PUSH_ENTRY_STORAGE_KEY)).toBe(true);

    clearPushEntryUnless("/chat");
    expect(store.has(PUSH_ENTRY_STORAGE_KEY)).toBe(false);
  });
});
