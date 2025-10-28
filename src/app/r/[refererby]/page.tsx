"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useParams } from 'next/navigation'

export default function RedirectPage(){  
  const params = useParams<{ refererby: string;  }>()
  const router = useRouter();

  useEffect(() => {
    if (params.refererby) {
      //api 호출
      router.replace("/");
    }
  }, []);

  return null; 
}
