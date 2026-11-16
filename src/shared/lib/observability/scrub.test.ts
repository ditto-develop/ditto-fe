import { describe, expect, it } from "vitest";

import type { TransportItem } from "@grafana/faro-web-sdk";

import { scrubTransportItem, stripQuery, stripQueriesInText } from "@/shared/lib/observability/scrub";

describe("stripQuery", () => {
  it("쿼리와 해시를 지운다", () => {
    expect(stripQuery("https://ditto.pics/auth/callback/?code=abc&state=x")).toBe("https://ditto.pics/auth/callback/");
    expect(stripQuery("https://ditto.pics/home#token=1")).toBe("https://ditto.pics/home");
  });

  it("쿼리가 없으면 그대로 둔다", () => {
    expect(stripQuery("https://ditto.pics/home/")).toBe("https://ditto.pics/home/");
  });
});

describe("stripQueriesInText", () => {
  it("문장 속 URL 의 쿼리만 지운다", () => {
    expect(stripQueriesInText("GET https://api.ditto.pics/api/v1/x?cursor=9 failed (401)")).toBe(
      "GET https://api.ditto.pics/api/v1/x failed (401)",
    );
  });

  it("URL 이 아닌 물음표는 건드리지 않는다", () => {
    expect(stripQueriesInText("왜 실패했지? code=1")).toBe("왜 실패했지? code=1");
  });
});

describe("scrubTransportItem", () => {
  const base = {
    meta: { page: { url: "https://ditto.pics/oauth/kakao/?code=secret" } },
  };

  it("페이지 주소와 이벤트 속성의 쿼리를 지운다", () => {
    const item = {
      ...base,
      type: "event",
      payload: {
        name: "faro.performance.resource",
        timestamp: "t",
        attributes: { name: "https://api.ditto.pics/api/v1/feature-flags?keys=RECORDS" },
      },
    } as unknown as TransportItem;

    const out = scrubTransportItem(item);

    expect(out.meta.page?.url).toBe("https://ditto.pics/oauth/kakao/");
    expect((out.payload as { attributes: Record<string, string> }).attributes.name).toBe(
      "https://api.ditto.pics/api/v1/feature-flags",
    );
  });

  it("로그 메시지와 예외 메시지의 쿼리를 지운다", () => {
    const log = scrubTransportItem({
      ...base,
      type: "log",
      payload: { message: "fetch https://ditto.pics/a?code=1", level: "error", timestamp: "t" },
    } as unknown as TransportItem);
    const exception = scrubTransportItem({
      ...base,
      type: "exception",
      payload: { type: "Error", value: "load https://ditto.pics/b?code=2", timestamp: "t" },
    } as unknown as TransportItem);

    expect((log.payload as { message: string }).message).toBe("fetch https://ditto.pics/a");
    expect((exception.payload as { value: string }).value).toBe("load https://ditto.pics/b");
  });

  it("원본을 바꾸지 않는다", () => {
    const item = { ...base, type: "event", payload: { name: "x", timestamp: "t" } } as unknown as TransportItem;
    scrubTransportItem(item);
    expect(item.meta.page?.url).toBe("https://ditto.pics/oauth/kakao/?code=secret");
  });
});
