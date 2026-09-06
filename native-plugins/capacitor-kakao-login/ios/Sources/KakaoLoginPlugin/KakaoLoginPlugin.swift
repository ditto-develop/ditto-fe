import Capacitor
import Foundation
import KakaoSDKAuth
import KakaoSDKCommon
import KakaoSDKUser

/// 카카오 네이티브 SDK 로그인.
///
/// **이 플러그인은 카카오 accessToken 을 돌려주기만 한다.** 우리 서버와의 토큰 교환은
/// 웹뷰(JS)가 한다 — 네이티브가 교환하면 `Set-Cookie: refreshToken` 이 네이티브 쿠키
/// 저장소로 들어가 웹뷰가 보지 못하고, 며칠 뒤 원인 모를 로그아웃이 난다.
@objc(KakaoLoginPlugin)
public class KakaoLoginPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KakaoLoginPlugin"
    public let jsName = "KakaoLogin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "login", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logout", returnType: CAPPluginReturnPromise)
    ]

    /// JS 가 취소를 식별하는 약속된 문자열. 바꾸면 kakaoLogin.ts 의 CANCELLED_MESSAGE 도 바꿔야 한다.
    private static let cancelledMessage = "USER_CANCELLED"

    private var didInitializeSdk = false

    /// capacitor.config.ts 의 `plugins.KakaoLogin.appKey` 를 읽어 한 번만 초기화한다.
    /// 앱 키를 JS 에서 넘기지 않는 이유: 이 앱은 원격 URL 로드라 웹 번들이 곧 공개 자산이다.
    private func initializeSdkIfNeeded() -> Bool {
        if didInitializeSdk { return true }

        guard let appKey = getConfig().getString("appKey"), !appKey.isEmpty else {
            return false
        }

        KakaoSDK.initSDK(appKey: appKey)
        didInitializeSdk = true
        return true
    }

    @objc func login(_ call: CAPPluginCall) {
        guard initializeSdkIfNeeded() else {
            call.reject("카카오 네이티브 앱 키가 설정되지 않았습니다(capacitor.config.ts plugins.KakaoLogin.appKey).")
            return
        }

        // 카카오 SDK 의 로그인 진입점은 UI 를 띄우므로 메인 스레드에서 불러야 한다.
        DispatchQueue.main.async {
            if UserApi.isKakaoTalkLoginAvailable() {
                // 카카오톡 앱으로 전환하는 간편 로그인. 이 경로가 이 작업의 목적이다.
                UserApi.shared.loginWithKakaoTalk { [weak self] token, error in
                    guard let self else { return }

                    if let error {
                        // 사용자가 스스로 취소한 것은 실패가 아니다. 계정 로그인으로 끌고 가면
                        // "취소했는데 또 로그인 창이 뜬다"가 된다.
                        if Self.isCancelled(error) {
                            call.reject(Self.cancelledMessage)
                            return
                        }
                        // 그 밖의 실패(카카오톡 미로그인 상태 등)는 계정 로그인으로 폴백한다.
                        self.loginWithAccount(call)
                        return
                    }

                    self.resolve(call, token: token)
                }
            } else {
                self.loginWithAccount(call)
            }
        }
    }

    /// 카카오계정(웹) 로그인. 카카오톡이 없거나 간편 로그인이 실패했을 때 쓴다.
    private func loginWithAccount(_ call: CAPPluginCall) {
        UserApi.shared.loginWithKakaoAccount { [weak self] token, error in
            guard let self else { return }

            if let error {
                if Self.isCancelled(error) {
                    call.reject(Self.cancelledMessage)
                } else {
                    call.reject(error.localizedDescription)
                }
                return
            }

            self.resolve(call, token: token)
        }
    }

    private func resolve(_ call: CAPPluginCall, token: OAuthToken?) {
        guard let accessToken = token?.accessToken, !accessToken.isEmpty else {
            call.reject("카카오 accessToken 을 받지 못했습니다.")
            return
        }

        // refreshToken 은 일부러 넘기지 않는다. 우리 서버가 쓰는 것은 accessToken 하나뿐이고,
        // 카카오 refreshToken 은 SDK 가 기기 안에서 관리한다.
        call.resolve(["accessToken": accessToken])
    }

    private static func isCancelled(_ error: Error) -> Bool {
        guard let sdkError = error as? SdkError, sdkError.isClientFailed else { return false }
        return sdkError.getClientError().reason == .Cancelled
    }

    /// 카카오 세션만 끊는다. 우리 서비스 세션(JWT/refreshToken)과는 무관하다.
    @objc func logout(_ call: CAPPluginCall) {
        guard initializeSdkIfNeeded() else {
            call.resolve()
            return
        }

        UserApi.shared.logout { error in
            if let error {
                call.reject(error.localizedDescription)
            } else {
                call.resolve()
            }
        }
    }
}

/// 카카오톡에서 앱으로 돌아오는 커스텀 스킴(`kakao{앱키}://oauth`)을 SDK 로 넘긴다.
///
/// **SceneDelegate 가 이걸 부르지 않으면 `loginWithKakaoTalk` 은 영영 완료되지 않는다**
/// — 카카오톡으로 넘어갔다가 앱으로 돌아왔는데 아무 일도 일어나지 않는 증상이 된다.
/// 앱 타깃이 카카오 SDK 를 직접 import 하지 않도록 여기서 감싸 둔다.
@objc public class KakaoLoginUrlHandler: NSObject {
    @objc public static func handle(_ url: URL) -> Bool {
        guard AuthApi.isKakaoTalkLoginUrl(url) else { return false }
        return AuthController.handleOpenUrl(url: url)
    }
}
