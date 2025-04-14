import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${props => props.theme.typography.fontFamilyBody};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.textPrimary};
    line-height: 1.6;
  }

  a {
    color: ${props => props.theme.colors.accent};
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${props => props.theme.colors.highlight};
    }
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.typography.fontFamilyHeadings};
    margin-bottom: 0.75rem;
    font-weight: ${props => props.theme.typography.fontWeights.semibold};
    line-height: 1.3;
    color: ${props => props.theme.colors.textPrimary};
    letter-spacing: -0.01em;
  }

  h1 {
    font-size: ${props => props.theme.typography.fontSizes.xxxlarge};
    font-weight: ${props => props.theme.typography.fontWeights.bold};
  }

  h2 {
    font-size: ${props => props.theme.typography.fontSizes.xxlarge};
  }

  h3 {
    font-size: ${props => props.theme.typography.fontSizes.xlarge};
  }

  p {
    margin-bottom: 1.2rem;
    color: ${props => props.theme.colors.textSecondary};
    line-height: 1.7;
  }

  input, textarea, select {
    font-family: ${props => props.theme.typography.fontFamilyBody};
    font-size: inherit;
    color: ${props => props.theme.colors.textPrimary};
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: ${props => props.theme.borderRadius.medium};
    padding: 0.75rem;
    background-color: rgba(255, 255, 255, 0.05);
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.accent};
      box-shadow: 0 0 0 3px ${props => props.theme.colors.cardHighlight};
    }
  }

  button {
    font-family: ${props => props.theme.typography.fontFamilyBody};
    font-size: inherit;
    cursor: pointer;
  }

  ::selection {
    background-color: ${props => props.theme.colors.accent};
    color: white;
  }
`;

export default GlobalStyles; 