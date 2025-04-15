import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const PageContainer = styled.div`
  max-width: 500px;
  margin: 80px auto;
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.card};
  border-radius: calc(${props => props.theme.borderRadius.large} / 2);
  box-shadow: ${props => props.theme.shadows.large};
  
  @media (max-width: 768px) {
    max-width: 90%;
    margin: 40px auto;
    padding: ${props => props.theme.spacing.md};
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2rem;
  color: ${props => props.theme.colors.primary};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  width: 100%;
  
  @media (max-width: 768px) {
    align-items: flex-start;
    gap: 4px;
  }
`;

const Label = styled.label`
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${props => props.theme.colors.textPrimary};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.md};
  border-radius: calc(${props => props.theme.borderRadius.medium} / 2);
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}30;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
    opacity: 0.8;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    padding: ${props => props.theme.spacing.sm};
    font-size: 0.95rem;
  }
`;

const SubmitButton = styled.button`
  background-color: ${props => props.theme.colors.accent};
  color: white;
  border: none;
  border-radius: calc(${props => props.theme.borderRadius.medium} / 2);
  padding: ${props => props.theme.spacing.md};
  font-size: 1rem;
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  cursor: pointer;
  margin-top: ${props => props.theme.spacing.md};
  transition: background-color 0.2s, transform 0.1s;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    margin: ${props => props.theme.spacing.md} auto 0;
    display: block;
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  background-color: ${props => props.theme.colors.danger}15;
  padding: ${props => props.theme.spacing.sm};
  border-radius: calc(${props => props.theme.borderRadius.small} / 2);
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
`;

const SuccessMessage = styled.div`
  color: ${props => props.theme.colors.success};
  background-color: ${props => props.theme.colors.success}15;
  padding: ${props => props.theme.spacing.sm};
  border-radius: calc(${props => props.theme.borderRadius.small} / 2);
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
`;

const BottomText = styled.p`
  text-align: center;
  margin-top: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.textSecondary};
  
  a {
    color: ${props => props.theme.colors.accent};
    text-decoration: none;
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to home
  const from = (location.state as any)?.from?.pathname || '/';
  
  // Check for logout message in location state
  useEffect(() => {
    const message = (location.state as any)?.message;
    if (message) {
      setSuccessMessage(message);
      // Clear the state so message doesn't reappear on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null); // Clear any success message when attempting login
      await login(username, password);
      // Navigate with state to trigger the typing animation
      navigate(from, { 
        replace: true,
        state: { justLoggedIn: true }
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <PageTitle>Welcome Back</PageTitle>
      
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </FormGroup>
        
        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </SubmitButton>
      </Form>
      
      <BottomText>
        Don't have an account? <Link to="/register">Register</Link>
      </BottomText>
    </PageContainer>
  );
};

export default LoginPage; 