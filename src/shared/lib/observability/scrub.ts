import type { TransportItem } from "@grafana/faro-web-sdk";

/**
 * Faro 로 나가는 항목에서 쿼리스트링을 지운다.
 *
 * 쿼리에는 우리가 보내면 안 되는 값이 실린다 — OAuth 콜백(`/auth/callback`, `/oauth/*`)의
 * `code=`/`state=` 가 대표적이고, API 요청 주소의 검색어·커서도 있다. 어느 경로에 무엇이
 * 실리는지 하나하나 가려낼 수 없어 **쿼리는 통째로 버린다.** 진단에는 경로만으로 충분하다.
 *
 * 해시(`#...`)도 같이 버린다. 소셜 로그인 응답이 토큰을 해시로 넘기는 경우가 있다.
 */

/** 문자열 안의 `http(s)://...?query` 에서 쿼리·해시만 지운다. URL 이 아닌 부분은 그대로 둔다. */
const URL_WITH_QUERY = /(https?:\/\/[^\s?#"'<>]+)[?#][^\s"'<>]*/g;

export function stripQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

export function stripQueriesInText(text: string): string {
  return text.replace(URL_WITH_QUERY, "$1");
}

function scrubRecord(record: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!record) return record;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = typeof value === "string" ? stripQueriesInText(value) : value;
  }
  return out;
}

/**
 * `beforeSend` 훅. 페이지 주소(meta.page.url)와 각 신호의 문자열에서 쿼리를 지운다.
 *
 * 신호 종류별로 URL 이 들어가는 자리가 다르다:
 *   - event: 성능 이벤트(`faro.performance.*`)의 attributes 에 리소스 주소가 들어간다.
 *   - log: console.warn/error 메시지에 주소가 섞일 수 있다.
 *   - exception: 메시지(value)에 요청 주소가 섞일 수 있다.
 * 스택 프레임의 파일 경로는 우리 정적 청크 주소라 손대지 않는다.
 */
export function scrubTransportItem(item: TransportItem): TransportItem {
  const meta = item.meta.page?.url
    ? { ...item.meta, page: { ...item.meta.page, url: stripQuery(item.meta.page.url) } }
    : item.meta;

  const payload = item.payload as unknown as Record<string, unknown>;
  const scrubbed: Record<string, unknown> = { ...payload };

  if (payload.attributes && typeof payload.attributes === "object") {
    scrubbed.attributes = scrubRecord(payload.attributes as Record<string, string>);
  }
  if (typeof payload.message === "string") {
    scrubbed.message = stripQueriesInText(payload.message);
  }
  if (typeof payload.value === "string") {
    scrubbed.value = stripQueriesInText(payload.value);
  }
  if (payload.context && typeof payload.context === "object") {
    scrubbed.context = scrubRecord(payload.context as Record<string, string>);
  }

  return { ...item, meta, payload: scrubbed as unknown as TransportItem["payload"] };
}
