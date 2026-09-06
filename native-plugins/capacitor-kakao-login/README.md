# capacitor-kakao-login (리포 내부 플러그인)

카카오 네이티브 SDK 로그인만 담당하는 로컬 Capacitor 플러그인이다.
npm 에 있는 카카오 플러그인들을 검토했으나 채택하지 않았다(2026-09-03):

| 후보 | 문제 |
|---|---|
| `@capgo/capacitor-social-login` | 카카오를 지원하지 않는다 |
| `@team-lepisode/capacitor-kakao-login@8.0.0` | iOS `login()` 이 `isKakaoTalkLoginAvailable` 양쪽 분기에서 모두 `loginWithKakaoAccount` 를 부른다 — **카카오톡 앱 전환이 iOS 에서 아예 일어나지 않는다**. 이 작업의 목적 자체가 사라진다 |
| `karbon-capacitor-kakao-plugin@1.0.0` | 로직은 맞지만 peer 가 Capacitor ^7 이고 버전이 1.0.0 하나뿐이며 tarball 에 빌드 산출물이 섞여 있다 |

## 이 패키지에 JS 가 없는 이유

플러그인 프록시는 앱 코드(`src/shared/lib/native/kakaoLogin.ts`)가
`registerPlugin("KakaoLogin")` 으로 직접 만든다. 여기는 네이티브 코드만 담고,
`package.json` 의 `capacitor` 키 덕분에 `npx cap sync` 가 iOS/Android 프로젝트에 엮어 준다.
**따라서 이 패키지를 import 하는 곳은 없다 — 미사용 의존성으로 보이지만 지우면 안 된다.**

## 앱 키

`capacitor.config.ts` 의 `plugins.KakaoLogin.appKey` 를 양 플랫폼이 함께 읽는다.
값은 빌드 시점의 `KAKAO_NATIVE_APP_KEY` 환경변수에서 오며, **웹 번들에는 들어가지 않는다**
(`NEXT_PUBLIC_` 접두사가 아니다). Android 의 리다이렉트 스킴만 Gradle 쪽에서 같은
환경변수를 한 번 더 읽는다. 절차는 `docs/app-shell-runbook.md` 참고.
