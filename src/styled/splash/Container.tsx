import styled from "styled-components";


export const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--space-4, 16px);
    flex: 1 0 0;
    align-self: stretch;
    min-height: 100vh;
`;

export const ImgContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
`