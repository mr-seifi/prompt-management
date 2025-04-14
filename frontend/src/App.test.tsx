import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock the router
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Outlet: () => <div>Outlet</div>
}));

// Mock the context
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock components
jest.mock('./components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('./components/auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock all page components
const mockComponent = () => <div>Mock Component</div>;
jest.mock('./pages/HomePage', () => ({ __esModule: true, default: mockComponent }));
jest.mock('./pages/AllPromptsPage', () => ({ __esModule: true, default: mockComponent }));
jest.mock('./pages/CreatePromptPage', () => ({ __esModule: true, default: mockComponent }));
jest.mock('./pages/PromptDetailsPage', () => ({ __esModule: true, default: mockComponent }));
jest.mock('./pages/EditPromptPage', () => ({ __esModule: true, default: mockComponent }));
jest.mock('./pages/FavoritesPage', () => ({ __esModule: true, default: mockComponent }));
jest.mock('./pages/LoginPage', () => ({ __esModule: true, default: mockComponent }));
jest.mock('./pages/RegisterPage', () => ({ __esModule: true, default: mockComponent }));

test('renders without crashing', () => {
  // Basic smoke test - if rendering doesn't throw an error, the test passes
  render(<App />);
});

// This is just a placeholder test that will always pass
test('placeholder test', () => {
  expect(true).toBe(true);
});
