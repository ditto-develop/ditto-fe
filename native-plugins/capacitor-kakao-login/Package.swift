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
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main"),
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
