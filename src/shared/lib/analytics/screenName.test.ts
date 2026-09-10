import { describe, expect, it } from "vitest";

import { resolveScreen } from "@/shared/lib/analytics/screenName";

/**
 * 화면 이름 정규화.
 *
 * 여기가 틀리면 조용히 망가진다 — 리포트는 계속 나오는데 카디널리티가 터져
 * `(other)` 로 뭉개지거나, roomId 가 GA4 에 그대로 적재된다. 둘 다 배포 뒤
 * 며칠이 지나서야 발견된다.
 */

describe("resolveScreen", () => {
  it("끝 슬래시 유무와 무관하게 같은 화면으로 접는다", () => {
    // trailingSlash: true 라 하드 로드는 "/home/", 클라 내비게이션은 "/home" 이다.
    // 정규화하지 않으면 같은 화면이 리포트에서 둘로 쪼개진다.
    expect(resolveScreen("/home")).toEqual(resolveScreen("/home/"));
    expect(resolveScreen("/home")?.screenName).toBe("home");
  });

  it("동적 세그먼트를 라우트 패턴으로 접어 식별자를 남기지 않는다", () => {
    const first = resolveScreen("/chat/group/1234");
    const second = resolveScreen("/chat/group/9999/");

    expect(first).toEqual(second);
    expect(first?.screenName).toBe("chat_group");
    expect(first?.screenPath).toBe("/chat/group/[roomId]");
  });

  it("같은 접두사의 /rate 를 별도 화면으로 구분한다", () => {
    expect(resolveScreen("/chat/one-on-one/12/rate")?.screenName).toBe("chat_one_on_one_rate");
    expect(resolveScreen("/chat/one-on-one/12")?.screenName).toBe("chat_one_on_one");
  });

  it("정적 경로가 동적 패턴보다 우선한다", () => {
    // 여기가 뒤집히면 /profile/edit 이 profile_detail 로, /quiz/current 가
    // quiz_detail 로 뭉쳐서 별개 화면 두 개가 리포트에서 사라진다.
    expect(resolveScreen("/profile/edit")?.screenName).toBe("profile_edit");
    expect(resolveScreen("/profile/777")?.screenName).toBe("profile_detail");
    expect(resolveScreen("/quiz/current")?.screenName).toBe("quiz_current");
    expect(resolveScreen("/quiz/42")?.screenName).toBe("quiz_detail");
  });

  it("관리자 경로는 추적하지 않는다", () => {
    // 운영자가 하루에도 수십 번 드나들어 실사용 지표를 오염시킨다.
    expect(resolveScreen("/admin")).toBeNull();
    expect(resolveScreen("/admin/matches/")).toBeNull();
  });

  it("표에 없는 경로에서도 식별자로 보이는 세그먼트는 가린다", () => {
    // 라우트를 추가하고 표를 고치는 걸 잊는 일은 반드시 생긴다. 잊었을 때
    // 최소한 식별자만은 새어 나가지 않아야 한다.
    const screen = resolveScreen("/future/12345/detail");

    expect(screen?.screenPath).toBe("/future/[id]/detail");
    expect(screen?.screenName).not.toContain("12345");
  });

  it("루트는 landing 이다 — 가입 퍼널이 이 경로 안에서 돌아간다", () => {
    expect(resolveScreen("/")?.screenName).toBe("landing");
  });

  it("generateStaticParams 의 placeholder 경로도 동적 패턴으로 접힌다", () => {
    // 정적 export 라 빌드 산출물에 /profile/placeholder 같은 경로가 실제로 존재한다.
    // 숫자가 아니라서 fallback 의 식별자 마스킹으로는 안 걸린다 — 패턴이 먼저 잡아야 한다.
    expect(resolveScreen("/profile/placeholder")?.screenName).toBe("profile_detail");
    expect(resolveScreen("/chat/group/placeholder/rate")?.screenName).toBe("chat_group_rate");
  });
});
