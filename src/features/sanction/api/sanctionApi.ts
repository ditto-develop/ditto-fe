import type { MySanctionResponse } from "@/features/sanction/model/types";
import { externalApiFetch } from "@/shared/lib/api/externalClient";

/**
 * 현재 유효한 제재 중 가장 강한 1건.
 * 제재로 다른 보호 API가 403이어도 이 API만은 기존 accessToken으로 호출할 수 있다.
 */
export function getMySanction(): Promise<MySanctionResponse> {
  return externalApiFetch<MySanctionResponse>("/api/v1/users/me/sanction");
}
