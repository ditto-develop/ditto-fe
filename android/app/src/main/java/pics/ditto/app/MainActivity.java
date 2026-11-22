package pics.ditto.app;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

/**
 * 안드로이드 웹뷰의 이미지 롱프레스 저장을 막는다.
 *
 * 텍스트 선택·복사는 CSS(globals.css 의 user-select)로 막히지만, 이미지 롱프레스 저장 메뉴는
 * 웹뷰가 네이티브에서 띄우는 것이라 CSS 로는 막히지 않는다. 그래서 여기서 직접 가로챈다.
 *
 * 단, **채팅방에서 주고받은 사진은 저장할 수 있어야 한다.** 채팅 이미지는 S3 키가
 * `chat/{memberId}/{uuid}` 라 presigned URL 경로에 {@code /chat/} 가 들어가므로 그것으로 구분한다.
 * (iOS 는 -webkit-touch-callout 으로 CSS 에서 처리된다.)
 */
public class MainActivity extends BridgeActivity {

    /** 채팅 이미지 S3 키의 루트. 서버의 ChatService.IMAGE_KEY_ROOT 와 맞춰야 한다. */
    private static final String CHAT_IMAGE_PATH = "/chat/";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 브리지는 super.onCreate 안에서 만들어지고 첫 로드를 건다. 콜백은 메인 루퍼에서 나중에
        // 오므로 여기서 바꿔 끼워도 첫 로드 실패까지 이 클라이언트가 받는다.
        getBridge().setWebViewClient(new OfflineAwareWebViewClient(getBridge()));

        WebView webView = getBridge().getWebView();
        webView.setLongClickable(true);
        webView.setOnLongClickListener(view -> {
            WebView.HitTestResult result = webView.getHitTestResult();
            int type = result.getType();

            boolean isImage =
                type == WebView.HitTestResult.IMAGE_TYPE
                    || type == WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE;

            if (!isImage) {
                // 이미지가 아니면 기본 동작에 맡긴다 — 텍스트 선택은 CSS 가 이미 통제한다.
                return false;
            }

            // true 를 돌려주면 이벤트를 소비해 저장 메뉴가 뜨지 않는다.
            return !isChatImage(result.getExtra());
        });
    }

    /**
     * 화면을 떠날 때 웹뷰 쿠키를 디스크에 쓴다. 이게 없으면 가끔 로그인이 풀린다.
     *
     * 서버는 refresh 할 때마다 refresh 토큰을 새로 내려주고(`Set-Cookie`), 옛 토큰은 30초만 더
     * 받아 준다(서버 ADR 0034). 그런데 웹뷰는 새 쿠키를 한동안 메모리에만 두었다가 나중에
     * 디스크에 쓰고, Capacitor 도 이 시점에 flush 하지 않는다. 앱을 열자마자 refresh 가 돌고
     * (콜드 스타트는 늘 refresh 한다) 잠깐 보고 나간 사이 OS 가 프로세스를 정리하면 디스크에는 옛
     * 쿠키만 남는다. 다음 실행은 그 옛 쿠키로 refresh 해 2002(만료)를 받고 FE 가 토큰을 지운다 —
     * "나갔다 들어오면 로그인이 풀려 있다"(2026-11-23 조사, 운영 로그의 2002 묶음).
     *
     * onPause 가 아니라 onStop 이다. 프로세스는 onStop 이 돌아온 뒤부터 정리될 수 있으므로 그 전에
     * 끝내면 충분하고, onPause 는 알림 창을 내리는 것만으로도 불려 디스크 쓰기를 둘 자리가 아니다.
     * flush() 는 쓰기가 끝날 때까지 막는데, 그래야 돌아온 직후 정리돼도 쿠키가 남는다.
     *
     * 막지 못하는 경우: 백그라운드로 간 **뒤에** 도착한 refresh 응답의 쿠키. 그건 서버가 옛 토큰을
     * 더 오래 받아 주는 쪽(BE)에서 막아야 한다.
     */
    @Override
    public void onStop() {
        super.onStop();
        CookieManager.getInstance().flush();
    }

    private boolean isChatImage(String url) {
        return url != null && url.contains(CHAT_IMAGE_PATH);
    }

    /**
     * "연결할 수 없어요"(public/app-offline.html) 화면에 실패 정보를 넘기는 웹뷰 클라이언트.
     *
     * Capacitor 8.5.0 의 {@code BridgeWebViewClient.onReceivedError} 는 메인 프레임 로드가 실패하면
     * errorPath 를 그대로 열어, 화면은 무슨 실패였는지 모른다. 원본을 먼저 부른 뒤(리스너 알림은 원본만
     * 할 수 있다 — 목록 접근자가 패키지 전용이다) 에러 코드·설명·실패 주소를 쿼리로 붙인 주소로 곧바로
     * 덮는다. 오프라인 화면이 이 값을 Faro 로 보낸다. iOS 는 SceneDelegate.swift 의
     * OfflineAwareNavigationDelegate 가 같은 일을 한다.
     *
     * iOS 와 달리 안드로이드 웹뷰는 다른 이동이 끼어든 취소를 이 콜백으로 보내지 않아 거르지 않는다.
     */
    private static final class OfflineAwareWebViewClient extends BridgeWebViewClient {

        private final Bridge bridge;

        OfflineAwareWebViewClient(Bridge bridge) {
            super(bridge);
            this.bridge = bridge;
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);

            String errorUrl = bridge.getErrorUrl();
            if (errorUrl == null || !request.isForMainFrame()) return;

            Uri failing = request.getUrl();
            Uri.Builder target = Uri.parse(errorUrl).buildUpon()
                .appendQueryParameter("code", String.valueOf(error.getErrorCode()))
                .appendQueryParameter("domain", "android.webkit")
                .appendQueryParameter("desc", String.valueOf(error.getDescription()));
            if (failing != null) {
                // 실패 주소의 쿼리에는 OAuth code 같은 값이 실릴 수 있다. 경로까지만 넘긴다.
                target.appendQueryParameter("url", failing.buildUpon().clearQuery().fragment(null).build().toString());
            }
            view.loadUrl(target.build().toString());
        }
    }
}
