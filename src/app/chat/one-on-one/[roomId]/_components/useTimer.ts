"use client";

import { useState, useEffect } from "react";

interface TimerState {
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
}

function formatTimeLeft(ms: number): TimerState {
  if (ms <= 0) {
    return { label: "남은 시간 0분", isUrgent: false, isExpired: true };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const isUrgent = ms <= 60 * 60 * 1000; // 1시간 이하

  let label: string;
  if (days > 0) {
    label = `남은 시간 ${days}일 ${hours}시간 ${minutes}분`;
  } else if (hours > 0) {
    label = `남은 시간 ${hours}시간 ${minutes}분`;
  } else {
    label = `남은 시간 ${minutes}분`;
  }

  return { label, isUrgent, isExpired: false };
}

export function useTimer(expiresAt: Date | null, isEnded = false): TimerState {
  const [state, setState] = useState<TimerState>(() => {
    if (isEnded) return formatTimeLeft(0);
    if (!expiresAt) return { label: "", isUrgent: false, isExpired: false };
    return formatTimeLeft(new Date(expiresAt).getTime() - Date.now());
  });

  useEffect(() => {
    if (isEnded) {
      setState(formatTimeLeft(0));
      return undefined;
    }

    if (!expiresAt) {
      setState({ label: "", isUrgent: false, isExpired: false });
      return undefined;
    }

    const tick = () => {
      setState(formatTimeLeft(new Date(expiresAt).getTime() - Date.now()));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, isEnded]);

  return state;
}
