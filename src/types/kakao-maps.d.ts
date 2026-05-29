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

  type KakaoPlaceSearchResult = {
    x: string;
    y: string;
  };

  type KakaoAddressSearchResult = {
    x: string;
    y: string;
  };

  interface KakaoPlacesService {
    keywordSearch(
      keyword: string,
      callback: (result: KakaoPlaceSearchResult[], status: string) => void,
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
