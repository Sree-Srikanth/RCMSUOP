import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  // Get authentication state
  const isAuthenticated = localStorage.getItem('university_token') !== null;
  
  // Get user data if authenticated
  let userData = null;
  if (isAuthenticated) {
    try {
      userData = JSON.parse(localStorage.getItem('university_user') || '{}');
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header isAuthenticated={isAuthenticated} userData={userData} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;