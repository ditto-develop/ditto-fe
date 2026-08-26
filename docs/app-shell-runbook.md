# 앱 셸(Capacitor) 런북

> 대상: `feat/capacitor-app-shell` 이후. BE 요청 항목은 `docs/be-request-app-push-auth.md` 참고.

---

## 1. 이 앱의 구조 — 먼저 읽을 것

**원격 URL 로드 방식이다.** 웹 번들을 앱에 넣지 않는다. 앱은 이미 배포된
CloudFront 도메인을 웹뷰로 열 뿐이다 (`capacitor.config.ts`의 `server.url`).

결과적으로:

- **웹은 그대로 살아 있다.** 앱과 웹이 같은 번들·같은 배포물이다.
- 화면 수정은 **기존 S3/CloudFront 배포만으로 앱에도 즉시 반영**된다. 스토어 심사 불필요.
- 카카오맵 JS SDK의 도메인 등록(`ditto.pics`)이 앱에서도 유효하다.
- BE CORS/쿠키에 새 origin을 추가할 필요가 없다.

**따라서 코드에서 웹 경로를 교체하면 안 된다. 분기만 추가한다.**
`isNativeApp()`(`src/shared/lib/native/platform.ts`)은 일반 브라우저에서 항상 `false`이고,
네이티브 모듈은 전부 웹에서 no-op이다.

---

## 2. 네이티브 프로젝트 (생성 완료)

`android/`, `ios/` 는 **이미 생성되어 커밋되어 있다.** 다시 만들 필요 없다.
(재생성이 필요하면 해당 디렉터리를 지우고 `npx cap add android` / `npx cap add ios` —
`android/ios` 처럼 한 번에 두 개를 넘기는 문법은 없다.)

| 플랫폼 | 빌드에 필요한 도구 |
|---|---|
| Android | JDK 17+, Android Studio + Android SDK |
| iOS | Xcode |

> **CocoaPods는 필요 없다.** Capacitor 8은 SwiftPM(`Package.swift`)을 쓴다.
> 프로젝트 *생성*은 두 플랫폼 모두 SDK/Xcode 없이도 되지만, *빌드*에는 위 도구가 필요하다.

복사된 웹 자산(`android/app/src/main/assets/public`, `ios/App/App/public`)은
원격 URL 로드라 실제로 쓰이지 않으며 `.gitignore`로 제외되어 있다.

### 이미 설정해 둔 것

- **권한** — Android: 위치(지도), `POST_NOTIFICATIONS`(Android 13+).
  iOS: `NSLocationWhenInUseUsageDescription`(**없으면 지도 화면에서 앱이 크래시한다**),
  사진/카메라 설명, `UIBackgroundModes: remote-notification`.
- **CAMERA 권한은 일부러 선언하지 않았다** — 사진 첨부는 시스템 파일 선택기로 처리되어
  권한이 불필요하고, 선언하면 런타임 승인까지 받아야 촬영이 동작해 실패 경로만 늘어난다.
- **세로 고정** — 393px 기준 모바일 전용 레이아웃이라 가로에서 깨진다.
  가로를 지원하려면 `AndroidManifest.xml`의 `android:screenOrientation`과
  `Info.plist`의 `UISupportedInterfaceOrientations`를 되돌리면 된다.

### 설정 변경 후 반영

```bash
npm run build
npx cap sync
npx cap open android          # Android Studio 실행
npx cap open ios              # Xcode 실행
```

### staging 앱 빌드

```bash
CAPACITOR_SERVER_URL=https://test.ditto.pics npx cap sync
```

기본값은 `https://ditto.pics`(prod)다.

---

## 2.1 앱이 서빙받을 도메인 — `app.ditto.pics`

앱은 웹(`ditto.pics` / `www`)과 **분리된 호스트**를 쓴다. 이유:

- **CloudFront 함수를 건드리지 않아도 된다.** 실측 결과 배포판은 *알 수 없는 호스트를
  prod 콘텐츠로* 서빙한다. `app.ditto.pics` 는 함수의 www 분기(301)에도 apex 분기에도
  걸리지 않고 기본값으로 떨어진다. 함수 수술이 이 작업에서 가장 위험한 부분인데 그걸 피한다.
- 앱/웹 트래픽이 분리되어 나중에 캐싱·분석 정책을 따로 줄 수 있다.
- 아펙스/www 정본 결정(§4.1)과 독립적으로 진행할 수 있다.

### 살리는 데 필요한 것

| # | 작업 | 어디서 | 상태 |
|---|---|---|---|
| 1 | `app` CNAME → `d28wm0h79feewt.cloudfront.net` | HOSTING.KR | 서브도메인이라 CNAME 가능 |
| 2 | CloudFront **대체 도메인 이름**에 `app.ditto.pics` 추가 | AWS 콘솔 | **필수** |
| 3 | 딥링크 허용 호스트에 추가 | 코드 | ✅ 완료 |
| 4 | 카카오 JS SDK 플랫폼 도메인 등록 | 카카오 콘솔 | 확인 필요 |

**2번을 빠뜨리면 DNS 만으로는 동작하지 않는다.** 인증서는 `ditto.pics` + `*.ditto.pics`
와일드카드라 재발급이 필요 없지만, CloudFront 는 **별칭으로 등록된 호스트에만 인증서를
제시한다.** 등록 전에는 HTTP 응답조차 오지 않고 TLS 핸드셰이크 단계에서 끊긴다:

```
$ curl --resolve app.ditto.pics:443:<CF-IP> https://app.ditto.pics/
* sslv3 alert handshake failure
```

### 살아났는지 확인

```bash
dig +short @8.8.8.8 app.ditto.pics                  # CloudFront 도메인이 나와야 한다
curl -s -o /dev/null -w "%{http_code}\n" https://app.ditto.pics/    # 200
```

`capacitor.config.ts` 의 기본 `server.url` 은 이미 `https://app.ditto.pics` 다.
1·2번이 끝나기 전까지 개발·테스트는 `npm run cap:staging`(→ `test.ditto.pics`)을 쓴다.

### ⚠️ 도메인을 바꾸기 전에 BE 에 확인할 것

카카오 OAuth 의 `redirect_uri` 는 **BE 자신**을 가리켜서 FE 도메인과 무관하다(확인함):

```
redirect_uri=https://api.ditto.pics/api/v1/users/social-login/KAKAO/callback
```

문제는 그다음이다. BE 가 카카오에서 돌아온 뒤 **FE 의 `/auth/callback` 으로 리다이렉트할 때
쓰는 호스트**는 BE 설정이라 밖에서 확인할 수 없다. `https://ditto.pics` 로 하드코딩돼 있으면
`app.ditto.pics` 에서 로그인해도 **죽은 도메인에 떨어진다.** www 정본화를 택해도 같은 문제라,
어느 쪽으로 가든 이 답을 먼저 받아야 한다. → BE 요청서 §C-3.

---

## 3. 앱에서 확인해야 할 것 (기기 스모크)

웹에서는 재현되지 않고 **기기에서만 드러나는** 항목이다. 순서대로 확인한다.

- [ ] **파일 첨부** — 채팅 입력(`ChatInput.tsx`)과 신고 증거 첨부(`EvidenceAttachField.tsx`).
      Android WebView는 `onShowFileChooser`가 없으면 **탭해도 아무 반응이 없다.**
      Capacitor는 이를 기본 제공하지만 실제 동작을 반드시 눈으로 확인할 것.
- [ ] **위치 권한** — 그룹채팅 장소 지도(`PlaceMapPage.tsx`)의 `navigator.geolocation`.
      Android는 런타임 권한 + `AndroidManifest.xml`의 `ACCESS_FINE_LOCATION`,
      iOS는 `Info.plist`의 `NSLocationWhenInUseUsageDescription`이 필요하다.
- [ ] **카카오 로그인 리다이렉트 체인** — 로그인 → 카카오 → `/auth/callback` 이
      **웹뷰 안에서** 끝나는지. 외부 브라우저로 빠지면 콜백이 앱으로 못 돌아온다.
      (`capacitor.config.ts`의 `server.allowNavigation`에 카카오 도메인을 등록해 뒀다)
- [ ] **세션 유지** — 앱 재실행 후 로그인이 유지되는지. refresh 쿠키가 웹뷰에서
      동작하는지 확인하는 것이 핵심이다 (BE 요청서 §C). 실패하면 §C의 대안으로 전환한다.
- [ ] **하드웨어 뒤로가기(Android)** — 채팅방에서 뒤로가기 시 앱이 종료되지 않고
      이전 화면으로 가는지. (`appShell.ts`의 `backButton` 리스너)
- [ ] **safe-area** — 노치/홈 인디케이터 기기에서 하단 버튼이 가리지 않는지.
      전역 하단탭(`MainBottomNav`)과 공용 하단 버튼(`BottomActionArea`)은 대응 완료.
      **나머지 하단 고정 요소는 아직 미적용** — §5 참고.
- [ ] **STOMP 채팅 소켓** — 앱을 백그라운드로 보냈다 복귀했을 때 재연결되는지.
      백그라운드 동안 온 메시지는 **푸시가 없으면 못 받는다**(BE 요청서 §B).

---

## 4. CloudFront 동적 라우트 rewrite (최초 1회)

`INTEGRATION-TODO.md` §0-1의 딥링크 버그 수정이다. 푸시 알림 딥링크의 **전제조건**이다.

### 무엇을 고치나

`output: 'export'`는 동적 라우트를 `placeholder` 한 장으로만 내보낸다.
`/profile/12/`를 직접 열면 S3에 객체가 없어 404 → CloudFront가 루트 `index.html`(200)로
덮어서, 주소창만 `/profile/12/`인 채 로그인 첫 화면이 뜬다.

viewer-request Function이 실제 id 경로를 placeholder 문서로 rewrite 하면
`resolveStaticRouteParam()`이 `window.location.pathname`에서 진짜 id를 복구한다.

### 함수 소스는 생성물이다

```bash
npm run build
node scripts/generate-cf-rewrite-function.mjs      # infra/cloudfront/rewrite-dynamic-routes.js 생성
```

`out/**/placeholder`를 스캔해 만들기 때문에 **새 동적 라우트가 생기면 자동으로 포함**된다.
배포 워크플로가 `--check`로 커밋본과 빌드 산출물이 어긋나는지 검사하고, 어긋나면 배포를 멈춘다.
로직 회귀는 `infra/cloudfront/rewrite-dynamic-routes.test.ts`가 막는다
(특히 `/profile/edit/` 같은 **형제 정적 라우트가 rewrite 되지 않는지**).

### 일회성 AWS 설정

```bash
# 1) 함수 생성
aws cloudfront create-function \
  --name ditto-rewrite-dynamic-routes \
  --function-config Comment="ditto dynamic route rewrite",Runtime=cloudfront-js-2.0 \
  --function-code fileb://infra/cloudfront/rewrite-dynamic-routes.js

# 2) 퍼블리시
ETAG=$(aws cloudfront describe-function --name ditto-rewrite-dynamic-routes --query 'ETag' --output text)
aws cloudfront publish-function --name ditto-rewrite-dynamic-routes --if-match "$ETAG"

# 3) 배포판 기본 behavior 의 viewer-request 에 연결
#    (콘솔에서 하는 편이 안전하다: CloudFront > E2IAN5BWR5D33B > Behaviors > Default > Function associations)
```

그 다음 GitHub 저장소 변수에 이름을 등록하면 이후 배포부터 자동 갱신된다:

```
Settings > Secrets and variables > Actions > Variables
CF_REWRITE_FUNCTION_NAME = ditto-rewrite-dynamic-routes
```

변수가 비어 있으면 워크플로의 퍼블리시 스텝은 조용히 건너뛴다 — 설정 전에 배포가 깨지지 않게 하기 위함이다.

### 배포 IAM 롤에 추가로 필요한 권한

`cloudfront:DescribeFunction`, `cloudfront:UpdateFunction`, `cloudfront:PublishFunction`
(최초 연결을 CLI로 한다면 `cloudfront:UpdateDistribution`도)

### ⚠️ 실측 결과 (2026-08-26) — 문서의 전제가 틀렸다

`INTEGRATION-TODO.md` §0-1은 "placeholder 서빙은 이 배포에서 한 번도 동작한 적이 없다"고
적고 있으나 **사실이 아니다.** staging 실측 결과 rewrite는 **이미 동작 중이고, 과매칭 상태**다.

응답 크기를 로컬 빌드 산출물과 대조한 결과:

| 경로 | 서빙 | 로컬 실제 | 판정 |
|---|---|---|---|
| `/profile/12/` | 9521 | 9521 (placeholder) | 정상 — rewrite 동작 중 |
| `/chat/one-on-one/305/` | 10311 | 10311 (placeholder) | 정상 |
| `/profile/edit/` | 9521 | **16759** | **깨짐** — placeholder가 덮음 |
| `/profile/intro-note/` | 9521 | **16555** | **깨짐** |
| `/quiz/current/` | 9489 | **9895** | **깨짐** |

즉 **동적 세그먼트를 무제한 매칭하는 rewrite가 이미 배포돼 있어, 형제 정적 라우트 3개를
placeholder로 덮고 있다.** 이 저장소의 함수가 숫자 id 가드로 막는 바로 그 사고다.

하드 로드에서만 재현되므로(앱 내부 이동은 Next 라우터가 받아서 정상) 지금까지 드러나지 않았다.
`/profile/edit/`를 새로고침하거나 URL을 직접 열면 프로필 상세가 뜬다.

**따라서 이 저장소의 함수를 연결하는 것은 신규 도입이 아니라 기존 과매칭의 수정이다.**
연결 전에 콘솔에서 **현재 무엇이 rewrite를 하고 있는지 반드시 확인할 것** — CloudFront는
behavior당 viewer-request 함수를 하나만 붙일 수 있어, 기존 함수가 있으면 교체된다.
기존 함수가 host 기반 staging/prod 프리픽스 분기까지 겸하고 있다면 그 로직을
이 함수에 합쳐야 한다. 확인 없이 붙이면 사이트 전체가 깨진다.

> ⚠️ `ditto.pics`(prod)와 `test.ditto.pics`(staging)는 **같은 배포판 E2IAN5BWR5D33B**를 쓴다.
> default behavior에 함수를 붙이면 staging만 검증하는 것이 불가능하고 prod에 즉시 적용된다.
> staging 전용 검증이 필요하면 host 조건 분기를 함수 안에 넣어야 한다.

404 폴백을 `/index.html`(200) → `/404.html`(404)로 바꾸는 것은 **이 함수가 동작한 뒤에** 한다.
순서를 뒤집으면 지금 첫 화면이 뜨던 자리에 404가 뜰 뿐 더 나빠진다.

---

### 기존 함수 역설계 초안

배포판에 이미 붙어 있는 viewer-request 함수의 소스를 볼 수 없어(AWS 자격증명 없음),
외부 관측으로 동작을 역설계한 초안이 `infra/cloudfront/viewer-request.draft.js` 다.

관측된 기존 동작:

| 요청 | 결과 | 의미 |
|---|---|---|
| `test.ditto.pics/` | staging 콘텐츠 | 호스트→프리픽스 라우팅 존재 |
| `ditto.pics/` | prod 콘텐츠 | |
| 알 수 없는 호스트 | prod 콘텐츠 | 기본값 prod |
| `www.ditto.pics/` | 301 → `https://ditto.pics/` | **죽은 아펙스로 보냄** |
| `/home` 과 `/home/` | 동일 응답 | 트레일링 슬래시 정규화 존재 |
| `/profile/{무엇이든}/` | placeholder | **과매칭** |
| `test.ditto.pics/nope/` | **prod 의 index.html** | **404 폴백에 프리픽스 누락** |

초안이 고치는 것 3가지:

1. **www→apex 301 을 뒤집는다.** 아펙스에 DNS 레코드가 없으므로(§4.1) 기존 방향은
   실사용자를 존재하지 않는 도메인으로 보낸다. Route53 이전이 끝나면 이 분기가
   그대로 apex→www 가 되어 일관된다.
2. **숫자 id 가드**로 형제 정적 라우트 과매칭을 막는다.
3. 404 폴백 프리픽스 누락은 **함수로 못 고친다** — CloudFront 커스텀 오류 응답은
   호스트를 모른다. 배포판을 staging/prod 두 개로 분리하거나 오류 응답 경로를
   재검토해야 한다. 별도 과제로 남긴다.

⚠️ **이 초안을 그대로 붙이지 말 것.** 프리픽스를 함수가 붙이는지 origin path 가
붙이는지, 보안 헤더 등 부가 로직이 있는지 확인하지 못했다. 대조용이다.

> 💡 CloudFront 콘솔의 Function **TEST 탭**을 쓰면 배포 없이 입력 URI 별 출력을 볼 수 있다.
> **기존 함수를 TEST 에 걸어보면 위 미확인 항목이 바로 드러난다.** 이것이 소스를
> 확인하는 가장 빠른 방법이다.

---

## 4.1 ⚠️ 프로덕션 DNS 장애 (2026-08-26 발견, 이 작업과 무관)

**`ditto.pics` 아펙스 도메인에 DNS 레코드가 하나도 없다.** 공개 리졸버(8.8.8.8 / 1.1.1.1)
양쪽에서 A·AAAA·CNAME·MX·TXT 전부 비어 있다(존은 존재, `status: NOERROR`).

```
dig +short @8.8.8.8 ditto.pics A        → (빈 응답)
dig +short @8.8.8.8 www.ditto.pics      → d28wm0h79feewt.cloudfront.net ✅
dig +short @8.8.8.8 test.ditto.pics     → d28wm0h79feewt.cloudfront.net ✅
```

그런데 `www.ditto.pics`는 CloudFront에서 **301로 `https://ditto.pics/`로 보낸다.**
즉 **실사용자는 프로덕션에 접속할 수 없다** — www로 들어와도 존재하지 않는 도메인으로 튕긴다.

- 네임서버는 Route53이 아니라 `ns1~4.hosting.co.kr` 이다. DNS는 해당 호스팅 콘솔에서 관리된다.
- 조치: 아펙스 `ditto.pics`에 CloudFront(`d28wm0h79feewt.cloudfront.net`)를 가리키는
  레코드 추가. 아펙스는 CNAME을 못 쓰므로 호스팅 업체의 ALIAS/ANAME 기능이 필요하고,
  없다면 Route53으로 이전하거나 www를 정본으로 바꾸고 301 방향을 뒤집어야 한다.

## 5. 남은 작업

- [ ] **푸시 활성화** — BE의 A·B 도착 후 `NEXT_PUBLIC_PUSH_ENABLED=true`.
      배포 워크플로의 `Build` 스텝 `env:`에도 추가해야 한다.
- [x] **safe-area 완료.** 코드베이스에 이미 24개 파일이 `env(safe-area-inset-*)`를
      쓰고 있었고, `viewport-fit=cover`가 없어 전부 0으로 계산되던 것을 살린 것이
      이번 수정이다. 나머지를 전수 점검한 결과 **실제로 필요한 것은 2개뿐**이었다:

      - `shared/ui/BottomSheet` — 하단 앵커(`align-items: flex-end`)라 시트가 바닥에 붙는다 ✅
      - `components/home/GroupMatchingResultModal` — viewport 고정 하단 액션 바 ✅

      **일부러 적용하지 않은 것** (적용하면 오히려 나빠진다):

      - `AlertModal` · `QuizModal` — `align-items: center`로 수직 중앙 정렬이라
        하단 가장자리에 닿지 않는다. 인셋을 넣으면 중앙이 어긋난다.
      - `FullScreenModal` — 자식이 임의인 범용 컨테이너다. 컨테이너에 패딩을 주면
        자체 하단 바를 가진 소비자(`GroupMatchingResultModal`)와 이중으로 적용된다.
        소비자 쪽에서 각자 처리하는 것이 맞다.
      - `ProfileDetailModal` — `padding: 0 16px 34px`로 이미 34px(아이폰 홈 인디케이터
        높이)를 수동 확보해 두었다. 깨진 상태가 아니고, 적응형으로 바꿀지는
        **실기기로 눈으로 봐야 판단할 수 있다.** 추측으로 건드리지 않는다.

- [ ] **네이티브 카카오 로그인** — BE의 D 도착 후. 1차 출시는 기존 리다이렉트로 충분하다.
- [ ] **스토어 심사 대비** — 원격 URL만 로드하는 순수 래퍼는 App Store 4.2
      (minimum functionality) 리젝 사유가 된다. **푸시·딥링크가 붙은 뒤에 심사를 넣을 것.**
- [ ] **앱 아이콘 / 스플래시** — 현재 Capacitor 기본 리소스다. 디자인 에셋으로 교체 필요.
- [ ] **실기기 빌드 검증** — 프로젝트 생성까지만 되어 있고 실제 컴파일은 아직 한 번도 하지 않았다.
      Android Studio / Xcode 가 있는 머신에서 §3 스모크와 함께 확인할 것.
