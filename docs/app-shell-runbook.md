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

### ⚠️ 검증 순서

**staging에서 라우트 하나만 먼저 붙여 확인할 것.** 주소창(`/profile/12/`)과
RSC 페이로드 세그먼트(`placeholder`)가 다른 상태를 Next 라우터가 어떻게 다루는지
이 배포에서 한 번도 검증된 적이 없다. 이상하면 신고 화면처럼 쿼리 파라미터가 폴백 플랜이다.

404 폴백을 `/index.html`(200) → `/404.html`(404)로 바꾸는 것은 **이 함수가 동작한 뒤에** 한다.
순서를 뒤집으면 지금 첫 화면이 뜨던 자리에 404가 뜰 뿐 더 나빠진다.

---

## 5. 남은 작업

- [ ] **푸시 활성화** — BE의 A·B 도착 후 `NEXT_PUBLIC_PUSH_ENABLED=true`.
      배포 워크플로의 `Build` 스텝 `env:`에도 추가해야 한다.
- [ ] **safe-area 잔여 적용** — 하단 고정 요소가 20여 개 파일에 흩어져 있다.
      공용 프리미티브 2개(`MainBottomNav`, `BottomActionArea`)만 적용됐다.
      나머지는 실제 기기에서 확인하며 batch로 처리한다 (추측으로 일괄 적용하지 말 것).
- [ ] **네이티브 카카오 로그인** — BE의 D 도착 후. 1차 출시는 기존 리다이렉트로 충분하다.
- [ ] **스토어 심사 대비** — 원격 URL만 로드하는 순수 래퍼는 App Store 4.2
      (minimum functionality) 리젝 사유가 된다. **푸시·딥링크가 붙은 뒤에 심사를 넣을 것.**
- [ ] **앱 아이콘 / 스플래시** — 현재 Capacitor 기본 리소스다. 디자인 에셋으로 교체 필요.
- [ ] **실기기 빌드 검증** — 프로젝트 생성까지만 되어 있고 실제 컴파일은 아직 한 번도 하지 않았다.
      Android Studio / Xcode 가 있는 머신에서 §3 스모크와 함께 확인할 것.
