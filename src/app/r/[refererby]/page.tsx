"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RedirectPage({ params }: { params: { refererby: string } }) {
  const router = useRouter();

  useEffect(() => {
    if (params.refererby) {
      //api 호출
      router.replace("/");
    }
  }, []);

  return null; 
}
