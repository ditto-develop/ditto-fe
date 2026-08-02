import { externalApiFetch } from "@/shared/lib/api/externalClient";

export type CounterpartProfile = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
};

type PublicProfile = {
  userId: number;
  nickname: string;
  profileImageUrl?: string;
};

/**
 * 채팅 상대 프로필.
 * 방 목록 응답에는 counterpartMemberIds만 있어 닉네임/이미지는 따로 받아와야 한다.
 * 같은 상대가 여러 방에 나올 수 있으므로 모듈 캐시로 중복 호출을 막는다.
 */
const cache = new Map<number, Promise<CounterpartProfile>>();

export function getCounterpartProfile(userId: number): Promise<CounterpartProfile> {
  const cached = cache.get(userId);
  if (cached) return cached;

  const request = externalApiFetch<PublicProfile>(`/api/v1/users/${userId}/profile`)
    .then((profile) => ({
      userId,
      nickname: profile.nickname,
      profileImageUrl: profile.profileImageUrl ?? null,
    }))
    .catch((error: unknown) => {
      // 실패한 응답을 캐시에 남기면 영영 복구되지 않는다.
      cache.delete(userId);
      throw error;
    });

  cache.set(userId, request);
  return request;
}

/** 테스트/로그아웃 등 사용자 전환 시 캐시를 비운다. */
export function clearCounterpartProfileCache(): void {
  cache.clear();
}
