"use client"
import { UsersService } from "@/api";
import { Blackbutton } from "@/components/Button";
import {ImgContainer, HomeContainer, ButtonContainer} from "@/components/home/Container"
import Image from "next/image";
import { useRouter } from "next/navigation";
import { OpenAPI } from "@/api";



export default function Home() {
  const router = useRouter();

  const handleStart = async() => {
      const user = await UsersService.usersControllerStart();
      if(user.data) {
        //console.log(user.data.user.id)
        //OpenAPI.TOKEN = user.data.user.id || '';
        router.push('/quiz');
      }
      else {
        alert("서버인증실패(알러트수정예정)");
      }
  }

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
          onClick={handleStart}
        >시작하기</Blackbutton>
      </ButtonContainer>
    </HomeContainer>
    </>
  );
}
