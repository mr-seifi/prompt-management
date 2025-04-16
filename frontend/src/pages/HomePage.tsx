import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';



const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    flex-direction: column;
    height: auto;
    text-align: center;
  }
`;

const WelcomeSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 ${props => props.theme.spacing.xl};
  text-align: center;
  margin-top: -140px;
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.lg} 0;
    margin-top: 0;
  }
`;

interface TypewriterTextProps {
  isTyping: boolean;
}

const TypewriterText = styled.h1<TypewriterTextProps>`
  font-size: 4.5rem;
  color: ${props => props.theme.colors.textPrimary};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  line-height: 1.1;
  margin: 0;
  max-width: 800px;
  text-align: center;
  min-height: 10rem; /* Increased height for multiple lines */
  white-space: pre-wrap; /* Changed from nowrap to pre-wrap to allow line breaks */
  overflow: hidden;
  margin: 0 auto;
  letter-spacing: 0.05em; /* Reduced from 0.15em to 0.05em */
  
  /* Only add the blinking cursor on the last line when typing */
  &:after {
    content: ${props => props.isTyping ? "'|'" : "''"};
    animation: ${props => props.isTyping ? 'blink-caret .75s step-end infinite' : 'none'};
    color: ${props => props.theme.colors.accent};
  }
  
  @keyframes blink-caret {
    from, to { opacity: 0 }
    50% { opacity: 1 }
  }
  
  @media (max-width: 1250px) {  
    margin-bottom: 0;
    font-size: 4rem;
  }
    @media (max-width: 1025px) {
    margin-bottom: ${props => props.theme.spacing.xl};
    font-size: 3.5rem;
  }
    @media (max-width: 920px) {
    margin-bottom: 0;
    font-size: 2.5rem;
  }
  }
    @media (max-width: 816px) {
    margin-bottom: ${props => props.theme.spacing.xl};
    font-size: 2.5rem;
  }
`;

const ImageSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-top: -140px;
  
  @media (max-width: 768px) {
    margin-top: 0;
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 480px;
  height: 480px;
  
  @media (max-width: 1250px) {
    width: 400px;
    height: 400px;
  }
    @media (max-width: 1000px) {
    width: 350px;
    height: 350px;
  }
    @media (max-width: 870px) {
    width: 300px;
    height: 300px;
  }
    @media (max-width: 770px) {
    width: 350px;
    height: 350px;
  }
    @media (max-width: 440px) {
    width: 300px;
    height: 300px;
  }
`;

const PromptImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%; /* Make image circular */
  object-fit: cover;
  box-shadow: ${props => props.theme.shadows.large};
`;

const ButtonsContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none; /* Allows clicking through to the image */
`;

const RoundButton = styled.button`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.accent};
  border: none;
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${props => props.theme.shadows.medium};
  transition: all 0.2s ease;
  position: absolute;
  pointer-events: auto; /* Makes buttons clickable */
  
  &:hover {
    transform: scale(1.1);
  }
  
  /* Button positioning for circular arc in 0-90 degree quadrant */
  /* Button at 0 degrees (3 o'clock position) */
  &:nth-child(1) {
    top: 50%;
    right: -36px;
    transform: translateY(-50%);
    background-color: ${props => props.theme.colors.accent};
  }
  
  /* Button at 30 degrees */
  &:nth-child(2) {
    top: calc(50% - 120px); /* 50% - (radius * sin(30°)) */
    right: -18px; /* Negative value: radius * (1 - cos(30°)) */
    background-color: ${props => props.theme.colors.highlight};
  }
  
  /* Button at 60 degrees */
  &:nth-child(3) {
    top: calc(50% - 208px); /* 50% - (radius * sin(60°)) */
    right: 36px; /* radius * (1 - cos(60°)) */
    background-color: ${props => props.theme.colors.primary};
  }
  
  /* Button at 90 degrees (12 o'clock position) */
  &:nth-child(4) {
    top: calc(50% - 280px); /* Moved 10px up from previous position */
    right: 120px;
    background-color: ${props => props.theme.colors.success};
  }
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 1.44rem;
    
    /* Adjust positions for smaller screens */
    &:nth-child(1) {
      right: -30px;
    }
    
    &:nth-child(2) {
      top: calc(50% - 90px);
      right: -15px;
    }
    
    &:nth-child(3) {
      top: calc(50% - 156px);
      right: 27px;
    }
    
    &:nth-child(4) {
      top: calc(50% - 220px); /* Moved 10px up from previous position */
      right: 90px;
    }
  }
`;

// Modal components with proper TypeScript interfaces
interface ModalOverlayProps {
  isClosing?: boolean;
}

const ModalOverlay = styled.div<ModalOverlayProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: ${props => props.isClosing ? 0 : 1};
  transition: opacity 0.6s ease-in-out;
`;

interface ModalContentProps {
  slideIn?: boolean;
}

const ModalContent = styled.div<ModalContentProps>`
  background-color: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  width: 500px;
  max-width: 90%;
  box-shadow: ${props => props.theme.shadows.large};
  transform: translateX(${props => props.slideIn ? 0 : '100%'});
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
`;

interface SlideInPanelProps {
  isOpen: boolean;
}

const SlideInPanel = styled.div<SlideInPanelProps>`
  position: fixed;
  top: 0;
  right: 0;
  width: 500px;
  max-width: 90%;
  height: 100%;
  background-color: ${props => props.theme.colors.card};
  box-shadow: ${props => props.theme.shadows.large};
  z-index: 1000;
  transform: translateX(${props => props.isOpen ? 0 : '100%'});
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PanelTitle = styled.h2`
  color: ${props => props.theme.colors.textPrimary};
  margin: 0;
`;

const PanelContent = styled.div`
  padding: ${props => props.theme.spacing.lg};
  flex: 1;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.textPrimary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: ${props => props.theme.colors.textPrimary};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: ${props => props.theme.colors.textPrimary};
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
  }
`;

const TextArea = styled.textarea`
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: ${props => props.theme.colors.textPrimary};
  font-size: 1rem;
  min-height: 150px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
  }
`;

const SubmitButton = styled.button`
  background-color: ${props => props.theme.colors.accent};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  font-size: 1rem;
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary};
  }
`;

// Search results list
const SearchResultsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SearchResultItem = styled.li`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

// Message component
const Message = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: ${props => props.theme.colors.success};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.medium};
  z-index: 1000;
`;

const HomePage: React.FC = () => {
  // State for modal visibility and type
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'search' | 'edit' | 'favorite'>('search');
  const [message, setMessage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Text state with no animation
  const [displayText] = useState('Welcome to your Prompt Manager');
  const [isTyping] = useState(false);
  
  // Mock data for search results
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchResults, setSearchResults] = useState([
    { id: 1, title: 'Writing Assistant Prompt', content: 'Help me write a professional email...' },
    { id: 2, title: 'Creative Story Starter', content: 'Generate an opening paragraph for a sci-fi story...' },
    { id: 3, title: 'Code Review Request', content: 'Review this React component for best practices...' },
  ]);
  
  // Mock data for favorite prompts
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [favorites, setFavorites] = useState([
    { id: 2, title: 'Creative Story Starter', content: 'Generate an opening paragraph for a sci-fi story...' },
  ]);
  
  // Control body overflow when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [modalOpen]);
  
  const openModal = (type: 'add' | 'search' | 'edit' | 'favorite') => {
    if (type === 'add') {
      navigate('/prompts/new');
    } else {
      setModalType(type);
      setModalOpen(true);
    }
  };
  
  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setIsClosing(false);
    }, 600);
  };
  
  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };
  
  // Mock form submission handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would perform an actual search
    showMessage('Search completed!');
    // Keep the modal open to show results
  };
  
  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would update the prompt
    showMessage('Prompt updated successfully!');
    closeModal();
  };
  
  return (
    <PageContainer>
      <WelcomeSection>
        <TypewriterText isTyping={isTyping}>
          {displayText}
        </TypewriterText>
      </WelcomeSection>
      
      <ImageSection>
        <ImageWrapper>
          <PromptImage 
            src="https://static.vecteezy.com/system/resources/previews/035/631/599/non_2x/man-using-laptop-surfing-internet-searching-information-email-checking-hand-drawn-style-illustrations-isolated-on-white-background-vector.jpg" 
            alt="Man using laptop computer"
          />
          <ButtonsContainer>
          </ButtonsContainer>
        </ImageWrapper>
      </ImageSection>
      
      {/* Modals for other actions */}
      {modalOpen && (
        <ModalOverlay onClick={closeModal} isClosing={isClosing}>
          <ModalContent onClick={e => e.stopPropagation()} slideIn={!isClosing}>
            <ModalHeader>
              <ModalTitle>
                {modalType === 'search' && 'Search Prompts'}
                {modalType === 'edit' && 'Edit Prompt'}
                {modalType === 'favorite' && 'Favorite Prompts'}
              </ModalTitle>
              <CloseButton onClick={closeModal}>✕</CloseButton>
            </ModalHeader>
            
            {modalType === 'search' && (
              <>
                <Form onSubmit={handleSearch}>
                  <Input placeholder="Search for prompts..." autoFocus />
                  <SubmitButton type="submit">Search</SubmitButton>
                </Form>
                <SearchResultsList>
                  {searchResults.map(result => (
                    <SearchResultItem key={result.id}>
                      <h3>{result.title}</h3>
                      <p>{result.content.substring(0, 50)}...</p>
                    </SearchResultItem>
                  ))}
                </SearchResultsList>
              </>
            )}
            
            {modalType === 'edit' && (
              <Form onSubmit={handleEdit}>
                <Input placeholder="Prompt Title" defaultValue="Creative Story Starter" required />
                <TextArea 
                  placeholder="Enter your prompt content here..." 
                  defaultValue="Generate an opening paragraph for a sci-fi story..."
                  required 
                />
                <SubmitButton type="submit">Update Prompt</SubmitButton>
              </Form>
            )}
            
            {modalType === 'favorite' && (
              <SearchResultsList>
                {favorites.length > 0 ? (
                  favorites.map(favorite => (
                    <SearchResultItem key={favorite.id}>
                      <h3>{favorite.title}</h3>
                      <p>{favorite.content.substring(0, 50)}...</p>
                    </SearchResultItem>
                  ))
                ) : (
                  <p>No favorite prompts yet. Star some prompts to see them here!</p>
                )}
              </SearchResultsList>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Toast message */}
      {message && <Message>{message}</Message>}
    </PageContainer>
  );
};

export default HomePage; 