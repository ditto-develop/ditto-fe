import UIKit
import WebKit
import Capacitor

/**
 * 웹뷰에 iOS 기본 뒤로가기 제스처(화면 왼쪽 끝에서 오른쪽으로 스와이프)를 붙인다.
 *
 * `WKWebView.allowsBackForwardNavigationGestures` 는 **기본값이 false** 이고,
 * Capacitor 는 이 값을 켜 주지도 `capacitor.config.ts` 키로 노출하지도 않는다
 * (8.5.0 의 `CAPInstanceDescriptor` 가 읽는 `ios.*` 키 목록에 없다). iOS 에는
 * 하드웨어 뒤로가기 버튼도 없으므로, 켜 주지 않으면 **이 앱에는 OS 수준 뒤로가기가
 * 아예 없다** — Android 는 `appShell.ts` 의 `backButton` 리스너가 담당한다.
 *
 * 별도 파일로 빼지 않고 여기 둔 이유: 이 Xcode 프로젝트는 파일을 자동 동기화하지
 * 않아(`objectVersion = 60`, 명시적 파일 참조) 새 .swift 를 추가하면 project.pbxproj
 * 까지 손대야 한다. 이미 빌드에 포함된 이 파일에 두면 그 손질이 필요 없다.
 *
 * 루트 뷰 컨트롤러가 만들어지는 경로가 둘이라 **양쪽 다** 이 클래스를 가리켜야 한다:
 * 아래 `scene(_:willConnectTo:)` 가 직접 만드는 것과, Info.plist 의
 * `UISceneStoryboardFile`(= Main.storyboard) 이 UIKit 에 만들게 하는 것. 한쪽만
 * 바꾸면 실제로 보이는 웹뷰가 반대쪽일 때 제스처가 조용히 안 붙는다.
 *
 * 참고: 웹뷰 히스토리는 우리 화면만 담고 있지 않다(리다이렉트 로그인은
 * kauth.kakao.com 을 웹뷰에서 직접 연다). 그쪽으로 되돌아가는 것을 막는 처리는
 * Android 처럼 JS 에서 가로챌 수 없어 — 이 제스처는 네이티브가 처리한다 —
 * `ROOT_PATHS` 같은 방어가 iOS 에는 적용되지 않는다.
 */
final class MainViewController: CAPBridgeViewController {
    /// `navigationDelegate` 는 weak 라 여기서 붙잡아 둔다. 놓치면 바로 해제되고 Capacitor 처리까지 같이 끊긴다.
    private var navigationProxy: CancelTolerantNavigationDelegate?

    override func viewDidLoad() {
        // 웹뷰는 loadView() 에서 만들어지므로 이 시점에는 이미 존재한다.
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = true

        if let webView, let original = webView.navigationDelegate {
            let proxy = CancelTolerantNavigationDelegate(wrapping: original)
            navigationProxy = proxy
            webView.navigationDelegate = proxy
        }
    }
}

/**
 * 문서 로드가 **취소**로 끝났을 때 Capacitor 가 오프라인 화면(`app-offline.html`)을 띄우지 않게 한다.
 *
 * Capacitor 의 `WebViewDelegationHandler` 는 `didFail` · `didFailProvisionalNavigation` 에서 에러 종류를 보지
 * 않고 `server.errorPath` 를 연다(node_modules/@capacitor/ios/.../WebViewDelegationHandler.swift). 그런데
 * iOS 는 "다른 이동에 밀려 취소됨"(NSURLErrorCancelled, -999)도 이 콜백으로 알린다. 그래서 망이 멀쩡해도
 * 푸시 탭·뒤로가기처럼 문서가 바뀌는 순간에 이동이 겹치면 "연결할 수 없어요"가 떴다(2026-10-26, 2026-11 QA).
 * 취소된 이동은 그 뒤의 이동이 이어 받으므로 오류 화면을 띄울 이유가 없다.
 *
 * 걸러 내는 것은 두 가지뿐이다. 나머지(실제 오프라인·DNS·타임아웃 등)는 그대로 Capacitor 가 처리한다.
 *  - NSURLErrorCancelled(-999): 다른 이동이 끼어들어 취소됨
 *  - WebKitErrorFrameLoadInterruptedByPolicyChange(102): 이동 정책이 로드를 멈춤(외부 앱으로 연 링크 등)
 *
 * Capacitor 는 핸들러를 `loadView()` 안에서 private 하게 만들어 갈아 끼울 수 없다. 그래서 감싼다 — 위 두 콜백만
 * 여기서 받고, 나머지 `WKNavigationDelegate` 메서드는 `forwardingTarget(for:)` 로 원래 핸들러에 그대로 넘긴다.
 * WebKit 은 델리게이트를 붙일 때 `responds(to:)` 로 메서드 목록을 한 번 읽어 두므로 그 답도 원래 핸들러를 따른다.
 */
final class CancelTolerantNavigationDelegate: NSObject, WKNavigationDelegate {
    private let wrapped: WKNavigationDelegate

    init(wrapping wrapped: WKNavigationDelegate) {
        self.wrapped = wrapped
        super.init()
    }

    override func responds(to aSelector: Selector!) -> Bool {
        super.responds(to: aSelector) || wrapped.responds(to: aSelector)
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        wrapped.responds(to: aSelector) ? wrapped : super.forwardingTarget(for: aSelector)
    }

    static func isCancellation(_ error: Error) -> Bool {
        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled { return true }
        // WebKitErrorFrameLoadInterruptedByPolicyChange. 상수가 공개 헤더에 없어 값으로 비교한다.
        if nsError.domain == "WebKitErrorDomain" && nsError.code == 102 { return true }
        return false
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if Self.isCancellation(error) {
            CAPLog.print("⚡️  Ignored cancelled provisional navigation (no offline page): \(error.localizedDescription)")
            return
        }
        wrapped.webView?(webView, didFailProvisionalNavigation: navigation, withError: error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if Self.isCancellation(error) {
            CAPLog.print("⚡️  Ignored cancelled navigation (no offline page): \(error.localizedDescription)")
            return
        }
        wrapped.webView?(webView, didFail: navigation, withError: error)
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // 카카오톡 간편 로그인의 복귀 URL(`kakao{앱키}://oauth`)도 그냥 프록시로 넘긴다.
        //
        // 프록시가 `.capacitorSceneOpenURL` 을 post 하고 KakaoLoginPlugin 이 그걸 듣는다.
        // 예전에는 여기서 `import CapacitorKakaoLogin` 으로 플러그인을 직접 불렀는데,
        // 그 모듈은 앱 타깃의 전이 의존성이라 **import 자체가 해석되지 않는다**
        // (`unable to resolve module dependency`). 앱 타깃은 플러그인을 몰라야 한다.
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
