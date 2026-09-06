package pics.ditto.kakaologin

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.kakao.sdk.auth.model.OAuthToken
import com.kakao.sdk.common.KakaoSdk
import com.kakao.sdk.common.model.ClientError
import com.kakao.sdk.common.model.ClientErrorCause
import com.kakao.sdk.user.UserApiClient

/**
 * 카카오 네이티브 SDK 로그인.
 *
 * **이 플러그인은 카카오 accessToken 을 돌려주기만 한다.** 우리 서버와의 토큰 교환은
 * 웹뷰(JS)가 한다 — 네이티브가 교환하면 `Set-Cookie: refreshToken` 이 네이티브 쿠키
 * 저장소로 들어가 웹뷰가 보지 못하고, 며칠 뒤 원인 모를 로그아웃이 난다.
 */
@CapacitorPlugin(name = "KakaoLogin")
class KakaoLoginPlugin : Plugin() {

    private companion object {
        /** JS 가 취소를 식별하는 약속된 문자열. kakaoLogin.ts 의 CANCELLED_MESSAGE 와 같아야 한다. */
        const val CANCELLED_MESSAGE = "USER_CANCELLED"
    }

    private var didInitializeSdk = false

    /**
     * capacitor.config.ts 의 `plugins.KakaoLogin.appKey` 를 읽어 한 번만 초기화한다.
     * 앱 키를 JS 에서 넘기지 않는 이유: 이 앱은 원격 URL 로드라 웹 번들이 곧 공개 자산이다.
     */
    private fun initializeSdkIfNeeded(): Boolean {
        if (didInitializeSdk) return true

        val appKey = config.getString("appKey")
        if (appKey.isNullOrEmpty()) return false

        KakaoSdk.init(context, appKey)
        didInitializeSdk = true
        return true
    }

    @PluginMethod
    fun login(call: PluginCall) {
        if (!initializeSdkIfNeeded()) {
            call.reject("카카오 네이티브 앱 키가 설정되지 않았습니다(capacitor.config.ts plugins.KakaoLogin.appKey).")
            return
        }

        // 카카오 SDK 의 로그인 진입점은 UI 를 띄우므로 메인 스레드에서 불러야 한다.
        activity.runOnUiThread {
            if (UserApiClient.instance.isKakaoTalkLoginAvailable(context)) {
                // 카카오톡 앱으로 전환하는 간편 로그인. 이 경로가 이 작업의 목적이다.
                UserApiClient.instance.loginWithKakaoTalk(activity) { token, error ->
                    when {
                        // 사용자가 스스로 취소한 것은 실패가 아니다. 계정 로그인으로 끌고 가면
                        // "취소했는데 또 로그인 창이 뜬다"가 된다.
                        isCancelled(error) -> call.reject(CANCELLED_MESSAGE)
                        // 그 밖의 실패(카카오톡 미로그인 상태 등)는 계정 로그인으로 폴백한다.
                        error != null -> loginWithAccount(call)
                        else -> resolve(call, token)
                    }
                }
            } else {
                loginWithAccount(call)
            }
        }
    }

    /** 카카오계정(웹) 로그인. 카카오톡이 없거나 간편 로그인이 실패했을 때 쓴다. */
    private fun loginWithAccount(call: PluginCall) {
        UserApiClient.instance.loginWithKakaoAccount(context) { token, error ->
            when {
                isCancelled(error) -> call.reject(CANCELLED_MESSAGE)
                error != null -> call.reject(error.message ?: "카카오 로그인에 실패했습니다.")
                else -> resolve(call, token)
            }
        }
    }

    private fun resolve(call: PluginCall, token: OAuthToken?) {
        val accessToken = token?.accessToken
        if (accessToken.isNullOrEmpty()) {
            call.reject("카카오 accessToken 을 받지 못했습니다.")
            return
        }

        // refreshToken 은 일부러 넘기지 않는다. 우리 서버가 쓰는 것은 accessToken 하나뿐이고,
        // 카카오 refreshToken 은 SDK 가 기기 안에서 관리한다.
        call.resolve(JSObject().put("accessToken", accessToken))
    }

    private fun isCancelled(error: Throwable?): Boolean =
        error is ClientError && error.reason == ClientErrorCause.Cancelled

    /** 카카오 세션만 끊는다. 우리 서비스 세션(JWT/refreshToken)과는 무관하다. */
    @PluginMethod
    fun logout(call: PluginCall) {
        if (!initializeSdkIfNeeded()) {
            call.resolve()
            return
        }

        UserApiClient.instance.logout { error ->
            if (error != null) call.reject(error.message ?: "카카오 로그아웃에 실패했습니다.") else call.resolve()
        }
    }
}
