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
    /** 웹뷰 navigationDelegate 를 감싼 프록시. WKWebView 는 delegate 를 weak 로 들어서 여기서 붙잡는다. */
    private var offlineAwareDelegate: OfflineAwareNavigationDelegate?

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        // loadView() 안, 첫 로드(viewDidLoad 의 loadWebView) 전에 불린다 — 첫 실행 실패도 잡힌다.
        guard let webView = webView, let original = webView.navigationDelegate else { return }
        let proxy = OfflineAwareNavigationDelegate(original: original) { [weak self] in
            self?.bridge?.config.errorPathURL
        }
        offlineAwareDelegate = proxy
        webView.navigationDelegate = proxy
    }

    override func viewDidLoad() {
        // 웹뷰는 loadView() 에서 만들어지므로 이 시점에는 이미 존재한다.
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = true
    }
}

/**
 * "연결할 수 없어요"(public/app-offline.html) 화면으로 보낼지 Capacitor 대신 정하는 navigationDelegate 프록시.
 *
 * Capacitor 8.5.0 의 `WebViewDelegationHandler` 는 메인 문서 로드가 실패하면 **에러 종류를 가리지 않고**
 * errorPath 를 연다. 두 가지가 문제였다:
 *   1. 취소(NSURLErrorCancelled, -999)·이동 중단(WebKit 102)도 실패로 친다. 로드 도중 다른 이동이
 *      끼어들면 생기는 값이라 실제로는 다음 이동이 이어지는데, 사용자는 멀쩡한 망에서 에러 화면을 본다.
 *   2. 무슨 실패였는지 화면에 넘기지 않아 원인을 알 수 없다.
 * 그래서 1은 무시하고(로그만), 나머지는 에러 코드·도메인·실패 주소를 쿼리로 붙여 연다. 오프라인
 * 화면이 이 값을 Faro 로 보낸다.
 *
 * Capacitor 의 delegate 는 브리지 동작(리셋·허용 도메인·외부 링크 열기 등)을 전부 쥐고 있어 교체하면 안 된다.
 * 실패 두 메서드만 가로채고 나머지 셀렉터는 전부 원본으로 넘긴다(`responds(to:)` + `forwardingTarget`).
 * 원본은 브리지가 강하게 들고 있다 — 여기서는 weak 로만 본다.
 *
 * `CAPBridgeViewController.loadView()` 가 final 이라 delegate 를 만드는 자리를 바꿀 수 없어서
 * capacitorDidLoad() 에서 감싼다. Capacitor 를 올릴 때 위 두 메서드의 동작이 바뀌었는지 확인할 것.
 */
final class OfflineAwareNavigationDelegate: NSObject, WKNavigationDelegate {
    private weak var original: WKNavigationDelegate?
    private let errorPathURL: () -> URL?

    init(original: WKNavigationDelegate, errorPathURL: @escaping () -> URL?) {
        self.original = original
        self.errorPathURL = errorPathURL
        super.init()
    }

    override func responds(to aSelector: Selector!) -> Bool {
        super.responds(to: aSelector) || (original?.responds(to: aSelector) ?? false)
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        if let original = original, original.responds(to: aSelector) { return original }
        return super.forwardingTarget(for: aSelector)
    }

    // 커밋된 뒤의 실패. 원본은 첫 로드였다면 웹뷰 불투명도를 되돌린다(내부 상태라 여기서 흉내 낼 수 없다).
    // 그래서 원본을 먼저 부르고, 원본이 연 에러 화면을 정보가 붙은 주소로 곧바로 덮는다. 덮으면서 원본의
    // 이동은 취소(-999)로 끝나고 아래에서 무시된다.
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if Self.isInterruption(error) {
            // 취소는 다음 이동이 이어진다는 뜻이다. 첫 로드의 불투명도도 그 이동의 didFinish 가 되돌린다.
            CAPLog.print("⚡️  WebView navigation interrupted (ignored): \(error.localizedDescription)")
            return
        }
        original?.webView?(webView, didFail: navigation, withError: error)
        showOfflinePage(in: webView, for: error)
    }

    // 커밋 전 실패(망 없음·DNS·시간 초과 등). 원본은 에러 화면을 열고 로그만 남기므로 통째로 대신한다.
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if Self.isInterruption(error) {
            CAPLog.print("⚡️  WebView provisional navigation interrupted (ignored): \(error.localizedDescription)")
            return
        }
        CAPLog.print("⚡️  WebView failed provisional navigation: \(error.localizedDescription)")
        showOfflinePage(in: webView, for: error)
    }

    private func showOfflinePage(in webView: WKWebView, for error: Error) {
        guard let base = errorPathURL(), var components = URLComponents(url: base, resolvingAgainstBaseURL: false) else {
            return
        }
        let nsError = error as NSError
        var items = [
            URLQueryItem(name: "code", value: String(nsError.code)),
            URLQueryItem(name: "domain", value: nsError.domain),
        ]
        if let failing = nsError.userInfo[NSURLErrorFailingURLStringErrorKey] as? String {
            // 실패 주소의 쿼리에는 OAuth code 같은 값이 실릴 수 있다. 경로까지만 넘긴다.
            items.append(URLQueryItem(name: "url", value: failing.components(separatedBy: CharacterSet(charactersIn: "?#")).first))
        }
        components.queryItems = items
        if let url = components.url {
            webView.load(URLRequest(url: url))
        }
    }

    /** 다른 이동이 끼어들어 끊긴 로드인지. 실패가 아니라 다음 이동으로 이어진다. */
    private static func isInterruption(_ error: Error) -> Bool {
        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled { return true }
        // WebKitErrorFrameLoadInterruptedByPolicyChange. WebKit 이 공개 상수로 내보내지 않아 값으로 비교한다.
        if nsError.domain == "WebKitErrorDomain" && nsError.code == 102 { return true }
        return false
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
