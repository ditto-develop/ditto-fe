package pics.ditto.appsettings

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * OS 설정 앱의 디토 알림 화면을 연다.
 *
 * Android 13+ 도 알림 권한(POST_NOTIFICATIONS)을 두 번 거절하면 시스템 창이 더는 뜨지 않는다.
 * 그 사람이 알림을 다시 켤 길은 설정 앱뿐이다. 권한을 묻거나 읽는 건 `@capacitor-firebase/messaging` 몫이다.
 */
@CapacitorPlugin(name = "AppSettings")
class AppSettingsPlugin : Plugin() {

    @PluginMethod
    fun openNotificationSettings(call: PluginCall) {
        val packageName = context.packageName
        // 8.0(API 26)+ 는 앱 알림 화면으로 바로 간다. 그 아래(최소 지원 24)는 앱 정보 화면까지 간다.
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
        } else {
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

        try {
            context.startActivity(intent)
            call.resolve()
        } catch (err: ActivityNotFoundException) {
            // 제조사 설정 앱이 위 화면을 지원하지 않을 때. 앱 정보 화면으로 한 번 더 시도한다.
            try {
                context.startActivity(
                    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                )
                call.resolve()
            } catch (fallbackErr: ActivityNotFoundException) {
                call.reject("설정 화면을 열지 못했습니다.", fallbackErr)
            }
        }
    }
}
