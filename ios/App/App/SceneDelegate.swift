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
    override func viewDidLoad() {
        // 웹뷰는 loadView() 에서 만들어지므로 이 시점에는 이미 존재한다.
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = true
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
