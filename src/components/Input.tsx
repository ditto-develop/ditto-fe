import { SubNormalText } from "@/styled/Text";
import styled from "styled-components";


const ButtonContainer = styled.div`
    display: flex;
    width: 361px;
    height: 48px;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    border: 1px solid var(--Primary-Normal, #1A1815);
`;

const ButtonInnerContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
`;

export const KakaoShareButton = () => {
    return(
        <ButtonContainer>
            <ButtonInnerContainer>
                <img 
                    src='/logo/kakaologo.svg'
                />
                <SubNormalText>카카오로 계속하기</SubNormalText>
            </ButtonInnerContainer>
        </ButtonContainer>
    )
}