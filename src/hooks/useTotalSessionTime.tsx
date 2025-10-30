"use client";

import { UsersService } from "@/api";
import { useEffect,useRef } from "react";

export function useTotalSessionTime() {
  const startTime = useRef<number>(0);

  useEffect(() => {
    // 사이트 접속 시점 기록
    startTime.current = Date.now();

    const handleLeave = () => {
      const stayMs = Date.now() - startTime.current;
      const staySec = Math.round(stayMs / 1000);
      console.log(`총 접속 시간: ${staySec}초`);

      // 👇 API 호출
      UsersService.usersControllerSaveStayTime(
        {   stayTime: staySec, }
      ).catch(() => {});

      // ✅ sendBeacon도 fallback로 함께
      navigator.sendBeacon?.(
        process.env.NEXT_PUBLIC_API_URL+"/api/users/stay-time",
        JSON.stringify({ staySec })
      );
      
    };

    // 브라우저 종료, 새로고침 시점
    window.addEventListener("beforeunload", handleLeave);
    return () => {
      handleLeave();
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, []);
}
