# App Store 심사 제출 (1.0)

> 2026-10-06 작성. 빌드·업로드·App Store Connect 설정의 큰 줄기는 `docs/app-shell-runbook.md` §7.
> 이 문서는 **1.0 첫 심사**에 필요한 입력값과 남은 수작업만 모은다.

---

## 1. 지금 상태

| 항목 | 상태 | 비고 |
|---|---|---|
| 빌드 1.0 (6) | ✅ 업로드 | BETA 제거 아이콘·스플래시, GA4 신고 매니페스트. iOS 26.5 SDK / Xcode 26.6 |
| 출시 국가 | ✅ 한국만 | 신규 국가 자동 추가 꺼짐 |
| 카테고리 | ✅ 소셜 네트워킹 / 라이프스타일 | |
| 연령 등급 | ✅ 18+ (재정의) | 새 설문·소셜 미디어 문항 응답 완료 |
| 이름·부제 | ✅ | `디토` / `퀴즈로 만나는 새로운 인연` |
| 설명·키워드·프로모션 텍스트 | ✅ | 기획 원고 반영(2026-10-06). 키워드는 쉼표 뒤 공백을 빼야 100자 안에 든다(90자) |
| 릴리즈 노트 | — | 첫 버전(1.0)에는 입력란이 없다(API 409). 원고는 §5 — 1.0.1 부터 쓴다 |
| 지원 URL | ✅ | `https://ditto.pics/settings/business` (비로그인 공개, 문의 이메일 노출) |
| 개인정보처리방침 URL | ✅ | `https://ditto.pics/settings/privacy` |
| 저작권 · 출시 방식 | ✅ | `2026 카운트제로` · 수동 출시 |
| 콘텐츠 권한 | ✅ | 제3자 콘텐츠 사용(카카오맵) — 권한 보유 |
| 수출 규정 | ✅ | `ITSAppUsesNonExemptEncryption = false` |
| 스크린샷 6.9" | ✅ 6장 | Figma `App Store ScreenShot`(3139:32379) 아래 줄 1~6 — §4 |
| **가격** | ⬜ | §3-1 |
| **앱 개인정보** | ⬜ | §3-2 — API 가 없어 웹에서만 된다 |
| **심사 연락처·데모 계정·노트** | ⬜ | §3-3 |
| **Sign in with Apple 서버 알림 URL** | ⬜ | §3-4 — 한국 개발자 필수(2026-01-01~) |
| **심사용 계정 데이터** | ⬜ | §3-5 |
| 빌드 선택 · 제출 | ⬜ | 위가 끝나면 |

---

## 2. 리뷰어 로그인 — 개인 Apple ID 를 주지 않는다

Apple ID 는 2단계 인증이 필수라 코드가 계정 주인 기기로 간다. 리뷰어는 그 코드를 받을 수
없어 로그인에서 막히고(2.1 리젝), 개인 계정의 iCloud·결제 정보까지 넘기게 된다.

**심사 전용 카카오 계정**을 쓴다. 2단계 인증을 끄고, 매칭 결과·1:1 방·그룹 방이 있는 상태로
만들어 둔다(§3-5). 리뷰어 기기에는 카카오톡이 없으므로 카카오 계정 웹 로그인(아이디·비밀번호)
으로 들어온다.

---

## 3. 남은 수작업

### 3-1. 가격 — 무료

App Store Connect → 가격 및 사용 가능 여부 → 가격 일정 → 기준 국가 **대한민국**, **₩0**.

### 3-2. 앱 개인정보 (App Privacy)

`ios/App/App/PrivacyInfo.xcprivacy` 와 **값이 같아야 한다.** 모든 항목: **사용자와 연결됨 = 예,
추적에 사용 = 아니요.**

| 분류 > 데이터 유형 | 목적 |
|---|---|
| 연락처 정보 > 이름 | 앱 기능 |
| 연락처 정보 > 이메일 주소 | 앱 기능 |
| 위치 > 정확한 위치 | 앱 기능 |
| 위치 > 대략적인 위치 | 분석 |
| 민감한 정보 | 앱 기능 |
| 사용자 콘텐츠 > 사진 또는 비디오 | 앱 기능 |
| 사용자 콘텐츠 > 기타 사용자 콘텐츠 | 앱 기능 |
| 식별자 > 사용자 ID | 앱 기능, 분석 |
| 식별자 > 기기 ID | 앱 기능, 분석 |
| 사용 데이터 > 제품 상호작용 | 분석 |
| 기타 데이터 > 기타 데이터 유형 | 앱 기능 |

"추적 아님"의 근거는 `gtag.ts` 의 `allow_google_signals` / `allow_ad_personalization_signals = false`
다. GA 속성 관리 화면에서도 Google 신호 데이터가 꺼져 있는지 한 번 확인할 것.

### 3-3. 앱 심사 정보

- **연락처**: 이름·전화(`+82 10 …` 형식)·이메일. API 는 이 셋이 없으면 노트도 저장하지 않는다.
- **로그인 정보**: 심사용 카카오 계정의 아이디·비밀번호. **비밀번호는 App Store Connect 에만
  입력하고 채팅·문서·커밋에 남기지 않는다.**
- **메모**: 아래 원문을 그대로 붙여넣는다. 카카오 계정이면 DEMO ACCOUNT 단락 끝에
  `Tap "카카오로 계속하기" and sign in with the Kakao ID and password above.` 한 줄을 더한다.

```text
ABOUT THE APP
ditto is a weekly, quiz-based matching service for adults (19+) in the Republic of Korea. The app is in Korean and distributed in Korea only. Profiles use illustrated avatars instead of real photos.
- Mon-Wed: users pick one of the two quizzes of the week (a 1:1 dating quiz or a group hobby quiz) and answer its 12 questions.
- Thu: for the 1:1 quiz, users see up to 5 candidates ranked by answer similarity and may request a match. For the group quiz, users are invited to a group of 3-6 people with similar answers.
- Fri-Sun: matched users get a 72-hour chat room (1:1, or group with votes for meeting time/place and a nearby-place map). All chats close on Sunday at 23:59.
- After the chat closes, users rate each other.

DEMO ACCOUNT
Matches and chat rooms are only created on the weekly schedule above, so a newly created account will show empty results. Please sign in with the account in the Sign-In Information section; it already has matching results, a 1:1 chat room and a group chat room.

NOT RANDOM OR ANONYMOUS CHAT (Guideline 1.2)
Chats only open between members who were matched by quiz-answer similarity and who accepted the match (both sides for 1:1, at least 3 members for a group). Members sign in with a Kakao or Apple account and enter their birth date at sign-up; sign-ups under 19 are rejected.

USER-GENERATED CONTENT SAFEGUARDS (Guideline 1.2)
- Report: 1:1 chat room top-right menu > "신고하기", a group chat member's profile, and the post-chat rating screen > "사용자 신고하기". Reporting automatically blocks that member.
- Block list: Profile tab > Settings (gear) > "차단 목록" (unblock available).
- Filtering: messages containing prohibited words require an extra confirmation before sending; rating comments and nicknames with prohibited words are rejected; messages with links or money requests show a safety warning.
- Reports are reviewed by our operations team within 24 hours and sanctioned per Terms of Service Article 13 (warning and exclusion from the next quiz, then a 2-week suspension, then a permanent ban; severe violations such as sexual crimes or fraud are banned immediately).
- Contact: ditto.apply@gmail.com (also shown in Settings > Business information).

ACCOUNT DELETION (Guideline 5.1.1(v))
Profile tab > Settings (gear) > "회원탈퇴".

NATIVE FUNCTIONALITY (Guideline 4.2)
The app renders our web app (ditto.pics) inside WKWebView and adds: Firebase Cloud Messaging push notifications for chat and match events, local notifications for in-app alerts, native Sign in with Apple, native Kakao login (KakaoTalk app switch), Universal Links (ditto.pics/auth/callback), location for the nearby-place map, photo/camera attachment in chat and reports, swipe-back navigation, and a bundled offline screen that recovers automatically when the connection returns.
```

### 3-4. Sign in with Apple 서버 알림 URL (BE)

2026-01-01부터 **한국 개발자**는 Services ID 를 등록·수정할 때 서버 간 알림 URL 이 필수다
(이메일 전달 변경 · 앱 계정 삭제 · Apple 계정 영구 삭제). `pics.ditto.web` 은 2026-09-08 등록이라
대상이다. 개발자 포털 → Identifiers → Sign in with Apple 설정에서 BE 가 처리하는 URL 이 들어가
있는지, BE 가 `account-delete` 를 받아 회원을 정리하는지 확인한다.

같이 볼 것: 탈퇴 시 애플 토큰 폐기(TN3194) — 런북 §6 "탈퇴 시 애플 토큰 폐기 — 확인 필요".
새 릴레이 도메인 `private.icloud.com`(2026-08~)을 BE 가 이메일 검증에서 거르지 않는지.

### 3-5. 심사용 계정 데이터

심사는 요일을 가리지 않는다. 제출 시점에 그 계정에 **매칭 결과·진행 중인 1:1 방·그룹 방**이
있어야 한다(대화방은 일요일 23:59 마감). admin 의 시간 재정의(`/admin/time-override`)·매칭
관리로 만들어 두고, 심사 기간에는 방이 닫히지 않게 관리한다.

### 3-6. 심사 기간 중 프로덕션 배포 동결

앱은 `ditto.pics` 를 그대로 띄운다. 심사 중 `deploy` 에 푸시하면 리뷰어가 보는 화면이 바뀐다.
심사 결과가 나올 때까지 릴리스를 멈춘다.

---

## 4. 스크린샷

스토어에는 **Figma 디자인**을 쓴다 — `Ditto` 파일의 `App Store ScreenShot` 페이지(node 3139:32379)
아래 줄 프레임 1~6(375×812). 위 줄(이름 5~8)은 3~6 의 어두운 배경 버전이라 올리지 않았다.

올리는 법: 프레임을 4배(1500×3248)로 내보내 높이 2868 로 줄인 뒤 가운데 1320 폭으로 자른다
(양옆 약 2px). 6.9" 규격 1320×2868, 알파 없음. App Store 는 투명도가 있는 스크린샷을 거절한다.

목업 화면을 다시 찍어야 하면(디자인 시안의 원본 화면 등) 캡처 스크립트가 있다:

```bash
npm run dev:e2e            # 다른 터미널
npm run capture:appstore   # → cypress/screenshots/app-store.cy.ts/*.png (1320×2868)
```

---

## 5. 릴리즈 노트 원고 (1.0.1 부터)

첫 버전(1.0)에는 "이번 버전의 새로운 기능" 입력란이 없다. 아래 원고는 다음 업데이트에 쓴다.
스토어 버전 표기는 `1.0` 이라 원고의 `v.1.0.0` 을 `v1.0` 으로 맞췄다.

```text
가을이 곧 올 것 같네요. 아침 저녁으로는 벌써 왔으려나요?
여름은 더워서 싫고 겨울은 추워서 싫죠.
지나보니 투정만 부리느라 온전한 계절을 누리지 못한 것 같아요.

이번 가을에는 12개의 다정한 선택으로 당신과 닮은 사람을 만나보는 건 어떨까요?

디토 모바일앱 v1.0이 출시됐어요.

주요기능
- 매주 월-수안에 1:1 또는 그룹 퀴즈를 골라 12문제에 답해요.
- 목요일에는 매칭된 사람의 소개노트를 보고 대화를 신청할 수 있어요.
- 대화를 수락한 상대와 금-일까지 72시간 대화해요.
- 대화가 끝나면 상대를 평가하고, 불편한 일은 바로 신고할 수 있어요.

리뷰를 통해 의견을 들려주세요. 이용에 도움이 필요하시면 ditto.apply@gmail.com으로 문의해 주세요.
```

---

## 6. 심사 외 리스크 — 법률 검토 필요

- **랜덤채팅앱 청소년유해매체물 고시**(여성가족부, 2020-12 시행): 실명·휴대전화 인증, 대화 저장,
  신고 기능이 없는 랜덤채팅앱을 청소년유해매체물로 본다. 디토는 퀴즈 기반 매칭이고 대화 저장·
  신고가 있지만 본인인증이 없다. 해당 여부는 법률 검토가 필요하다.
- 본인인증이 없으므로 스토어 문구·심사 노트에 "인증", "검증된 회원" 같은 표현을 쓰지 않는다.
  연령은 "가입 시 생년월일 입력 · 만 19세 미만 가입 거절" 수준으로만 적는다.
