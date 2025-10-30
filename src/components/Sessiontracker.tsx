"use client";
import { useTotalSessionTime } from "@/hooks/useTotalSessionTime";
import { useVisitorTracker } from "@/hooks/useVisitorTracker";

export default function SessionTracker() {
  useTotalSessionTime(); // 훅은 클라이언트에서만 호출됨
  useVisitorTracker();
  return null; // 화면에 아무것도 안 보임
}