import AuthenticationServices
import Capacitor
import CryptoKit
import Foundation

/// Sign in with Apple (iOS 네이티브).
///
/// **이 플러그인은 애플이 발급한 identityToken 을 돌려주기만 한다.** 우리 서버와의 토큰
/// 교환은 웹뷰(JS)가 한다 — 네이티브가 교환하면 `Set-Cookie: refreshToken` 이 네이티브
/// 쿠키 저장소로 들어가 웹뷰가 보지 못하고, 며칠 뒤 원인 모를 로그아웃이 난다.
/// 카카오 플러그인(`KakaoLoginPlugin`)과 같은 역할 분담이다.
///
/// nonce 는 **여기서 만든다.** 원본을 JS 로 돌려주고 애플에는 SHA-256 해시를 보낸다.
/// 서버는 받은 원본을 해시해 토큰의 `nonce` 클레임과 대조한다 — 이게 없으면 탈취한
/// identityToken 을 그대로 재사용하는 공격이 열린다.
@objc(AppleLoginPlugin)
public class AppleLoginPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleLoginPlugin"
    public let jsName = "AppleLogin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "login", returnType: CAPPluginReturnPromise)
    ]

    /// JS 가 취소를 식별하는 약속된 문자열. 바꾸면 appleLogin.ts 의 CANCELLED_MESSAGE 도 바꿔야 한다.
    fileprivate static let cancelledMessage = "USER_CANCELLED"

    /// 진행 중인 요청을 붙잡아 둔다. `ASAuthorizationController` 는 강한 참조가 없으면
    /// `performRequests()` 직후 해제되고 **델리게이트가 영영 호출되지 않는다**
    /// (증상: 애플 시트가 떴다 사라지는데 Promise 가 끝나지 않는다).
    private var activeSession: AppleLoginSession?

    @objc func login(_ call: CAPPluginCall) {
        // 인증 시트를 띄우므로 메인 스레드여야 한다.
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            if self.activeSession != nil {
                call.reject("이미 진행 중인 Apple 로그인이 있습니다.")
                return
            }

            let rawNonce = Self.makeRawNonce()
            let session = AppleLoginSession(
                call: call,
                rawNonce: rawNonce,
                anchor: self.bridge?.viewController?.view.window
            ) { [weak self] in
                self?.activeSession = nil
            }
            self.activeSession = session

            let request = ASAuthorizationAppleIDProvider().createRequest()
            // 이름·이메일은 **최초 인증 1회만** 내려온다. 이후 로그인에서는 nil 이다.
            request.requestedScopes = [.fullName, .email]
            request.nonce = Self.sha256(rawNonce)

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = session
            controller.presentationContextProvider = session
            controller.performRequests()
        }
    }

    /// 애플에 보내는 것은 이 값의 SHA-256 이고, 서버에는 이 원본이 간다.
    private static func makeRawNonce(byteCount: Int = 32) -> String {
        var bytes = [UInt8](repeating: 0, count: byteCount)
        let status = SecRandomCopyBytes(kSecRandomDefault, byteCount, &bytes)
        if status != errSecSuccess {
            // 실패해도 로그인을 막지는 않는다. UUID 두 개면 추측 저항으로 충분하다.
            return (UUID().uuidString + UUID().uuidString).replacingOccurrences(of: "-", with: "")
        }
        return bytes.map { String(format: "%02x", $0) }.joined()
    }

    private static func sha256(_ input: String) -> String {
        let digest = SHA256.hash(data: Data(input.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

/// 한 번의 인증 요청. 델리게이트 두 개를 구현하려고 분리했다.
private final class AppleLoginSession: NSObject,
    ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding {

    private let call: CAPPluginCall
    private let rawNonce: String
    private let anchor: UIWindow?
    private let onFinish: () -> Void

    init(call: CAPPluginCall, rawNonce: String, anchor: UIWindow?, onFinish: @escaping () -> Void) {
        self.call = call
        self.rawNonce = rawNonce
        self.anchor = anchor
        self.onFinish = onFinish
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        anchor ?? UIWindow()
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        defer { onFinish() }

        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            call.reject("Apple 자격증명을 읽지 못했습니다.")
            return
        }

        guard
            let identityTokenData = credential.identityToken,
            let identityToken = String(data: identityTokenData, encoding: .utf8),
            !identityToken.isEmpty
        else {
            call.reject("Apple identityToken 을 받지 못했습니다.")
            return
        }

        // 서버는 인가 코드를 교환하지 않으므로 **보내지 않는다**(BE 위키 Frontend-Apple-Login-Guide §2).
        // 그래도 여기서 꺼내 두는 이유: 애플은 계정 삭제 시 토큰 폐기(`/auth/revoke`)를 요구하는데
        // 그때 필요한 값이 이것뿐이라, 정책이 바뀌면 JS 한 줄만 고쳐 실어 보낼 수 있게 남겨 둔다.
        let authorizationCode = credential.authorizationCode
            .flatMap { String(data: $0, encoding: .utf8) }

        // 이름은 **토큰에 들어 있지 않고** 최초 1회만 여기로 온다. 이 값을 흘리면
        // 서버는 사용자 이름을 영영 받을 수 없다(재로그인에서는 nil).
        let fullName = credential.fullName.flatMap { components -> String? in
            let formatter = PersonNameComponentsFormatter()
            formatter.style = .default
            let name = formatter.string(from: components).trimmingCharacters(in: .whitespaces)
            return name.isEmpty ? nil : name
        }

        call.resolve([
            "identityToken": identityToken,
            "authorizationCode": authorizationCode as Any,
            "rawNonce": rawNonce,
            "name": fullName as Any
        ])
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        defer { onFinish() }

        // 사용자가 스스로 취소한 것은 실패가 아니다. 취소했는데 카카오 로그인 창이
        // 새로 뜨면 안 되므로 JS 가 이 문자열로 폴백을 건너뛴다.
        if let authError = error as? ASAuthorizationError, authError.code == .canceled {
            call.reject(AppleLoginPlugin.cancelledMessage)
            return
        }

        call.reject(error.localizedDescription)
    }
}
