"use client"
import { Blackbutton } from "@/components/Button";
import {ImgContainer, HomeContainer, ButtonContainer} from "@/components/home/Container"

import { useRouter } from "next/navigation";



export default function Home() {
  const router = useRouter();

  return (
    <>
    <HomeContainer>
      <ImgContainer>
        <img 
          src='/DittoGroup.svg'
        />
      </ImgContainer>

      <ButtonContainer>
        <Blackbutton
          onClick={()=>{router.push('/quiz')}}
        >시작하기</Blackbutton>
      </ButtonContainer>
    </HomeContainer>
    </>
  );
}
