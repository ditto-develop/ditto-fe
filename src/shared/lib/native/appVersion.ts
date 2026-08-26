import { App } from "@capacitor/app";

import { isNativeApp } from "@/shared/lib/native/platform";

/**
 * 웹에서 표시하는 버전.
 *
 * 원래 설정 화면에 `v1.0.0`으로 하드코딩돼 있던 값을 그대로 옮겨온 것이다.
 * 웹은 배포 단위에 버전 개념이 없어(정적 export, 상시 최신) 표시값을 바꾸면
 * 사용자에게 보이는 동작이 달라지므로 유지한다. 실제 빌드 버전을 노출할지는
 * 별도 결정 사항이다(INTEGRATION-TODO.md).
 */
export const WEB_APP_VERSION = "1.0.0";

/**
 * 화면에 표시할 앱 버전.
 *
 * 네이티브 셸에서는 스토어에 올라간 실제 빌드 버전을 읽는다. 원격 URL 로드라
 * 웹 번들은 상시 최신이지만 네이티브 셸은 스토어 심사를 거쳐야 갱신되므로,
 * 문의 대응 시 사용자의 셸 버전을 아는 것이 중요하다.
 *
 * 웹에서는 `WEB_APP_VERSION`을 그대로 돌려주며 기존 동작이 바뀌지 않는다.
 */
export async function getAppVersion(): Promise<string> {
    if (!isNativeApp()) return WEB_APP_VERSION;

    try {
        const info = await App.getInfo();
        // build는 스토어 제출 번호(iOS CFBundleVersion / Android versionCode)다.
        return info.build ? `${info.version} (${info.build})` : info.version;
    } catch {
        // 플러그인을 못 읽어도 설정 화면이 깨지면 안 된다.
        return WEB_APP_VERSION;
    }
}
