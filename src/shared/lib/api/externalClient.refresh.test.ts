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
