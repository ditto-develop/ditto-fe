import { describe, expect, it } from "vitest";

import { parseOfflineDiag } from "@/shared/lib/observability/faro";

describe("parseOfflineDiag", () => {
  it("iOS 오프라인 화면이 실어 온 기록을 읽는다", () => {
    const raw = JSON.stringify([
      { name: "offline_page_shown", domain: "app_offline", attributes: { error_code: -1009, online: false }, timestamp: "2026-11-16T01:00:00.000Z" },
    ]);

    expect(parseOfflineDiag(raw)).toEqual([
      { name: "offline_page_shown", attributes: { error_code: "-1009", online: "false" }, timestamp: "2026-11-16T01:00:00.000Z" },
    ]);
  });

  it("값이 없거나 깨졌으면 빈 목록이다", () => {
    expect(parseOfflineDiag(null)).toEqual([]);
    expect(parseOfflineDiag("{not json")).toEqual([]);
    expect(parseOfflineDiag(JSON.stringify({ name: "x" }))).toEqual([]);
  });

  it("모양이 틀린 항목은 버리고 최근 10개만 받는다", () => {
    const items = Array.from({ length: 12 }, (_, i) => ({ name: `e${i}`, attributes: {} }));
    const parsed = parseOfflineDiag(JSON.stringify([...items, { name: 1 }, "x"]));

    expect(parsed.map((e) => e.name)).toEqual(["e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"]);
  });
});
