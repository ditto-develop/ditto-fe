# BE 개발 요청서 — Android 출시 알림 신청 API

> 작성: 2026-10-19 · FE 담당: @junseo2323
> 관련 FE: `src/features/download/`(신청 화면 `/download/android`), `src/shared/lib/webGate.ts`(웹 차단)
> FE 는 이 명세대로 이미 연결해 두었다. 배포되기 전까지 신청은 실패 토스트("신청하지 못했어요")로 끝난다.

## 배경

- 웹(`ditto.pics`)을 브라우저로 열면 앱 다운로드 안내만 보이게 바꾼다(앱 웹뷰는 그대로).
- Android 앱은 아직 준비 중이라, 출시되면 메일로 알려 줄 사람의 이메일을 받는다.
- 신청자는 **로그인하지 않은 방문자**다.

## `POST /api/v1/launch-notification-requests`

**인증**: `X-API-Key` 만, JWT 없음. 로그인 전 호출이라 `review-login`·`social-login/*/native` 와 같은
보안 체인(@Order(4))에 두면 된다. API Key 는 웹 번들에 들어 있어 사실상 공개이므로 아래 남용 방지가 필요하다.

**요청**
```jsonc
{
  "email": "user@example.com",   // 필수. 이메일 형식, 최대 254자. 서버에서 trim·소문자 정규화
  "platform": "ANDROID",          // 필수. 지금은 ANDROID 만
  "privacyConsent": true,         // 필수. true 가 아니면 0001
  "consentVersion": "2026-10-19"  // 필수. FE 가 보여 준 동의 문구의 버전. 동의 증빙으로 저장
}
```

**응답**: HTTP 항상 200 + `ApiResponse`. 성공은 `{ "success": true, "data": null }`.

- **같은 이메일·플랫폼으로 다시 신청해도 성공으로 응답한다.** "이미 신청됨"을 알려 주면 그 이메일이
  등록돼 있다는 사실이 드러난다. 새 행은 만들지 않고 `consented_at`·`consent_version` 만 갱신한다.

**에러**

| code | 언제 |
|---|---|
| `0001` | 이메일 형식 오류·254자 초과, `privacyConsent` 가 true 가 아님, 모르는 `platform` |
| 신규(번호는 BE 결정) | 같은 IP 에서 너무 잦은 요청(예: 분당 5회) |

## 저장

- 테이블 예: `launch_notification_request`
  - `id`, `email`, `platform`, `consent_version`, `consented_at`, `created_at`, `notified_at`
  - 유니크 `(email, platform)`
- **보유 기간: 신청일(`consented_at`)로부터 3개월.** 지나면 지체 없이 파기(스케줄러).
  재신청으로 `consented_at` 이 갱신되면 그날부터 다시 3개월이다.

## 어드민

- 신청 수 확인, 이메일 목록 내보내기(CSV)
- "출시 안내 발송 완료" 표시(`notified_at`)

## 개인정보

- FE 신청 화면이 고지하는 내용(문구 버전 `2026-10-19`):
  - 수집 항목: 이메일 주소
  - 이용 목적: Android 앱 출시 안내 메일 발송
  - 보유 기간: 신청일로부터 3개월 (기간이 지나면 지체 없이 파기)
  - 동의를 거부할 수 있으며, 거부하면 출시 알림을 받을 수 없다
- 개인정보처리방침 v1.2(2026-10-19 공고·시행)에 같은 항목을 신설했다(§2.1(4)·§3.4·§4.2(4)·§8.2).
- 철회 요청은 개인정보 보호책임자 메일로 받아 수동 삭제로 시작해도 된다.
- 출시 안내 메일 자동 발송은 이번 범위가 아니다.
