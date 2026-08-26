import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

/**
 * 생성기의 **스캔 로직**을 고정한다.
 *
 * 이 부분만 다른 안전망이 없다. 배포 워크플로의 `--check`는 생성 결과와 커밋본을
 * 비교하는데 둘 다 같은 로직에서 나오므로, 스캔이 라우트를 조용히 빠뜨려도
 * 검사를 통과한다. 즉 여기서 잡지 않으면 아무 데서도 못 잡는다.
 */

const SCRIPT = "scripts/generate-cf-rewrite-function.mjs";
let workspace: string | null = null;

function buildFixture(files: string[]): { outDir: string; target: string } {
  workspace = mkdtempSync(join(tmpdir(), "cf-rewrite-"));
  const outDir = join(workspace, "out");
  for (const rel of files) {
    const full = join(outDir, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, "<html></html>");
  }
  return { outDir, target: join(workspace, "generated.js") };
}

function generate(files: string[]): string {
  const { outDir, target } = buildFixture(files);
  execFileSync("node", [SCRIPT], {
    env: { ...process.env, CF_REWRITE_OUT_DIR: outDir, CF_REWRITE_TARGET: target },
  });
  return readFileSync(target, "utf8");
}

/** 생성된 함수를 실행해 rewrite 결과를 얻는다. */
function rewriterFrom(source: string): (uri: string) => string {
  const handler = new Function(`${source}; return handler;`)() as (e: {
    request: { uri: string };
  }) => { uri: string };
  return (uri) => handler({ request: { uri } }).uri;
}

afterEach(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true });
  workspace = null;
});

describe("생성기 스캔", () => {
  it("중첩된 placeholder 디렉터리를 전부 찾는다", () => {
    const source = generate([
      "profile/placeholder/index.html",
      "quiz/placeholder/index.html",
      "chat/group/placeholder/index.html",
      "chat/group/placeholder/rate/index.html",
      "chat/one-on-one/placeholder/index.html",
      "chat/one-on-one/placeholder/rate/index.html",
    ]);
    const rewrite = rewriterFrom(source);

    expect(rewrite("/profile/12/")).toBe("/profile/placeholder/index.html");
    expect(rewrite("/quiz/7/")).toBe("/quiz/placeholder/index.html");
    expect(rewrite("/chat/group/88/")).toBe("/chat/group/placeholder/index.html");
    expect(rewrite("/chat/group/88/rate/")).toBe("/chat/group/placeholder/rate/index.html");
    expect(rewrite("/chat/one-on-one/305/")).toBe("/chat/one-on-one/placeholder/index.html");
  });

  it("새 동적 라우트가 추가되면 자동으로 포함된다 — 드리프트가 구조적으로 불가능하다", () => {
    const rewrite = rewriterFrom(
      generate(["profile/placeholder/index.html", "event/placeholder/index.html"]),
    );
    expect(rewrite("/event/42/")).toBe("/event/placeholder/index.html");
  });

  it("더 깊은 라우트를 먼저 매칭한다", () => {
    const rewrite = rewriterFrom(
      generate([
        "chat/group/placeholder/index.html",
        "chat/group/placeholder/rate/index.html",
      ]),
    );
    // /rate/ 가 있는 쪽이 먼저 걸려야 한다.
    expect(rewrite("/chat/group/88/rate/")).toBe("/chat/group/placeholder/rate/index.html");
    expect(rewrite("/chat/group/88/")).toBe("/chat/group/placeholder/index.html");
  });

  it("형제 정적 라우트는 생성된 함수가 건드리지 않는다", () => {
    const rewrite = rewriterFrom(
      generate(["profile/placeholder/index.html", "profile/edit/index.html"]),
    );
    expect(rewrite("/profile/edit/")).toBe("/profile/edit/");
    expect(rewrite("/profile/12/")).toBe("/profile/placeholder/index.html");
  });

  it("placeholder 가 하나도 없으면 실패한다 — 빈 함수를 배포하지 않는다", () => {
    const { outDir, target } = buildFixture(["home/index.html"]);
    expect(() =>
      execFileSync("node", [SCRIPT], {
        env: { ...process.env, CF_REWRITE_OUT_DIR: outDir, CF_REWRITE_TARGET: target },
        stdio: "pipe",
      }),
    ).toThrow();
  });
});
