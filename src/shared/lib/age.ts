/**
 * 생년월일 기반 연령 처리.
 *
 * 본인확인기관을 통한 본인인증은 **하지 않는다**(2026-08-30 결정). 나이는 가입자가
 * 직접 입력한 생년월일에서 계산하는 자기신고 값이며, 미성년자 유입은 신고·제재로
 * 사후 대응한다(신고 사유에 "19세 미만으로 의심됨"이 있다).
 *
 * 소셜 로그인에서 받아올 수도 없다 — 구글은 생일을 기본 스코프로 주지 않고,
 * 연령대 스코프는 미국 기준(18/21)이라 만 19세를 판별할 수 없다.
 */

/** 가입 가능한 최소 나이(만). 이용약관 제7조의 "만 19세 미만인 자" 가입 거절과 같은 값이다. */
export const MIN_SIGNUP_AGE = 19;

/** BE 가 받는 연령대 값(하한). `formatAgeRange` 의 구간과 같다. */
const AGE_BUCKETS = [60, 50, 45, 40, 35, 30, 25, 20] as const;

/**
 * `yyyy-MM-dd` 를 만 나이로 계산한다. 형식이 아니거나 미래 날짜면 null.
 *
 * 기준 시각을 인자로 받는 이유는 테스트에서 고정하기 위함이다.
 */
export function calculateAge(birthDate: string, now: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const birth = new Date(year, month - 1, day);
  // Date 는 2026-02-31 같은 값을 3월로 굴려버린다. 되돌려 받은 값이 입력과 다르면 없는 날짜다.
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return null;
  }

  let age = now.getFullYear() - year;
  // 올해 생일이 아직 안 지났으면 한 살 뺀다.
  const hadBirthday =
    now.getMonth() > month - 1 ||
    (now.getMonth() === month - 1 && now.getDate() >= day);
  if (!hadBirthday) age -= 1;

  return age < 0 ? null : age;
}

/** 만 19세 이상인지. 생년월일이 비었거나 형식이 틀리면 false. */
export function isEligibleAge(birthDate: string | null, now: Date = new Date()): boolean {
  if (!birthDate) return false;
  const age = calculateAge(birthDate, now);
  return age !== null && age >= MIN_SIGNUP_AGE;
}

/**
 * 만 나이를 BE 가 받는 연령대 값으로 바꾼다(20 · 25 · 30 · 35 · 40 · 45 · 50 · 60).
 *
 * ⚠️ 구간이 20 부터라 **만 19세는 20 으로 올라간다.** 약관은 19세부터 허용하는데
 * 연령대 구간에는 19 가 없다 — BE 가 19 구간을 만들거나 약관을 20 세로 올리기 전까지
 * 만 19세는 프로필에 "20~24세" 로 보인다.
 */
export function toAgeBucket(age: number): number {
  return AGE_BUCKETS.find((bucket) => age >= bucket) ?? 20;
}
