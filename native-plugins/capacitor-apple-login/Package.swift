// swift-tools-version: 5.9
import PackageDescription

/// 카카오 플러그인과 달리 **외부 의존성이 없다.** Sign in with Apple 은 OS 프레임워크
/// (AuthenticationServices)라 SPM 으로 내려받을 것이 없다.
let package = Package(
    name: "CapacitorAppleLogin",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorAppleLogin",
            targets: ["AppleLoginPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")
    ],
    targets: [
        .target(
            name: "AppleLoginPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/AppleLoginPlugin")
    ]
)
