export type LinkifyPart =
  | { type: "text"; text: string }
  | { type: "link"; text: string; href: string };

/**
 * 스킴 없는 주소를 링크로 볼 최상위 도메인.
 * `3.14`, `file.txt` 같은 일반 문장 속 점을 링크로 오인하지 않도록 목록으로 좁힌다.
 */
const BARE_TLDS = [
  "com", "net", "org", "kr", "io", "me", "app", "dev", "pics", "ai", "co",
  "ly", "gl", "so", "xyz", "info", "biz", "shop", "site", "link", "page", "tv", "us", "jp",
].join("|");

/**
 * 1) http(s):// 로 시작하는 주소  2) www. 로 시작하는 주소  3) 목록의 TLD 로 끝나는 도메인(+경로).
 * lookbehind 는 구형 iOS WKWebView(16.4 미만)에서 정규식 파싱 자체가 실패하므로 쓰지 않고,
 * 앞 글자 검사는 `isBoundaryBefore` 에서 한다.
 */
const URL_PATTERN = new RegExp(
  `https?:\\/\\/[^\\s<>]+` +
    `|www\\.[^\\s<>]+` +
    `|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:${BARE_TLDS})(?![a-z0-9-])(?:[/?#][^\\s<>]*)?`,
  "gi",
);

const TRAILING_PUNCTUATION = /[.,!?;:)}\]'"]+$/;

/** 이메일(`a@naver.com`)이나 단어 중간(`abc.naver.com` 의 일부)에서 잡히지 않게 한다. */
function isBoundaryBefore(content: string, index: number) {
  if (index === 0) return true;
  return !/[a-z0-9@._\-/]/i.test(content[index - 1]);
}

export function linkify(content: string): LinkifyPart[] {
  const parts: LinkifyPart[] = [];
  let cursor = 0;

  for (const match of content.matchAll(URL_PATTERN)) {
    const start = match.index;
    if (!isBoundaryBefore(content, start)) continue;

    const url = match[0].replace(TRAILING_PUNCTUATION, "");
    // "www." 처럼 문장부호를 떼고 나면 주소가 남지 않는 경우
    if (!/\.[a-z0-9]/i.test(url)) continue;

    if (start > cursor) parts.push({ type: "text", text: content.slice(cursor, start) });
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    parts.push({ type: "link", text: url, href });
    cursor = start + url.length;
  }

  if (cursor < content.length) parts.push({ type: "text", text: content.slice(cursor) });
  return parts;
}
