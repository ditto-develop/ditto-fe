import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * CloudFront Function은 AWS의 JS runtime 2.0에서 실행되는 독립 스크립트라
 * import 할 수 없다. 소스를 읽어 실행한 뒤 최상위 함수를 꺼내 검증한다.
 *
 * 고정하는 것 셋:
 *   1. 형제 정적 라우트가 rewrite 되지 않는가(숫자 id 가드). /profile/edit/ 이
 *      placeholder로 넘어가면 멀쩡하던 페이지가 깨진다.
 *   2. **S3 프리픽스와 index.html 을 이 함수가 붙이는가.** origin path 가 아니라
 *      함수가 붙인다 — 빠뜨리면 전 경로가 404 다. 2026-08-28 라이브 소스 확인.
 *   3. www → 아펙스 301.
 */
type CfRequest = { uri: string; headers?: Record<string, { value: string }>; querystring?: Record<string, { value: string }> };
type CfResponse = CfRequest & { statusCode?: number; headers?: Record<string, { value: string }> };
type CfHandler = (event: { request: CfRequest }) => CfResponse;

const source = readFileSync(
  fileURLToPath(new URL("./rewrite-dynamic-routes.js", import.meta.url)),
  "utf8",
);
const exported = new Function(
  `${source}; return { handler: handler, rewriteDynamicRoute: rewriteDynamicRoute };`,
)() as { handler: CfHandler; rewriteDynamicRoute: (uri: string) => string };

const rewrite = exported.rewriteDynamicRoute;

/** 실제 요청처럼 호스트를 달아 handler 를 통과시킨다. */
const serve = (
  uri: string,
  host = "ditto.pics",
  querystring: Record<string, { value: string }> = {},
): CfResponse => exported.handler({ request: { uri, headers: { host: { value: host } }, querystring } });

describe("CloudFront 동적 라우트 rewrite", () => {
  it.each([
    ["/profile/12/", "/profile/placeholder/index.html"],
    ["/quiz/7/", "/quiz/placeholder/index.html"],
    ["/chat/one-on-one/305/", "/chat/one-on-one/placeholder/index.html"],
    ["/chat/one-on-one/305/rate/", "/chat/one-on-one/placeholder/rate/index.html"],
    ["/chat/group/88/", "/chat/group/placeholder/index.html"],
    ["/chat/group/88/rate/", "/chat/group/placeholder/rate/index.html"],
  ])("숫자 id 경로 %s 를 placeholder 문서로 넘긴다", (uri, expected) => {
    expect(rewrite(uri)).toBe(expected);
  });

  it.each([
    "/profile/edit/",
    "/profile/intro-note/",
    "/quiz/current/",
    "/profile/",
    "/chat/",
    "/home/",
    "/settings/blocks/",
    "/admin/matches/",
    "/auth/callback/",
    "/profile/placeholder/",
  ])("형제 정적 라우트 %s 는 그대로 둔다", (uri) => {
    expect(rewrite(uri)).toBe(uri);
  });

  it.each(["/_next/static/chunks/main.js", "/assets/logo/ditto.svg", "/icons/notification/bell.svg"])(
    "정적 자산 %s 는 그대로 둔다",
    (uri) => {
      expect(rewrite(uri)).toBe(uri);
    },
  );

  it("세그먼트 깊이가 맞지 않으면 건드리지 않는다", () => {
    expect(rewrite("/chat/group/88/rate/extra/")).toBe("/chat/group/88/rate/extra/");
  });

  it("id 자리가 숫자가 아니면 건드리지 않는다", () => {
    expect(rewrite("/profile/me/")).toBe("/profile/me/");
  });
});

describe("호스트 처리와 S3 프리픽스", () => {
  it("www 는 아펙스로 301 한다 — 쿼리스트링을 잃지 않는다", () => {
    const res = serve("/quiz/7/", "www.ditto.pics", { from: { value: "push" } });
    expect(res.statusCode).toBe(301);
    expect(res.headers?.location.value).toBe("https://ditto.pics/quiz/7/?from=push");
  });

  it("아펙스는 /prod 프리픽스와 index.html 을 붙인다", () => {
    expect(serve("/home/").uri).toBe("/prod/home/index.html");
  });

  it("동적 라우트는 rewrite 된 뒤 프리픽스가 붙는다", () => {
    expect(serve("/chat/one-on-one/305/rate/").uri).toBe(
      "/prod/chat/one-on-one/placeholder/rate/index.html",
    );
  });

  it("정적 자산도 프리픽스를 받는다 — 여기서 빠지면 전부 404 다", () => {
    expect(serve("/_next/static/chunks/main.js").uri).toBe("/prod/_next/static/chunks/main.js");
    expect(serve("/assets/logo/ditto.svg").uri).toBe("/prod/assets/logo/ditto.svg");
  });

  it("확장자 없는 경로에는 /index.html 을 붙인다", () => {
    expect(serve("/home").uri).toBe("/prod/home/index.html");
  });

  it("알 수 없는 호스트는 prod 로 간다(기존 동작)", () => {
    expect(serve("/home/", "d28wm0h79feewt.cloudfront.net").uri).toBe("/prod/home/index.html");
  });

  it("이미 프리픽스가 붙은 URI 는 두 번 붙이지 않는다", () => {
    expect(serve("/prod/home/index.html").uri).toBe("/prod/home/index.html");
  });
});
