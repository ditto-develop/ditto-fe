# capacitor-apple-login

Ditto 전용 Sign in with Apple 플러그인. **iOS 전용**이고 리포 안에서만 쓴다.

## 왜 직접 만들었나

`@capacitor-community/apple-sign-in` 이 있지만 이 앱에는 맞지 않는다.

| 후보 | 문제 |
|---|---|
| `@capacitor-community/apple-sign-in` | nonce 를 **JS 가 만들어 넘기는** 구조다. 이 앱은 원격 URL 로드라 웹 번들이 곧 공개 자산이고, 로그인 흐름의 난수를 웹뷰에서 만들면 재사용 방어가 웹 코드에 노출된다. 또 `authorizationCode` 를 항상 돌려주지 않는 버전이 있어 서버의 토큰 폐기(탈퇴) 경로가 막힌다 |
| 웹 JS 흐름 (`appleid.auth`) | 애플이 **네이티브 앱 웹뷰에서의 웹 로그인**을 권장하지 않는다. 네이티브 시트가 아니라 사파리 뷰가 떠서 카카오와 경험이 어긋난다 |

`AuthenticationServices` 는 OS 프레임워크라 직접 감싸도 코드가 100줄 남짓이다.
카카오 플러그인과 같은 구조로 두는 편이 유지보수도 싸다.

## 역할

**identityToken 을 돌려주는 것까지만 한다.** 우리 서버와의 교환은 웹뷰(JS)가 한다 —
네이티브가 교환하면 `Set-Cookie: refreshToken` 이 네이티브 쿠키 저장소로 들어가
웹뷰가 그 쿠키를 보지 못한다(며칠 뒤 원인 모를 로그아웃).

```
네이티브: ASAuthorizationController → identityToken · authorizationCode · nonce · fullName
   ↓ (웹뷰로 전달)
웹뷰(JS): POST /api/v1/users/social-login/apple/native
```

## nonce

**원본은 네이티브가 만든다.** 애플에는 SHA-256 해시를 보내고, 원본을 JS 로 돌려준다.
서버는 받은 원본을 해시해 토큰의 `nonce` 클레임과 대조한다. 이 대조가 없으면 탈취한
identityToken 을 그대로 재사용하는 공격이 열린다.

## fullName 은 최초 1회뿐

이름은 **identityToken 안에 없다.** 최초 인증에서만 자격증명으로 오고, 이후 재로그인에서는
`nil` 이다. 그래서 이 값만은 클라이언트가 서버로 전달해야 한다. 첫 로그인에서 서버가 저장하지
않으면 사용자가 애플 설정에서 앱 연결을 지우기 전까지 영영 받을 수 없다.

이메일은 반대다 — 토큰 안에 있으므로 **클라이언트가 보내지 않는다**(클라이언트가 보낸 값은
서버가 믿을 수 없다). `@privaterelay.appleid.com` 릴레이 주소로 올 수 있다.

## 앱 설정

- Apple Developer → App ID `pics.ditto.app` 에 **Sign in with Apple** capability ON
- `ios/App/App/App.entitlements` 의 `com.apple.developer.applesignin`
- 카카오와 달리 **앱 키가 없다.** 설정할 값이 없어 `capacitor.config.ts` 에 항목이 없다.
