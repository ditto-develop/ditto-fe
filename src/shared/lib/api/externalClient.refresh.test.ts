import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getAccessToken: vi.fn(() => "stale-token"),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));
const trackEvent = vi.hoisted(() => vi.fn());

vi.mock("@/shared/lib/auth", () => auth);
vi.mock("@/shared/lib/analytics/gtag", () => ({ trackEvent }));

import { externalApiFetch, isSessionEnded, refreshSession } from "@/shared/lib/api/externalClient";

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "groupCollapsed").mockImplementation(() => {});
  vi.spyOn(console, "groupEnd").mockImplementation(() => {});
});

afterEach(() => {
  fetchMock.mockReset();
  auth.setTokens.mockClear();
  auth.clearTokens.mockClear();
  trackEvent.mockClear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/**
 * 푸시 탭 후 로그아웃(BE 위키 Frontend-App-Push-Login-Fix-Request §2)의 핵심은
 * "서버가 거부함"과 "서버에 닿지 못함"을 구분하는 것이다. 다시 뭉개지면 쿠키가
 * 멀쩡한 사용자가 네트워크 한 번 흔들릴 때마다 로그아웃된다.
 */
describe("refreshSession", () => {
  it("새 토큰을 받으면 저장하고 ok 를 돌려준다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: { accessToken: "new" } }));

    await expect(refreshSession()).resolves.toEqual({ kind: "ok", accessToken: "new" });
    expect(auth.setTokens).toHaveBeenCalledWith("new");
    expect(trackEvent).toHaveBeenCalledWith("auth_refresh", { result: "ok", code: "" });
  });

  it("서버가 success:false 로 답하면 rejected 와 코드를 돌려준다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: false, error: { code: "2001" } }));

    const result = await refreshSession();
    expect(result).toEqual({ kind: "rejected", code: "2001" });
    expect(isSessionEnded(result)).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith("auth_refresh", { result: "rejected", code: "2001" });
  });

  it("제재 거부는 세션 종료로 보지 않는다(제재 화면이 받는다)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: false, error: { code: "6006" } }));

    const result = await refreshSession();
    expect(result).toEqual({ kind: "rejected", code: "6006" });
    expect(isSessionEnded(result)).toBe(false);
  });

  it("네트워크 오류·취소는 unreachable 이다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Load failed"));

    const result = await refreshSession();
    expect(result).toEqual({ kind: "unreachable" });
    expect(isSessionEnded(result)).toBe(false);
    expect(trackEvent).toHaveBeenCalledWith("auth_refresh", { result: "unreachable", code: "" });
  });

  it("5xx 는 세션을 판정한 응답이 아니라 unreachable 이다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(502, { success: false, error: { code: "9999" } }));

    await expect(refreshSession()).resolves.toEqual({ kind: "unreachable" });
  });

  it("동시에 불러도 요청은 한 번만 나간다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: { accessToken: "new" } }));

    await Promise.all([refreshSession(), refreshSession()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

/**
 * 서버는 refresh 를 받는 순간 토큰을 바꾸고 옛 토큰을 30초 뒤 만료시킨다. 기다리기 상한(8초)에서
 * 요청까지 끊으면 새 쿠키가 담긴 응답을 버려, 30초 뒤의 다음 refresh 가 2002 로 로그아웃된다
 * (2026-11-23 조사). 그래서 기다리기만 멈추고 요청은 끝까지 받는다.
 */
describe("refreshSession 의 기다리기 상한", () => {
  type Deferred = { signal: AbortSignal; resolve: (res: Response) => void };
  let pendingFetches: Deferred[];

  /** 응답을 테스트가 직접 돌려줄 때까지 끝나지 않는 fetch. abort 되면 AbortError 로 끝난다. */
  const holdFetch = () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const signal = init.signal as AbortSignal;
          pendingFetches.push({ signal, resolve });
          signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
  };

  /** 응답 본문 읽기까지 끝나도록 마이크로태스크를 비운다(setImmediate 는 가짜 타이머가 아니다). */
  const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

  beforeEach(() => {
    pendingFetches = [];
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(async () => {
    // 남은 요청을 끝내 모듈의 진행 중 상태를 비운다. 안 그러면 다음 테스트가 여기에 합류한다.
    pendingFetches.forEach((pending) => pending.resolve(jsonResponse(503, {})));
    await vi.runAllTimersAsync();
    await flush();
    vi.useRealTimers();
  });

  it("8초가 지나면 unreachable 을 주지만 요청은 끊지 않는다", async () => {
    holdFetch();

    const result = refreshSession();
    await vi.advanceTimersByTimeAsync(8000);

    await expect(result).resolves.toEqual({ kind: "unreachable" });
    expect(pendingFetches).toHaveLength(1);
    expect(pendingFetches[0].signal.aborted).toBe(false);
  });

  it("기다리기를 멈춘 뒤 늦게 온 토큰은 저장하지 않는다", async () => {
    holdFetch();

    const result = refreshSession();
    await vi.advanceTimersByTimeAsync(8000);
    await result;

    pendingFetches[0].resolve(jsonResponse(200, { success: true, data: { accessToken: "late" } }));
    await flush();

    expect(auth.setTokens).not.toHaveBeenCalled();
  });

  it("늦은 요청이 남아 있으면 다시 불러도 새 요청을 보내지 않고 합류한다", async () => {
    holdFetch();

    const first = refreshSession();
    await vi.advanceTimersByTimeAsync(8000);
    await first;

    const second = refreshSession();
    pendingFetches[0].resolve(jsonResponse(200, { success: true, data: { accessToken: "new" } }));

    await expect(second).resolves.toEqual({ kind: "ok", accessToken: "new" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(auth.setTokens).toHaveBeenCalledWith("new");
  });

  it("요청 상한(20초)에 걸리면 끊고, 다음 refresh 는 새 요청을 보낸다", async () => {
    holdFetch();

    const first = refreshSession();
    await vi.advanceTimersByTimeAsync(20_000);
    await first;
    expect(pendingFetches[0].signal.aborted).toBe(true);

    void refreshSession();
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("externalApiFetch 의 401 재시도", () => {
  const unauthorized = () => jsonResponse(401, { success: false, error: { code: "0003" } });

  it("refresh 가 서버에 닿지 못하면 토큰을 지우지 않는다", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockRejectedValueOnce(new TypeError("Load failed"));

    await expect(externalApiFetch("/api/v1/chat/rooms")).rejects.toMatchObject({ status: 401 });
    expect(auth.clearTokens).not.toHaveBeenCalled();
  });

  it("서버가 refresh 를 거부하면 토큰을 지운다", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(jsonResponse(200, { success: false, error: { code: "2002" } }));

    await expect(externalApiFetch("/api/v1/chat/rooms")).rejects.toMatchObject({ status: 401 });
    expect(auth.clearTokens).toHaveBeenCalledTimes(1);
  });
});
