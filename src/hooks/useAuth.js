import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Synchronize state if localStorage is changed in other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return {
    isAuthenticated: !!token,
    token,
    login,
    logout
  };
};