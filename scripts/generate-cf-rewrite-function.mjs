#!/usr/bin/env node
/**
 * 정적 export의 동적 라우트를 위한 CloudFront viewer-request Function 생성기.
 *
 * 왜 생성하나: 라우트 목록을 AWS 콘솔에만 두면 새 동적 라우트가 추가돼도
 * 아무도 모르게 조용히 깨진다(INTEGRATION-TODO.md §0-1의 "드리프트" 경고).
 * `out/**​/placeholder`를 스캔해 함수 소스를 만들면 빌드 산출물이 곧 진실이 된다.
 *
 * 사용:
 *   node scripts/generate-cf-rewrite-function.mjs            # 생성
 *   node scripts/generate-cf-rewrite-function.mjs --check    # 커밋본과 diff (CI용)
 */

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";

// 테스트에서 픽스처 트리를 물릴 수 있도록 주입 가능하게 둔다. 기본값은 실제 빌드 산출물.
const OUT_DIR = process.env.CF_REWRITE_OUT_DIR ?? "out";
const TARGET = process.env.CF_REWRITE_TARGET ?? "infra/cloudfront/rewrite-dynamic-routes.js";
const PLACEHOLDER = "placeholder";

/** out/ 아래의 모든 placeholder 디렉터리를 찾는다. */
function findPlaceholderDirs(root) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (!statSync(full).isDirectory()) continue;
      if (entry === PLACEHOLDER) found.push(full);
      else walk(full);
    }
  };
  walk(root);
  return found.sort();
}

/** placeholder 디렉터리 하나에서 index.html 들을 찾아 라우트 항목으로 만든다. */
function routesFromPlaceholder(placeholderDir) {
  const routes = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "index.html") {
        // out/chat/group/placeholder/rate/index.html
        //   prefix = ["chat","group"], suffix = ["rate"]
        const prefix = relative(OUT_DIR, dirname(placeholderDir)).split(sep).filter(Boolean);
        const suffix = relative(placeholderDir, dirname(full)).split(sep).filter(Boolean);
        const target = "/" + relative(OUT_DIR, full).split(sep).join("/");
        routes.push({ p: prefix, s: suffix, t: target });
      }
    }
  };
  walk(placeholderDir);
  return routes;
}

const routes = findPlaceholderDirs(OUT_DIR)
  .flatMap(routesFromPlaceholder)
  // 세그먼트가 긴 것부터 검사해야 /chat/group/{id}/rate/ 가
  // /chat/group/{id}/ 보다 먼저 매칭된다.
  .sort((a, b) => b.p.length + b.s.length - (a.p.length + a.s.length));

if (routes.length === 0) {
  console.error(
    `[cf-rewrite] ${OUT_DIR}/ 에서 placeholder 디렉터리를 찾지 못했다. 'npm run build' 를 먼저 실행할 것.`,
  );
  process.exit(1);
}

const table = routes
  .map((r) => `  { p: ${JSON.stringify(r.p)}, s: ${JSON.stringify(r.s)}, t: ${JSON.stringify(r.t)} }`)
  .join(",\n");

const source = `// 이 파일은 생성됩니다. 직접 수정하지 마세요.
// 생성: node scripts/generate-cf-rewrite-function.mjs  (out/ 스캔 결과 기반)
//
// 배포판 E2IAN5BWR5D33B 의 default behavior 에 붙는 viewer-request Function
// (JS runtime 2.0, 이름 \`www-to-apex-ditto-pics\`). **이 함수 하나가 전부다** —
// CloudFront 는 behavior 당 viewer-request 를 하나만 허용하므로, 아래 세 가지를
// 한 함수가 다 한다. 하나라도 빠뜨리고 배포하면 사이트가 통째로 깨진다.
//
//   1. www.ditto.pics → 아펙스 301 (쿼리스트링 보존)
//   2. host → S3 프리픽스(\`/prod\`, test 는 \`/staging\`) + 디렉터리 URI → index.html
//      ⚠️ 프리픽스는 origin path 가 아니라 **이 함수가** 붙인다. 2026-08-28 에
//      라이브 소스를 직접 읽어 확인했다. 빼면 전 경로가 404 다.
//   3. 정적 export 동적 라우트 rewrite (아래 ROUTES)
//
// 3번이 있는 이유: 정적 export 는 동적 라우트를 placeholder 한 장으로만 내보내
// /profile/12/ 같은 실제 id 경로가 S3 에 없다. rewrite 가 없으면 404 폴백이
// 루트 index.html(200)로 덮어 주소창만 그대로인 채 로그인 첫 화면이 뜬다.
// FE 의 resolveStaticRouteParam() 이 window.location.pathname 에서 id 를 복구한다.

var ROUTES = [
${table}
];

function handler(event) {
  var request = event.request;
  var host = request.headers.host && request.headers.host.value;
  var normalizedHost = host ? host.toLowerCase() : '';

  // 1) www → 아펙스 301. rewrite 이전의 원본 URI 로 보낸다.
  if (normalizedHost === 'www.ditto.pics') {
    var parts = [];
    if (request.querystring) {
      for (var q in request.querystring) {
        parts.push(encodeURIComponent(q) + '=' + encodeURIComponent(request.querystring[q].value));
      }
    }
    var qs = parts.length ? '?' + parts.join('&') : '';
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://ditto.pics' + request.uri + qs } }
    };
  }

  // 2) host → S3 프리픽스. 알 수 없는 호스트는 prod 다(기존 동작 유지).
  var prefix = normalizedHost === 'test.ditto.pics' ? '/staging' : '/prod';

  var uri = rewriteDynamicRoute(request.uri);

  // 이미 프리픽스가 붙어 들어온 요청은 두 번 붙이지 않는다.
  if (uri.indexOf('/staging/') === 0 || uri.indexOf('/prod/') === 0) {
    request.uri = uri;
    return request;
  }

  // 디렉터리 URI 는 index.html 로. 확장자가 있으면 그대로 둔다(정적 자산).
  if (uri.endsWith('/')) {
    uri += 'index.html';
  } else if (!uri.split('/').pop().includes('.')) {
    uri += '/index.html';
  }

  request.uri = prefix + uri;
  return request;
}

// 3) 동적 라우트 → placeholder 문서. 매칭이 없으면 입력을 그대로 돌려준다.
function rewriteDynamicRoute(uri) {
  // 정적 자산은 볼 것도 없다 — 가장 잦은 경로라 앞에서 끊는다.
  if (uri.indexOf('/_next/') === 0 || uri.indexOf('/assets/') === 0 || uri.indexOf('/icons/') === 0) {
    return uri;
  }

  var segs = uri.split('/').filter(function (s) { return s.length > 0; });

  for (var i = 0; i < ROUTES.length; i++) {
    var r = ROUTES[i];
    if (segs.length !== r.p.length + 1 + r.s.length) continue;

    var matched = true;
    for (var j = 0; j < r.p.length; j++) {
      if (segs[j] !== r.p[j]) { matched = false; break; }
    }
    if (!matched) continue;

    // 동적 세그먼트는 숫자 id만 허용한다. 이 가드가 없으면 형제로 존재하는
    // 실제 정적 라우트(/profile/edit/, /profile/intro-note/, /quiz/current/)까지
    // placeholder로 rewrite 되어 멀쩡한 페이지가 깨진다. 2026-08-28 이전의
    // 라이브 함수가 정확히 그 상태였다.
    var id = segs[r.p.length];
    if (!/^[0-9]+$/.test(id)) continue;

    for (var k = 0; k < r.s.length; k++) {
      if (segs[r.p.length + 1 + k] !== r.s[k]) { matched = false; break; }
    }
    if (!matched) continue;

    return r.t;
  }

  return uri;
}
`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(TARGET, "utf8");
  } catch {
    console.error(`[cf-rewrite] ${TARGET} 이 없다. 생성 후 커밋할 것.`);
    process.exit(1);
  }
  if (current !== source) {
    console.error(
      `[cf-rewrite] ${TARGET} 이 out/ 과 어긋난다. 동적 라우트가 추가/삭제된 것 같다.\n` +
        `  node scripts/generate-cf-rewrite-function.mjs 를 실행하고 커밋할 것.`,
    );
    process.exit(1);
  }
  console.log(`[cf-rewrite] ${TARGET} 최신 상태 (라우트 ${routes.length}건).`);
  process.exit(0);
}

mkdirSync(dirname(TARGET), { recursive: true });
writeFileSync(TARGET, source);
console.log(`[cf-rewrite] ${TARGET} 생성 완료 — 라우트 ${routes.length}건:`);
routes.forEach((r) => {
  console.log(`  /${[...r.p, "{id}", ...r.s].join("/")}/  ->  ${r.t}`);
});
