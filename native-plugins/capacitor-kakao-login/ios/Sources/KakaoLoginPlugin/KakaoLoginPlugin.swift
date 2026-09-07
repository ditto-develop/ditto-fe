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

    /// 카카오톡에서 앱으로 돌아오는 커스텀 스킴(`kakao{앱키}://oauth`)을 SDK 로 넘긴다.
    ///
    /// **이걸 놓치면 `loginWithKakaoTalk` 은 영영 완료되지 않는다** — 카카오톡으로 넘어갔다가
    /// 돌아왔는데 아무 일도 일어나지 않는 증상이 된다.
    ///
    /// 예전에는 앱 타깃의 `SceneDelegate` 가 `import CapacitorKakaoLogin` 으로 이 플러그인을
    /// 직접 불렀는데, 그 모듈은 앱 타깃의 **전이 의존성**이라 import 가 해석되지 않는다
    /// (`unable to resolve module dependency: 'CapacitorKakaoLogin'`).
    /// Capacitor 가 열어 둔 확장점을 쓰면 앱 타깃이 이 플러그인을 알 필요가 없다.
    override public func load() {
        // 앱이 씬을 쓰므로(Info.plist UIApplicationSceneManifest) 실제로 오는 것은 scene 쪽이다.
        // 씬 없는 구성으로 되돌아갈 경우를 위해 구형 경로도 함께 듣는다. 두 번 불려도
        // 대기 중인 인증 요청이 없으면 SDK 가 그냥 false 를 돌려주므로 해롭지 않다.
        for name in [Notification.Name.capacitorSceneOpenURL, .capacitorOpenURL] {
            NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { notification in
                guard let url = Self.extractURL(from: notification) else { return }
                // queue: .main 이라 이미 메인 스레드지만, 컴파일러는 그 사실을 모른다.
                // (`MainActor.assumeIsolated` 는 iOS 17+ 라 배포 타깃 15.0 에서 못 쓴다.)
                Task { @MainActor in
                    Self.handleKakaoLoginUrl(url)
                }
            }
        }
    }

    /// `capacitorSceneOpenURL` 은 `userInfo`, 구형 `capacitorOpenURL` 은 `object` 에 담아 준다.
    private static func extractURL(from notification: Notification) -> URL? {
        if let url = notification.userInfo?["url"] as? URL { return url }
        if let payload = notification.object as? [String: Any], let url = payload["url"] as? URL { return url }
        return nil
    }

    @MainActor
    private static func handleKakaoLoginUrl(_ url: URL) {
        guard AuthApi.isKakaoTalkLoginUrl(url) else { return }
        _ = AuthController.handleOpenUrl(url: url)
    }

    /// capacitor.config.ts 의 `plugins.KakaoLogin.appKey` 를 읽어 한 번만 초기화한다.
    /// 앱 키를 JS 에서 넘기지 않는 이유: 이 앱은 원격 URL 로드라 웹 번들이 곧 공개 자산이다.
    private func initializeSdkIfNeeded() -> Bool {
        if didInitializeSdk { return true }

        guard let appKey = getConfig().getString("appKey"), !appKey.isEmpty else {
            print("[KakaoLoginPlugin] appKey 가 비어 있다 — capacitor.config.json 의 plugins.KakaoLogin.appKey 확인")
            return false
        }

        print("[KakaoLoginPlugin] SDK 초기화. appKey 앞 6자리=\(appKey.prefix(6))")
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
            let talkAvailable = UserApi.isKakaoTalkLoginAvailable()
            print("[KakaoLoginPlugin] login() 진입. isKakaoTalkLoginAvailable=\(talkAvailable)")
            if talkAvailable {
                // 카카오톡 앱으로 전환하는 간편 로그인. 이 경로가 이 작업의 목적이다.
                UserApi.shared.loginWithKakaoTalk { [weak self] token, error in
                    guard let self else { return }

                    if let error {
                        print("[KakaoLoginPlugin] loginWithKakaoTalk 실패: \(error)")

                        // 사용자가 스스로 취소한 것은 실패가 아니다. 계정 로그인으로 끌고 가면
                        // "취소했는데 또 로그인 창이 뜬다"가 된다.
                        if Self.isCancelled(error) {
                            call.reject(Self.cancelledMessage)
                            return
                        }

                        /*
                         * 설정 오류는 **폴백하지 않는다.**
                         *
                         * 계정 로그인도 같은 앱 키·같은 번들 ID 를 쓰므로 똑같이 실패한다.
                         * 폴백하면 사용자는 카카오톡에서 한 번, 웹에서 또 한 번 로그인하고도
                         * 결국 실패한다 — 2026-09-07 실기기에서 실제로 그렇게 나왔다
                         * (KOE009 "IOS bundleId validation failed", 카카오 콘솔에 iOS 플랫폼
                         * 번들 ID 미등록). 바로 실패시켜 JS 가 리다이렉트 로그인으로 넘기게 한다.
                         */
                        if Self.isMisconfigured(error) {
                            call.reject("카카오 앱 설정이 올바르지 않습니다(콘솔의 iOS 플랫폼 번들 ID 등록을 확인하세요): \(error.localizedDescription)")
                            return
                        }

                        // 그 밖의 실패(카카오톡에 로그인돼 있지 않은 상태 등)만 계정 로그인으로
                        // 폴백한다. 이 경우는 웹에서 로그인하면 실제로 풀린다.
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
        print("[KakaoLoginPlugin] loginWithKakaoAccount 로 넘어감")
        UserApi.shared.loginWithKakaoAccount { [weak self] token, error in
            guard let self else { return }

            if let error {
                print("[KakaoLoginPlugin] loginWithKakaoAccount 실패: \(error)")
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
        guard let sdkError = error as? SdkError else { return false }

        // 카카오톡 화면에서 뒤로 나온 경우.
        if sdkError.isClientFailed, sdkError.getClientError().reason == .Cancelled { return true }

        // 동의 화면에서 "취소"를 누른 경우. SDK 는 이걸 AuthFailed(.AccessDenied) 로 준다.
        // 사용자의 명시적 거절이므로 취소와 같이 다뤄야 한다 — 폴백해서 또 물으면 안 된다.
        if sdkError.isAuthFailed, sdkError.getAuthError().reason == .AccessDenied { return true }

        return false
    }

    /// 앱 키·번들 ID·콘솔 설정이 어긋나 **어느 경로로 가도 실패하는** 오류인지.
    private static func isMisconfigured(_ error: Error) -> Bool {
        guard let sdkError = error as? SdkError, sdkError.isAuthFailed else { return false }
        return sdkError.getAuthError().reason == .Misconfigured
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

/// (구 `KakaoLoginUrlHandler` 는 제거했다 — 앱 타깃이 이 모듈을 import 할 수 없어
/// 애초에 부를 수 없었다. URL 처리는 이제 위의 `load()` 가 노티피케이션으로 받는다.)
