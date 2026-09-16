package pics.ditto.app;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

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
}
