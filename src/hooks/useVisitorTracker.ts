"use client";
import { UsersService } from "@/api";
import { setisRevisit } from "@/store/referalSlice";
import { AppDispatch } from "@/store/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export function useVisitorTracker() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const hasVisited = localStorage.getItem("visited");

    if (hasVisited) {
      dispatch(setisRevisit(true));
    } else {
      console.log("첫 방문자 🚀");
      localStorage.setItem("visited", "true");
      // 여기서 서버에 "신규 방문자"로 기록 가능
    }
  }, []);
}
