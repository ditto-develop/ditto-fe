// 이 파일은 생성됩니다. 직접 수정하지 마세요.
// 생성: node scripts/generate-cf-rewrite-function.mjs  (out/ 스캔 결과 기반)
//
// CloudFront viewer-request Function (JS runtime 2.0).
// 정적 export가 동적 라우트를 placeholder 한 장으로만 내보내기 때문에,
// /profile/12/ 같은 실제 id 경로는 S3에 객체가 없어 404 → 루트 index.html(200)로
// 덮이고 주소창만 그대로인 채 로그인 첫 화면이 뜬다. 이 함수가 실제 id 경로를
// placeholder 문서로 rewrite 해서 딥링크·공유 URL·푸시 알림 진입을 살린다.
// FE의 resolveStaticRouteParam()이 window.location.pathname에서 진짜 id를 복구한다.
//
// 주의: 이 함수는 S3 프리픽스(staging//prod/)를 모른다. 프리픽스는 CloudFront
// origin path가 붙이므로 여기서는 공개 URI만 다룬다.

var ROUTES = [
  { p: ["chat","group"], s: ["rate"], t: "/chat/group/placeholder/rate/index.html" },
  { p: ["chat","one-on-one"], s: ["rate"], t: "/chat/one-on-one/placeholder/rate/index.html" },
  { p: ["chat","group"], s: [], t: "/chat/group/placeholder/index.html" },
  { p: ["chat","one-on-one"], s: [], t: "/chat/one-on-one/placeholder/index.html" },
  { p: ["profile"], s: [], t: "/profile/placeholder/index.html" },
  { p: ["quiz"], s: [], t: "/quiz/placeholder/index.html" }
];

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // 정적 자산은 즉시 통과 — 가장 잦은 경로라 앞에서 끊는다.
  if (uri.indexOf('/_next/') === 0 || uri.indexOf('/assets/') === 0 || uri.indexOf('/icons/') === 0) {
    return request;
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
    // placeholder로 rewrite 되어 멀쩡한 페이지가 깨진다.
    var id = segs[r.p.length];
    if (!/^[0-9]+$/.test(id)) continue;

    for (var k = 0; k < r.s.length; k++) {
      if (segs[r.p.length + 1 + k] !== r.s[k]) { matched = false; break; }
    }
    if (!matched) continue;

    request.uri = r.t;
    return request;
  }

  return request;
}
