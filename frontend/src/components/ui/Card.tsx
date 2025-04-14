import React from 'react';
import styled from 'styled-components';

interface CardProps {
  children: React.ReactNode;
  title?: string;
}

const CardContainer = styled.div`
  background-color: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.medium};
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.large};
  }
`;

const CardHeader = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background-color: ${props => props.theme.colors.cardHighlight};
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.typography.fontSizes.large};
  font-weight: ${props => props.theme.typography.fontWeights.semibold};
  color: ${props => props.theme.colors.textPrimary};
  font-family: ${props => props.theme.typography.fontFamilyHeadings};
`;

const CardContent = styled.div`
  padding: ${props => props.theme.spacing.lg};
  font-family: ${props => props.theme.typography.fontFamilyBody};
`;

const Card: React.FC<CardProps> = ({ children, title }) => {
  return (
    <CardContainer>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </CardContainer>
  );
};

export default Card; 