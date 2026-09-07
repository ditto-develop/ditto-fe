// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorKakaoLogin",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorKakaoLogin",
            targets: ["KakaoLoginPlugin"])
    ],
// ⚠️ `branch: "main"` 을 쓰지 말 것. capacitor-swift-pm 의 main 은 릴리스 태그보다 뒤처져
// **Capacitor 6.2.2 바이너리**를 vend 한다. 브랜치 요구사항은 SPM 그래프에서 버전 요구사항을
// 덮어써서, 로컬 플러그인 하나가 main 을 물면 앱 전체가 8.5.0 대신 6.2.2 로 끌려간다
// (증상: @capacitor/status-bar 가 `.capacitorViewDidAppear` 를 못 찾고 빌드 실패).
// 퍼스트파티 플러그인들과 같은 `from: "8.0.0"` 을 쓰면 앱의 exact 핀(8.5.0)이 정한다.
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/kakao/kakao-ios-sdk", .upToNextMajor(from: "2.24.0"))
    ],
    targets: [
        .target(
            name: "KakaoLoginPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "KakaoSDKAuth", package: "kakao-ios-sdk"),
                .product(name: "KakaoSDKCommon", package: "kakao-ios-sdk"),
                .product(name: "KakaoSDKUser", package: "kakao-ios-sdk")
            ],
            path: "ios/Sources/KakaoLoginPlugin")
    ]
)
