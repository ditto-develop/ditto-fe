/**
 * 주간 리추얼 시각 계산.
 *
 * Ditto의 한 주는 고정 일정으로 돌아간다(이용약관 제11조):
 *   월~수  퀴즈
 *   목      매칭 결과 공개 — 00:00~23:59, **24시간 창**
 *   금~일  채팅방 — 일요일 23:59 일괄 마감
 *
 * 전부 결정적이라 서버 없이 클라이언트가 미리 알림을 예약할 수 있다.
 *
 * ⚠️ KST 벽시계를 그대로 `Date`에 담는 흔한 패턴(`new Date(utc + 9h)`)을 쓰면 안 된다.
 * 그렇게 만든 값은 "로컬 타임존으로 해석되는 가짜 시각"이라, 알림 예약처럼 **절대 시각**이
 * 필요한 곳에 넘기면 KST가 아닌 기기에서 엉뚱한 때에 울린다. 여기서는 KST 벽시계로
 * 계산한 뒤 오프셋을 빼서 진짜 순간(UTC epoch)으로 되돌린다.
 */

/** KST는 UTC+9 고정이며 서머타임이 없다. */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const KST_WEEKDAY = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
} as const;

/**
 * `from` 이후 처음 오는 "KST 기준 <weekday>요일 <hour>시 정각"의 절대 시각.
 *
 * 이미 지난 같은 요일·시각은 건너뛰고 다음 주를 돌려준다.
 *
 * @param weekday 0(일)~6(토)
 * @param hour    0~23, KST 기준
 */
export function nextKstWeekly(weekday: number, hour: number, from: Date = new Date()): Date {
    // epoch에 오프셋을 더하면 getUTC* 가 KST 벽시계 값을 돌려준다.
    const kstNow = new Date(from.getTime() + KST_OFFSET_MS);
    const year = kstNow.getUTCFullYear();
    const month = kstNow.getUTCMonth();
    const date = kstNow.getUTCDate();

    const daysAhead = (weekday - kstNow.getUTCDay() + 7) % 7;

    // Date.UTC로 KST 벽시계를 조립한 뒤 오프셋을 빼서 진짜 순간으로 되돌린다.
    let targetKstMs = Date.UTC(year, month, date + daysAhead, hour, 0, 0, 0);
    if (targetKstMs <= kstNow.getTime()) {
        targetKstMs = Date.UTC(year, month, date + daysAhead + 7, hour, 0, 0, 0);
    }

    return new Date(targetKstMs - KST_OFFSET_MS);
}

/** `nextKstWeekly`부터 주 단위로 `count`개의 시각을 만든다. */
export function upcomingKstWeekly(
    weekday: number,
    hour: number,
    count: number,
    from: Date = new Date(),
): Date[] {
    const first = nextKstWeekly(weekday, hour, from);
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    return Array.from({ length: count }, (_, i) => new Date(first.getTime() + i * WEEK_MS));
}
