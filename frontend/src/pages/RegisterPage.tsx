import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const PageContainer = styled.div`
  max-width: 600px;
  margin: 60px auto;
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.card};
  border-radius: calc(${props => props.theme.borderRadius.large} / 2);
  box-shadow: ${props => props.theme.shadows.large};
  
  @media (max-width: 768px) {
    max-width: 90%;
    margin: 30px auto;
    padding: ${props => props.theme.spacing.md};
  }

  @media (max-width: 480px) {
    max-width: 95%;
    margin: 20px auto;
    padding: ${props => props.theme.spacing.sm};
  }
`;

const PageTitle = styled.h1`
  font-size: 3.6rem;
  text-align: center;
  margin-bottom: 2rem;
  color: ${props => props.theme.colors.primary};
  font-weight: ${props => props.theme.typography.fontWeights.bold};

  @media (max-width: 1024px) {
    font-size: 3.15rem;
    margin-bottom: 1.8rem;
  }

  @media (max-width: 768px) {
    font-size: 2.25rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.35rem;
    margin-bottom: 1.2rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};

  @media (max-width: 480px) {
    gap: ${props => props.theme.spacing.sm};
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
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

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
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
  
  &[type="password"],
  &[type="text"] {
    padding-right: 40px;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
    opacity: 0.8;
  }
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.sm};
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    padding: ${props => props.theme.spacing.xs};
    font-size: 0.9rem;
  }
`;

const PasswordRequirements = styled.ul`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: ${props => props.theme.spacing.xs};
  padding-left: 1.2rem;
  
  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
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

  @media (max-width: 480px) {
    padding: ${props => props.theme.spacing.sm};
    font-size: 0.95rem;
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

  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: ${props => props.theme.spacing.xs};
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

  @media (max-width: 768px) {
    margin-top: ${props => props.theme.spacing.md};
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    margin-top: ${props => props.theme.spacing.sm};
    font-size: 0.9rem;
  }
`;

const PasswordInputContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #211951;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 2;
  pointer-events: auto;
  width: 20px;
  height: 20px;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
  
  svg {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 480px) {
    width: 18px;
    height: 18px;
  }
`;

const PasswordSuggestionBox = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: calc(${props => props.theme.borderRadius.medium} / 2);
  padding: ${props => props.theme.spacing.md};
  margin-top: 5px;
  box-shadow: ${props => props.theme.shadows.medium};
  z-index: 10;

  @media (max-width: 480px) {
    padding: ${props => props.theme.spacing.sm};
  }
`;

const SuggestionHeader = styled.div`
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${props => props.theme.colors.textPrimary};
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const HeaderText = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 4px;
  }
`;

const KeyIcon = styled.span`
  color: #211951;
  display: inline-flex;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.2rem;
  padding: 0;
  
  &:hover {
    color: ${props => props.theme.colors.danger};
  }
`;

const SuggestedPassword = styled.div`
  font-family: monospace;
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background};
  border-radius: calc(${props => props.theme.borderRadius.small} / 2);
  color: ${props => props.theme.colors.primary};

  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding: ${props => props.theme.spacing.xs};
  }
`;

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  password2?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSuggestion, setShowPasswordSuggestion] = useState(false);
  const [suggestedPassword, setSuggestedPassword] = useState('');
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Function to generate a secure random password
  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    
    // Ensure at least one of each character type
    let password = '';
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // Add more random characters to complete the password (12 chars total)
    const allChars = lowercase + uppercase + numbers + specialChars;
    for (let i = 0; i < 8; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password characters
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handlePasswordFocus = () => {
    // Only show suggestion if it hasn't been dismissed before
    if (!suggestionDismissed) {
      const newPassword = generateStrongPassword();
      setSuggestedPassword(newPassword);
      setShowPasswordSuggestion(true);
    }
  };
  
  const handleCloseSuggestion = () => {
    setShowPasswordSuggestion(false);
    setSuggestionDismissed(true);
  };
  
  const handleUsePassword = () => {
    // Use the suggested password in both password fields
    setFormData(prev => ({
      ...prev,
      password: suggestedPassword,
      password2: suggestedPassword
    }));
    setShowPasswordSuggestion(false);
    setSuggestionDismissed(true);
    
    // Clear any password-related errors
    setErrors(prev => ({
      ...prev,
      password: undefined,
      password2: undefined
    }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.password2) {
      newErrors.password2 = 'Please confirm your password';
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      await register(
        formData.username,
        formData.password,
        formData.password2,
        formData.email,
        formData.firstName,
        formData.lastName
      );
      navigate('/');
    } catch (err: any) {
      const responseErrors = err.response?.data || {};
      const formattedErrors: FormErrors = {};
      
      // Handle API error responses
      Object.entries(responseErrors).forEach(([key, value]) => {
        formattedErrors[key as keyof FormErrors] = Array.isArray(value) 
          ? (value as string[])[0] 
          : value as string;
      });
      
      if (Object.keys(formattedErrors).length === 0) {
        formattedErrors.general = 'Registration failed. Please try again.';
      }
      
      setErrors(formattedErrors);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <PageTitle>Create an Account</PageTitle>
      
      {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            required
          />
          {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
          {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
        </FormGroup>
        
        <FormRow>
          <FormGroup>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              required
            />
            {errors.firstName && <ErrorMessage>{errors.firstName}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              required
            />
            {errors.lastName && <ErrorMessage>{errors.lastName}</ErrorMessage>}
          </FormGroup>
        </FormRow>
        
        <FormRow>
          <FormGroup>
            <PasswordInputContainer>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onFocus={handlePasswordFocus}
                placeholder="Password"
                required
              />
              <TogglePasswordButton 
                type="button" 
                onClick={togglePasswordVisibility}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.26 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8 5.2L10.17 7.37C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.74 7.01C3.08 8.3 1.78 10.02 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM11.84 9.02L14.99 12.17L15.01 12.01C15.01 10.35 13.67 9.01 12.01 9.01L11.84 9.02Z"/>
                  </svg>
                )}
              </TogglePasswordButton>
              
              {showPasswordSuggestion && (
                <PasswordSuggestionBox>
                  <SuggestionHeader>
                    <HeaderText>
                      <KeyIcon>
                        <svg 
                          width="25" 
                          height="25" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                        </svg>
                      </KeyIcon>
                      <span>Use suggested password</span>
                    </HeaderText>
                    <CloseButton 
                      onClick={handleCloseSuggestion}
                      aria-label="Close password suggestion"
                    >
                      ×
                    </CloseButton>
                  </SuggestionHeader>
                  
                  <SuggestedPassword onClick={handleUsePassword}>
                    {suggestedPassword}
                  </SuggestedPassword>
                </PasswordSuggestionBox>
              )}
            </PasswordInputContainer>
            <PasswordRequirements>
              <li>At least 8 characters long</li>
              <li>Combination of letters and numbers is recommended</li>
            </PasswordRequirements>
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <PasswordInputContainer>
              <Input
                id="password2"
                name="password2"
                type="password"
                value={formData.password2}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
              />
            </PasswordInputContainer>
            {errors.password2 && <ErrorMessage>{errors.password2}</ErrorMessage>}
          </FormGroup>
        </FormRow>
        
        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </SubmitButton>
      </Form>
      
      <BottomText>
        Already have an account? <Link to="/login">Login</Link>
      </BottomText>
    </PageContainer>
  );
};

export default RegisterPage; 