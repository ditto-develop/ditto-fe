"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, LocateFixed, MapPin, X } from "lucide-react";
import type { VotePlaceOption } from "@/features/chat";
import { loadKakaoMaps } from "@/shared/lib/kakao-maps";
import {
  Address,
  AddressRow,
  BottomCard,
  CloseButton,
  CopyButton,
  EmptyState,
  Label,
  LoadingState,
  MapArea,
  MapContainer,
  MapControlButton,
  MapControlLayer,
  PageRoot,
  PlaceInfo,
  Title,
  TopBar,
  VoteButton,
} from "./_parts/PlaceMapPage.parts";

type PlaceMapPageProps = {
  place: VotePlaceOption;
  onClose: () => void;
  onSelect: () => void;
};

function hasCoordinates(place: VotePlaceOption) {
  return typeof place.latitude === "number" && typeof place.longitude === "number";
}

type Coordinate = {
  latitude: number;
  longitude: number;
};

function parseCoordinate(x: string, y: string): Coordinate | null {
  const longitude = Number.parseFloat(x);
  const latitude = Number.parseFloat(y);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

function searchAddress(maps: KakaoMapsNamespace, address: string): Promise<Coordinate | null> {
  return new Promise((resolve) => {
    if (!address.trim()) {
      resolve(null);
      return;
    }

    const geocoder = new maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (status !== maps.services.Status.OK || result.length === 0) {
        resolve(null);
        return;
      }

      resolve(parseCoordinate(result[0].x, result[0].y));
    });
  });
}

function searchKeyword(maps: KakaoMapsNamespace, keyword: string): Promise<Coordinate | null> {
  return new Promise((resolve) => {
    if (!keyword.trim()) {
      resolve(null);
      return;
    }

    const places = new maps.services.Places();
    places.keywordSearch(keyword, (result, status) => {
      if (status !== maps.services.Status.OK || result.length === 0) {
        resolve(null);
        return;
      }

      resolve(parseCoordinate(result[0].x, result[0].y));
    });
  });
}

async function resolvePlaceCoordinate(maps: KakaoMapsNamespace, place: VotePlaceOption): Promise<Coordinate | null> {
  if (hasCoordinates(place)) {
    return {
      latitude: place.latitude as number,
      longitude: place.longitude as number,
    };
  }

  return (
    (await searchAddress(maps, place.address ?? "")) ??
    (await searchKeyword(maps, [place.label, place.address].filter(Boolean).join(" "))) ??
    (await searchKeyword(maps, place.label))
  );
}

export function PlaceMapPage({ place, onClose, onSelect }: PlaceMapPageProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const markerClickListenerRef = useRef<KakaoMapListener | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("복사");
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);

  const recenter = useCallback(() => {
    if (!coordinate || !mapRef.current) return;
    const maps = window.kakao?.maps;
    if (!maps) return;

    mapRef.current.setCenter(new maps.LatLng(coordinate.latitude, coordinate.longitude));
  }, [coordinate]);

  const moveToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;

    navigator.geolocation.getCurrentPosition((position) => {
      const maps = window.kakao?.maps;
      if (!maps || !mapRef.current) return;

      mapRef.current.setCenter(new maps.LatLng(position.coords.latitude, position.coords.longitude));
    });
  }, []);

  const copyAddress = async () => {
    const text = place.address ?? "";
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("복사됨");
    } catch {
      setCopyLabel("실패");
    }

    window.setTimeout(() => setCopyLabel("복사"), 1400);
  };

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setCoordinate(null);

    void loadKakaoMaps()
      .then(async (maps) => {
        if (cancelled || !mapContainerRef.current) return;

        const resolvedCoordinate = await resolvePlaceCoordinate(maps, place);
        if (cancelled || !mapContainerRef.current) return;

        if (!resolvedCoordinate) {
          setError("이 장소의 지도 정보를 불러올 수 없습니다.");
          return;
        }

        const center = new maps.LatLng(resolvedCoordinate.latitude, resolvedCoordinate.longitude);
        const map = new maps.Map(mapContainerRef.current, {
          center,
          level: 3,
        });
        const marker = new maps.Marker({
          map,
          position: center,
        });
        const listener = maps.event.addListener(marker, "click", () => {
          map.setCenter(center);
        });

        mapRef.current = map;
        markerRef.current = marker;
        markerClickListenerRef.current = listener;
        setCoordinate(resolvedCoordinate);

        window.setTimeout(() => {
          map.relayout();
          map.setCenter(center);
        }, 0);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "지도를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;

      const maps = window.kakao?.maps;
      if (maps && markerClickListenerRef.current) {
        maps.event.removeListener(markerClickListenerRef.current);
      }
      markerRef.current?.setMap(null);
      markerClickListenerRef.current = null;
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [place]);

  return (
    <PageRoot role="dialog" aria-modal="true" aria-labelledby="place-map-title">
      <TopBar>
        <CloseButton type="button" onClick={onClose} aria-label="닫기">
          <X aria-hidden="true" size={24} strokeWidth={1.8} />
        </CloseButton>
        <Title id="place-map-title">지도</Title>
      </TopBar>

      <MapArea>
        <MapContainer ref={mapContainerRef} />
        <MapControlLayer>
          <MapControlButton type="button" onClick={moveToCurrentLocation} aria-label="현재 위치로 이동">
            <LocateFixed aria-hidden="true" size={20} strokeWidth={1.8} />
          </MapControlButton>
          <MapControlButton type="button" onClick={recenter} aria-label="장소 위치로 이동">
            <MapPin aria-hidden="true" size={20} fill="currentColor" strokeWidth={0} />
          </MapControlButton>
        </MapControlLayer>
        {loading && <LoadingState>지도를 불러오는 중입니다.</LoadingState>}
        {error && <EmptyState>{error}</EmptyState>}
      </MapArea>

      <BottomCard>
        <PlaceInfo>
          <Label>{place.label}</Label>
          <AddressRow>
            <Address>{place.address ?? "주소 정보가 없습니다."}</Address>
            {place.address && (
              <CopyButton type="button" onClick={copyAddress}>
                <Copy aria-hidden="true" size={14} strokeWidth={1.8} />
                {copyLabel}
              </CopyButton>
            )}
          </AddressRow>
        </PlaceInfo>
        <VoteButton type="button" onClick={onSelect}>
          투표하기
        </VoteButton>
      </BottomCard>
    </PageRoot>
  );
}
