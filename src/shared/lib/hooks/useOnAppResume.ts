"use client";

import { useEffect, useRef } from "react";

import { subscribeAppResume } from "@/shared/lib/appResume";

/**
 * 탭·앱이 다시 보이게 될 때 `fn` 을 부른다. 폴링 없이 "돌아왔을 때 한 번 다시 읽기"만
 * 필요한 화면용이다. 한 번의 복귀에 신호가 둘 올 수 있으므로 `fn` 은 진행 중 재호출을
 * 스스로 건너뛰어야 한다.
 */
export function useOnAppResume(fn: () => void): void {
  const fnRef = useRef(fn);

  // 렌더 중에 ref 를 쓰면 react-hooks/refs 에 걸린다. 매 렌더 뒤에 갱신한다(useBackClose 와 같은 방식).
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => subscribeAppResume(() => fnRef.current()), []);
}
