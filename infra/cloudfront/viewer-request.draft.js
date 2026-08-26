// ⚠️ 초안 — 배포 전 반드시 실제 함수 소스와 대조할 것.
//
// 현재 배포판(E2IAN5BWR5D33B)에 이미 붙어 있는 viewer-request 함수의 소스를 볼 수
// 없어(AWS 자격증명 없음), 외부 관측으로 동작을 역설계한 초안이다.
// 관측된 사실:
//   test.ditto.pics/       → staging 콘텐츠      (호스트→프리픽스 라우팅 존재)
//   ditto.pics/            → prod 콘텐츠
//   알 수 없는 호스트       → prod 콘텐츠         (기본값 prod)
//   www.ditto.pics/        → 301 https://ditto.pics/
//   /home 과 /home/        → 동일 응답           (트레일링 슬래시 정규화 존재)
//   /profile/{무엇이든}/    → placeholder         (과매칭)
//
// 확인 못 한 것: 프리픽스를 함수가 붙이는지 origin path가 붙이는지, 보안 헤더 등
// 부가 로직 유무. 그래서 이 파일은 "붙이는 것"이 아니라 "대조용"이다.
//
// 콘솔의 Function TEST 탭으로 배포 없이 입력 URI별 출력을 확인할 수 있다.
// 기존 함수를 TEST에 걸어보면 위 미확인 항목도 바로 드러난다.

var PROD_HOST = 'ditto.pics';
var WWW_HOST = 'www.ditto.pics';
var STAGING_HOST = 'test.ditto.pics';

var STAGING_PREFIX = '/staging';
var PROD_PREFIX = '/prod';

// 생성물과 동일한 라우트 표. scripts/generate-cf-rewrite-function.mjs 참고.
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
  var host = request.headers.host ? request.headers.host.value : '';

  // [수정 1] www → apex 301 을 뒤집는다.
  // 아펙스에 DNS 레코드가 없어(hosting.co.kr 이 A에 IP만 허용) 기존 방향은
  // 실사용자를 존재하지 않는 도메인으로 보낸다. www 를 정본으로 삼는다.
  // Route53 이전이 끝나 아펙스가 살아나면 이 분기가 그대로 apex→www 가 된다.
  if (host === PROD_HOST) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { 'location': { value: 'https://' + WWW_HOST + request.uri } }
    };
  }

  var prefix = (host === STAGING_HOST) ? STAGING_PREFIX : PROD_PREFIX;
  var uri = request.uri;

  // 정적 자산은 프리픽스만 붙이고 통과.
  if (uri.indexOf('/_next/') === 0 || uri.indexOf('/assets/') === 0 || uri.indexOf('/icons/') === 0) {
    request.uri = prefix + uri;
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

    // [수정 2] 숫자 id 만 매칭한다.
    // 이 가드가 없어서 지금 /profile/edit/, /profile/intro-note/, /quiz/current/ 가
    // placeholder 로 덮여 있다(staging·prod 양쪽 재현).
    var id = segs[r.p.length];
    if (!/^[0-9]+$/.test(id)) continue;

    for (var k = 0; k < r.s.length; k++) {
      if (segs[r.p.length + 1 + k] !== r.s[k]) { matched = false; break; }
    }
    if (!matched) continue;

    request.uri = prefix + r.t;
    return request;
  }

  // 트레일링 슬래시 정규화: 확장자가 없으면 디렉터리로 보고 index.html 을 붙인다.
  var last = segs.length > 0 ? segs[segs.length - 1] : '';
  if (last.indexOf('.') === -1) {
    request.uri = prefix + '/' + segs.join('/') + (segs.length ? '/' : '') + 'index.html';
  } else {
    request.uri = prefix + uri;
  }

  return request;
}

// [수정 3 — 함수 밖 작업] 없는 경로의 404 폴백이 프리픽스 없이 /index.html 을
// 가리키고 있어, staging 에서 없는 경로를 하드 로드하면 prod 빌드가 뜬다.
// CloudFront 커스텀 오류 응답은 호스트를 모르므로 함수로는 못 고친다.
// 배포판을 staging/prod 두 개로 분리하거나, 오류 응답 경로를 재검토해야 한다.
