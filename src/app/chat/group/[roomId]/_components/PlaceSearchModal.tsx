"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, CircleX, MapPin, Search } from "lucide-react";
import { useBackClose } from "@/shared/hooks/useBackClose";
import { searchPlaces } from "@/features/chat/lib/placeSearch";
import type { PlaceSearchResult } from "@/features/chat/lib/placeSearch";
import {
  ClearButton,
  FeedbackText,
  IconButton,
  ModalRoot,
  NavigationFiller,
  ResultAddress,
  ResultContent,
  ResultIconBox,
  ResultList,
  ResultRow,
  ResultStack,
  ResultTitle,
  ResultTitleHighlight,
  SearchField,
  SearchInput,
  SearchSection,
  Title,
  TopNavigation,
} from "./_parts/PlaceSearchModal.parts";

export type SelectedPlace = {
  name: string;
  address: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
};

type PlaceSearchModalProps = {
  onClose: () => void;
  onSelect: (place: SelectedPlace) => void;
};

type HighlightSegment = {
  text: string;
  highlighted: boolean;
};

const normalizeSearchText = (text: string) => text.trim().toLocaleLowerCase();

const getSearchTokens = (keyword: string) =>
  normalizeSearchText(keyword)
    .split(/\s+/)
    .filter((token) => token.length > 0);

const countTokenMatches = (text: string, tokens: string[]) => {
  const normalizedText = normalizeSearchText(text);

  return tokens.filter((token) => normalizedText.includes(token)).length;
};

const getPlaceSearchRank = (place: PlaceSearchResult, keyword: string) => {
  const normalizedKeyword = normalizeSearchText(keyword);
  const tokens = getSearchTokens(keyword);
  const normalizedName = normalizeSearchText(place.name);
  const normalizedAddress = normalizeSearchText(place.address);
  const [primaryToken, ...secondaryTokens] = tokens;

  if (normalizedKeyword && normalizedName.includes(normalizedKeyword)) return 0;
  if (tokens.length > 0 && tokens.every((token) => normalizedName.includes(token))) return 1;
  if (
    primaryToken &&
    normalizedName.includes(primaryToken) &&
    secondaryTokens.length > 0 &&
    secondaryTokens.every((token) => normalizedAddress.includes(token))
  ) {
    return 2;
  }
  if (
    tokens.length > 1 &&
    countTokenMatches(place.name, tokens) > 0 &&
    countTokenMatches(place.address, tokens) > 0
  ) {
    return 3;
  }
  if (normalizedKeyword && normalizedAddress.includes(normalizedKeyword)) return 4;

  return 5;
};

const sortPlacesByQuery = (places: PlaceSearchResult[], keyword: string) => {
  const tokens = getSearchTokens(keyword);

  return [...places].sort((left, right) => {
    const rankDiff = getPlaceSearchRank(left, keyword) - getPlaceSearchRank(right, keyword);

    if (rankDiff !== 0) return rankDiff;

    const nameMatchDiff = countTokenMatches(right.name, tokens) - countTokenMatches(left.name, tokens);

    if (nameMatchDiff !== 0) return nameMatchDiff;

    return countTokenMatches(right.address, tokens) - countTokenMatches(left.address, tokens);
  });
};

const getHighlightedSegments = (text: string, keyword: string): HighlightSegment[] => {
  if (!keyword) return [{ text, highlighted: false }];

  const lowerText = normalizeSearchText(text);
  const lowerKeyword = normalizeSearchText(keyword);
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let matchIndex = lowerText.indexOf(lowerKeyword, cursor);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex), highlighted: false });
    }

    const matchEnd = matchIndex + keyword.length;
    segments.push({ text: text.slice(matchIndex, matchEnd), highlighted: true });
    cursor = matchEnd;
    matchIndex = lowerText.indexOf(lowerKeyword, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false });
  }

  return segments.length > 0 ? segments : [{ text, highlighted: false }];
};

export function PlaceSearchModal({ onClose, onSelect }: PlaceSearchModalProps) {
  // 열려 있는 동안만 마운트된다 — OS 뒤로가기로도 닫히게 한다.
  useBackClose(true, onClose);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const requestIdRef = useRef(0);

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!normalizedQuery) {
      requestIdRef.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void searchPlaces(normalizedQuery)
        .then((places) => {
          if (requestIdRef.current !== requestId) return;

          setResults(sortPlacesByQuery(places, normalizedQuery));
        })
        .catch((err: unknown) => {
          if (requestIdRef.current !== requestId) return;

          setResults([]);
          setError(err instanceof Error ? err.message : "장소를 검색하지 못했어요.");
        })
        .finally(() => {
          if (requestIdRef.current === requestId) {
            setLoading(false);
          }
        });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [normalizedQuery]);

  const handleSelect = (place: PlaceSearchResult) => {
    onSelect({
      name: place.name,
      address: place.address,
      mapUrl: place.mapUrl,
      latitude: place.latitude,
      longitude: place.longitude,
    });
    onClose();
  };

  return (
    <ModalRoot role="dialog" aria-modal="true" aria-labelledby="place-search-title">
      <TopNavigation>
        <IconButton type="button" onClick={onClose} aria-label="뒤로가기">
          <ChevronLeft aria-hidden="true" strokeWidth={1.8} />
        </IconButton>
        <Title id="place-search-title">장소 선택하기</Title>
        <NavigationFiller aria-hidden="true" />
      </TopNavigation>

      <SearchSection>
        <SearchField $focused={focused}>
          <Search aria-hidden="true" size={22} strokeWidth={1.8} />
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="장소를 입력해 주세요."
            aria-label="장소 검색"
            autoFocus
          />
          {query && (
            <ClearButton type="button" onClick={() => setQuery("")} aria-label="검색어 지우기">
              <CircleX aria-hidden="true" fill="currentColor" strokeWidth={1.5} />
            </ClearButton>
          )}
        </SearchField>
      </SearchSection>

      <ResultList>
        {!normalizedQuery ? null : loading ? (
          <FeedbackText>검색 중...</FeedbackText>
        ) : error ? (
          <FeedbackText>{error}</FeedbackText>
        ) : results.length === 0 ? (
          <FeedbackText>검색 결과가 없습니다.</FeedbackText>
        ) : (
          <ResultStack>
            {results.map((place) => (
              <ResultRow key={place.id} type="button" onClick={() => handleSelect(place)}>
                <ResultIconBox>
                  <MapPin aria-hidden="true" fill="currentColor" strokeWidth={0} />
                </ResultIconBox>
                <ResultContent>
                  <ResultTitle>
                    {getHighlightedSegments(place.name, normalizedQuery).map((segment, index) =>
                      segment.highlighted ? (
                        <ResultTitleHighlight key={`${segment.text}-${index}`}>
                          {segment.text}
                        </ResultTitleHighlight>
                      ) : (
                        segment.text
                      ),
                    )}
                  </ResultTitle>
                  <ResultAddress>{place.address}</ResultAddress>
                </ResultContent>
              </ResultRow>
            ))}
          </ResultStack>
        )}
      </ResultList>
    </ModalRoot>
  );
}
