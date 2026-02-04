
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


export default function MainHeader(){
    return(
        <Header>
            <img 
                height={32}
                src='/logo/dittologo.svg'
            />
            
            <img 
                src='/nav/alarm.svg'
                style={{paddingTop: '4px'}}
            />
        </Header>
    )
}