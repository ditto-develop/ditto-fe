/**
 * 채팅 이미지 presigned URL 재사용 캐시.
 *
 * 서버는 같은 이미지(objectKey)에도 조회할 때마다 **서명이 다른 새 URL** 을 내려준다.
 * 브라우저 캐시 키는 쿼리스트링까지 포함한 URL 전체라, 방에 다시 들어가거나 위로 스크롤해
 * 같은 메시지를 다시 받을 때마다 이미 받아 둔 이미지를 처음부터 다시 내려받았다.
 *
 * 그래서 objectKey 마다 처음 받은 URL 을 붙잡아 두고, 서명이 살아 있는 동안은 그 URL 을
 * 계속 돌려준다 — 그러면 브라우저 캐시가 그대로 맞는다.
 *
 * 만료는 추측하지 않는다. presigned URL 자체에 서명 시각(`X-Amz-Date`)과 유효 기간
 * (`X-Amz-Expires`)이 들어 있어 그 값으로 정확히 계산하고, 두 값이 없는 형식이면
 * 캐시하지 않고 원본을 그대로 쓴다. 만료를 잘못 늘리면 이미지가 403 으로 깨지는데,
 * 그건 캐시로 아끼는 트래픽보다 훨씬 나쁘다.
 */

/** 만료 직전 URL 을 넘겨주지 않도록 두는 여유. 화면에 떠 있는 동안 만료되는 것도 막는다. */
const SAFETY_MARGIN_MS = 60_000;

/** 장수가 많은 방에서 무한정 자라지 않게 상한을 둔다. 넘으면 오래된 것부터 버린다. */
const MAX_ENTRIES = 300;

const cache = new Map<string, { url: string; expiresAt: number }>();

/** `20260918T012233Z` 형태의 X-Amz-Date. */
const AMZ_DATE_PATTERN = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;

/** presigned URL 의 실제 만료 시각(ms). 서명 파라미터가 없으면 null. */
function readPresignedExpiry(url: string): number | null {
  let params: URLSearchParams;
  try {
    params = new URL(url, "https://placeholder.invalid").searchParams;
  } catch {
    return null;
  }

  const signedAt = AMZ_DATE_PATTERN.exec(params.get("X-Amz-Date") ?? "");
  const expiresIn = Number(params.get("X-Amz-Expires"));
  if (!signedAt || !Number.isFinite(expiresIn) || expiresIn <= 0) return null;

  const signedAtMs = Date.UTC(
    Number(signedAt[1]),
    Number(signedAt[2]) - 1,
    Number(signedAt[3]),
    Number(signedAt[4]),
    Number(signedAt[5]),
    Number(signedAt[6]),
  );

  return signedAtMs + expiresIn * 1000;
}

/**
 * 같은 objectKey 로 이미 받아 둔 URL 이 아직 유효하면 그것을, 아니면 방금 받은 URL 을 준다.
 *
 * @param objectKey IMAGE 메시지의 `content`. 이미지 하나를 가리키는 불변 키다.
 */
export function stabilizeChatImageUrl(objectKey: string, url: string | null): string | null {
  if (!url || !objectKey) return url;

  const now = Date.now();
  const cached = cache.get(objectKey);
  if (cached && cached.expiresAt - SAFETY_MARGIN_MS > now) return cached.url;

  const expiresAt = readPresignedExpiry(url);
  // 서명 파라미터가 없으면(공개 URL 등) 매번 같은 URL 일 테니 캐시할 이유도 없다.
  if (expiresAt == null) return url;

  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(objectKey, { url, expiresAt });

  return url;
}

/** 테스트용. 화면 코드에서는 부르지 않는다. */
export function clearChatImageUrlCache(): void {
  cache.clear();
}
