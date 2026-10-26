/**
 * 퀴즈 기간 홈 "참여한 사람" 표시값. 실제 수 대신 구간의 아래쪽 끝에 "+"를 붙여 보인다
 * (QA 2026-10-26 — 예전에는 실제 수에 50을 더해 보였다).
 *
 * - 1,000명 이하: 50명 단위. 100명 이하는 모두 "50명+", 101~150명 "100명+", 151~200명 "150명+" …
 *   경계는 아래 구간에 넣는다(150명은 "100명+"). "+"는 "넘게"라 150명을 "150명+"로 보이면 틀린다.
 * - 1,000명 초과: 100명 단위(요청에 없어 정한 값). 1,001~1,100명이 "1,000명+"다.
 */
export function formatParticipantCount(count: number): string {
  const unit = count > 1000 ? 100 : 50;
  const lowerBound = Math.max(50, Math.floor((count - 1) / unit) * unit);
  return `${lowerBound.toLocaleString("ko-KR")}명+`;
}
