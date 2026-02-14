import styled from "styled-components";
import { BaseText } from "./Text";

/*
 * Layout Components
 * Figma: List, Section structures
 */

export const List = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--color-semantic-background-normal-normal);
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 0;
  gap: 8px;
`;

export const Heading = styled(BaseText).attrs({ as: "h3" })`
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-semantic-label-alternative);
  text-transform: uppercase;
  margin-bottom: 8px;
`;

export const LayoutPage = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: var(--color-semantic-background-normal-normal);
`;
