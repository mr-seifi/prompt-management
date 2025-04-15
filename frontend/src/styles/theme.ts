// Color palette: https://colorhunt.co/palette/211951836fff15f5baf0f3ff
const theme = {
  colors: {
    // Primary colors
    primary: '#211951',      // Deep purple
    secondary: '#211951',    // Deep purple
    
    // Accent colors
    accent: '#15F5BA',       // Mint green
    highlight: '#211951',    // Deep purple
    
    // Text colors
    textPrimary: '#211951',  // Deep purple for headings on light backgrounds
    textSecondary: '#555555', // Medium gray for body text
    textTertiary: '#ffffff', // White for body text
    
    // UI colors
    background: '#F0F3FF',   // Very light blue background
    card: '#FFFFFF',         // White card background
    success: '#15F5BA',      // Mint green for success states (matching accent)
    danger: '#FF5252',       // Red for alerts/errors
    warning: '#FFC107',      // Amber for warnings
    
    // Gradients and accents
    gradient: 'linear-gradient(135deg, #211951 0%, #211951 100%)',
    cardHighlight: 'rgba(33, 25, 81, 0.15)', // Subtle deep purple highlight
    cardHelpHighlight: 'rgba(59, 55, 81, 0.8)', // Subtle deep purple highlight
    neonHighlight: 'rgba(21, 245, 186, 0.15)',  // Subtle mint highlight
  },
  shadows: {
    small: '0 2px 6px rgba(33, 25, 81, 0.1)',
    medium: '0 4px 12px rgba(33, 25, 81, 0.15)',
    large: '0 8px 24px rgba(33, 25, 81, 0.2)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
  typography: {
    fontFamily: "'Poppins', 'Helvetica', sans-serif",
    fontFamilyHeadings: "'Poppins', 'Helvetica', sans-serif",
    fontFamilyBody: "'Poppins', 'Helvetica', sans-serif",
    fontSizes: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.25rem',
      xlarge: '1.5rem',
      xxlarge: '2rem',
      xxxlarge: '2.5rem',
    },
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  }
};

export default theme; 