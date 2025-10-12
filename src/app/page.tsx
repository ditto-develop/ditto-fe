"use client"
import { Blackbutton } from "@/components/Button";
import {ImgContainer, HomeContainer, ButtonContainer} from "@/components/home/Container"
import Image from "next/image";
import { useRouter } from "next/navigation";



export default function Home() {
  const router = useRouter();

  return (
    <>
    <HomeContainer>
      <ImgContainer>
        <Image
          alt="text" 
          src='/dittoGroup.svg'
          width={351}
          height={348}
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
