import styled from "styled-components"

export const MainContainer = styled.div`
  padding: 64px 0px;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr 2fr 1fr;
  align-content: space-between;
  place-items: center;
`


export const CheckContainer = styled.div`
    display: flex;
    gap: 10px;
    align-items: center; 
`;


export const BottomContainer = styled.div`
    padding: 0px 24px;
    display: grid;
    gap: 12px;
`;