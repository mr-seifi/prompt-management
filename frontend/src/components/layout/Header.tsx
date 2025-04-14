import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: ${props => props.theme.colors.primary};
  color: white;
  box-shadow: ${props => props.theme.shadows.medium};
`;

const LogoLink = styled(Link)`
  text-decoration: none;
  color: white;
  display: flex;
  align-items: center;
`;

const Logo = styled.h1`
  margin: 0;
  font-size: ${props => props.theme.typography.fontSizes.xlarge};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  transition: transform 0.2s ease-in-out;
  color: white;
  font-family: ${props => props.theme.typography.fontFamilyHeadings};

  @media (max-width: 768px) {
    font-size: ${props => props.theme.typography.fontSizes.large};
  }

  @media (max-width: 480px) {
    font-size: ${props => props.theme.typography.fontSizes.medium};
  }

  &:hover {
    transform: scale(1.05);
  }
`;

const LogoHighlight = styled.span`
  color: ${props => props.theme.colors.accent};
`;

const Nav = styled.nav`
  display: flex;
  gap: ${props => props.theme.spacing.lg};
  align-items: center;

  @media (max-width: 768px) {
    gap: ${props => props.theme.spacing.md};
  }

  @media (max-width: 480px) {
    gap: ${props => props.theme.spacing.sm};
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  font-family: ${props => props.theme.typography.fontFamilyBody};
  font-size: ${props => props.theme.typography.fontSizes.medium};
  position: relative;
  padding: 0.25rem 0;
  transition: all 0.2s;
  
  &:after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: 0;
    left: 0;
    background-color: ${props => props.theme.colors.accent};
    transition: width 0.3s ease;
  }

  &:hover {
    opacity: 1;
    color: ${props => props.theme.colors.accent};
    
    &:after {
      width: 100%;
    }
  }
`;

const LogoutButton = styled.button`
  background: transparent;
  border: 2px solid ${props => props.theme.colors.accent};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.medium};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.accent};
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const UserName = styled.span`
  color: white;
  font-size: ${props => props.theme.typography.fontSizes.small};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { state: { message: 'You have been logged out successfully' } });
    } catch (error) {
      console.error('Failed to log out', error);
      navigate('/login');
    }
  };
  
  return (
    <HeaderContainer>
      <LogoLink to="/">
        <Logo>Prompt <LogoHighlight>Manager</LogoHighlight></Logo>
      </LogoLink>
      <Nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/prompts">All Prompts</NavLink>
        <NavLink to="/prompts/new">Create New</NavLink>
        <NavLink to="/favorites">Favorites</NavLink>
        
        {currentUser && (
          <UserInfo>
            <UserName>
              {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser.email}
            </UserName>
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
          </UserInfo>
        )}
      </Nav>
    </HeaderContainer>
  );
};

export default Header; 