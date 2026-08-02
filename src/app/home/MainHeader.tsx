"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";

const Header = styled.div`
    display: flex;
    padding: 16px;
    justify-content: space-between;
    align-items: flex-start;
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
            <img
                height={32}
                src="/assets/logo/ditto.svg"
                alt="Ditto"
            />

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
