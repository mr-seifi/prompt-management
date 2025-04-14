import axios from 'axios';

const environment = process.env.REACT_APP_ENVIRONMENT || 'development';
const API_URL = environment === 'production' 
  ? process.env.REACT_APP_PRODUCTION_API_URL + "/auth"  // Use production URL
  : process.env.REACT_APP_API_URL + "/auth" || 'http://localhost:8000/api/auth';  // Fallback to local URL

// Token management
const getToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};
const removeTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Create axios instance with authorization header
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization header to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 responses and attempt to refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          removeTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_URL}/login/refresh/`, {
          refresh: refreshToken
        });
        
        if (response.data.access) {
          setTokens(response.data.access, refreshToken);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        removeTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication service
const authService = {
  register: async (username: string, password: string, password2: string, email: string, firstName: string, lastName: string) => {
    const response = await axiosInstance.post('/register/', {
      username,
      password,
      password2,
      email,
      first_name: firstName,
      last_name: lastName
    });
    return response.data;
  },
  
  login: async (username: string, password: string) => {
    const response = await axiosInstance.post('/login/', {
      username,
      password
    });
    
    if (response.data.access && response.data.refresh) {
      setTokens(response.data.access, response.data.refresh);
    }
    
    return response.data;
  },
  
  logout: async () => {
    try {
      // Try to notify the server about logout
      await axiosInstance.post('/logout/');
    } catch (error) {
      console.warn('Could not notify server about logout:', error);
      // Continue with local logout even if server request fails
    } finally {
      // Always remove the tokens from local storage
      removeTokens();
      console.log('User logged out successfully - tokens removed');
    }
  },
  
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/profile/');
    return response.data;
  },
  
  updateProfile: async (userData: any) => {
    const response = await axiosInstance.patch('/profile/', userData);
    return response.data;
  },
  
  isAuthenticated: () => {
    return !!getToken();
  }
};

export default authService; 