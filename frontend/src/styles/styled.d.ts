import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      textPrimary: string;
      textSecondary: string;
      textTertiary: string;
      background: string;
      card: string;
      success: string;
      danger: string;
      warning: string;
      gradient: string;
      accent: string;
      highlight: string;
      cardHighlight: string;
      cardHelpHighlight: string;
      neonHighlight: string;
    };
    shadows: {
      small: string;
      medium: string;
      large: string;
    };
    borderRadius: {
      small: string;
      medium: string;
      large: string;
    };
    typography: {
      fontFamily: string;
      fontFamilyHeadings: string;
      fontFamilyBody: string;
      fontSizes: {
        small: string;
        medium: string;
        large: string;
        xlarge: string;
        xxlarge: string;
        xxxlarge: string;
      };
      fontWeights: {
        regular: number;
        medium: number;
        semibold: number;
        bold: number;
      };
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
  }
} 