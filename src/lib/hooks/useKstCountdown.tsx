import { useState, useEffect } from "react";

// targetDayIndex: 0(일) ~ 6(토)
export const useTargetDayCountdown = (targetDayIndex: number) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // KST 변환
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const KST_OFFSET = 9 * 60 * 60 * 1000;
      const nowKst = new Date(utc + KST_OFFSET);

      const currentDay = nowKst.getDay();
      
      // 목표 시간 설정
      const targetKst = new Date(nowKst);
      
      // (선택사항) 만약 현재 요일이 목표 요일보다 지났다면 다음주로 넘길지 여부는 기획에 따라 결정
      // 현재 로직: 단순히 같은 주(Week) 내에서의 목표 요일로 이동
  targetKst.setDate(nowKst.getDate() + (targetDayIndex - currentDay));
      targetKst.setHours(0, 0, 0, 0);

      // ✅ [수정 파트] 만약 목표 시간이 현재 시간보다 이전(과거)이라면, 7일을 더해서 '다음 주'로 설정
      if (targetKst.getTime() <= nowKst.getTime()) {
        targetKst.setDate(targetKst.getDate() + 7);
      }

      const difference = targetKst.getTime() - nowKst.getTime();
      if (difference <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const formattedHours = hours.toString().padStart(2, "0");
      const formattedMinutes = minutes.toString().padStart(2, "0");
      const formattedSeconds = seconds.toString().padStart(2, "0");

      setTimeLeft(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDayIndex]); // targetDayIndex가 바뀌면 타이머 재설정

  return timeLeft;
};