require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# 이 프로젝트의 iOS 앱은 SPM 으로 의존성을 관리한다(ios/App/CapApp-SPM).
# 이 podspec 은 CocoaPods 로 되돌릴 때를 위한 보험이며 평소에는 쓰이지 않는다.
Pod::Spec.new do |s|
  s.name         = 'CapacitorKakaoLogin'
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']
  s.homepage     = 'https://github.com/ditto-develop/ditto-fe'
  s.author       = 'Ditto'
  s.source       = { :git => 'https://github.com/ditto-develop/ditto-fe.git', :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '15.0'
  s.swift_version = '5.9'

  s.dependency 'Capacitor'
  s.dependency 'KakaoSDKCommon'
  s.dependency 'KakaoSDKAuth'
  s.dependency 'KakaoSDKUser'
end
