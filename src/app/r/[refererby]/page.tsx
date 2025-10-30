"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useParams } from 'next/navigation'
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setReferal, setUtm } from "@/store/referalSlice";

export default function RedirectPage(){  

  /** Hook Section */
  const searchParams = useSearchParams();
  const params = useParams<{ refererby: string;  }>()
  const router = useRouter();

  /** Store Section */
  const dispatch = useDispatch<AppDispatch>();

  const utm = searchParams.get("utm") || ''; 

  /** Effect Section */
  useEffect(() => {
    if (params.refererby) {
      //api 호출
      dispatch(setReferal(params.refererby));
      dispatch(setUtm(utm.replace(/'/g, "")));

      router.replace("/");
    }
  }, []);

  return null; 
}
