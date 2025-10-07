import { createGlobalStyle } from 'styled-components';

const ScrollablePageStyle = createGlobalStyle`
  html, body {
    overflow: auto !important;
  }
`;

export default ScrollablePageStyle;