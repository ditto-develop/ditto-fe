/**
 * DB에 저장된 age(연령대 하한값)를 FE 표시용 범위 문자열로 변환
 * 20 → "20~24세", 25 → "25~29세", ..., 60 → "60세 이상"
 */
export function formatAgeRange(age: number): string {
  if (age >= 60) return "60세 이상";
  if (age >= 50) return "50~59세";
  if (age >= 45) return "45~49세";
  if (age >= 40) return "40~44세";
  if (age >= 35) return "35~39세";
  if (age >= 30) return "30~34세";
  if (age >= 25) return "25~29세";
  return "20~24세";
}
