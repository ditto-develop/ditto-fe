package pics.ditto.app;

import android.net.Uri;
import android.os.Bundle;
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
