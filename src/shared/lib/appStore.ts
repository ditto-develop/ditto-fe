/**
 * 스토어 주소. 웹 다운로드 안내 화면(/download)이 연다.
 *
 * iPhone 의 Safari 에서 이 https 주소를 열면 App Store 앱의 디토 페이지로 바로 넘어간다.
 */
export const APP_STORE_URL = "https://apps.apple.com/kr/app/%EB%94%94%ED%86%A0/id6809342012";

/**
 * Google Play 주소. 패키지명(`pics.ditto.app`)으로 정해지므로 출시 전에도 주소는 확정이다.
 * Android 폰의 브라우저에서 열면 Play 스토어 앱의 디토 페이지로 넘어간다.
 */
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=pics.ditto.app";

/**
 * Play 스토어에 공개 출시됐는지. 출시 전에는 Google Play 버튼 대신 출시 알림 신청(/download/android)을 보여 준다.
 *
 * 켜는 법은 다른 플래그와 같다: 배포 워크플로 deploy 잡의 Build 스텝 `env:` 에
 * `NEXT_PUBLIC_PLAY_STORE_RELEASED: 'true'`. **프로덕션 트랙 공개가 끝난 뒤에** 켠다 — 그 전에는
 * 주소가 "찾을 수 없음"을 보여 준다(docs/play-store-submission.md).
 */
export function isPlayStoreReleased(): boolean {
  return process.env.NEXT_PUBLIC_PLAY_STORE_RELEASED === "true";
}
