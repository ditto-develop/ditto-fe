
/**
 * 26/01/09 Todo : 
 * MainHeader Nav bar 개발
 */

import styled from "styled-components"


const Header = styled.div`
    display: flex;
    padding: 16px;
    justify-content: space-between;
    align-items: flex-start;
`;

const AlarmIcon = styled.img`
    padding-top: 4px;
`;

export function MainHeader(){
  console.log('[src/app/home/MainHeader.tsx] MainHeader'); // __component_log__
    return(
        <Header>
            <img 
                height={32}
                src="/assets/logo/ditto.svg"
                alt="Ditto"
            />
            
            <AlarmIcon
                src='/icons/navigation/alarm.svg'
                alt="알림"
            />
        </Header>
    )
}
