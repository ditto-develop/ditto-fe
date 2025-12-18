import styled from "styled-components"

const NavContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;

  display: flex;
  justify-content: space-between;
  align-items: center;

  width: 100%;
  padding: 16px;
  box-sizing: border-box;

  background-color: var(--Background-Normal-Normal, #E9E6E2);
`;

const IconBox = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconImg = styled.img`
  width: 100%;
  height: 100%;
  display: block;
`;

export default function Nav() {
  return (
    <NavContainer>
      <IconBox>
        <IconImg src="/nav/Arrow.svg" />
      </IconBox>
      <IconBox>
        <IconImg src="/nav/X.svg" />
      </IconBox>
    </NavContainer>
  );
}
