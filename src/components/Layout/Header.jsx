import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Home, 
  FileText, 
  Briefcase,
  UserCircle,
  Settings
} from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('university_token');
    const user = localStorage.getItem('university_user');
    
    if (token && user) {
      try {
        setIsAuthenticated(true);
        setUserData(JSON.parse(user));
      } catch (error) {
        setIsAuthenticated(false);
        setUserData(null);
      }
    } else {
      setIsAuthenticated(false);
      setUserData(null);
    }
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Instructions', href: '/instructions', icon: FileText },
    { name: 'Vacancies', href: '/vacancies', icon: Briefcase },
  ];

  const handleLogout = () => {
    localStorage.removeItem('university_token');
    localStorage.removeItem('university_user');
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem('remember_me');
    
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    
    setIsAuthenticated(false);
    setUserData(null);
    
    navigate('/');
    
    sessionStorage.setItem('logoutMessage', 'You have been successfully logged out.');
  };

  const getUserInitials = () => {
    if (userData?.name) {
      const names = userData.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (userData?.email) {
      return userData.email[0].toUpperCase();
    }
    return 'U';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav className="px-3 mx-auto sm:px-4 lg:px-6 xl:px-8 max-w-7xl">
        <div className="flex justify-between h-16.5">
          {/* Logo and Text */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              {/* Logo */}
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
  <a href="https://www.pdn.ac.lk" target="_blank" rel="noopener noreferrer">
    <img 
      src="/logo.png" 
      alt="University Logo" 
      className="object-contain transition-opacity w-14 h-14 sm:w-16 sm:h-16 hover:opacity-90"
    />
  </a>
</div>

              {/* Text Content - Visible on all screens */}
              <div className="inline-block">
  <h1 className="mt-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-[#6A0C0F] to-[#8A0F13] bg-clip-text text-transparent leading-tight whitespace-nowrap">
    Application Management System
  </h1>
  <div className="w-full bg-[#6A0C0F] rounded px-2 py-1 mt-0.4">
    <p className="text-base sm:text-lg md:text-xl font-semibold text-[#FFD700] text-left whitespace-nowrap">
      University of Peradeniya
    </p>
  </div>
</div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="items-center hidden md:flex">
            {/* Navigation Links */}
            <div className="flex items-center mr-4 space-x-1 lg:space-x-2 xl:space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-1.5 px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg transition-colors ${
                      location.pathname === item.href
                        ? 'bg-primary-50 text-gold-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} className="lg:w-5 lg:h-5" />
                    <span className="text-sm lg:text-base font-medium text-[#470307]">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center px-3 py-1.5 lg:px-4 lg:py-2 space-x-2 lg:space-x-3 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <div className="flex items-center space-x-1.5 lg:space-x-2">
                    <div className="flex items-center justify-center w-8 h-8 text-sm font-semibold text-white rounded-full lg:w-9 lg:h-9 lg:text-base bg-primary-600">
                      {getUserInitials()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {userData?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {userData?.role === 'admin' ? 'Administrator' : 'Applicant'}
                      </p>
                    </div>
                  </div>
                </button>
                
                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 z-50 w-56 py-2 mt-2 bg-white border border-gray-200 shadow-lg lg:w-64 rounded-xl">
                    {/* User Info */}
                    <div className="px-3 py-2 border-b lg:px-4 lg:py-3">
                      <p className="font-medium text-gray-900">{userData?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate lg:text-sm">{userData?.email}</p>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                          {userData?.role || 'applicant'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1 lg:py-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center px-3 py-2 space-x-2 transition-colors lg:px-4 lg:py-3 lg:space-x-3 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Briefcase size={18} className="text-gray-500 lg:w-5 lg:h-5" />
                        <span className="text-sm text-gray-700 lg:text-base">Dashboard</span>
                      </Link>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-3 py-2 space-x-2 transition-colors lg:px-4 lg:py-3 lg:space-x-3 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserCircle size={18} className="text-gray-500 lg:w-5 lg:h-5" />
                        <span className="text-sm text-gray-700 lg:text-base">My Profile</span>
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-3 py-2 space-x-2 transition-colors lg:px-4 lg:py-3 lg:space-x-3 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings size={18} className="text-gray-500 lg:w-5 lg:h-5" />
                        <span className="text-sm text-gray-700 lg:text-base">Settings</span>
                      </Link>
                    </div>
                    
                    {/* Logout Button */}
                    <div className="pt-1 border-t lg:pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 space-x-2 text-sm text-left text-red-600 transition-colors lg:px-4 lg:py-3 lg:space-x-3 lg:text-base hover:bg-red-50"
                      >
                        <LogOut size={18} className="lg:w-5 lg:h-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm lg:text-base font-medium text-[#6A0C0F] border border-[#6A0C0F] rounded-lg hover:bg-[#6A0C0F] hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm lg:text-base font-medium bg-[#6A0C0F] text-[#fffefe] rounded-lg hover:bg-[#8A0F13] transition-colors shadow-md hover:shadow-lg border border-[#FFD700]/30"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="py-4 border-t md:hidden">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 space-x-3 rounded-lg ${
                      location.pathname === item.href
                        ? 'bg-primary-50 text-[#800000]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Auth Section */}
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 mt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 font-semibold text-white rounded-full bg-primary-600">
                        {getUserInitials()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userData?.name || 'User'}</p>
                        <p className="text-sm text-gray-500 truncate">{userData?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    to="/dashboard"
                    className="flex items-center px-4 py-3 space-x-3 text-gray-700 rounded-lg hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Briefcase size={20} />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 space-x-3 text-gray-700 rounded-lg hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserCircle size={20} />
                    <span className="font-medium">My Profile</span>
                  </Link>
                  
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-3 space-x-3 text-gray-700 rounded-lg hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 mt-1 space-x-3 text-left text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="pt-2 mt-1 space-y-2 border-t border-gray-200">
                  <Link
                    to="/login"
                    className="flex items-center justify-center px-4 py-3 font-medium border rounded-lg text-[#800000] border-maroon-800 hover:bg-primary-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center px-4 py-3 font-medium text-white rounded-lg bg-[#800000] hover:bg-maroon-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;