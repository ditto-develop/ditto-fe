declare global {
  type KakaoMapEventHandler = () => void;

  interface KakaoMapListener {
    readonly __kakaoMapListener: unique symbol;
  }

  interface KakaoLatLng {
    getLat(): number;
    getLng(): number;
  }

  interface KakaoMap {
    setCenter(latlng: KakaoLatLng): void;
    relayout(): void;
  }

  interface KakaoMarker {
    setMap(map: KakaoMap | null): void;
  }

  type KakaoMapOptions = {
    center: KakaoLatLng;
    level: number;
  };

  type KakaoMarkerOptions = {
    map?: KakaoMap;
    position: KakaoLatLng;
  };

  /**
   * `services.Places().keywordSearch` 의 결과 1건.
   * 카카오 로컬 API 원본 필드명 그대로다(snake_case). 좌표 x=경도 / y=위도이고 문자열로 온다.
   */
  type KakaoPlaceSearchResult = {
    id: string;
    place_name: string;
    /** 도로명 주소. 없는 장소가 있어 address_name으로 폴백한다. */
    road_address_name: string;
    address_name: string;
    place_url: string;
    x: string;
    y: string;
  };

  type KakaoPlacesSearchOptions = {
    /** 1~15. 기본 15. */
    size?: number;
  };

  type KakaoAddressSearchResult = {
    x: string;
    y: string;
  };

  interface KakaoPlacesService {
    keywordSearch(
      keyword: string,
      callback: (result: KakaoPlaceSearchResult[], status: string) => void,
      options?: KakaoPlacesSearchOptions,
    ): void;
  }

  interface KakaoGeocoderService {
    addressSearch(
      address: string,
      callback: (result: KakaoAddressSearchResult[], status: string) => void,
    ): void;
  }

  interface KakaoMapsNamespace {
    load(callback: () => void): void;
    LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
    Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
    Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
    services: {
      Places: new () => KakaoPlacesService;
      Geocoder: new () => KakaoGeocoderService;
      Status: {
        OK: string;
        ZERO_RESULT: string;
        ERROR: string;
      };
    };
    event: {
      addListener(target: KakaoMarker | KakaoMap, type: string, handler: KakaoMapEventHandler): KakaoMapListener;
      removeListener(listener: KakaoMapListener): void;
    };
  }

  interface KakaoMapsSdk {
    maps: KakaoMapsNamespace;
  }

  interface Window {
    kakao?: KakaoMapsSdk;
  }
}

export {};
