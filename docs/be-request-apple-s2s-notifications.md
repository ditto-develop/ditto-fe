# BE 개발 요청서 — Sign in with Apple 서버 간 알림 · 탈퇴 시 애플 토큰 폐기

> 작성: 2026-10-06 · FE 담당: @junseo2323
> 관련: [BE-Request 위키](https://github.com/ditto-develop/ditto-fe/wiki/BE-Request),
> FE `docs/app-store-submission.md` §3-4, `docs/app-shell-runbook.md` §6
> 우선순위: **P1** — 애플 정책상 필수. App Store 심사를 직접 막지는 않지만, 없으면 애플 쪽에서
> 연결을 끊거나 계정을 지운 사용자가 우리 DB 에 그대로 남는다.

---

## 0. 한 줄 요약

1. **서버 간 알림 엔드포인트** — 애플이 보내는 계정 상태 변경(`consent-revoked` · `account-delete` ·
   `email-disabled` · `email-enabled`)을 받아 처리한다. **2026-01-01부터 한국 개발자 필수**이며,
   애플 개발자 포털에 이 URL 을 등록해야 한다.
2. **탈퇴 시 애플 토큰 폐기** — 앱 안에서 탈퇴하면 `POST https://appleid.apple.com/auth/revoke` 로
   토큰을 폐기한다(애플 TN3194, 가이드라인 5.1.1(v) 계정 삭제 요건과 묶여 있다).

ditto-server 소스(2026-10-06 `main`)에는 둘 다 없다 — 위 이벤트 이름도, `/auth/revoke` 호출도
없다. FE 는 할 일이 없다(2번에서 인가 코드를 실어 보내는 한 줄만 있다).

---

## 1. 서버 간 알림

### 1-1. 왜

애플 공지(2025-10-09, "New requirement for apps using Sign in with Apple for account creation"):
2026-01-01부터 **대한민국에 기반한 개발자**는 Services ID 를 등록하거나 수정할 때 서버 간 알림
엔드포인트를 제공해야 한다. 우리 Services ID `pics.ditto.web` 은 2026-09-08 등록이라 대상이다.

### 1-2. 계약 (애플 → 우리)

- `POST <우리 URL>`, `Content-Type: application/json`
- 본문: `{ "payload": "<JWS>" }`
- JWS 는 애플 개인키로 서명돼 있다. 헤더의 `kid` 로 `https://appleid.apple.com/auth/keys` 에서
  공개키를 골라 검증한다(로그인 identityToken 검증과 같은 키 세트다).
- 검증할 클레임: `iss == "https://appleid.apple.com"`, `aud` 가 우리 client_id
  (`pics.ditto.app` 또는 `pics.ditto.web`), `iat` 가 지나치게 오래되지 않았는지.
- `events` 클레임(JSON 문자열)을 다시 파싱하면 다음이 나온다:

```jsonc
{
  "type": "consent-revoked",   // 아래 표의 넷 중 하나
  "sub": "001234.abcd....1234", // 애플 사용자 ID = SocialAccount.providerUserId (provider = APPLE)
  "event_time": 1760000000000, // ms
  "email": "xxx@privaterelay.appleid.com", // email-* 에만
  "is_private_email": "true"                // email-* 에만
}
```

### 1-3. 이벤트별 처리

| type | 언제 | 처리 |
|---|---|---|
| `consent-revoked` | iPhone 설정 > Apple 계정 > Apple로 로그인 에서 디토 사용 중단 | 해당 회원의 세션(refresh token) 폐기·로그아웃. 계정을 지울지는 정책 결정 — 최소한 다음 로그인 때 새 인가를 받게 한다 |
| `account-delete` | 사용자가 Apple 계정 자체를 영구 삭제 | **회원 탈퇴 처리** — 앱 내 탈퇴(`UserService.leaveUser`)와 같은 정리(FCM 토큰 해제 포함). 탈퇴 사유는 별도 코드로 남긴다 |
| `email-disabled` | 릴레이 이메일 전달을 끔 | 해당 회원 이메일 발송 불가 표시 |
| `email-enabled` | 릴레이 이메일 전달을 다시 켬 | 발송 가능 표시 |

- `sub` 로 회원을 못 찾으면(이미 탈퇴 등) **200 으로 무시**한다. 애플은 실패 응답이면 재시도한다.
- 같은 이벤트가 다시 와도 안전해야 한다(멱등).
- 무거운 처리는 비동기로 넘기고 빨리 200 을 돌려준다.

### 1-4. 엔드포인트 위치 · 보안 설정

- 제안 경로: `POST /api/v1/users/social-login/apple/notifications`
- 애플은 `X-API-Key`·JWT 를 보내지 않는다. `SecurityConfig.publicApiSecurityFilterChain` 의
  `securityMatcher` 는 지금 `/api/v1/users/social-login/*` 와 `.../*/callback` 만 잡으므로
  **새 경로를 공개 체인에 추가**해야 한다. CSRF 도 꺼야 한다.
- 인증이 없는 엔드포인트라 **JWS 검증이 곧 인증**이다. 검증 실패는 400 으로 거절한다.

### 1-5. 포털 등록 (BE 배포 후)

Certificates, Identifiers & Profiles → Identifiers → App ID `pics.ditto.app`(주 App ID) →
Sign In with Apple → Edit → **Server-to-Server Notification Endpoint** 에 위 URL 을 넣는다.
https 절대 URL · TLS 1.2 이상. Account Holder/Admin 권한이 필요하다.
9/8 등록 때 이미 다른 값이 들어가 있다면 그 URL 이 살아 있는지 먼저 확인한다.

---

## 2. 탈퇴 시 애플 토큰 폐기

### 2-1. 지금

BE 는 identityToken 검증만 하고 **인가 코드(authorization code)를 교환하지 않는다**(위키
Frontend-Apple-Login-Guide §2). 그래서 폐기할 refresh token 이 없다.

### 2-2. 요청

1. 로그인(`POST /api/v1/users/social-login/apple/native`) 요청에 선택 필드 `authorizationCode` 를
   받는다. FE 네이티브 플러그인은 이미 이 값을 돌려주고 있어 JS 한 줄로 실어 보낸다.
2. BE 가 `POST https://appleid.apple.com/auth/token`(grant_type=authorization_code)으로 교환해
   refresh token 을 `SocialAccount` 에 보관한다. client_secret 은 Sign in with Apple 키(.p8)로
   서명한 JWT 다.
3. 탈퇴(`leaveUser`) 때 `POST https://appleid.apple.com/auth/revoke`
   (token=refresh token, token_type_hint=refresh_token)를 부른다. 실패해도 탈퇴는 진행한다.

웹·안드로이드의 리다이렉트 로그인(`/api/v1/users/social-login/APPLE`)은 이미 인가 코드를 받는
흐름이니 같은 저장을 붙이면 된다.

---

## 3. 함께 확인

- **새 릴레이 도메인**: 2026-08 부터 새 가린 이메일은 `private.icloud.com` 으로 발급된다
  (기존 `privaterelay.appleid.com` 도 계속 유효). 이메일 도메인으로 거르는 곳이 있다면 둘 다 허용.

## 4. FE 쪽 후속

- 2번 BE 배포 후 `appleLogin.ts` 에서 `authorizationCode` 를 요청 본문에 싣는다(한 줄).
- 1번은 FE 변경 없음.
