/**
 * 캐리커쳐(아바타) 이미지 주소.
 *
 * 고르는 화면(가입 Step_2·프로필 수정 ProfileSelect)은 2026-03 부터 `/assets/avatar/{id}` 그림을 보여 줬는데,
 * 가입 요청은 2026-06 부터 2026-10-19 까지 **옛 그림 세트**인 `/onboarding/profileimg/avatar/{id}.svg` 를 보냈다.
 * 두 세트는 번호만 같고 그림이 달라서, 가입한 회원의 프로필에는 고른 것과 다른 그림이 떴다.
 * 서버는 받은 문자열을 그대로 저장하고 그대로 내려주므로(member.caricature → profileImageUrl),
 * 이미 저장된 옛 주소는 화면에 그리기 전에 여기서 같은 번호의 지금 그림으로 바꾼다.
 */

/** 캐리커쳐 id("m1"~"m8", "f1"~"f8")의 지금 그림 주소. 가입·프로필 수정이 서버에 보내는 값이다. */
export function avatarImageUrl(avatarId: string): string {
  return `/assets/avatar/${avatarId}.webp`;
}

/**
 * 서버에 저장된 옛 캐리커쳐 주소.
 * - `/onboarding/profileimg/avatar/m1.svg`: 가입 요청이 보내던 옛 그림 세트(그림이 다르다)
 * - `/assets/avatar/m1.png`: 예전 프로필 수정이 보내던 값(그림은 같고 형식만 다르다)
 */
const LEGACY_AVATAR_URL = /^(?:https?:\/\/[^/]+)?\/(?:onboarding\/profileimg\/avatar|assets\/avatar)\/([mf][1-8])\.(?:svg|png)$/;

/** 서버가 준 프로필 이미지 주소를 화면에 그릴 주소로 바꾼다. 캐리커쳐가 아니면 그대로 둔다. */
export function toAvatarImageUrl<T extends string | null | undefined>(url: T): T {
  const avatarId = url?.match(LEGACY_AVATAR_URL)?.[1];
  return (avatarId ? avatarImageUrl(avatarId) : url) as T;
}
