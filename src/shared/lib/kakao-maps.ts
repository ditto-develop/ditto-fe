let kakaoMapsPromise: Promise<KakaoMapsNamespace> | null = null;

const KAKAO_MAPS_SCRIPT_ID = "kakao-maps-sdk";

function getLoadedKakaoMaps(): KakaoMapsNamespace | null {
  if (typeof window === "undefined") return null;
  return window.kakao?.maps ?? null;
}

export function loadKakaoMaps(): Promise<KakaoMapsNamespace> {
  const loadedMaps = getLoadedKakaoMaps();

  if (loadedMaps) {
    return new Promise((resolve) => {
      loadedMaps.load(() => resolve(loadedMaps));
    });
  }

  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("카카오 지도는 브라우저에서만 사용할 수 있습니다."));
      return;
    }

    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!appKey) {
      reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY가 설정되어 있지 않습니다."));
      return;
    }

    const handleLoad = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."));
        return;
      }

      maps.load(() => resolve(maps));
    };

    const existingScript = document.getElementById(KAKAO_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("카카오 지도 SDK를 불러오지 못했습니다.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_MAPS_SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("카카오 지도 SDK를 불러오지 못했습니다.")), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return kakaoMapsPromise;
}
