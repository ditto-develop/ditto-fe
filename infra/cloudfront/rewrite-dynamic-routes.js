// 이 파일은 생성됩니다. 직접 수정하지 마세요.
// 생성: node scripts/generate-cf-rewrite-function.mjs  (out/ 스캔 결과 기반)
//
// 배포판 E2IAN5BWR5D33B 의 default behavior 에 붙는 viewer-request Function
// (JS runtime 2.0, 이름 `www-to-apex-ditto-pics`). **이 함수 하나가 전부다** —
// CloudFront 는 behavior 당 viewer-request 를 하나만 허용하므로, 아래 세 가지를
// 한 함수가 다 한다. 하나라도 빠뜨리고 배포하면 사이트가 통째로 깨진다.
//
//   1. www.ditto.pics → 아펙스 301 (쿼리스트링 보존)
//   2. host → S3 프리픽스(prod 는 릴리스 폴더, test 는 `/staging`) + 디렉터리 URI → index.html
//      ⚠️ 프리픽스는 origin path 가 아니라 **이 함수가** 붙인다. 2026-08-28 에
//      라이브 소스를 직접 읽어 확인했다. 빼면 전 경로가 404 다.
//      prod 는 배포마다 `releases/<id>/` 에 통째로 올리고, 이 함수의 PROD_RELEASE_PREFIX 를
//      바꿔 게시하는 순간 한 번에 넘어간다(scripts/render-cf-release-function.mjs).
//      청크(`/_next/static/`)만은 버전 공용 `/prod` 에 둔다 — 배포 전에 열어 둔 탭이
//      옛 청크를 계속 받아야 하기 때문이다.
//   3. 정적 export 동적 라우트 rewrite (아래 ROUTES)
//
// 3번이 있는 이유: 정적 export 는 동적 라우트를 placeholder 한 장으로만 내보내
// /profile/12/ 같은 실제 id 경로가 S3 에 없다. rewrite 가 없으면 404 폴백이
// 루트 index.html(200)로 덮어 주소창만 그대로인 채 로그인 첫 화면이 뜬다.
// FE 의 resolveStaticRouteParam() 이 window.location.pathname 에서 id 를 복구한다.

var ROUTES = [
  { p: ["chat","group"], s: ["rate"], t: "/chat/group/placeholder/rate/index.html" },
  { p: ["chat","one-on-one"], s: ["rate"], t: "/chat/one-on-one/placeholder/rate/index.html" },
  { p: ["chat","group"], s: [], t: "/chat/group/placeholder/index.html" },
  { p: ["chat","one-on-one"], s: [], t: "/chat/one-on-one/placeholder/index.html" },
  { p: ["profile"], s: [], t: "/profile/placeholder/index.html" },
  { p: ["quiz"], s: [], t: "/quiz/placeholder/index.html" },
  { p: ["records"], s: [], t: "/records/placeholder/index.html" }
];

// prod 의 현재 릴리스. 커밋본은 '/prod'(릴리스 폴더 도입 전 위치)이고, 배포 워크플로가
// '/releases/<id>' 로 치환한 사본을 게시한다. 이 줄의 모양을 바꾸면 치환 스크립트도 고칠 것.
var PROD_RELEASE_PREFIX = '/prod';

// 버전 공용 청크 위치. 파일명에 콘텐츠 해시가 붙어 릴리스끼리 섞여도 충돌하지 않는다.
var SHARED_CHUNK_PREFIX = '/prod';

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
  var isStaging = normalizedHost === 'test.ditto.pics';
  var prefix = isStaging ? '/staging' : PROD_RELEASE_PREFIX;

  var uri = rewriteDynamicRoute(request.uri);

  // 이미 프리픽스가 붙어 들어온 요청은 두 번 붙이지 않는다.
  if (uri.indexOf('/staging/') === 0 || uri.indexOf('/prod/') === 0 || uri.indexOf('/releases/') === 0) {
    request.uri = uri;
    return request;
  }

  // 청크는 릴리스 폴더가 아니라 공용 위치에서 준다(위 SHARED_CHUNK_PREFIX 설명).
  if (!isStaging && uri.indexOf('/_next/static/') === 0) {
    request.uri = SHARED_CHUNK_PREFIX + uri;
    return request;
  }

  // /.well-known/ 은 파일을 그대로 줘야 한다. 확장자가 없어서(예:
  // apple-app-site-association) 아래 규칙에 걸리면 '/index.html' 이 붙어 404 가 되고,
  // 그러면 유니버설 링크가 조용히 죽는다 — 애플은 이 경로를 그 이름 그대로만 읽는다.
  if (uri.indexOf('/.well-known/') === 0) {
    request.uri = prefix + uri;
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
