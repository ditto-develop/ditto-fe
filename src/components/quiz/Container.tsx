"use client"
import styled from "styled-components";

const MainContainer = styled.div`
  padding: 160px 0px;
  display: grid;
  gap: 80px;
  place-items: center;
  grid-template-rows: 1fr 0.5fr 0.5fr;
`

const InfomationContainer = styled.div`
  display: grid;
  gap: 16px;
  padding: 60px 10px;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 16px;
`;

export {MainContainer,InfomationContainer,ButtonContainer}