// swift-tools-version: 5.9
import PackageDescription

/// 외부 의존성이 없다. 설정 앱을 여는 건 UIKit 의 `UIApplication.open` 하나다.
let package = Package(
    name: "CapacitorAppSettings",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorAppSettings",
            targets: ["AppSettingsPlugin"])
    ],
// ⚠️ `branch: "main"` 을 쓰지 말 것 — capacitor-apple-login/Package.swift 의 같은 주석 참고.
// main 은 6.2.2 바이너리를 vend 해서 앱 전체가 8.5.0 대신 6.2.2 로 끌려간다.
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "AppSettingsPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/AppSettingsPlugin")
    ]
)
