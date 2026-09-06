/**
 * 사업자 정보 — 사업자등록증 기재 내용.
 *
 * 카카오 비즈앱 심사는 이 값을 **사업자등록증·비즈앱 등록 정보와 글자 단위로 대조**한다
 * (2026-08 반려 사유 2번 "사이트 내 사업자 정보 미확인", 3번 "회사명 불일치").
 * 등록증 / 카카오 콘솔 / 이 파일 세 곳의 표기가 하나라도 다르면 다시 반려되므로
 * 띄어쓰기·괄호까지 등록증 표기 그대로 두고, 보기 좋게 다듬지 않는다.
 *
 * 대표자 생년월일은 등록증에 기재되어 있으나 공개 게시 대상이 아니라 담지 않는다.
 *
 * 빈 문자열인 항목은 화면에서 행 자체가 빠진다 — 값이 정해지면 여기만 채우면 된다.
 */
export const BUSINESS_INFO = {
  /** 상호. 카카오 콘솔 [내 애플리케이션] > [일반] > [기본 정보]의 회사명과 반드시 동일해야 한다. */
  companyName: "카운트제로",
  representative: "오세영",
  registrationNumber: "291-39-01610",
  address: "서울특별시 노원구 한글비석로 479, 111동 306호(상계동, 보람아파트)",
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
  contactPhone: "010-2936-6989",
} as const;

/**
 * 개인정보 보호책임자. 개인정보처리방침 제11조에 그대로 들어간다.
 * 1인 사업자라 보호책임자와 문의 창구가 같다.
 */
export const PRIVACY_OFFICER = {
  name: "오세영",
  title: "대표",
  phone: BUSINESS_INFO.contactPhone,
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
    { label: "대표자", value: BUSINESS_INFO.representative },
    { label: "사업자등록번호", value: BUSINESS_INFO.registrationNumber },
    { label: "통신판매업 신고번호", value: BUSINESS_INFO.mailOrderNumber },
    { label: "사업장 소재지", value: BUSINESS_INFO.address },
    { label: "업태", value: BUSINESS_INFO.businessType },
    { label: "종목", value: BUSINESS_INFO.businessItem },
    { label: "개업연월일", value: BUSINESS_INFO.openedOn },
    { label: "이메일", value: BUSINESS_INFO.contactEmail },
    { label: "전화번호", value: BUSINESS_INFO.contactPhone },
  ].filter((row) => row.value.length > 0);
}
