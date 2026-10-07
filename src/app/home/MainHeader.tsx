"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";

const Header = styled.div`
    display: flex;
    /*
     * 다른 화면의 상단 내비와 같은 56px(로고 32 + 위아래 12). Figma 2.1 Home 의 Top Navigation.
     * 앱에서는 상태바가 웹뷰 위에 겹친다. 웹에서는 env()가 0이라 12px 그대로다.
     */
    padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
    justify-content: space-between;
    align-items: flex-start;
`;

/*
 * Figma 3177:34042(Leading Button 의 Shape). 60×32 박스 가운데에 워드마크를 46×22 로 둔다.
 * 박스 높이 32 는 그대로라 헤더 56px 도 그대로다.
 */
const LogoBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 32px;
`;

const Logo = styled.img`
    display: block;
    height: 22px;
`;

const AlarmButton = styled.button`
    padding-top: 4px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
`;

const AlarmIcon = styled.img`
    display: block;
`;

export function MainHeader(){
    const router = useRouter();

    return(
        <Header>
            <LogoBox>
                <Logo
                    src="/assets/logo/ditto.svg"
                    alt="ditto"
                />
            </LogoBox>

            <AlarmButton
                type="button"
                aria-label="알림"
                onClick={() => router.push("/notifications")}
            >
                <AlarmIcon
                    src='/icons/navigation/alarm.svg'
                    alt=""
                />
            </AlarmButton>
        </Header>
    )
}
