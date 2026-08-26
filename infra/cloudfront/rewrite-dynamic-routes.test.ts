import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * CloudFront Function은 AWS의 JS runtime 2.0에서 실행되는 독립 스크립트라
 * import 할 수 없다. 소스를 읽어 handler만 꺼내 검증한다.
 *
 * 이 테스트의 핵심은 "동적 라우트가 rewrite 되는가"보다
 * **"형제 정적 라우트가 rewrite 되지 않는가"** 다. /profile/edit/ 이 placeholder로
 * 넘어가면 멀쩡하던 페이지가 깨지므로, 숫자 id 가드가 회귀하지 않는지 고정한다.
 */
type CfRequest = { uri: string };
type CfHandler = (event: { request: CfRequest }) => CfRequest;

const source = readFileSync(
  fileURLToPath(new URL("./rewrite-dynamic-routes.js", import.meta.url)),
  "utf8",
);
const handler = new Function(`${source}; return handler;`)() as CfHandler;

const rewrite = (uri: string): string => handler({ request: { uri } }).uri;

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
