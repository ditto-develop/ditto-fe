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

### 다른 환경으로 빌드

기본값은 `https://ditto.pics`(프로덕션)다. `alpha.ditto.pics` 를 도입하면:

```bash
CAPACITOR_SERVER_URL=https://alpha.ditto.pics npm run cap:sync
```

---

## 2.1 앱이 서빙받는 도메인 — `ditto.pics` (확정)

Route53 이전(2026-08-26)으로 아펙스가 살아났다. **아펙스가 정본이고 앱도 같은 호스트를
본다.** `www` 는 CloudFront 에서 아펙스로 301 된다.

검토했다가 접은 것: 앱 전용 서브도메인(`app.ditto.pics`). 원래 명분이 "CloudFront 함수를
안 건드리고 앱을 붙인다" 였는데, 아펙스 정본이면 함수를 건드릴 이유가 없어 명분이
사라졌다. CloudFront 별칭 등록 작업도 아꼈다.

```
ditto.pics       A(Alias) → CloudFront   ✅ 정본 (앱·웹 공통)
www.ditto.pics   A(Alias) → CloudFront   ✅ 아펙스로 301
api.ditto.pics   A(Alias) → ALB          ✅ BE
```

### staging 환경은 두지 않는다 (2026-08-26)

`test.ditto.pics` 는 Route53 이전 때 누락됐고 **복구하지 않기로 했다.**
그 결과 **`feat/s3-migration` 에 푸시하면 곧바로 프로덕션에 배포된다.**

검증 버퍼가 사라진 대신 배포 워크플로에 `verify` 잡을 두어
lint · typecheck · vitest · Cypress 가 전부 통과해야 `deploy` 가 돌게 했다.
**이 게이트를 약화시키지 말 것** — 지금은 이게 유일한 안전망이다.

1차 릴리스 이후 `alpha.ditto.pics` 를 도입해 다시 분리할 예정이다. 그때 필요한 것:

| # | 작업 |
|---|---|
| 1 | Route53 에 `alpha` A(Alias) → `d28wm0h79feewt.cloudfront.net` |
| 2 | CloudFront 배포판의 **대체 도메인 이름**에 `alpha.ditto.pics` 추가 (인증서는 `*.ditto.pics` 와일드카드라 재발급 불필요) |
| 3 | CloudFront 함수의 host→prefix 분기에 alpha 추가 |
| 4 | `deploy-prod.yml` 을 복제해 트리거 브랜치와 S3 프리픽스만 교체 |
| 5 | `ALLOWED_HOSTS`(`appShell.ts`)에 추가 · `verify:domains --also alpha.ditto.pics` |
| 6 | BE CORS 허용 목록에 추가 |

S3 의 `staging/` 프리픽스는 현재 고아 상태다. alpha 를 붙일 때 재사용하거나 지우면 된다.

---

## 2.2 알림 — 로컬·원격 둘 다 동작

알림은 **두 갈래**이고 의존성이 전혀 다르다. 혼동하지 말 것.

| | 로컬 알림 | 원격 푸시 |
|---|---|---|
| 서버 필요 | ❌ 없음 | ✅ BE 발송 인프라 |
| 상태 | **동작 중** | **켬**(`NEXT_PUBLIC_PUSH_ENABLED`) — iOS 는 APNs 키 업로드 후 실제 도달 |
| 커버 | 고정 일정 | 임의 시점 이벤트 |

### 로컬 알림 (BE 없이 동작)

Ditto의 주간 리추얼이 고정이라(이용약관 제11조) 기기가 스스로 예약한다.

| 시점(KST) | 내용 | 딥링크 |
|---|---|---|
| 목 09:00 | 매칭 결과 공개 — 23:59까지 24시간 창 | `/matching/` |
| 일 20:00 | 채팅방 23:59 마감 예고 | `/chat/` |

- 8주치를 미리 예약하고, 앱을 열 때마다 기존 예약을 지우고 다시 잡는다(중복 없음).
- 로그아웃 시 예약을 지운다 — 안 지우면 로그아웃 상태에서도 계속 울린다.
- 발송 시각은 제품 결정이며 `localNotifications.ts`의 `RITUALS`에서 바꾼다.
  매칭은 00:00에 열리지만 **자정에 알림을 보낼 수는 없어** 아침으로 잡았다.

⚠️ **시각 계산은 절대 시각으로 해야 한다.** KST 벽시계를 그대로 `Date`에 담는 흔한 패턴
(`new Date(utc + 9h)`)을 알림 예약에 넘기면 KST가 아닌 기기에서 엉뚱한 때에 울린다.
`kstSchedule.ts`가 이를 처리하며, 테스트는 전부 UTC ISO로 단언해 실행 타임존과 무관하다.

### 권한 — 한 번뿐인 기회

**iOS에서 로컬 알림과 원격 푸시는 같은 권한이다**(UNUserNotificationCenter).

- 지금 로컬 알림으로 승인을 받아두면 **BE 푸시가 붙을 때 재요청이 없다.**
- 반대로 여기서 거부당하면 **푸시 옵트인까지 함께 잃는다.** iOS는 한 번 거부하면
  앱에서 재요청이 불가능하고 OS 설정으로 유도하는 수밖에 없다. 그래서 거부 시
  다시 묻지 않는다.
- 요청 시점은 **로그인 직후**다. 비로그인 사용자에게 매칭 알림을 예약할 이유가 없고,
  앱의 가치를 이해한 뒤에 뜨는 편이 승인률이 높다.

Android는 `POST_NOTIFICATIONS`(13+)만 있으면 되고 이미 매니페스트에 있다.
`SCHEDULE_EXACT_ALARM`은 쓰지 않는다 — 분 단위 오차가 무방한 알림이고,
정확 알람은 Google이 사용을 제한해 심사 리스크가 있다.

### 로컬 알림으로 커버되지 않는 것

**새 채팅 메시지는 원리적으로 불가능하다.** 언제 올지 모르고, 앱이 백그라운드면
JS가 아예 돌지 않으며 STOMP 소켓도 끊긴다. 서버가 깨워주는 수밖에 없다 —
이것이 앱으로 가는 진짜 이유다. 그룹 결성·재매칭 성사·시스템 공지도 동일하다.

### 원격 푸시 (FCM) — 배선 완료, 기기 스모크만 남음

`@capacitor-firebase/messaging` 을 쓴다. `@capacitor/push-notifications` 는
**제거했다** — 둘 다 APNs 델리게이트를 잡아서 함께 두면 충돌한다.

계약 정본은 BE 위키 [`Frontend-Push-Guide`](https://github.com/ditto-develop/ditto-server/wiki/Frontend-Push-Guide)
다. 토큰 등록/해제(A)는 머지돼 라이브고, 발송·payload(B)는 BE 리뷰 중이다(PR #156).

| 단계 | 상태 |
|---|---|
| 권한 요청 · 토큰 획득 · 갱신(`tokenReceived`) 재등록 | ✅ |
| BE 등록/해제 `POST·DELETE /api/v1/notifications/devices` | ✅ (위키 §1·§2) |
| 알림 탭 → `data.deepLink` 이동 + `notificationId` 읽음 처리 | ✅ (호스트 검증 포함) |
| 포그라운드 수신 → 알림 센터 재조회 | ✅ (`ditto:push-received` 이벤트) |
| 로그아웃·탈퇴 시 BE 해제 + 기기 토큰 폐기 | ✅ |
| Firebase 설정 파일 (Android · iOS) | ✅ 커밋 + iOS 타겟 등록까지 |
| iOS Push capability (`App.entitlements`) | ✅ `aps-environment` |
| iOS AppDelegate APNs 브리지 | ✅ (없으면 iOS 만 조용히 토큰 미발급) |
| Android 상태바 아이콘 (`ic_stat_ditto`) | ✅ 매니페스트 배선 |
| APNs 인증 키(.p8) → Firebase 업로드 | ✅ 2026-08-28 업로드 완료 |

**남은 것은 기기 확인뿐이다.** 코드·설정·자격증명이 다 갖춰졌으므로 이제부터는
실제 기기에서 §3 의 푸시 스모크를 밟아야 한다. 시뮬레이터는 APNs 를 못 받으니
**실기기**여야 한다.

`NEXT_PUBLIC_PUSH_ENABLED=true` 는 배포 워크플로 `Build` 스텝 `env:` 에 이미
들어가 있다. 문제가 생기면 **그 줄만 지우면** 등록·권한 요청까지 통째로 꺼진다.

> iOS 권한은 로컬 알림과 **같은 권한**이다. 그래서 `ClientLayout` 은 로컬 →
> 푸시 순서로 **직렬** 초기화한다. 안드로이드 13+ 는 런타임 권한 대화상자를 동시에
> 두 개 띄우지 못해, 병렬로 부르면 나중 요청(=푸시)이 대화상자도 없이 거부로
> 떨어지고 FCM 토큰을 영영 못 받는다.

#### 아직 안 한 것 (의도적)

- **인앱 벨 배지** — 홈 헤더(`MainHeader`)에는 미읽음 배지가 없다. 푸시가 오면
  알림 센터가 스스로 재조회하지만, 홈에 떠 있으면 표시되는 변화가 없다.
  `getUnreadNotificationCount` 는 이미 있으므로 배지 UI 만 붙이면 된다.
- **iOS 앱 아이콘 배지 초기화** — 배지 수는 payload 로 실려 오는데(위키 §3),
  인앱에서 알림을 읽어도 아이콘 배지는 다음 푸시까지 그대로다. 내리려면 별도
  플러그인(`@capawesome/capacitor-badge` 등)이 필요해서 미뤘다.
- **알림 채널 분리(Android)** — FCM 기본 채널을 쓴다. 매칭/채팅을 따로 끄고
  싶다는 요구가 나오면 그때 나눈다(지금은 BE 알림 토글이 그 역할을 한다).

---

## 2.3 Firebase 설정 (푸시 전제)

앱 식별자는 Android · iOS 모두 **`pics.ditto.app`** 이다.

### 콘솔에서 할 일

**① Android 앱 등록** — 프로젝트 설정 → 내 앱 → Android

- Android 패키지 이름: `pics.ditto.app`
- **SHA-1 은 넣지 않아도 된다.** Google 로그인 · Dynamic Links 에나 필요하고
  FCM 만 쓰는 지금은 불필요하다.
- `google-services.json` 다운로드 → **`android/app/google-services.json`**

**② iOS 앱 등록** — 프로젝트 설정 → 내 앱 → iOS

- 번들 ID: `pics.ditto.app`
- `GoogleService-Info.plist` 다운로드 → **`ios/App/App/GoogleService-Info.plist`**
- ⚠️ **파일만 두면 동작하지 않는다.** Xcode 에서 App 타겟에 추가해
  Build Phases → Copy Bundle Resources 에 들어가야 한다.
  (Xcode 좌측 트리의 `App` 폴더로 드래그 → "Copy items if needed" + App 타겟 체크)
- ✅ 지금 프로젝트는 **끝난 상태**다(`project.pbxproj` 에 등록돼 있다). 파일을
  새로 받아 갈아끼우기만 하면 되고, 타겟 등록을 다시 할 필요는 없다.

**③ APNs 인증 키** — iOS 푸시에 필수 (✅ 2026-08-28 업로드 완료)

1. Apple Developer → Certificates, Identifiers & Profiles → **Keys** → 새 키,
   **Apple Push Notifications service (APNs)** 체크 → `.p8` 다운로드
   **한 번만 내려받을 수 있다.** 잃어버리면 키를 다시 만들어야 한다.
2. Key ID 와 Team ID 를 기록
3. Firebase 콘솔 → 프로젝트 설정 → **클라우드 메시징** → Apple 앱 구성 →
   APNs 인증 키 업로드

**④ Push Notifications capability** — ✅ 이미 배선돼 있다.
`ios/App/App/App.entitlements` 의 `aps-environment` 와 pbxproj 의
`CODE_SIGN_ENTITLEMENTS` 가 그것이며, Xcode 의 Signing & Capabilities 에도
"Push Notifications" 로 보인다. 자동 서명이라 아카이브 시 Xcode 가
`development` → `production` 으로 바꿔 준다 — **손으로 고치지 말 것.**

같이 봐야 하는 것: `AppDelegate.swift` 의 APNs 브리지 세 메서드
(`didRegisterForRemoteNotificationsWithDeviceToken` 등)가
NotificationCenter 로 토큰을 넘긴다. **이게 없으면 빌드는 성공하고 iOS 에서만
FCM 토큰이 안 나온다**(`getToken()` 이 "No APNS token specified" 로 실패).

**⑤ BE 에 전달할 것** — 서비스 계정 키

BE 가 FCM 으로 발송하려면 자격증명이 필요하다.
프로젝트 설정 → **서비스 계정** → 새 비공개 키 생성 → JSON.

> 🔴 **이 JSON 은 비밀이다.** 유출되면 누구나 우리 사용자에게 푸시를 보낼 수 있다.
> FE 레포에 들어올 이유가 없고, `.gitignore` 로 `firebase-adminsdk-*.json` ·
> `serviceAccountKey*.json` · `*.p8` 을 막아 뒀다. BE 에 안전한 경로로 전달할 것.

### 커밋 여부

| 파일 | 커밋 | 이유 |
|---|---|---|
| `google-services.json` | ✅ 한다 | 클라이언트 설정. 앱 번들에 그대로 들어가는 공개 값 |
| `GoogleService-Info.plist` | ✅ 한다 | 〃 |
| 서비스 계정 JSON | ❌ 절대 | 발송 권한 자격증명 |
| APNs `.p8` | ❌ 절대 | 재발급 불가, 발송 권한 |

### 파일을 넣은 뒤

```bash
npm run cap:sync
```

Gradle 배선은 Capacitor 템플릿에 이미 있어 `google-services.json` 이 있으면
자동으로 `com.google.gms.google-services` 플러그인이 적용된다.

> iOS 의존성은 CocoaPods 가 아니라 **SwiftPM** 이다(`ios/App/CapApp-SPM/Package.swift`).
> Xcode 가 패키지 해석에서 *package identity collision* 을 뱉으면 플러그인 README 의
> 우회를 쓴다 — `capacitor.config.ts` 에
> `experimental.ios.spm.packageOptions["@capacitor-firebase/messaging"].symlink = true`
> 를 넣고 `cap sync` 를 다시 돌린다(CLI 8.4.0+ 필요, 현재 8.5.0). 지금은 충돌이
> 없어 넣지 않았다 — 넣으면 `CapApp-SPM/symlinks/` 생성물이 따라온다.

### iOS 가 실제로 배선됐는지 확인하는 법

**이건 반드시 확인해야 한다.** iOS 는 plist 가 번들에 없어도 빌드가 성공하고,
Firebase 초기화만 조용히 실패한다 — 즉 "빌드 됐으니 됐겠지" 가 통하지 않는다.

레포에서 한 줄로 볼 수 있다. 등록돼 있으면 1 이상이 나온다:

```bash
grep -c "GoogleService-Info" ios/App/App.xcodeproj/project.pbxproj
```

기기/시뮬레이터에서는 Xcode 콘솔에 이 줄이 뜨면 성공이다:

```
[FirebaseMessaging] ... FIRMessaging registration token ...
```

`Could not locate configuration file: 'GoogleService-Info.plist'` 가 뜨면
타겟 등록이 안 된 것이다. Xcode → App 타겟 → Build Phases → **Copy Bundle Resources**
목록에 파일이 있는지 본다.

**푸시를 실제로 켜는 것은 BE 의 디바이스 토큰 API(§A)가 배포된 뒤다.**
그때 `NEXT_PUBLIC_PUSH_ENABLED=true` 를 배포 워크플로 `Build` 스텝 `env:` 에 추가한다.

---

## 2.4 앱 아이콘 · 스플래시 (생성물이다 — 손으로 만들지 말 것)

네이티브 아이콘/스플래시 PNG 는 **전부 생성물**이고 소스는 웹이 쓰는 브랜드 에셋 둘뿐이다.

| 소스 | 무엇 |
|---|---|
| `public/logo/icon.svg` | 디자인된 앱 아이콘. 둥근 `#E9E6E2` 타일 + ditto 워드마크 |
| `public/assets/logo/ditto.svg` | 워드마크 단독. 웹 스플래시(`components/splash/Splash.tsx`)가 쓰는 바로 그 파일 |

```bash
npm run assets:app     # scripts/generate-app-assets.mjs
```

`cap sync` 는 필요 없다 — 네이티브 리소스 디렉터리를 직접 쓴다.
브랜드가 바뀌면 위 SVG 두 개만 갈고 이 명령을 다시 돌린다.
**생성된 PNG 를 직접 편집하면 다음 실행에서 조용히 덮인다.**

### 대상마다 마스크가 달라서 배율이 다르다

한 장을 그대로 리사이즈하면 안 되는 이유다. 각 값의 근거는 스크립트 상단 `MARK_RATIO` 주석에 있다.

| 대상 | 워드마크 폭 | 왜 |
|---|---|---|
| iOS `AppIcon-512@2x.png` | 79% (원본 그대로) | 시스템이 모서리를 깎으므로 **각진 정사각형·알파 없음**으로 넣는다. 둥근 소스를 그대로 넣으면 이중으로 깎여 모서리가 빈다 |
| Android `ic_launcher.png` | 79% (원본 그대로) | 레거시 런처(API 24~25). 둥근 타일을 그대로 쓴다 |
| Android `ic_launcher_round.png` | 70% | 원형 마스크. 대각선이 원 안에 들어와야 한다 |
| Android `ic_launcher_foreground.png` | 60% | 어댑티브 아이콘. 108dp 중 **가운데 72dp만 보장**된다. 워드마크 종횡비 2.105 기준 √(0.60² + (0.60/2.105)²) × 108 = 71.6dp — 딱 맞는다. **올리면 런처에 따라 양끝이 잘린다** |
| 스플래시 | 짧은 변의 40% | 웹 스플래시가 393px 뷰포트에서 160px 로고를 쓴다(= 40.7%). 같은 비율 |

iOS 스플래시만 2732 정사각 기준 19% 다. `LaunchScreen.storyboard` 가 `scaleAspectFill`
로 깔아서 폰에서는 가운데 폭 1260 단위만 보이기 때문이다 — 그 크롭을 거치면 화면 폭의 40.7% 가 된다.

### 스플래시는 안드로이드 버전에 따라 다른 경로를 탄다

- **API 31+ (Android 12 이상)** — 시스템이 직접 그린다. `values/styles.xml` 의
  `android:background="@drawable/splash"` 는 View 속성이라 **여기서는 무시된다.**
  그래서 `values-v31/styles.xml` 에 `windowSplashScreenBackground` 를 따로 뒀다.
  아이콘은 일부러 지정하지 않았다 — 비우면 런처 아이콘(어댑티브 = `brand_background`
  + 워드마크)을 쓰는데 배경색이 같아 워드마크만 떠 보인다. 웹 스플래시와 같은 그림이다.
- **API 24~30** — 기존대로 `@drawable/splash` PNG 다. 이 경로는 PNG 가 화면 비율로
  **늘어난다**(가로 스케일과 세로 스케일이 다르다). 1280×1920 자산이 1080×2400 기기에
  깔리면 워드마크가 세로로 약 1.5배 늘어난다. 실측상 알아볼 수 있는 수준이라 두었다.
  거슬리면 `drawable/splash.xml` 을 layer-list(단색 + `gravity="center"` bitmap)로
  바꿔야 하고, 그때는 `drawable*/splash.png` 를 전부 지워야 한다(같은 이름 충돌).

### 색은 한 곳에서만 산다

`#E9E6E2` 는 웹 토큰 `color-atomic-neutral-95`(= `color-semantic-background-normal-normal`)
의 복제값이다. 네이티브는 CSS 토큰을 읽을 수 없어 값을 옮겨 적을 수밖에 없다.
**토큰이 바뀌면 아래 세 곳을 함께 바꾼다:**

- `android/app/src/main/res/values/colors.xml` 의 `brand_background`
  (`ic_launcher_background` 가 이걸 참조하고, `values-v31/styles.xml` 도 참조한다)
- `capacitor.config.ts` 의 `android.backgroundColor`
- `scripts/generate-app-assets.mjs` 의 `BG`

> ⚠️ Android 리소스 XML 주석에는 `--` 를 쓸 수 없다. CSS 변수명(`--color-...`)을
> 주석에 그대로 붙여 넣으면 **빌드가 아니라 XML 파싱에서 깨진다.**

### 검증

로컬에 Android SDK 가 없으면 리소스 컴파일을 확인할 수 없다. 아이콘/스플래시를 건드린 뒤에는
**Android Studio 에서 한 번 빌드해서** `values-v31` · `colors.xml` 이 실제로 컴파일되는지 볼 것.

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

### 원격 푸시 (위 항목과 별도로 순서대로)

- [ ] **권한 대화상자가 한 번만** 뜨는지. 두 번 뜨거나, 한 번 뜨고 푸시가 조용히
      거부되면 로컬↔푸시 직렬화(`ClientLayout`)가 깨진 것이다.
- [ ] **토큰이 FCM 등록 토큰인지.** 콜론이 섞인 150~170자여야 한다.
      **64자 hex 면 APNs 토큰**이고, 그건 iOS 배선(plist/entitlements/AppDelegate)이
      덜 됐다는 뜻이다 — BE 등록은 성공하고 발송만 전부 실패한다(위키 §공통 경고).
      iOS: Xcode 콘솔 `FIRMessaging registration token` / Android: `adb logcat -s FirebaseMessaging`
- [ ] **BE 등록 왕복** — `POST /api/v1/notifications/devices` 가 `success: true` 인지.
      `registered: false` 는 **실패가 아니다**(이미 내 토큰인 재호출).
- [ ] **백그라운드 수신 → 탭** — 배너가 뜨고, 탭하면 `deepLink` 화면으로 가고,
      알림 센터의 그 행이 읽음으로 바뀌어 있는지.
- [ ] **앱을 완전히 종료한 상태에서 탭** — 콜드 스타트에서도 같은 이동이 되는지.
      (플러그인이 이벤트를 `retainUntilConsumed` 로 물고 있다가 리스너가 붙으면 흘린다)
- [ ] **포그라운드 수신** — 앱을 켜 둔 채 받으면 배너가 없을 수 있다. 이때
      알림 센터가 **스스로 갱신**되는지(`ditto:push-received`).
- [ ] **Android 상태바 아이콘** — 흰 사각형이 아니라 `ditto` 워드마크인지.
      사각형이면 `ic_stat_ditto` 배선이 빠진 것이다.
- [ ] **로그아웃 → 이전 계정 푸시 없음** — 로그아웃 뒤 그 계정으로 알림이 생겨도
      이 기기에 오면 안 된다. (해제 + 토큰 폐기)
- [ ] **탈퇴** — 탈퇴 직전에 해제가 나가는지. 탈퇴 후에는 인증이 막혀 못 부른다.

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

### 일회성 AWS 설정 (2026-08-28 정정 — 함수를 새로 만들면 안 된다)

**배포판에는 이미 `www-to-apex-ditto-pics` 함수가 붙어 있다.** 새로 만들어 연결하는
것이 아니라 **그 함수의 내용을 교체**한다. 이름을 유지하면 연결(association)을 건드릴
필요가 없어 가장 안전하다.

```bash
# 1) DEVELOPMENT 스테이지에 올린다 (LIVE 는 그대로 — 트래픽 영향 없음)
ETAG=$(aws cloudfront describe-function --name www-to-apex-ditto-pics --query 'ETag' --output text)
aws cloudfront update-function \
  --name www-to-apex-ditto-pics --if-match "$ETAG" \
  --function-config Comment="www->apex 301 + host prefix routing + static export dynamic route rewrite",Runtime=cloudfront-js-2.0 \
  --function-code fileb://infra/cloudfront/rewrite-dynamic-routes.js

# 2) 배포 없이 입력별 출력을 확인한다 (test-function 은 DEVELOPMENT 를 친다)
#    최소한 이 셋은 봐야 한다: 딥링크 rewrite · 형제 정적 라우트 · /prod 프리픽스
DEV_ETAG=$(aws cloudfront describe-function --name www-to-apex-ditto-pics --stage DEVELOPMENT --query 'ETag' --output text)
aws cloudfront test-function --name www-to-apex-ditto-pics --stage DEVELOPMENT \
  --if-match "$DEV_ETAG" --event-object fileb://event.json

# 3) 통과하면 LIVE 로
DEV_ETAG=$(aws cloudfront describe-function --name www-to-apex-ditto-pics --stage DEVELOPMENT --query 'ETag' --output text)
aws cloudfront publish-function --name www-to-apex-ditto-pics --if-match "$DEV_ETAG"
```

`event.json` 은 `{"version":"1.0","context":{"eventType":"viewer-request"},"viewer":{"ip":"1.2.3.4"},
"request":{"method":"GET","uri":"<경로>","headers":{"host":{"value":"ditto.pics"}},"querystring":{},"cookies":{}}}`
형태다.

그 다음 GitHub 저장소 변수에 이름을 등록하면 이후 배포부터 자동 갱신된다:

```
Settings > Secrets and variables > Actions > Variables
CF_REWRITE_FUNCTION_NAME = www-to-apex-ditto-pics
```

변수가 비어 있으면 워크플로의 퍼블리시 스텝은 조용히 건너뛴다 — 설정 전에 배포가 깨지지 않게 하기 위함이다.

**2026-08-28 설정 완료** — `CF_REWRITE_FUNCTION_NAME = www-to-apex-ditto-pics`.
같은 날 수동 배포로 `Publish CloudFront rewrite function` 스텝이 실제로 도는 것까지
확인했다(`skipped` → `success`). 이제 **커밋된 소스가 곧 라이브 함수**이며, 배포마다
동기화된다.

### 배포 IAM 권한 (2026-08-28 추가 완료)

배포는 롤이 아니라 IAM 사용자 `github-actions-deployer` 의 액세스 키로 돈다.
인라인 정책은 `ditto-fe-deploy` 이고, 원래 S3 3종 + `cloudfront:CreateInvalidation`
뿐이라 함수 권한이 없었다. 아래 Statement 를 추가해 해결했다.

> 권한 없이 `CF_REWRITE_FUNCTION_NAME` 만 켜면 퍼블리시 스텝이 AccessDenied 로
> 죽는다(`set -euo pipefail`). S3 동기화·무효화는 그 앞이라 **사이트는 갱신되는데
> 잡만 빨간불**이 되어 원인을 찾기 헷갈린다. 순서는 권한 → 변수다.

```json
{
  "Sid": "CloudFrontFunction",
  "Effect": "Allow",
  "Action": [
    "cloudfront:DescribeFunction",
    "cloudfront:UpdateFunction",
    "cloudfront:PublishFunction"
  ],
  "Resource": "arn:aws:cloudfront::247842832483:function/www-to-apex-ditto-pics"
}
```

`get-user-policy` 로 현재 문서를 받아 위 Statement 를 붙이고 `put-user-policy` 로
되돌려 넣는 방식이다. 배포판 연결은 이미 돼 있으므로 `UpdateDistribution` 은 필요 없다.

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

### 기존 함수의 실제 내용 (2026-08-28 소스 확인)

AWS 자격증명이 생겨 `get-function` 으로 **실제 소스를 읽었다.** 역설계 초안
(`infra/cloudfront/viewer-request.draft.js`)은 역할을 다해 삭제했다.

읽어 보니 초안이 "확인 못 했다"고 남겨 둔 항목의 답이 **가장 중요했다**:

> **S3 프리픽스는 origin path 가 아니라 이 함수가 붙인다.**

즉 생성기가 만들던 rewrite 전용 함수를 그대로 붙였으면 `/prod` 가 사라져
**사이트 전 경로가 404** 났다. 그래서 생성기가 **함수 전체**(301 + 프리픽스 +
index.html + rewrite)를 만들도록 바꿨다. 지금 `rewrite-dynamic-routes.js` 는
배포판에 붙는 것과 같은 파일이다.

기존 함수가 하던 일과 바뀐 점:

| | 기존(2026-06-17) | 지금 |
|---|---|---|
| www → 아펙스 301 | ✅ | ✅ 그대로 |
| host → `/prod`·`/staging` 프리픽스 | ✅ | ✅ 그대로 |
| 디렉터리 URI → `index.html` | ✅ | ✅ 그대로 |
| 동적 라우트 rewrite | ⚠️ 과매칭 — id 자리에 뭐가 오든 매칭 | ✅ 숫자 id 만 |
| `.../rate/` 딥링크 | ❌ 모름(두 세그먼트만 봄) | ✅ 접미 세그먼트 지원 |
| 라우트 목록 출처 | 콘솔에만 존재(드리프트) | `out/` 스캔 생성물 |

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

## 4.2 Route53 이전이 끝나면 — FE 대응 절차

아펙스에 ALIAS를 걸 수 없어(호스팅 업체가 A 레코드에 IP만 허용, 웹 포워딩은 DNS 레코드
서비스와 배타적) Route53으로 이전한다. **이전이 끝나면 아펙스가 살아나고, 그 시점에
도메인 정본을 다시 정해야 한다.** 아래는 그 뒤 FE가 할 일이다.

### 0단계 — 이전 자체 검증 (인프라)

```bash
# NS 교체 전, Route53 네임서버에 직접 질의해서 4개가 다 옳은지 확인
dig @<route53-ns1> ditto.pics A
dig @<route53-ns1> api.ditto.pics A     # ★ 이게 틀리면 BE 가 통째로 죽는다
dig @<route53-ns1> www.ditto.pics A
dig @<route53-ns1> test.ditto.pics A
```

교체 후에는 `npm run verify:domains` 로 한 번에 확인한다(§4.3).

### 1단계 — 도메인 정본 결정

아펙스가 살아나면 선택지가 셋이고, **FE 대응이 각각 다르다.**

| 정본 | CloudFront 함수 | FE 변경 | 비고 |
|---|---|---|---|
| **`ditto.pics`** (아펙스) | 손댈 필요 없음 — 기존 www→apex 301 이 그대로 맞아떨어진다 | `server.url` 을 아펙스로 되돌림 | 가장 단순 |
| `www.ditto.pics` | 301 방향 뒤집기 필요 | `server.url` 을 www 로 | |
| `app.ditto.pics` (앱 전용) | 손댈 필요 없음(알 수 없는 호스트 → prod) | 현재 커밋 상태 유지 | **CloudFront 별칭 추가 필요** |

> Route53 이전으로 아펙스가 살아나면 **`app.ditto.pics` 를 따로 둘 이유가 줄어든다.**
> 앱 전용 서브도메인의 원래 명분은 "함수를 안 건드리고 앱을 붙인다"였는데,
> 아펙스 정본을 택하면 함수를 안 건드려도 되기 때문이다.
> 커밋 `6576516` 이 `server.url` 을 `app.ditto.pics` 로 바꿔 뒀으므로 **재검토 대상**이다.

### 2단계 — 코드 반영 (정본 확정 후)

- [ ] **`capacitor.config.ts`** — `SERVER_URL` 기본값을 정본 호스트로.
      현재 `https://app.ditto.pics` (커밋 `6576516`).
- [ ] **`src/shared/lib/native/appShell.ts`** — `ALLOWED_HOSTS` 정리.
      딥링크가 통과할 호스트 집합이다. **안 쓰기로 한 호스트는 빼는 편이 안전하다**
      (푸시 payload 로 들어오는 값이라 공격 표면이다).
- [ ] `npm run cap:prod` 로 sync 하고 네이티브 `capacitor.config.json` 을 눈으로 확인.

### 3단계 — 외부 등록 (코드 밖)

- [ ] **BE CORS** — 정본 호스트가 허용 목록에 있는지. 없으면 **모든 API 호출이 막힌다.**
      → BE 요청서 §C-4 로 질의해 둠.
- [ ] **BE 로그인 리다이렉트 호스트** — 로그인 후 FE `/auth/callback` 으로 보낼 때 쓰는 호스트.
      하드코딩이면 도메인을 바꾸는 순간 로그인이 깨진다. → BE 요청서 §C-3.
- [ ] **카카오 개발자 콘솔** — JS SDK 플랫폼 도메인. 카카오맵(`ClientLayout.tsx`)이 이걸 쓴다.
- [ ] **CloudFront 별칭** — `app.ditto.pics` 를 쓰기로 한 경우에만. 인증서는 `*.ditto.pics`
      와일드카드라 재발급은 불필요하지만, 별칭 등록 전에는 TLS 핸드셰이크에서 끊긴다.

### 4단계 — Route53 과 무관하게 여전히 남는 것

도메인이 정리돼도 **아래는 그대로 남는다.** 같이 끝났다고 착각하지 말 것.

- **CloudFront 함수의 과매칭 버그** — `/profile/edit/` · `/profile/intro-note/` ·
  `/quiz/current/` 가 placeholder 로 덮이는 문제(§4). 도메인과 무관하다.
- **404 폴백의 프리픽스 누락** — staging 에서 없는 경로가 prod 빌드를 띄운다(§4).
  배포판 분리가 필요하다.
- **도메인 자동갱신** — 만료 2026-10-24. NS 를 Route53 으로 옮겨도 **등록기관은
  HOSTING.KR 그대로**라 갱신은 계속 거기서 한다.

---

## 4.3 도메인 검증

```bash
npm run build && npm run verify:domains
```

DNS · HTTP · 딥링크 rewrite · **형제 정적 라우트 과매칭**을 한 번에 확인한다.
Route53 레코드 변경 직후, CloudFront 함수 배포 직후에 돌릴 것.
실패가 있으면 종료 코드 1이라 CI 에도 걸 수 있다.

**비교 방식이 핵심이다.** 배포본과 로컬 빌드는 보통 서로 다른 빌드라 응답 크기가
절대 일치하지 않는다. 그래서 로컬과 대조하지 않고 **같은 호스트 안에서** 비교한다:

```
/{parent}/{숫자}/  === /{parent}/placeholder/   → rewrite 동작
/{parent}/{정적}/  !== /{parent}/placeholder/   → 과매칭 없음
```

이 비교는 어느 빌드가 올라가 있든 유효하다. 라우트 목록은 `out/**/placeholder`
스캔으로 만들기 때문에 새 동적 라우트가 생겨도 자동으로 포함된다.

### 2026-08-28 기준 결과 — **전체 통과** (실패 0건)

```
DNS      ditto.pics ✓   www ✓   api ✓
HTTP     apex 200 ✓     www 301 → apex ✓
딥링크    4/4 rewrite 동작 ✓
과매칭    /profile/edit/ · /profile/intro-note/ · /quiz/current/ ✓ 정상 복구
```

함수 교체 전후 실측(응답 크기):

| 경로 | 이전 | 지금 |
|---|---|---|
| `/profile/edit/` | 9521b (placeholder) | **16759b** (진짜 페이지) |
| `/profile/intro-note/` | 9521b | **16555b** |
| `/quiz/current/` | 9489b | **9895b** |
| `/chat/one-on-one/{id}/rate/` | 12721b (로그인 화면) | **10447b** (placeholder rate) |

`test.ditto.pics` 는 검증 대상에서 빠졌다(staging 폐지, §2.1).

### `.../rate/` 딥링크 — 깨져 있었고 2026-08-28 고쳤다

`verify:domains` 가 보는 4계열 밖이라 그동안 안 잡혔다. 실측:

```
/chat/one-on-one/305/rate/   → 12721b   ← 존재하지 않는 경로와 같은 크기(SPA 폴백)
/chat/one-on-one/placeholder/rate/ → 10447b
/definitely-not-a-real-path/ → 12721b
```

즉 **평가 요청 푸시(`REVIEW_REQUEST`)의 딥링크가 콜드 오픈에서 로그인 첫 화면으로
떨어진다.** BE 위키 §deepLink 규칙의 `/chat/{type}/{roomId}/rate/` 가 그것이다.

원인은 기존 함수가 `부모 + id` 두 세그먼트만 보고 뒤에 붙는 `rate` 를 몰랐던 것이다.
지금 함수는 접미 세그먼트(`s: ["rate"]`)를 포함해 생성되며, 교체 후 `10447b` 로
placeholder rate 페이지와 정확히 일치한다. **§4 의 함수 교체는 과매칭 수정이자
푸시 딥링크 수정이었다.**

---

## 5. 카카오 네이티브 로그인 (배선 완료, 앱 키 대기 중)

앱에서 카카오 SDK 로 로그인해 **카카오톡 앱으로 바로 전환**되게 하는 경로다.
BE 위키 `Frontend-Native-Login-Peer-Profile-Guide` §1, 요청서 `docs/be-request-app-push-auth.md` §D.

### 현재 상태

코드는 전부 들어갔고 **킬 스위치가 꺼져 있다**. 카카오 개발자 콘솔 작업이 끝나기 전에는
앱도 기존 리다이렉트 로그인을 그대로 탄다.

| 조각 | 위치 | 상태 |
|---|---|---|
| 네이티브 플러그인 | `native-plugins/capacitor-kakao-login/` | 작성 완료 (iOS Swift / Android Kotlin) |
| JS 게이트 | `src/shared/lib/native/kakaoLogin.ts` | 완료 |
| 토큰 교환 | `loginWithExternalKakaoNative` (`externalApi.ts`) | 완료 |
| 결말 분기 공유 | `src/features/auth/lib/socialLoginOutcome.ts` | 완료 (리다이렉트 콜백과 공유) |
| 앱 키 | `.env.local` / `Info.plist` | 발급 완료(2026-09-06). 콘솔 **플랫폼 등록은 별도 확인 필요** |
| 실기기 빌드 검증 | — | **미실시** (Xcode / Android Studio 필요) |

### 역할 분담 — 여기가 이 기능의 핵심이다

네이티브가 맡는 것은 **카카오 SDK 로그인 한 조각뿐**이다. 받아온 카카오 accessToken 을
웹뷰로 넘기면 **웹뷰(JS)가** `POST /api/v1/users/social-login/kakao/native` 를 호출한다.

네이티브가 이 API 를 직접 부르면 응답의 `Set-Cookie: refreshToken` 이 네이티브 쿠키
저장소로 들어가 **웹뷰가 그 쿠키를 보지 못한다.** 증상은 며칠 쓰다가 원인 없이 로그아웃되는
것이고, 추적이 매우 어렵다. 절대 옮기지 말 것.

### 켜는 절차

1. **카카오 개발자 콘솔** (기존 앱에 추가하는 것이다 — 새 앱을 만들지 말 것)
   - 앱 키 > **네이티브 앱 키** 복사
   - 플랫폼 > iOS: 번들 ID `pics.ditto.app`
   - 플랫폼 > Android: 패키지명 `pics.ditto.app`, **키 해시**(디버그·릴리스 각각)
     - 디버그: `keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android | openssl sha1 -binary | openssl base64`
   - 카카오 로그인 활성화 ON

2. **앱 키를 두 곳에 넣는다** (둘이 어긋나면 카카오톡에서 앱으로 돌아오지 못한다)

   | 곳 | 값 |
   |---|---|
   | `.env.local` (또는 빌드 환경변수) | `KAKAO_NATIVE_APP_KEY=<네이티브 앱 키>` — `capacitor.config.ts` 와 Android Gradle 이 **같은 우선순위로** 읽는다: 환경변수 → `android/gradle.properties` → 리포 루트 `.env.local` |
   | `ios/App/App/Info.plist` | `CFBundleURLSchemes` 의 `kakao<네이티브 앱 키>` — **여기만 자동화되지 않는다. 손으로 넣어야 한다** |

   `NEXT_PUBLIC_` 접두사를 붙이지 않는다 — 이 앱은 원격 URL 로드라 웹 번들이 곧 공개
   자산이고, 앱 키를 번들에 넣으면 APK 를 뜯을 필요도 없이 읽힌다. 카카오맵용
   `NEXT_PUBLIC_KAKAO_JS_KEY` 와는 **다른 키다** — `.env.local` 에 둘 다 있어야 한다.

3. **동기화 후 빌드**

   ```bash
   npm run cap:sync     # 키는 .env.local 에서 읽는다. 덮어쓰려면 앞에 환경변수를 붙인다
   npm run cap:ios      # Xcode 에서 실기기 빌드
   npm run cap:android  # Android Studio 에서 실기기 빌드
   ```

   동기화가 끝나면 네이티브 설정에 키가 실제로 박혔는지 확인한다 — 비어 있어도 빌드는
   통과하고 런타임에만 실패하기 때문이다:

   ```bash
   grep -o '"KakaoLogin":{[^}]*}' ios/App/App/capacitor.config.json
   grep -o '"KakaoLogin":{[^}]*}' android/app/src/main/assets/capacitor.config.json
   ```

   iOS 는 첫 빌드에서 SPM 이 `kakao-ios-sdk` 를 새로 내려받는다.

4. **실기기 스모크** — 카카오톡 설치/미설치 두 기기에서 각각
   - 신규 회원 → 회원가입(Tutorial) 진입
   - 기존 회원 → `/home`
   - 제재 회원 → `/sanction` (정지 해제 일시가 제대로 보이는지)
   - 카카오 화면에서 **취소** → 아무 일도 일어나지 않아야 한다.
     리다이렉트 로그인 창이 새로 뜨면 폴백 분기가 잘못된 것이다.

5. **플래그를 켠다** — `.github/workflows/deploy-prod.yml` 의 Build 스텝에
   `NEXT_PUBLIC_NATIVE_KAKAO_LOGIN_ENABLED: 'true'` 를 추가한다.
   푸시 플래그와 같은 방식이라 되돌릴 때는 그 줄만 지우면 된다.
   **2026-09-06 에 추가했다.** 4번 실기기 스모크는 아직 남아 있다.

### 실패해도 로그인이 막히지 않는다

`KakaoLogin.tsx` 는 네이티브가 **취소가 아닌 이유로 실패하면 기존 리다이렉트 로그인으로
폴백**한다. 앱 키가 틀렸거나 콘솔 등록이 안 됐어도 사용자는 로그인할 수 있다.
취소만 폴백에서 제외한다 — 취소했는데 로그인 창이 새로 뜨면 안 되기 때문이다.

### 왜 npm 플러그인을 쓰지 않았나

`native-plugins/capacitor-kakao-login/README.md` 에 후보 비교표가 있다. 요약하면
`@capgo/capacitor-social-login` 은 카카오를 지원하지 않고,
`@team-lepisode/capacitor-kakao-login@8.0.0` 은 **iOS 에서 카카오톡 앱 전환이 아예 일어나지
않는 버그**가 있어(두 분기 모두 `loginWithKakaoAccount` 호출) 이 작업의 목적이 사라진다.

### iOS 복귀 URL 처리 — 실빌드로 확인했고, 방식이 바뀌었다 (2026-09-07)

이 자리에는 원래 "`SceneDelegate.swift` 가 `import CapacitorKakaoLogin` 으로 플러그인 모듈을
직접 참조한다. SPM 전이 의존성이라 실빌드로 한 번 확인해야 한다"라고 적혀 있었다.
**확인했고, 안 된다.**

```
ios/App/App/SceneDelegate.swift:3:8: error:
  unable to resolve module dependency: 'CapacitorKakaoLogin'
```

앱 타깃은 `CapApp-SPM` 하나만 링크하고, 플러그인들은 그 **전이 의존성**이다.
전이 의존성의 모듈은 import 할 수 없다.

**해결은 앱 타깃에 직접 링크하는 쪽이 아니라 반대 방향이었다** — Capacitor 가 이미 열어 둔
확장점을 쓰면 앱 타깃이 플러그인을 알 필요가 없다.

- `SceneDelegateProxy` 는 `openURLContexts` 를 받으면 `.capacitorSceneOpenURL` 을 post 한다
  (`userInfo["url"]`). 구형 경로는 `.capacitorOpenURL` 이고 `object` 에 담아 준다.
- 그래서 `KakaoLoginPlugin.load()` 가 두 노티를 듣고 스스로 `AuthController.handleOpenUrl`
  을 부른다. `SceneDelegate` 는 그냥 프록시로 넘기기만 한다.
- 앱 타깃에서 `import CapacitorKakaoLogin` 과 `KakaoLoginUrlHandler` 를 **둘 다 지웠다.**

pbxproj 를 만져 플러그인을 직접 링크하는 방법도 있지만, 그러면 같은 로컬 패키지가 그래프에
두 번 들어가고 플러그인이 늘 때마다 반복해야 한다. 이쪽이 Capacitor 가 의도한 방식이다.

### Swift 6 동시성 — `@MainActor` 가 필요하다

카카오 SDK 의 `AuthController.handleOpenUrl` 은 메인 액터에 격리돼 있다. 표시하지 않으면
컴파일이 거부된다:

```
error: call to main actor-isolated static method 'handleOpenUrl(url:options:)'
       in a synchronous nonisolated context
```

`NotificationCenter` 옵저버를 `queue: .main` 으로 달아도 컴파일러는 그 사실을 모른다.
`MainActor.assumeIsolated` 는 iOS 17+ 라 배포 타깃(15.0)에서 못 쓰므로
`Task { @MainActor in ... }` 로 넘긴다. 한 런루프 늦게 실행되지만 대기 중인 인증 콜백을
깨우는 일이라 문제되지 않는다.

---

## 6. 애플 로그인 (배선 완료, BE 배포 대기)

### 왜 넣었나 — 선택 기능이 아니다

App Store 가이드라인 **4.8**: 제3자 소셜 로그인으로 계정을 만드는 앱은 *동등한* 로그인
수단을 하나 더 제공해야 한다. 그 수단은 ① 이름·이메일만 수집하고 ② 이메일을 비공개로
둘 수 있어야 하며 ③ 광고 목적으로 앱 내 행동을 수집하지 않아야 한다.
**카카오는 ②를 제공하지 않는다.** 카카오 하나만으로 제출하면 규칙상 리젝된다.

부수 효과가 하나 더 있다. 심사용 데모 계정 문제가 같이 풀린다 — 리뷰어가 자기 Apple ID 로
들어온다.

### 경로가 둘이다

계약 정본은 BE 위키 [`Frontend-Apple-Login-Guide`](https://github.com/ditto-develop/ditto-server/wiki/Frontend-Apple-Login-Guide).

| | 방식 | FE 코드 |
|---|---|---|
| **iOS 앱** | 네이티브 `ASAuthorizationController` → identityToken → 웹뷰가 교환 | `appleLogin.ts` + 로컬 플러그인 |
| **웹 · 안드로이드 앱** | 카카오와 **똑같은 리다이렉트** (`/api/v1/users/social-login/APPLE`) | `startExternalSocialLogin("APPLE")` 한 줄 |

웹은 `/auth/callback` 이 그대로 받는다 — **콜백 처리 코드를 고칠 필요가 없다.**
중간에 애플이 우리 서버로 POST 콜백(`response_mode=form_post`)을 보내는데 FE 가 볼 일은 없다.

### 현재 상태 — 플래그 OFF

| 조각 | 위치 | 상태 |
|---|---|---|
| 네이티브 플러그인 | `native-plugins/capacitor-apple-login/` | 완료 (iOS Swift) |
| JS 게이트 | `src/shared/lib/native/appleLogin.ts` | 완료 |
| 토큰 교환 | `loginWithExternalAppleNative` (`externalApi.ts`) | 완료 |
| 버튼 + 안내 문구 | `src/components/auth/AppleLogin.tsx` → `Step0` | 완료 |
| entitlement | `ios/App/App/App.entitlements` | 완료 (아카이브 서명에 실제로 포함됨) |
| 포털 capability | Apple Developer App ID | ✅ 자동 프로비저닝이 등록함 |
| **BE 엔드포인트** | `/api/v1/users/social-login/apple/native` | **미배포** |
| **웹 Services ID** | 애플 개발자 콘솔 | **미확인** |

🔴 **2026-09-07 기준 라이브 스펙에 `apple` 이 없다.** 앱(PR #164)·웹(PR #166) 둘 다 리뷰 중이다.

```bash
curl -s https://api.ditto.pics/docs/openapi.yaml | grep -ci apple   # 0 이면 아직이다
```

### 계약 (위키 §1)

```jsonc
POST /api/v1/users/social-login/apple/native
{
  "identityToken": "eyJraWQiOi...",  // 필수 — 이것만으로 인증이 끝난다
  "rawNonce": "a1b2c3...",           // 선택이지만 **보낸다**. 없으면 재생 공격 검증을 건너뛴다
  "name": "홍길동"                    // 선택 — 최초 인가 1회만 온다
}
```

응답은 `/kakao/native` 와 **완전히 같다.** `NativeSocialLoginResult` 와 결말 분기
(`resolveSocialLogin`)를 그대로 공유한다.

**FE 가 먼저 배선하며 가정했던 이름 셋이 실제와 달랐다** — `nonce`→`rawNonce`,
`fullName`→`name`, 그리고 `authorizationCode` 는 **서버가 쓰지 않는다**(인가 코드 교환을
하지 않는다). 회귀 방지: `src/shared/lib/api/externalApi.socialLogin.test.ts`

### ⚠️ 탈퇴 시 애플 토큰 폐기 — 확인 필요

애플은 Sign in with Apple 을 쓰면서 계정 삭제를 제공하는 앱에
`POST appleid.apple.com/auth/revoke` 로 토큰 폐기를 요구한다(가이드라인 5.1.1(v) 와 묶여 있다).
그러려면 인가 코드 교환이 필요한데 **BE 는 하지 않는다**(위키 §2).

플러그인은 그때를 위해 `authorizationCode` 를 계속 돌려주고 있다 — 정책이 문제되면
JS 한 줄만 고쳐 실어 보낼 수 있다. **탈퇴 흐름을 심사에 넣기 전에 BE 와 확인할 것.**

### 알아둘 것 (위키 §3)

- **카카오와 애플은 별도 회원이다.** 같은 사람이 카카오로 가입한 뒤 애플로 로그인하면
  새 계정이 된다(이메일이 같아도). 애플 릴레이 주소를 신뢰할 수 없고 이메일 일치를 계정
  병합 근거로 삼는 건 계정 탈취 경로라서다. → 로그인 화면에 안내 문구를 넣어 뒀다
  (`AppleLogin.tsx`). 없으면 "가입했는데 처음부터 다시 하라고 한다"는 문의가 된다.
- **이메일이 없거나 릴레이 주소일 수 있다.** 설정 > 계정은 `?? "-"` 로 이미 대비돼 있다.
- **성별·나이는 애플도 주지 않는다.** `signupRequired: true` 면 기존 온보딩을 그대로 탄다.

### 역할 분담 · nonce — 카카오와 같다

네이티브는 identityToken 을 받아오는 **한 조각만** 맡고, 교환 요청은 **웹뷰(JS)가** 보낸다.
네이티브가 교환하면 `Set-Cookie: refreshToken` 이 네이티브 쿠키 저장소로 들어가 웹뷰가
보지 못한다.

nonce 원본은 **네이티브가 만든다.** 애플에는 SHA-256 을 보내고 원본을 JS 로 돌려준다.
서버가 원본을 해시해 토큰의 `nonce` 클레임과 대조한다.

### 켜는 절차

1. **라이브 스펙에 `apple` 이 뜨는지 확인** (위 curl). 뜨기 전에는 켜지 말 것.
2. **웹까지 켤 거면** 애플 개발자 콘솔에 **Services ID · Return URL** 등록 여부를 BE 에
   확인한다. 등록 전에는 애플이 인가 요청을 거부해 버튼만 보이고 안 된다.
3. 실기기 스모크 — 신규/기존/제재 회원, 그리고 **애플 시트에서 취소** 시 아무 일도
   일어나지 않는지. 이름은 **최초 인가 1회만** 오므로, 다시 받으려면 iOS 설정 >
   Apple 계정 > 로그인 및 보안 > Apple로 로그인에서 ditto 를 지우고 다시 로그인한다.
4. 플래그를 켠다 — 배포 워크플로 Build 스텝에
   `NEXT_PUBLIC_APPLE_LOGIN_ENABLED: 'true'`. **앱·웹 양쪽에 함께 적용된다.**

### 실패해도 로그인이 막히지는 않는다 — 다만 폴백은 없다

카카오는 네이티브가 실패하면 리다이렉트로 흘려보낸다. **애플은 그 경로가 유일해서 폴백이
없다.** 그래서 실패는 토스트로 알리고 화면에 머문다 — 사용자는 카카오 버튼으로 계속할 수
있다. 취소는 조용히 무시한다.

실패 코드(위키 §4): `1002`(토큰 검증 실패 — 재시도로 풀린다) · `0001`(필수값 누락·이름 50자
초과) · `0003`(API Key) · `9999`(애플 공개키 서버 장애).

---

## 7. 앱스토어 제출 준비 (2026-09-07)

심사에서 걸리는 자리를 코드 쪽에서 미리 막아 둔 것들이다. 나머지(App Store Connect
등록·스크린샷·심사 노트)는 코드 밖 작업이다.

| 항목 | 조치 | 왜 |
|---|---|---|
| iPad 타깃 | `TARGETED_DEVICE_FAMILY = 1` | 웹 레이아웃이 393px 모바일 전용인데 iPad 에서도 심사한다. iPad 스크린샷 요구도 사라진다. 되돌리려면 `"1,2"` 로 (`Info.plist` 의 `UISupportedInterfaceOrientations~ipad` 는 남겨 뒀다) |
| 수출 규정 | `ITSAppUsesNonExemptEncryption = false` | 없으면 **업로드하는 빌드마다** ASC 가 묻고, 답하기 전에는 TestFlight·심사에 못 넣는다. HTTPS 만 쓰므로 면제 |
| 프라이버시 매니페스트 | `ios/App/App/PrivacyInfo.xcprivacy` 신규 + 타깃 등록 | 없으면 업로드 후 경고 메일. **ASC 의 앱 개인정보 표시와 값이 일치해야 한다** — 어긋나면 그건 리젝 사유다 |
| 오프라인 폴백 | `server.errorPath` → `public/app-offline.html` | 원격 URL 로드라 서버를 못 열면 리뷰어가 흰 화면을 본다(2.1 리젝의 단골). 번들 안 화면으로 바꿔 준다. **외부 리소스를 참조하면 안 된다** — 네트워크가 끊긴 상황이 존재 이유다 |
| Sign in with Apple | §6 | 4.8. 카카오 하나로는 통과하지 못한다 |

### 아직 남은 것

- **Apple Developer 포털** — App ID 에 Sign in with Apple capability
- **App Store Connect** — 앱 레코드·이름 선점, 연령 등급(데이팅은 최고 등급),
  개인정보처리방침 URL(앱 내 `/settings/privacy` 가 비로그인으로 열리므로 그 주소를
  쓸 수 있는지 확인), 지원 URL·연락처(1.2 UGC 요건), 6.9" 스크린샷, 프라이버시 표시,
  심사 노트(데모 계정 + 원격 웹뷰 구조 + 네이티브 기능 목록)
- **4.2 최소 기능 방어** — 심사 노트에 네이티브 기능을 명시한다: FCM 원격 푸시,
  로컬 알림, 카카오 SDK 네이티브 로그인, 유니버설 링크, 위치. 원격 URL 로드는
  "웹사이트 재포장"으로 읽힐 수 있다
- **실기기 빌드 자체가 아직 없다** — §3 스모크 전부 미실시. 내부 TestFlight 는 베타
  심사를 거치지 않으므로 지금 바로 팀 배포로 확인할 수 있다

### 실빌드 · 아카이브 · 배포 (2026-09-07 여기까지 통과)

CLI 만으로 IPA 까지 나온다. Xcode GUI 를 열 필요가 없다.

```bash
# 0) 웹 자산 동기화 — 이걸 빼면 예전 번들이 들어간다
npm run cap:sync

# 1) 컴파일 검증 (서명 문제와 분리해서 본다)
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -destination 'generic/platform=iOS' -configuration Debug \
  CODE_SIGNING_ALLOWED=NO build

# 2) 아카이브 — `-allowProvisioningUpdates` 가 App ID capability 와 프로필을 자동 등록한다
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -destination 'generic/platform=iOS' -configuration Release \
  -archivePath build/App.xcarchive -allowProvisioningUpdates archive

# 3) App Store Connect 용 IPA 로 내보낸다(배포 인증서로 재서명된다)
xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath build/export -allowProvisioningUpdates
```

`build/` 는 gitignore 돼 있다.

**아카이브 결과물을 반드시 확인할 것** — 빌드가 성공해도 조용히 빠지는 것들이 있다:

```bash
APP=build/App.xcarchive/Products/Applications/App.app
codesign -d --entitlements :- "$APP"        # applesignin · associated-domains · aps-environment
ls "$APP" | grep -i privacy                  # PrivacyInfo.xcprivacy
ls "$APP/public/app-offline.html"            # 오프라인 폴백
```

#### `aps-environment` 는 아카이브가 아니라 **export 에서** 바뀐다

이 문서는 원래 "자동 서명이면 Xcode 가 배포용 아카이브에서 `production` 으로 바꿔 준다"고
적어 뒀는데, 정확히는 **export 시점**이다. 아카이브 자체는 키체인에 있는 개발 인증서로
서명돼 `development` 로 남는다. 놀라지 말 것 — `-exportArchive` 를 거친 IPA 를 확인하면
`production` 이고 `beta-reports-active`(TestFlight 용)도 함께 들어가 있다.

### 팀원 테스트 — TestFlight

배포(=심사) 전에 팀원이 써 볼 수 있다. 두 갈래다.

| | 대상 | 심사 | 준비 |
|---|---|---|---|
| **내부(Internal)** | ASC 사용자로 초대한 최대 100명 | **없음** | 팀원을 ASC 사용자로 추가. 빌드 업로드 즉시 배포 |
| **외부(External)** | 이메일/공개 링크로 최대 10,000명 | **베타 앱 심사 있음** | 첫 빌드만 심사. 이후 빌드는 대체로 자동 통과 |

내부 테스트가 지금 필요한 것이다 — 심사가 없어 4.8(애플 로그인)이 없어도 올라간다.
팀원은 Apple ID 로 ASC 에 초대되고 TestFlight 앱으로 설치한다. 빌드는 90일 뒤 만료된다.

#### 업로드 — ✅ 2026-09-07 성공

App Store Connect 앱 레코드와 API 키가 생기면서 CLI 만으로 업로드까지 끝났다.

| 항목 | 값 |
|---|---|
| ASC 앱 ID | `6809342012` |
| App Store 표시 이름 | **`Ditto - 퀴즈로 만나는 인연`** |
| 번들 ID · SKU | `pics.ditto.app` · `ditto-ios-001` |
| 기본 언어 | 한국어 |

⚠️ **앱 이름이 `Ditto` 가 아니다.** 그 이름은 이미 선점돼 있었다. 앱 아이콘 밑에 뜨는
이름(`CFBundleDisplayName = Ditto`)과 App Store 목록에 뜨는 이름은 별개이고, 지금은
의도적으로 다르다. 스토어 이름을 바꿀 일이 생겨도 plist 는 건드릴 필요 없다.

```bash
# 자격증명 확인 겸 앱 레코드 조회
xcrun altool --list-apps --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>

# 업로드 전 검증 (여기서 걸리면 업로드해도 어차피 거절된다)
xcrun altool --validate-app -f build/export/App.ipa -t ios \
  --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>

xcrun altool --upload-app -f build/export/App.ipa -t ios \
  --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>
```

`<KEY_ID>` · `<ISSUER_ID>` 는 App Store Connect → 사용자 및 액세스 → 통합에서 확인한다.
**값도 `.p8` 도 리포에 넣지 않는다.** `.p8` 은 `~/.appstoreconnect/private_keys/` 에 두면
`--apiKey` 만으로 자동으로 찾는다(`.gitignore` 가 `*.p8` 을 막는다).

#### 처리 상태를 CLI 로 보는 법

`altool` 에는 빌드 목록 명령이 없다. 업로드 성공과 **TestFlight 에 뜨는 것은 다른 사건**이고
(처리 중 실패하면 메일만 오고 목록에는 영영 안 뜬다), 상태는 App Store Connect API 로 본다.

```bash
curl -s -H "Authorization: Bearer <JWT>" \
  "https://api.appstoreconnect.apple.com/v1/builds?filter%5Bapp%5D=6809342012&limit=5"
```

`<JWT>` 는 `.p8` 로 ES256 서명한 토큰이다(만료 최대 20분, `aud` 는 `appstoreconnect-v1`).
이 맥에는 PyJWT·cryptography 가 없어서 `openssl dgst -sha256 -sign` 으로 서명하고
DER → JOSE(r‖s, 각 32바이트) 변환만 직접 해 주면 된다.

`processingState` 가 `PROCESSING` → `VALID` 이 되면 TestFlight 에 뜬다.
`INVALID` / `FAILED` 면 그 빌드는 버리고 다시 올려야 한다.

---

## 8. 로컬 Capacitor 플러그인 — SPM 핀 함정 (2026-09-07 실빌드에서 발견)

리포 안의 플러그인(`native-plugins/*`)은 `Package.swift` 에서 Capacitor 를 직접 의존한다.
**여기 `branch: "main"` 을 쓰면 앱 전체가 깨진다.**

```swift
// ❌ 절대 쓰지 말 것
.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")

// ✅ 퍼스트파티 플러그인들과 같게
.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
```

### 왜

`capacitor-swift-pm` 은 소스가 아니라 **XCFramework 바이너리를 vend 하는 저장소**다.
그리고 그 저장소의 `main` 은 릴리스 태그보다 **한참 뒤처져 있다** — 2026-09-07 시점에
main HEAD(`fd80ee6`)가 가리키는 바이너리는 **Capacitor 6.2.2** 였다. 앱이 쓰는 8.5.0 이 아니다.

SPM 은 한 패키지를 그래프 전체에서 **하나의 버전으로 통일**하는데, **브랜치 요구사항이
버전 요구사항을 이긴다.** 그래서 로컬 플러그인 하나가 main 을 물면:

- `CapApp-SPM/Package.swift` 의 `exact: "8.5.0"` 이 무시되고
- 퍼스트파티 플러그인의 `from: "8.0.0"` 도 무시되고
- **앱 전체가 6.2.2 로 끌려간다** (두 메이저 아래)

### 증상이 엉뚱한 곳에서 난다

우리 플러그인이 아니라 **남의 플러그인**이 깨진다. 실제로 본 것:

```
@capacitor/status-bar/.../StatusBar.swift:22:75: error:
  type 'NSNotification.Name?' has no member 'capacitorViewDidAppear'
```

`capacitorViewDidAppear` 는 Capacitor 8 에 있고 6.2.2 에는 없다. status-bar 8.0.3 은
아무 잘못이 없는데 혼자 실패해서, 원인을 그 플러그인에서 찾게 된다.
**`Package.resolved` 를 열어 `capacitor-swift-pm` 이 branch 로 잡혀 있는지 먼저 볼 것.**

```bash
grep -A5 capacitor-swift-pm ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved
# "branch": "main" 이 보이면 이 문제다. "version": "8.5.0" 이어야 한다.
```

### 고친 뒤에는 DerivedData 를 비운다

핀만 고치고 다시 빌드하면 **이전 버전으로 만든 모듈 캐시가 남아** 또 다른 오류가 난다:

```
error: file '.../Cordova.framework/Headers/CDVPlugin.h' has been modified
       since the module file '.../Capacitor-....pcm' was built
error: failed to build module 'Capacitor'; this SDK is not supported by the compiler
```

두 번째 줄(Swift 버전 불일치)은 진짜 툴체인 문제처럼 보이지만 캐시 오염의 2차 증상이다.

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*
```

### 왜 여태 몰랐나

**iOS 프로젝트를 한 번도 빌드한 적이 없었다.** 카카오 플러그인(2026-09-06)에 들어간
`branch: "main"` 이 그대로 있었고, 애플 플러그인을 만들면서 같은 줄을 복사해 두 개가 됐다.
`npm run lint && build && tsc` 는 이 문제를 절대 잡지 못한다 — 웹 빌드에는 Swift 가 없다.
