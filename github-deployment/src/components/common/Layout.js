import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, FileEdit, Clock, FileText, User, LogOut, Menu, X, PlusCircle, HelpCircle, Shield, MessageSquare, ChevronDown, Settings, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DemoBanner from './DemoBanner';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'VASP Search', href: '/search', icon: Search },
    { name: 'Generate Document', href: '/documents/new', icon: FileEdit },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'FAQ', href: '/faq', icon: HelpCircle },
  ];
  
  // User dropdown menu items
  const userNavigation = [
    { name: 'My Profile', href: '/profile', icon: User },
    { name: 'My Templates', href: '/templates', icon: FileText },
    { name: 'Document History', href: '/documents/history', icon: Clock },
    { name: 'My Submissions', href: '/submissions/my', icon: MessageSquare },
  ];
  
  // Add admin portal link for admin users
  const adminNavigation = user?.role === 'ADMIN' ? [
    { name: 'Admin Portal', href: '/admin', icon: Shield }
  ] : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <a href="https://www.theblockaudit.com" target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/logo.png"
                  alt="VASP Legal Assistant Logo"
                  className="h-8 w-8"
                />
              </a>
              <span className="ml-3 text-xl font-semibold text-white">
                VASP Legal Assistant
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-3">
              {[...navigation, ...adminNavigation].map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-center space-x-2 px-5 py-2.5 h-10 min-w-[120px] rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                      isActive
                        ? 'bg-white text-blue-900 shadow-md border border-white/20'
                        : 'bg-blue-800/40 text-white border border-blue-700/50 hover:bg-blue-800/60 hover:border-blue-600/50 hover:shadow-md hover:scale-[1.02]'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4" ref={userMenuRef}>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 h-10 min-w-[140px] rounded-lg text-sm font-medium bg-blue-800/40 text-white border border-blue-700/50 hover:bg-blue-800/60 hover:border-blue-600/50 hover:shadow-md transition-all duration-200 shadow-sm"
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{user?.firstName} {user?.lastName}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{user?.role}</div>
                    </div>
                    
                    {userNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}
                    
                    <div className="border-t">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-blue-800/40 text-white border border-blue-700/50 hover:bg-blue-800/60 transition-all duration-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-blue-800">
              <nav className="space-y-2">
                {/* Main Navigation */}
                {[...navigation, ...adminNavigation].map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-blue-900 shadow-md'
                          : 'text-white bg-blue-800/40 hover:bg-blue-800/60'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* User Navigation - Divider */}
                <div className="border-t border-blue-700 pt-2 mt-2">
                  <div className="px-3 py-2 text-xs uppercase text-blue-300">My Account</div>
                  
                  {/* User Navigation Items */}
                  {userNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-blue-800/40 hover:bg-blue-800/60 transition-all duration-200"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium bg-red-600/90 hover:bg-red-600 text-white mt-3 shadow-sm transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <DemoBanner />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
