import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import pages
import HomePage from './pages/HomePage';
import AllPromptsPage from './pages/AllPromptsPage';
import CreatePromptPage from './pages/CreatePromptPage';
import PromptDetailsPage from './pages/PromptDetailsPage';
import EditPromptPage from './pages/EditPromptPage';
import FavoritesPage from './pages/FavoritesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const NotFound = () => (
  <div style={{ textAlign: 'center', padding: '2rem' }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
);

// Wrapper component to provide Layout with children
const LayoutWrapper = () => (
  <Layout>
    <Outlet />
  </Layout>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<LayoutWrapper />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/prompts" element={<AllPromptsPage />} />
              <Route path="/prompts/new" element={<CreatePromptPage />} />
              <Route path="/prompts/:id" element={<PromptDetailsPage />} />
              <Route path="/prompts/:id/edit" element={<EditPromptPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
