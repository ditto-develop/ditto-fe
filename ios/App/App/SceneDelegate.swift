import UIKit
import Capacitor
import CapacitorKakaoLogin

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // 카카오톡 간편 로그인의 복귀 URL(`kakao{앱키}://oauth`)은 카카오 SDK 가 처리해야
        // loginWithKakaoTalk 의 콜백이 완료된다. Capacitor 프록시로 넘기면 아무도 받지 않는다.
        if let url = URLContexts.first?.url, KakaoLoginUrlHandler.handle(url) {
            return
        }

        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
