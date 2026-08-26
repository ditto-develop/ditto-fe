import { loadKakaoMaps } from "@/shared/lib/kakao-maps";

/**
 * 만남 장소 검색.
 *
 * **BE 프록시가 없다** — 카카오 지도 JS SDK의 `services` 라이브러리를 브라우저에서 직접 쓴다
 * (BE 위키 Frontend-Vote-Guide, "서버가 담당하지 않는 것"). SDK 로더가 이미
 * `libraries=services`로 불러오고 있어 추가 스크립트가 필요 없다.
 *
 * 도메인 등록(ditto.pics)이 걸린 키라 앱 웹뷰에서도 그대로 동작한다(원격 URL 로드 방식).
 */

/** 검색 결과 1건. 투표 생성 요청의 장소 선택지로 그대로 옮겨 담을 수 있는 형태다. */
export type PlaceSearchResult = {
  id: string;
  name: string;
  address: string;
  mapUrl: string;
  latitude?: number;
  longitude?: number;
};

/** 카카오 로컬 API 상한이 15다. */
const MAX_RESULTS = 15;

function toNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPlaceSearchResult(place: KakaoPlaceSearchResult): PlaceSearchResult {
  return {
    id: place.id,
    name: place.place_name,
    // 도로명이 없는 장소가 있어 지번 주소로 폴백한다.
    address: place.road_address_name || place.address_name,
    mapUrl: place.place_url,
    // x가 경도, y가 위도다. 문자열로 오므로 숫자로 좁힌다.
    longitude: toNumber(place.x),
    latitude: toNumber(place.y),
  };
}

/**
 * 키워드로 장소를 찾는다. 결과가 없으면 빈 배열이고, SDK 오류만 reject 한다.
 * 호출부가 디바운스를 담당한다.
 */
export async function searchPlaces(keyword: string): Promise<PlaceSearchResult[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const maps = await loadKakaoMaps();

  return new Promise<PlaceSearchResult[]>((resolve, reject) => {
    const places = new maps.services.Places();

    places.keywordSearch(
      trimmed,
      (result, status) => {
        if (status === maps.services.Status.OK) {
          resolve(result.map(toPlaceSearchResult));
          return;
        }
        // 결과 없음은 오류가 아니다 — 화면은 '검색 결과가 없어요'를 그린다.
        if (status === maps.services.Status.ZERO_RESULT) {
          resolve([]);
          return;
        }
        reject(new Error("장소를 검색하지 못했어요."));
      },
      { size: MAX_RESULTS },
    );
  });
}
