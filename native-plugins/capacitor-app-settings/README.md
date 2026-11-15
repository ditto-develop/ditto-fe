# capacitor-app-settings

디토 전용 로컬 플러그인. OS 설정 앱의 **디토 알림 화면**을 연다. 메서드는 하나다.

```ts
AppSettings.openNotificationSettings(): Promise<void>
```

| 플랫폼 | 여는 화면 |
|---|---|
| iOS 16+ | 설정 > 디토 > 알림 (`UIApplication.openNotificationSettingsURLString`) |
| iOS 15 | 설정 > 디토 (`openSettingsURLString`) |
| Android 8.0+ | 앱 알림 설정 (`ACTION_APP_NOTIFICATION_SETTINGS`) |
| Android 7.x | 앱 정보 (`ACTION_APPLICATION_DETAILS_SETTINGS`) |

## 왜

iOS 시스템 알림 권한 창은 앱 설치당 한 번만 뜬다. Android 13+ 도 두 번 거절하면 더는 뜨지 않는다.
거절한 사람이 알림을 다시 켤 길은 설정 앱뿐이라, 퀴즈 완료 화면의 "알림 받기"가 이 플러그인으로 그곳을 연다.

JS 쪽 진입점은 `src/shared/lib/native/pushNotifications.ts` 의 `requestPushPermission()` 이다.
플러그인이 없는 옛 앱 바이너리에서는 `Capacitor.isPluginAvailable("AppSettings")` 가 false 라 버튼 대신
"설정 > 디토 > 알림" 안내 문구를 보여 준다. 원격 URL 로드라 웹 코드는 옛 앱에서도 돈다.

권한 읽기·요청과 설정에서 돌아온 뒤 토큰 재등록은 `@capacitor-firebase/messaging` 과
`pushNotifications.ts` 의 `appStateChange` 리스너가 맡는다. 이 플러그인은 화면을 열기만 한다.
