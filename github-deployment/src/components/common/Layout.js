import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, FileEdit, Clock, FileText, User, LogOut, Menu, X, PlusCircle, HelpCircle, Shield, MessageSquare, ChevronDown, Settings, Trophy, FileStack, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DemoBanner from './DemoBanner';
import { contributorAPI } from '../../services/api';
import { ToastContainer } from './Toast';
import SurveyReminderPopup from './SurveyReminderPopup';
import { isAdmin } from '../../utils/auth';
import OnboardingTour from './OnboardingTour';
import MilestoneFeedbackPopup from './MilestoneFeedbackPopup';
import LeaderboardAchievementPopup from './LeaderboardAchievementPopup';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userPoints, setUserPoints] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const userMenuRef = useRef(null);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Search VASP', href: '/search', icon: Search },
    { name: 'Generate Request', href: '/documents/create', icon: FileText },
    { name: 'FAQ', href: '/faq', icon: HelpCircle },
  ];
  
  // User dropdown menu items
  const userNavigation = [
    { name: 'My Profile', href: '/profile', icon: User },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'My Templates', href: '/templates', icon: FileText },
    { name: 'Batch Documents', href: '/documents/batch', icon: FileStack },
    { name: 'Document History', href: '/documents/history', icon: Clock },
    { name: 'Decrypt Document', href: '/documents/decrypt', icon: Shield },
    { name: 'My Submissions', href: '/submissions/my', icon: MessageSquare },
  ];

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
  
  // Fetch user points
  useEffect(() => {
    if (user && !user.leaderboardOptOut) {
      contributorAPI.getUserScore()
        .then(data => setUserPoints(data.totalPoints))
        .catch(() => setUserPoints(null));
    }
  }, [user, location]); // Refetch on route change
  
  // Check for onboarding
  useEffect(() => {
    // Check for permanent opt-out first
    const permanentOptOut = localStorage.getItem('tutorialPermanentOptOut') === 'true' || user?.tutorialOptOut;
    
    // Check if tutorial restart was requested
    const restartRequested = localStorage.getItem('restartTutorial');
    if (restartRequested) {
      localStorage.removeItem('restartTutorial');
      // Only show if not permanently opted out
      if (!permanentOptOut) {
        // Add a small delay to ensure page is fully loaded
        setTimeout(() => setShowOnboarding(true), 500);
      }
      return;
    }
    
    // Don't show if permanently opted out
    if (permanentOptOut) {
      return;
    }
    
    // Demo users always get the tutorial on login
    if (user?.role === 'DEMO') {
      const demoTutorialShown = sessionStorage.getItem('demoTutorialShown');
      if (!demoTutorialShown) {
        sessionStorage.setItem('demoTutorialShown', 'true');
        sessionStorage.setItem('onboardingInProgress', 'true');
        setTimeout(() => setShowOnboarding(true), 500);
      }
      return;
    }
    
    // Regular users only get onboarding on first login
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    const onboardingInProgress = sessionStorage.getItem('onboardingInProgress');
    
    if (!hasCompletedOnboarding && !onboardingInProgress) {
      sessionStorage.setItem('onboardingInProgress', 'true');
      // Add a small delay to ensure page is fully loaded
      setTimeout(() => setShowOnboarding(true), 500);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour 
          isDemo={user?.role === 'DEMO'}
          onComplete={() => {
            setShowOnboarding(false);
            sessionStorage.removeItem('onboardingInProgress');
          }} 
        />
      )}
      
      {/* Navigation */}
      <header className="bg-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo and Title */}
            <div className="flex items-start">
              <div className="flex-shrink-0 text-center">
                <a href="https://www.theblockaudit.com" target="_blank" rel="noopener noreferrer">
                  <img
                    src="/images/logo.png"
                    alt="VASP Records Assistant Logo"
                    className="h-14 w-auto bg-white rounded-md px-3 py-1 shadow-md object-contain"
                    style={{ minWidth: '200px', maxWidth: '260px' }}
                  />
                </a>
                <div className="mt-2 text-lg font-semibold text-white">
                  VASP Records Assistant
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-center space-x-2 px-4 py-2.5 h-10 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                      isActive
                        ? 'bg-white text-blue-900 shadow-md border border-white/20'
                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:shadow-md hover:scale-[1.02] backdrop-blur-sm'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-2" ref={userMenuRef}>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 h-10 rounded-lg text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:shadow-md transition-all duration-200 shadow-sm backdrop-blur-sm"
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{user?.firstName} {user?.lastName}</span>
                  {userPoints !== null && (
                    <span className="flex items-center space-x-1 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                      <Star className="h-3 w-3" />
                      <span>{userPoints}</span>
                    </span>
                  )}
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
                    
                    {isAdmin() && (
                      <div className="border-t border-gray-100">
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 font-medium"
                        >
                          <Shield className="h-4 w-4 mr-3" />
                          Admin Portal
                        </Link>
                      </div>
                    )}
                    
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
              className="md:hidden p-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-blue-800">
              <nav className="space-y-2">
                {/* Main Navigation */}
                {navigation.map((item) => {
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
                          : 'text-white bg-white/10 hover:bg-white/20 border border-white/10'
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
                        className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-200"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                  
                  {/* Admin Portal Button */}
                  {isAdmin() && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium bg-red-800/90 hover:bg-red-700 text-white mt-3 shadow-sm transition-all duration-200"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Portal</span>
                    </Link>
                  )}
                  
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
      <ToastContainer />
      <SurveyReminderPopup />
      <MilestoneFeedbackPopup />
      <LeaderboardAchievementPopup />
    </div>
  );
};

export default Layout;
