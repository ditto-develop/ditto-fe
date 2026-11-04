#!/usr/bin/env node
/**
 * 커밋된 CloudFront 함수에서 prod 릴리스 프리픽스만 바꾼 사본을 만든다.
 *
 * 왜 따로 두나: 배포는 "새 릴리스 폴더를 다 올린 뒤 함수의 프리픽스 한 줄을 바꿔 게시"로
 * 한 번에 넘어간다. 그 한 줄을 sed 로 바꾸면 패턴이 어긋났을 때 **치환 없이 옛 프리픽스로
 * 게시**되고 배포는 성공한 것처럼 보인다. 여기서는 정확히 한 번 바뀌지 않으면 실패한다.
 *
 * 사용:
 *   node scripts/render-cf-release-function.mjs <releaseId> <출력 경로>
 */

import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = process.env.CF_REWRITE_TARGET ?? "infra/cloudfront/rewrite-dynamic-routes.js";
const LINE = /^var PROD_RELEASE_PREFIX = '\/prod';$/m;
// S3 키와 함수 소스에 그대로 들어가므로 따옴표·슬래시가 섞이지 않게 막는다.
const RELEASE_ID = /^[0-9A-Za-z][0-9A-Za-z-]*$/;

const [releaseId, outPath] = process.argv.slice(2);

if (!releaseId || !outPath) {
  console.error("사용: node scripts/render-cf-release-function.mjs <releaseId> <출력 경로>");
  process.exit(1);
}
if (!RELEASE_ID.test(releaseId)) {
  console.error(`[cf-release] 릴리스 id 형식이 아니다: ${releaseId}`);
  process.exit(1);
}

const source = readFileSync(SOURCE, "utf8");
const matches = source.match(new RegExp(LINE.source, "gm")) ?? [];
if (matches.length !== 1) {
  console.error(
    `[cf-release] ${SOURCE} 에서 PROD_RELEASE_PREFIX 선언을 정확히 한 번 찾지 못했다(${matches.length}건). ` +
      "생성기의 선언 모양이 바뀌었다면 이 스크립트의 LINE 도 고칠 것.",
  );
  process.exit(1);
}

writeFileSync(outPath, source.replace(LINE, `var PROD_RELEASE_PREFIX = '/releases/${releaseId}';`));
console.log(`[cf-release] ${outPath} — prod 프리픽스 /releases/${releaseId}`);
