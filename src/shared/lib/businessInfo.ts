/**
 * 사업자 정보 — 사업자등록증 기재 내용 중 화면에 게시하는 항목만 담는다.
 *
 * 대표자·사업장 소재지·전화번호는 값 자체를 지웠다(2026-09-08 화면 제거 → 2026-09-18 상수 제거).
 * 카카오 비즈앱 심사 대조·전자상거래법 게시 의무는 더 이상 고려하지 않는다.
 *
 * 등록증 / 카카오 콘솔 / 이 파일 표기가 다르면 카카오 심사가 다시 반려될 수 있으니
 * 남은 항목(상호·사업자등록번호 등)은 띄어쓰기·괄호까지 등록증 표기 그대로 둔다.
 *
 * 빈 문자열인 항목은 화면에서 행 자체가 빠진다 — 값이 정해지면 여기만 채우면 된다.
 */
export const BUSINESS_INFO = {
  /** 상호. 카카오 콘솔 [내 애플리케이션] > [일반] > [기본 정보]의 회사명과 반드시 동일해야 한다. */
  companyName: "카운트제로",
  registrationNumber: "291-39-01610",
  businessType: "도매 및 소매업",
  businessItem: "전자상거래 소매업",
  openedOn: "2026년 08월 08일",
  /**
   * 통신판매업 신고번호.
   *
   * 유료 판매를 하지 않아 **신고하지 않는다**(2026-08-30 확인). 빈 값이므로 화면에
   * 행 자체가 나오지 않는다 — "미신고" 같은 문구를 대신 넣지 않는다.
   */
  mailOrderNumber: "",
  contactEmail: "ditto.apply@gmail.com",
} as const;

/**
 * 개인정보 보호책임자. 개인정보처리방침 제11조에 그대로 들어간다.
 * 1인 사업자라 보호책임자와 문의 창구가 같다.
 *
 * **대표자 성명·개인 휴대전화는 이 파일에서 완전히 지웠다(2026-09-18 사용자 요청).**
 * 1인 사업자라 두 값이 곧 개인 신상이어서, 화면에서만 빼고 상수로 남겨 두면
 * 정적 번들(JS)에 그대로 실려 나간다 — 값 자체를 두지 않는 것이 유일한 제거 방법이다.
 * 다시 넣어야 한다면 화면 노출 여부와 무관하게 사용자 확인을 먼저 받는다.
 */
export const PRIVACY_OFFICER = {
  title: "대표",
  email: BUSINESS_INFO.contactEmail,
} as const;

/**
 * 약관·방침 시행일. 세 문서가 같은 날짜를 쓰므로 여기 한 곳에서만 바꾼다.
 * 문서를 실제로 개정할 때만 갱신한다(자리표시자가 아니다).
 */
export const POLICY_EFFECTIVE_DATE = {
  /** 본문 표기: "2026년 8월 30일" */
  long: "2026년 8월 30일",
  /** 변경 이력 표 표기: "2026.08.30" */
  dotted: "2026.08.30",
} as const;

export type BusinessInfoRow = {
  label: string;
  value: string;
};

/** 값이 있는 항목만 순서대로 돌려준다. 미정 항목은 빈 행으로 남기지 않는다. */
export function getBusinessInfoRows(): BusinessInfoRow[] {
  return [
    { label: "상호", value: BUSINESS_INFO.companyName },
    { label: "사업자등록번호", value: BUSINESS_INFO.registrationNumber },
    { label: "통신판매업 신고번호", value: BUSINESS_INFO.mailOrderNumber },
    { label: "업태", value: BUSINESS_INFO.businessType },
    { label: "종목", value: BUSINESS_INFO.businessItem },
    { label: "개업연월일", value: BUSINESS_INFO.openedOn },
    { label: "이메일", value: BUSINESS_INFO.contactEmail },
  ].filter((row) => row.value.length > 0);
}
