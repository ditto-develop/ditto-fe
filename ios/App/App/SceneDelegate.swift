import UIKit
import Capacitor

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
