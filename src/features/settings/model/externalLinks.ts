/**
 * 설정 > 정보 섹션이 여는 외부 문서.
 *
 * 공지사항·자주 묻는 질문은 앱 안에 본문이 없어 외부 문서로 연결한다
 * (약관 3종은 `policies.ts`에 본문이 있어 앱 내 화면으로 연다).
 *
 * 주소가 정해지면 아래 상수에 그대로 넣는다. 빈 문자열이면 링크를 열지 않고
 * "준비 중입니다." 토스트를 띄운다 — 주소를 비워 둔 채 배포해도 빈 탭이 열리지 않는다.
 */
export const SETTINGS_EXTERNAL_LINKS = {
  /** 공지사항 문서 URL. 주소가 정해지지 않아 비워 둔다(누르면 "준비 중입니다."). */
  notice: "",
  /** 자주 묻는 질문 문서 URL. */
  faq: "https://absorbed-platypus-f50.notion.site/FAQ-36a6d9645e8b8148b1fad03d1cbdab5e?pvs=73",
} as const;
