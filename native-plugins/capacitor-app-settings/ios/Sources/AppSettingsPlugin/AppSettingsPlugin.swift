import Capacitor
import Foundation
import UIKit

/// OS 설정 앱의 디토 알림 화면을 연다.
///
/// 왜 필요한가: iOS 시스템 알림 권한 창은 **앱 설치당 한 번만** 뜬다. 한 번 "허용 안 함"을 고른
/// 사람에게 `requestPermissions()` 를 다시 불러도 창 없이 거절 결과만 돌아온다. 그 사람이 알림을
/// 다시 켤 길은 설정 앱뿐이라, 화면의 버튼이 그곳으로 바로 보내 준다.
///
/// 권한을 묻거나 읽지 않는다 — 그건 `@capacitor-firebase/messaging` 이 한다
/// (src/shared/lib/native/pushNotifications.ts). 돌아온 뒤 토큰 재등록도 그쪽 `appStateChange` 가 맡는다.
@objc(AppSettingsPlugin)
public class AppSettingsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppSettingsPlugin"
    public let jsName = "AppSettings"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "openNotificationSettings", returnType: CAPPluginReturnPromise)
    ]

    @objc func openNotificationSettings(_ call: CAPPluginCall) {
        // UIApplication.open 은 메인 스레드에서 불러야 한다.
        DispatchQueue.main.async {
            guard let url = Self.settingsURL() else {
                call.reject("설정 화면 주소를 만들지 못했습니다.")
                return
            }
            UIApplication.shared.open(url, options: [:]) { opened in
                if opened {
                    call.resolve()
                } else {
                    call.reject("설정 화면을 열지 못했습니다.")
                }
            }
        }
    }

    /// iOS 16+ 는 알림 화면으로 바로 간다. 그 아래(최소 지원 15)는 앱 설정 화면까지 가고, 거기서 "알림"을 누른다.
    private static func settingsURL() -> URL? {
        if #available(iOS 16.0, *) {
            return URL(string: UIApplication.openNotificationSettingsURLString)
        }
        return URL(string: UIApplication.openSettingsURLString)
    }
}
