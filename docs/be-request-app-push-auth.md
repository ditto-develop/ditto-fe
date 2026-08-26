# BE 개발 요청서 — 앱(Capacitor) 전환: 푸시 알림 · 네이티브 로그인

> 작성: 2026-08-26 · FE 담당: @junseo2323
> 관련: [BE-Request 위키](https://github.com/ditto-develop/ditto-fe/wiki/BE-Request) · `INTEGRATION-TODO.md`
> FE 브랜치: `feat/capacitor-app-shell`

---

## 0. 배경 — 무엇이 왜 필요한가

Ditto FE를 **Capacitor 기반 하이브리드 앱**으로 전환한다. 구조는 이렇다.

- 화면은 **전부 기존 웹 그대로**다. 앱은 이미 배포된 `https://ditto.pics`를 웹뷰로 연다
  (원격 URL 로드). 웹 배포 파이프라인·도메인·CORS 설정을 **하나도 바꾸지 않는다.**
- 웹 접속은 그대로 살아 있다. 앱과 웹이 **같은 번들, 같은 배포물**이다.
- 네이티브로 가는 것은 **푸시 알림과 (2단계) 소셜 로그인** 둘뿐이다.

FE 앱 셸은 이미 구현했고, 아래 **A·B·C가 없어서 푸시 기능만 비활성 플래그로 꺼둔 상태**다.
BE가 도착하면 FE는 환경변수 하나(`NEXT_PUBLIC_PUSH_ENABLED=true`)만 켜면 된다.

### 요청 항목 요약

| # | 항목 | 상태 | 블로킹 대상 |
|---|---|---|---|
| **A** | 디바이스 토큰 등록/해제 API | 신규 | 푸시 전체 |
| **B** | FCM/APNs 발송 인프라 + payload 계약 | 신규 | 푸시 전체 |
| **C** | 앱에서의 refreshToken 전략 확인 | **확인만** | 앱 세션 유지 |
| **D** | 네이티브 소셜 로그인 토큰 교환 | 신규 | 2단계(선택) |

**A·B가 이번 분기 밖이라면 D도 보류해도 된다.** 앱 1차 출시는 A~D 없이도 가능하다
(웹뷰 + 기존 리다이렉트 로그인 + 폴링 알림). 다만 그 앱은 **푸시가 없으므로
백그라운드에서 채팅 메시지를 받지 못한다** — 앱의 실질적 가치가 거의 없다.
우선순위를 매긴다면 **A → B → C → D**.

---

## A. 디바이스 토큰 등록/해제 API

### A-1. 등록

```
POST /api/v1/notifications/devices
Authorization: Bearer <accessToken>
X-API-Key: <key>
Content-Type: application/json
```

```jsonc
// Request
{
  "token": "fcm_or_apns_device_token_string",
  "platform": "IOS"   // "IOS" | "ANDROID"
}
```

```jsonc
// Response 200
{ "success": true, "data": { "registered": true } }
```

**요구사항**

- **멱등이어야 한다.** 같은 `(회원, token)` 조합으로 재호출해도 200이고 행이 늘지 않아야 한다.
  앱은 실행할 때마다 등록을 호출한다(OS가 토큰을 재발급할 수 있어서 매번 확인이 필요).
- **한 회원이 여러 기기를 가질 수 있다.** 폰 + 태블릿, 기기 교체 등. 회원당 1행으로 덮어쓰지 말 것.
- **한 토큰은 한 회원에게만 붙어야 한다.** 기기 하나에서 A가 로그아웃하고 B가 로그인하면
  그 토큰의 소유자는 B로 **이전**되어야 한다. 안 그러면 B의 기기로 A의 알림이 간다(개인정보 사고).
  → 등록 시 `token`이 이미 다른 회원에게 있으면 그 행을 현재 회원으로 갱신하는 것이 안전하다.

### A-2. 해제

```
DELETE /api/v1/notifications/devices/{token}
Authorization: Bearer <accessToken>
```

- 로그아웃·탈퇴 시 호출한다.
- 내 토큰이 아니면 404. 이미 없으면 204/200 (멱등).

### A-3. 죽은 토큰 정리

FCM/APNs가 발송 시 `NotRegistered` / `Unregistered` / HTTP 410을 돌려주면 해당 행을 삭제해 달라.
앱 삭제한 기기로 계속 쏘면 발송 실패율이 올라가고 결국 프로젝트가 스로틀링된다.

---

## B. 푸시 발송 인프라 + payload 계약

### B-1. 발송 트리거

기존 인앱 알림(`GET /api/v1/notifications`)이 생성되는 **바로 그 지점**에서 푸시도 함께 나가면 된다.
알림 타입은 이미 FE가 아는 것과 동일하다:

| 타입 | 푸시 필요성 |
|---|---|
| `CHAT_MESSAGE` | **최우선.** 앱이 백그라운드면 STOMP 소켓이 끊겨서 푸시 없이는 메시지를 아예 못 받는다 |
| `MATCH_RESULT` | 높음 |
| `GROUP_FORMED` | 높음 |
| `REMATCH_MATCHED` | 높음 |
| `CHAT_ENDING_SOON` | 중간 |
| `REVIEW_REQUEST` | 중간 |
| `SYSTEM_NOTICE` | 낮음 |

### B-2. payload 계약 (중요)

```jsonc
{
  "notification": {
    "title": "새 메시지",
    "body": "상대방이 메시지를 보냈어요"
  },
  "data": {
    "deepLink": "/chat/one-on-one/305/",   // ★ FE가 이 값으로 화면을 연다
    "notificationId": "8821",
    "type": "CHAT_MESSAGE"
  }
}
```

- **`data.deepLink`는 반드시 슬래시로 시작하는 앱 내부 경로**이거나
  `https://ditto.pics/...` 전체 URL이어야 한다. FE가 호스트를 검증하고
  (`ditto.pics` / `www.ditto.pics` / `test.ditto.pics`만 허용) 그 외에는 무시한다.
- **경로 끝에 슬래시를 붙여 달라** (`/chat/one-on-one/305/`). FE가 `trailingSlash: true`로
  export 되어 있어 슬래시 없는 경로는 리다이렉트를 한 번 더 탄다.
- `data` 값은 **전부 문자열**이어야 한다 (FCM 제약). 숫자를 그대로 넣지 말 것.

### B-3. 뱃지 카운트

가능하면 iOS payload에 `badge` 값을 넣어 달라. 값은 기존
`GET /api/v1/notifications/unread-count`와 **같은 기준(최근 30일 미읽음)** 이어야
인앱 뱃지와 앱 아이콘 뱃지가 어긋나지 않는다.

### B-4. 확인 필요

- FCM 프로젝트/APNs 인증서는 누가 발급·보관하나? (FE는 앱 번들 ID `pics.ditto.app`를 씀)
- Android는 `google-services.json`, iOS는 APNs 키가 앱 빌드에 들어가야 한다. 전달 경로 협의 요청.

---

## C. 앱에서의 refreshToken 전략 — **확인 요청**

현재 refreshToken은 BE가 HttpOnly 쿠키로 관리하고, FE는 401 시
`POST /api/v1/users/auth/refresh`를 `credentials: 'include'`로 호출한다.

앱은 웹뷰가 **`https://ditto.pics`를 그대로 열기 때문에**, API(`api.ditto.pics`)와
**같은 사이트(registrable domain 동일)** 다. 따라서 `SameSite=Lax`여도 쿠키가 전송되고
**웹과 동일하게 동작할 것으로 예상**한다.

> 앞서 우려했던 "서드파티 쿠키 차단" 문제는 로컬 번들(`capacitor://localhost`) 방식일 때의
> 이야기이고, 원격 URL 로드를 택했기 때문에 해당하지 않는다.

**확인해 주실 것 2가지:**

1. refresh 쿠키의 `Domain` / `SameSite` / `Secure` 현재 설정값이 무엇인가?
   (`Domain=.ditto.pics`, `SameSite=Lax`, `Secure` 면 그대로 동작한다)
2. **`SameSite=None`으로 바꾸지 말아 달라.** 앱을 위해 바꿀 필요가 없고,
   같은 번들이 웹에서도 돌기 때문에 웹의 CSRF 방어가 함께 약해진다.

실제 기기(iOS WKWebView는 ITP가 있다)에서 FE가 검증하고 결과를 회신하겠다.
만약 검증에서 실패하면 그때 D의 브릿지 방식으로 전환을 요청하겠다.

### C-3. 로그인 후 FE 리다이렉트 호스트 — **확인 요청 (우선)**

카카오 OAuth의 `redirect_uri`가 BE 자신을 가리키는 것은 확인했다:

```
redirect_uri=https://api.ditto.pics/api/v1/users/social-login/KAKAO/callback
```

여기까지는 FE 도메인과 무관해서 안전하다. 확인이 필요한 것은 **그다음 단계**다 —
BE가 카카오에서 돌아온 뒤 FE의 `/auth/callback`으로 리다이렉트할 때 **어느 호스트를 쓰는가?**

**왜 지금 묻는가:** 앱이 서빙받을 도메인을 `app.ditto.pics`로 분리하려고 한다.
그런데 BE의 리다이렉트 대상이 `https://ditto.pics`로 하드코딩돼 있으면
**앱에서 로그인해도 엉뚱한 호스트로 떨어져 로그인이 완료되지 않는다.**

> 참고로 `ditto.pics` 아펙스는 현재 DNS 레코드가 없어 접속 자체가 불가능한 상태다.
> 즉 지금 하드코딩돼 있다면 웹 로그인도 이미 영향을 받고 있을 수 있다.

**확인해 주실 것:**

1. 리다이렉트 대상 호스트가 **설정값인가 하드코딩인가?**
2. 설정값이라면 **허용 목록에 `app.ditto.pics`를 추가**해 주실 수 있는가?
3. 가능하면 **요청의 Origin/Referer 기반으로 되돌려보내는 방식**이 가장 안전하다.
   그러면 웹(`ditto.pics`·`www`)·스테이징(`test`)·앱(`app`)이 각자 자기 호스트로 돌아온다.
   다만 오픈 리다이렉트가 되지 않도록 **허용 호스트 목록으로 제한**해 주셔야 한다.

FE의 딥링크 검증은 이미 `app` · `test` · `ditto.pics` · `www` 네 호스트만 허용하도록
구현돼 있다(`src/shared/lib/native/appShell.ts`). 같은 목록을 쓰시면 된다.

---

### C-4. CORS 허용 origin — **확인 요청 (도메인 확정 후)**

FE가 서빙되는 호스트가 바뀔 예정이다(아래 배경). 현재 BE의 CORS 허용 목록이
**명시적 allowlist**라면, 새 호스트를 추가하지 않는 순간 그 도메인에서는
**모든 API 호출이 실패한다.** 로그인뿐 아니라 전부다.

**배경:** `ditto.pics` 아펙스에 DNS 레코드가 없어 프로덕션 접속이 불가능한 상태이고
(§0-0), 현재 DNS 업체가 아펙스 ALIAS를 지원하지 않아 **Route53 이전을 진행 중**이다.
이전 결과에 따라 FE 정본 호스트가 아래 중 하나로 정해진다:

- `ditto.pics` (아펙스 정본)
- `www.ditto.pics` (www 정본)
- `app.ditto.pics` (앱 전용 서브도메인을 두는 경우)

**확인해 줄 것:**

1. 현재 CORS 허용 origin 목록이 무엇인가? (와일드카드인가 명시적 목록인가)
2. `credentials: 'include'` 요청을 허용하고 있는가?
   (refresh 쿠키 때문에 필요하다. 이 경우 `Access-Control-Allow-Origin`에
   `*`를 쓸 수 없고 origin을 정확히 반환해야 한다)
3. 도메인이 확정되면 추가해 줄 수 있는가?

FE가 도메인을 확정하는 대로 정확한 목록을 회신하겠다.
확정 전까지는 `test.ditto.pics`(staging)로 개발·검증한다.

---

---

## D. 네이티브 소셜 로그인 토큰 교환 (2단계 — A·B 이후)

### 현재 흐름의 한계

지금 로그인은 브라우저 리다이렉트 전용이다:

```
FE: window.location.href = /api/v1/users/social-login/KAKAO
  → 카카오 → BE 처리 → /auth/callback?accessToken=...&signupRequired=... 로 리다이렉트
```

이 흐름은 **앱 웹뷰에서도 그대로 동작한다** (allowNavigation에 카카오 도메인을 등록해 둠).
그래서 1차 출시에는 문제가 없다. 다만 네이티브 카카오 SDK를 쓰면
**카카오톡 앱으로 바로 넘어가는 로그인**이 되어 전환율이 유의미하게 오른다.

### 요청 스펙

```
POST /api/v1/users/social-login/kakao/native
X-API-Key: <key>
Content-Type: application/json
```

```jsonc
// Request — 네이티브 카카오 SDK가 받은 액세스 토큰
// ⚠️ 필드명은 `accessToken`이 아니라 `kakaoAccessToken`으로 요청한다.
//    응답의 `accessToken`(우리 JWT)과 이름이 겹치면 양쪽 다 헷갈린다.
{ "kakaoAccessToken": "kakao_sdk_access_token" }
```

```jsonc
// Response 200 — 기존 리다이렉트 콜백과 동일한 정보를 JSON으로
{
  "success": true,
  "data": {
    "accessToken": "ditto_jwt",
    "signupRequired": false,
    "sanctioned": false
  }
}
```

**요구사항**

- 기존 리다이렉트 엔드포인트는 **삭제하지 말 것.** 웹의 유일한 로그인 경로다.
  이건 *추가*이지 대체가 아니다.
- `signupRequired` / `sanctioned` 분기 의미는 현재 콜백 쿼리파라미터와 동일하게 유지.
- refreshToken은 이 응답에서도 동일하게 `Set-Cookie`로 내려주면 된다.
  **바디로 내려줄 필요는 없다** — 아래 호출 주체를 참고할 것.

**토큰이 두 개다 (이름 충돌 주의)**

| | 발급자 | 수명 | FE 저장 |
|---|---|---|---|
| 요청의 `kakaoAccessToken` | 카카오 | 교환용, 1회성 | 저장 안 함 |
| 응답의 `accessToken` | BE(우리 JWT) | 기존과 동일 | localStorage |

**이 엔드포인트를 호출하는 주체는 네이티브가 아니라 웹뷰다**

앱이라도 이 요청은 **웹뷰(JS)에서** 나간다. 네이티브 코드가 직접 호출하지 않는다.
네이티브가 호출하면 `Set-Cookie: refreshToken`이 네이티브 쿠키 저장소로 들어가고
**웹뷰는 그 쿠키를 보지 못해** 이후 `/api/v1/users/auth/refresh`가 항상 실패한다
(증상: 며칠 쓰다가 원인 없이 로그아웃 — 추적이 매우 어렵다).

네이티브가 맡는 부분은 **카카오 SDK 로그인 한 조각뿐**이고, 받은 카카오 토큰을
웹뷰로 넘기면 웹뷰가 이 엔드포인트를 호출한다. 따라서 BE 입장에서는
**기존 웹 요청과 동일한 origin · 쿠키 처리**를 하면 된다.

---

## E. FE 준비 상태 (참고)

BE 작업 시 FE가 이미 어떤 계약으로 코딩해 뒀는지:

| 파일 | 내용 |
|---|---|
| `src/shared/lib/native/pushNotifications.ts` | A-1/A-2 호출부 구현 완료. `NEXT_PUBLIC_PUSH_ENABLED` 플래그로 꺼둠 |
| `src/shared/lib/native/appShell.ts` | B-2의 `deepLink` 파싱 + 호스트 검증 구현 완료 |
| `src/shared/lib/native/platform.ts` | 웹/앱 분기. 웹에서는 전부 no-op |
| `capacitor.config.ts` | 앱 번들 ID `pics.ditto.app`, 원격 URL 로드 설정 |

스펙에 이견이 있으면 **구현 전에 알려 달라.** FE가 계약에 맞춰 이미 코드를 넣어 둔 상태라
스펙이 바뀌면 위 4개 파일을 함께 고쳐야 한다.
