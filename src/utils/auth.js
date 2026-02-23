// src/utils/auth.js

/**
 * Authentication utility functions
 */

// Save authentication data
export const saveAuthData = (token, userData) => {
  localStorage.setItem('university_token', token);
  localStorage.setItem('university_user', JSON.stringify(userData));
};

// Get authentication data
export const getAuthData = () => {
  const token = localStorage.getItem('university_token');
  const userData = localStorage.getItem('university_user');
  
  if (token && userData) {
    try {
      return {
        token,
        user: JSON.parse(userData)
      };
    } catch (error) {
      return null;
    }
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const authData = getAuthData();
  return authData !== null;
};

// Get user role
export const getUserRole = () => {
  const authData = getAuthData();
  return authData?.user?.role || null;
};

// Logout
export const logout = () => {
  localStorage.removeItem('university_token');
  localStorage.removeItem('university_user');
  localStorage.removeItem('redirectAfterLogin');
  window.location.href = '/login';
};

// Check if user has required role
export const hasRole = (requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  
  const userRole = getUserRole();
  return requiredRoles.includes(userRole);
};