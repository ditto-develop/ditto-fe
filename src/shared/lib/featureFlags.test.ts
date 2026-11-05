import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FEATURE_FLAGS_STORAGE_KEY,
  FEATURE_FLAGS_TTL_MS,
  getFeatureFlagSnapshot,
  refreshFeatureFlags,
  resetFeatureFlagsForTest,
  subscribeFeatureFlags,
} from "@/shared/lib/featureFlags";

const fetchFeatureFlags = vi.fn();

vi.mock("@/shared/lib/api/featureFlagsApi", () => ({
  fetchFeatureFlags: (keys: readonly string[]) => fetchFeatureFlags(keys),
}));

/** node 환경이라 window 가 없다. 이 모듈이 쓰는 것은 localStorage 뿐이다. */
function createFakeWindow(initial: Record<string, string> = {}) {
  const stored = new Map<string, string>(Object.entries(initial));
  return {
    stored,
    localStorage: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    },
  };
}

/** 물어본 키를 모두 `value` 로 답한다. */
function answerAll(value: boolean) {
  fetchFeatureFlags.mockImplementation(async (keys: readonly string[]) => ({
    flags: Object.fromEntries(keys.map((key) => [key, value])),
  }));
}

describe("서버 기능 플래그 캐시", () => {
  let fakeWindow: ReturnType<typeof createFakeWindow>;

  beforeEach(() => {
    resetFeatureFlagsForTest();
    fetchFeatureFlags.mockReset();
    fakeWindow = createFakeWindow();
    vi.stubGlobal("window", fakeWindow);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("받은 적이 없으면 모름(null)이고, 받으면 그 값이다", async () => {
    answerAll(true);
    expect(getFeatureFlagSnapshot("RECORDS")).toBeNull();

    await refreshFeatureFlags(["RECORDS"], 1_000);

    expect(getFeatureFlagSnapshot("RECORDS")).toBe(true);
    expect(fetchFeatureFlags).toHaveBeenCalledWith(["RECORDS"]);
  });

  it("서버가 빠뜨린 키는 꺼짐이다", async () => {
    fetchFeatureFlags.mockResolvedValue({ flags: {} });

    await refreshFeatureFlags(["RECORDS"], 1_000);

    expect(getFeatureFlagSnapshot("RECORDS")).toBe(false);
  });

  it("키마다 1분 동안은 다시 묻지 않고, 1분이 지나면 그 키만 다시 묻는다", async () => {
    answerAll(true);
    await refreshFeatureFlags(["RECORDS"], 1);
    await refreshFeatureFlags(["QUIZ_CHAT"], 30_000);
    fetchFeatureFlags.mockClear();

    await refreshFeatureFlags(["RECORDS", "QUIZ_CHAT"], FEATURE_FLAGS_TTL_MS);
    expect(fetchFeatureFlags).not.toHaveBeenCalled();

    await refreshFeatureFlags(["RECORDS", "QUIZ_CHAT"], FEATURE_FLAGS_TTL_MS + 2);
    expect(fetchFeatureFlags).toHaveBeenCalledTimes(1);
    expect(fetchFeatureFlags).toHaveBeenCalledWith(["RECORDS"]);
  });

  it("같은 순간 여러 곳이 물으면 키를 모아 한 번만 묻는다", async () => {
    answerAll(true);

    await Promise.all([
      refreshFeatureFlags(["RECORDS"], 1_000),
      refreshFeatureFlags(["QUIZ_CHAT"], 1_000),
      refreshFeatureFlags(["RECORDS"], 1_000),
    ]);

    expect(fetchFeatureFlags).toHaveBeenCalledTimes(1);
    expect([...fetchFeatureFlags.mock.calls[0][0]].sort()).toEqual(["QUIZ_CHAT", "RECORDS"]);
  });

  it("묻는 중인 키는 다시 묻지 않고 그 응답을 기다린다", async () => {
    let answer: (value: unknown) => void = () => undefined;
    fetchFeatureFlags.mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );

    const first = refreshFeatureFlags(["RECORDS"], 1_000);
    await Promise.resolve();
    const second = refreshFeatureFlags(["RECORDS"], 1_000 + FEATURE_FLAGS_TTL_MS + 1);
    answer({ flags: { RECORDS: true } });
    await Promise.all([first, second]);

    expect(fetchFeatureFlags).toHaveBeenCalledTimes(1);
    expect(getFeatureFlagSnapshot("RECORDS")).toBe(true);
  });

  it("받은 값을 기기에 남기고, 다음 실행의 첫 화면은 그 값으로 그린다", async () => {
    answerAll(true);
    await refreshFeatureFlags(["RECORDS"], 1_000);
    expect(JSON.parse(fakeWindow.stored.get(FEATURE_FLAGS_STORAGE_KEY) ?? "{}")).toEqual({ RECORDS: true });

    resetFeatureFlagsForTest();

    expect(getFeatureFlagSnapshot("RECORDS")).toBe(true);
  });

  it("조회에 실패하면 남겨 둔 값을 쓰고, 남긴 값도 없으면 꺼짐으로 확정한다", async () => {
    vi.stubGlobal("window", createFakeWindow({ [FEATURE_FLAGS_STORAGE_KEY]: JSON.stringify({ RECORDS: true }) }));
    fetchFeatureFlags.mockRejectedValue(new Error("network"));

    await refreshFeatureFlags(["RECORDS", "QUIZ_CHAT"], 1_000);

    expect(getFeatureFlagSnapshot("RECORDS")).toBe(true);
    expect(getFeatureFlagSnapshot("QUIZ_CHAT")).toBe(false);
  });

  it("저장된 값이 깨져 있으면 없는 것으로 본다", () => {
    vi.stubGlobal("window", createFakeWindow({ [FEATURE_FLAGS_STORAGE_KEY]: "not json" }));

    expect(getFeatureFlagSnapshot("RECORDS")).toBeNull();
  });

  it("값이 바뀌면 구독자에게 알린다", async () => {
    answerAll(true);
    const listener = vi.fn();
    subscribeFeatureFlags(listener);

    await refreshFeatureFlags(["RECORDS"], 1_000);

    expect(listener).toHaveBeenCalled();
  });
});
