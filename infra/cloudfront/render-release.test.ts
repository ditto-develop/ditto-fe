import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

/**
 * 릴리스 전환을 고정한다. prod 배포는 `releases/<id>/` 를 다 올린 뒤 함수의 프리픽스 한 줄을
 * 바꿔 게시하는 것으로 한 번에 넘어간다(scripts/render-cf-release-function.mjs).
 *
 * 고정하는 것 셋:
 *   1. 치환된 함수가 문서·자산은 릴리스 폴더로, 청크만 공용 `/prod` 로 보내는가.
 *      청크까지 릴리스 폴더로 가면 배포 전에 열어 둔 탭이 옛 청크를 못 받아 죽는다.
 *   2. 치환이 정확히 한 번 일어나지 않으면 실패하는가. 조용히 넘어가면 옛 프리픽스로
 *      게시되고 배포는 성공한 것처럼 보인다.
 *   3. 릴리스 id 에 따옴표·슬래시가 섞이면 거부하는가.
 */

const SCRIPT = "scripts/render-cf-release-function.mjs";
const COMMITTED = "infra/cloudfront/rewrite-dynamic-routes.js";

type CfRequest = { uri: string; headers?: Record<string, { value: string }> };
type CfHandler = (event: { request: CfRequest }) => CfRequest;

let workspace: string | null = null;

function tempPath(name: string): string {
  workspace ??= mkdtempSync(join(tmpdir(), "cf-release-"));
  return join(workspace, name);
}

function render(releaseId: string, source = COMMITTED): string {
  const out = tempPath("rendered.js");
  execFileSync("node", [SCRIPT, releaseId, out], {
    env: { ...process.env, CF_REWRITE_TARGET: source },
    stdio: "pipe",
  });
  return readFileSync(out, "utf8");
}

function serverFrom(source: string): (uri: string, host?: string) => string {
  const handler = new Function(`${source}; return handler;`)() as CfHandler;
  return (uri, host = "ditto.pics") => handler({ request: { uri, headers: { host: { value: host } } } }).uri;
}

afterEach(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true });
  workspace = null;
});

describe("릴리스 프리픽스로 치환된 함수", () => {
  const serve = serverFrom(render("41769564818-1-b710313"));
  const release = "/releases/41769564818-1-b710313";

  it("라우트 문서는 릴리스 폴더에서 준다", () => {
    expect(serve("/home/")).toBe(`${release}/home/index.html`);
    expect(serve("/chat/group/88/rate/")).toBe(`${release}/chat/group/placeholder/rate/index.html`);
  });

  it("청크는 공용 /prod 에서 준다 — 배포 전에 열어 둔 탭이 옛 청크를 받아야 한다", () => {
    expect(serve("/_next/static/chunks/main.js")).toBe("/prod/_next/static/chunks/main.js");
  });

  it("청크가 아닌 /_next/ 아래와 public 자산·/.well-known/ 은 릴리스를 따른다", () => {
    expect(serve("/_next/BUILD_ID/x.txt")).toBe(`${release}/_next/BUILD_ID/x.txt`);
    expect(serve("/assets/logo/ditto.svg")).toBe(`${release}/assets/logo/ditto.svg`);
    expect(serve("/.well-known/apple-app-site-association")).toBe(
      `${release}/.well-known/apple-app-site-association`,
    );
  });

  it("이미 릴리스 프리픽스가 붙은 URI 는 두 번 붙이지 않는다", () => {
    expect(serve(`${release}/home/index.html`)).toBe(`${release}/home/index.html`);
  });

  it("staging 호스트는 릴리스와 무관하게 /staging 이다", () => {
    expect(serve("/home/", "test.ditto.pics")).toBe("/staging/home/index.html");
    expect(serve("/_next/static/chunks/main.js", "test.ditto.pics")).toBe(
      "/staging/_next/static/chunks/main.js",
    );
  });
});

describe("치환 스크립트의 실패 조건", () => {
  it.each(["", "a/b", "a'b", "-leading-dash", "with space"])("릴리스 id %j 는 거부한다", (id) => {
    expect(() => render(id)).toThrow();
  });

  it("선언 줄을 찾지 못하면 실패한다 — 옛 프리픽스로 게시하지 않는다", () => {
    const broken = tempPath("broken.js");
    writeFileSync(broken, readFileSync(COMMITTED, "utf8").replace("var PROD_RELEASE_PREFIX", "var PREFIX"));
    expect(() => render("123-1-abc", broken)).toThrow();
  });

  it("선언 줄이 두 번이면 실패한다", () => {
    const doubled = tempPath("doubled.js");
    const source = readFileSync(COMMITTED, "utf8");
    writeFileSync(doubled, `${source}\nvar PROD_RELEASE_PREFIX = '/prod';\n`);
    expect(() => render("123-1-abc", doubled)).toThrow();
  });
});
