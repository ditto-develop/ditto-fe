import { externalApiFetch } from "@/shared/lib/api/externalClient";

/** 서버 기능 플래그 응답(`GET /api/v1/feature-flags?keys=…`). 물어본 키만 온다. 서버가 모르는 키는 false. */
export type FeatureFlagsResponse = {
  flags: Record<string, boolean>;
};

/** 물어볼 키마다 `keys` 를 하나씩 붙인다. 로그인 전에도 부를 수 있다(X-API-Key 만 필요). */
export function fetchFeatureFlags(keys: readonly string[]): Promise<FeatureFlagsResponse> {
  const query = keys.map((key) => `keys=${encodeURIComponent(key)}`).join("&");
  return externalApiFetch<FeatureFlagsResponse>(`/api/v1/feature-flags?${query}`);
}
