"use client"
import { UsersService } from "@/api";
import { Blackbutton } from "@/components/Button";
import {ImgContainer, HomeContainer, ButtonContainer} from "@/components/home/Container"
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CustomToast } from "@/components/result/Toast";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { setSteper } from "@/store/stepSlice";
import { setWhere } from "@/store/sitemapSlice";


export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const referal = useSelector((state: RootState) => state.referal.value);
  const utm = useSelector((state: RootState) => state.referal.utm);
  const isRevisit = useSelector((state: RootState) => state.referal.isRevisit);

  

  const handleStart = async() => {
      const user = await UsersService.usersControllerStart(referal,utm,isRevisit);
      dispatch(setSteper(false));
      dispatch(setWhere('quiz'));

      if(user.data) {
        router.push('/quiz');
      }
      
      else {
        toast.custom(
            () => (
                <CustomToast aria-live="polite">
                  <div>서버와의 연결을 실패했습니다.</div>
                </CustomToast>
            ),
            { 
                duration: 1500 
            }
        );
      }
  }

  return (
    <>
    <HomeContainer>
      <ImgContainer>
        <Image
          alt="text" 
          src='/homeImg.png'
          width={348}
          height={345}
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
