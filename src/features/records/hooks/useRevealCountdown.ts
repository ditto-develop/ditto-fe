"use client";

import { useEffect, useState } from "react";

import { formatCountdown } from "@/features/records/lib/recordFormat";
import { parseServerDateTime } from "@/shared/lib/serverDateTime";

type RevealCountdown = {
  /** "10:49:25". 시각을 못 읽으면 빈 문자열. */
  label: string;
  /** 이 기기 시계로 공개 시각이 지났는지. 공개 여부의 정본은 서버 `revealed` 다. */
  expired: boolean;
};

function remainingMs(target: Date | null): number {
  return target ? target.getTime() - Date.now() : 0;
}

/** 통계 공개(statsRevealAt)까지 1초마다 줄어드는 카운트다운(Figma 3254:38697). */
export function useRevealCountdown(statsRevealAt: string | null): RevealCountdown {
  const target = parseServerDateTime(statsRevealAt);
  const targetMs = target?.getTime() ?? null;
  const [left, setLeft] = useState(() => remainingMs(target));

  useEffect(() => {
    if (targetMs === null) return undefined;
    const tick = () => setLeft(targetMs - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (targetMs === null) return { label: "", expired: false };
  return { label: formatCountdown(left), expired: left <= 0 };
}
