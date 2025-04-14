import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'accent' | 'highlight';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  outlined?: boolean;
  as?: React.ElementType;
  to?: string; // For React Router Link
  href?: string; // For regular anchor tags
}

const getButtonColor = (variant: ButtonVariant, theme: any, outlined: boolean) => {
  const colorMap = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    danger: theme.colors.danger,
    success: theme.colors.success, 
    accent: theme.colors.accent,
    highlight: theme.colors.highlight
  };
  
  const color = colorMap[variant] || theme.colors.primary;
  
  if (outlined) {
    return css`
      background-color: transparent;
      color: ${color};
      border: 1px solid ${color};
      
      &:hover:not(:disabled) {
        background-color: ${color}15;
      }
    `;
  }
  
  // Text color based on background lightness
  const textColor = variant === 'secondary' ? theme.colors.textPrimary : 'white';
  
  return css`
    background-color: ${color};
    color: ${textColor};
    border: none;
    
    &:hover:not(:disabled) {
      background-color: ${color}DD;
    }
  `;
};

const getButtonSize = (size: string, theme: any) => {
  switch (size) {
    case 'small':
      return css`
        padding: ${theme.spacing.xs} ${theme.spacing.md};
        font-size: ${theme.typography.fontSizes.small};
        border-radius: ${theme.borderRadius.small};
      `;
    case 'medium':
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.lg};
        font-size: ${theme.typography.fontSizes.medium};
        border-radius: ${theme.borderRadius.medium};
      `;
    case 'large':
      return css`
        padding: ${theme.spacing.md} ${theme.spacing.xl};
        font-size: ${theme.typography.fontSizes.medium};
        border-radius: ${theme.borderRadius.medium};
      `;
    default:
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.lg};
        font-size: ${theme.typography.fontSizes.medium};
        border-radius: ${theme.borderRadius.medium};
      `;
  }
};

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: ${props => props.theme.typography.fontFamilyBody};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  transition: all 0.2s ease;
  text-decoration: none;
  box-shadow: ${props => !props.outlined && props.theme.shadows.small};
  letter-spacing: 0.01em;
  
  ${({ variant = 'primary', theme, outlined = false }) => getButtonColor(variant, theme, outlined)}
  ${({ size = 'medium', theme }) => getButtonSize(size, theme)}
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${props => !props.outlined && props.theme.shadows.medium};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  /* Add glow effect for accent button */
  ${({ variant, theme }) => variant === 'accent' && css`
    &:focus {
      box-shadow: 0 0 0 3px ${theme.colors.cardHighlight};
    }
  `}
`;

const Button: React.FC<ButtonProps> = ({ children, ...rest }) => {
  return <StyledButton {...rest}>{children}</StyledButton>;
};

export default Button; 