import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Home' },
    { path: '/project-overview', label: 'Project Overview' },
    { path: '/rcms', label: 'RCMS' },
    { path: '/research-publications', label: 'Research & Publications' },
    { path: '/project-team', label: 'Project Team' },
    { path: '/contact-us', label: 'Contact Us' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' : 'bg-white shadow-md py-3'
    }`}>
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo and University Name - Using local logo from public folder */}
          <Link to="/" className="flex items-center space-x-3 group">
            {/* Local logo from public folder */}
            <div className="flex items-center justify-center w-12 h-12 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-md">
              <img 
                src="./logo.png" 
                alt="University of Peradeniya" 
                className="object-contain w-full h-full p-1"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-primary-600 font-bold text-lg">UoP</span>';
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-xl font-bold text-primary-900">AI-RCMS</span>
                <span className="ml-2 text-xs bg-secondary-500 text-primary-900 px-2 py-0.5 rounded-full font-semibold">
                  Grant 515
                </span>
              </div>
              <span className="text-xs tracking-wide text-gray-600">
                University of Peradeniya
              </span>
            </div>
          </Link>

          {/* Desktop Menu - Always visible */}
          <div className="items-center hidden space-x-1 lg:flex">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'text-secondary-600 bg-secondary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 transition-colors rounded-lg lg:hidden hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isOpen ? <Menu className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden bg-white border border-gray-100 shadow-xl lg:hidden rounded-xl"
            >
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 border-b last:border-0 transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;