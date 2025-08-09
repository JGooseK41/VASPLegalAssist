import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import './OnboardingTour.css';

const OnboardingTour = ({ onComplete, isDemo = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({});
  const [highlightBounds, setHighlightBounds] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPermanentOptOut, setShowPermanentOptOut] = useState(false);
  const navigationCountRef = useRef(0);

  const steps = [
    {
      title: "Welcome to VASP Legal Assistant! 🚀",
      content: "The world's first crowdsourced platform for cryptocurrency legal requests. Built by investigators, for investigators. Let's walk through how to use the platform effectively.",
      target: null,
      position: 'center',
      page: '/'
    },
    {
      title: "Step 1: Start Your Investigation 🔍",
      content: "Begin by searching our crowdsourced database of 100+ VASPs. Type exchange names like 'Binance', 'Coinbase', or search by jurisdiction. Updated by investigators worldwide!",
      target: '[data-tour="search-vasp"]',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "LEO Friendly Score System 📊",
      content: "See the green/yellow/red grades? That's our LEO Friendly Score - showing how cooperative each VASP is. Grade A means fast responses and easy process. Grade F means expect challenges.",
      target: '[data-tour="vasp-card"] div.flex.justify-end > div',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Service Type Intelligence 🏷️",
      content: "Click any service badge (CEX, DEX, P2P) to see what evidence is available. CEX has full KYC, DEX has limited data, P2P varies. Hover for quick info, click for full guide!",
      target: '[data-tour="vasp-card"] .flex.flex-wrap.gap-1',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Required Documents at a Glance 📋",
      content: "Color coding shows what each VASP requires: Green (Letterhead) = Easy, Yellow (Subpoena) = Medium, Orange (Search Warrant) = Hard, Red (MLAT) = Complex. Know before you submit!",
      target: '[data-tour="vasp-card"] .bg-white.rounded-b-lg',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Generate Your First Document ⚡",
      content: "Click 'Generate Request' to create freeze orders or records requests. The system auto-fills compliance emails, addresses, and jurisdiction data from the crowdsourced database.",
      target: '[data-tour="generate-request"]',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Simple vs Custom Mode 🎯",
      content: "Simple Mode: Quick forms for standard requests. Custom Mode: Use your agency's templates with smart tags like {{CASE_NUMBER}}. Most users start with Simple Mode.",
      target: '[data-tour="document-mode"]',
      position: 'bottom',
      page: '/documents/simple'
    },
    {
      title: "Batch Processing Power 📊",
      content: "Have multiple addresses? Upload a CSV with up to 100 transactions. Generate personalized documents for each VASP in seconds. Perfect for complex investigations!",
      target: '[data-tour="batch-import"]',
      position: 'bottom',
      page: '/documents/batch'
    },
    {
      title: "Smart Template Library 📚",
      content: "Access templates shared by other agencies. Filter by domain (.gov, .mil) or create your own. Each template use earns the creator points - encouraging knowledge sharing!",
      target: '[data-tour="community-tab"]',
      position: 'top',
      page: '/templates'
    },
    {
      title: "Client-Side Encryption 🔐",
      content: "Your templates and documents are encrypted in your browser before storage. Only you have the key - even admins can't see your data. Download backups anytime for agency records.",
      target: '[data-tour="recent-documents"]',
      position: 'top',
      page: '/'
    },
    {
      title: "Track Your Results 📈",
      content: "See community response stats here! After sending requests, contribute your outcomes to help others know success rates, turnaround times, and tips for each VASP.",
      target: '[data-tour="vasp-card"] div:has(> [class*="Success"]):has(> [class*="responses"])',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Community Comments 💬",
      content: "Check comments on each VASP for insider tips. 'Use badge number in subject line' or 'Requires notarization' - learn from others' experiences before you submit!",
      target: '.border-t.border-gray-200',
      position: 'top',
      page: '/search'
    },
    {
      title: "Earn Recognition Points 🏆",
      content: "Contributing helps everyone! Earn 10 points for VASP updates, 5 for response feedback, 1 for helpful comments. Check the point structure and top contributors here.",
      target: '.bg-white.rounded-lg.p-6:has(h3:contains("How Points Are Earned"))',
      position: 'top',
      page: '/leaderboard'
    },
    {
      title: "Update VASP Information 🔄",
      content: "Found a new compliance email? Required document changed? Click 'Update Info' to submit changes. Admin-verified updates keep our database accurate for all users.",
      target: '[data-tour="vasp-card"] button.bg-gray-600',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Start Your First Request! 🎯",
      content: "You're ready! Search for a VASP, click 'Generate Request', and create your document. The crowdsourced data helps streamline the legal request process.",
      target: '[data-tour="quick-links"]',
      position: 'top',
      page: '/'
    }
  ];

  const currentStepData = steps[currentStep];
  
  // Debug logging
  useEffect(() => {
    console.log('OnboardingTour state:', {
      currentStep,
      totalSteps: steps.length,
      isVisible,
      currentPage: location.pathname,
      targetPage: currentStepData?.page
    });
  }, [currentStep, isVisible, location.pathname]);

  // Navigate to the correct page when step changes
  useEffect(() => {
    // Only navigate if we're actually on a different page
    // and add a flag to prevent re-navigation during the same step
    const navigationKey = `onboarding_nav_${currentStep}_${currentStepData.page}`;
    const hasNavigated = sessionStorage.getItem(navigationKey);
    
    if (currentStepData.page && location.pathname !== currentStepData.page && !hasNavigated) {
      // Safety check to prevent infinite navigation
      navigationCountRef.current += 1;
      if (navigationCountRef.current > 50) {
        console.error('OnboardingTour: Too many navigations, aborting to prevent infinite loop');
        setIsVisible(false);
        return;
      }
      
      console.log('OnboardingTour: Navigating from', location.pathname, 'to', currentStepData.page);
      sessionStorage.setItem(navigationKey, 'true');
      navigate(currentStepData.page);
    }
    
    // Clean up navigation flags when step changes
    return () => {
      if (currentStep > 0) {
        const prevKey = `onboarding_nav_${currentStep - 1}_${steps[currentStep - 1].page}`;
        sessionStorage.removeItem(prevKey);
      }
    };
  }, [currentStep]);

  // Update positions when step changes, window resizes, or user scrolls
  useEffect(() => {
    const updatePositions = () => {
      setIsMobile(window.innerWidth < 768);
      
      if (currentStepData.target) {
        const element = document.querySelector(currentStepData.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          
          // Update highlight bounds with more padding and rounded corners
          setHighlightBounds({
            top: rect.top - 10,
            left: rect.left - 10,
            width: rect.width + 20,
            height: rect.height + 20
          });
          
          // Update tooltip position
          if (window.innerWidth < 768) {
            // Mobile: center the tooltip
            setTooltipPosition({
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            });
          } else {
            // Desktop: position relative to element
            const position = calculateTooltipPosition(rect, currentStepData.position);
            setTooltipPosition(position);
          }
        }
      } else {
        // No target: center the tooltip
        setHighlightBounds(null);
        setTooltipPosition({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        });
      }
    };

    // Add delay after navigation to ensure page loads
    const navigationDelay = location.pathname !== currentStepData.page ? 1500 : 0;
    
    setTimeout(() => {
      // Scroll target into view if needed
      if (currentStepData.target) {
        const element = document.querySelector(currentStepData.target);
        if (element) {
          // Scroll element into view with some padding
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center' 
          });
          
          // Wait for scroll to complete before positioning
          setTimeout(() => {
            updatePositions();
          }, 500);
        } else {
          // Add delays for specific steps to prevent visual jumps
          if (currentStep === 8) {  // Step 9 is index 8
            setTimeout(() => {
              updatePositions();
            }, 1000);
          } else if (currentStep === 5 || currentStep === 6) {  // Steps 5-6 transition
            setTimeout(() => {
              updatePositions();
            }, 800);
          } else {
            updatePositions();
          }
        }
      } else {
        updatePositions();
      }
    }, navigationDelay);

    // Update positions on scroll and resize
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true); // Capture phase to handle all scroll events

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [currentStep, currentStepData]);

  // Auto-advance for welcome and completion steps
  useEffect(() => {
    console.log('Auto-advance check: currentStep =', currentStep, 'total steps =', steps.length);
    
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        console.log('Auto-advancing from welcome screen');
        setCurrentStep(1);
      }, 10000); // 10 seconds to read welcome screen
      return () => clearTimeout(timer);
    } else if (currentStep === steps.length - 1) {
      const timer = setTimeout(() => {
        console.log('Auto-completing from last step');
        handleComplete();
      }, 10000); // 10 seconds to read completion screen
      return () => clearTimeout(timer);
    }
  }, [currentStep, steps.length]);

  const calculateTooltipPosition = (elementRect, position) => {
    const tooltipWidth = 400;
    const tooltipHeight = 350;
    const padding = 20;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Always use a safe centered position that will stay on screen
    let styles = { 
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
    
    // Try to position near the element if there's enough space
    const elementCenterY = elementRect.top + elementRect.height / 2;
    const elementCenterX = elementRect.left + elementRect.width / 2;
    
    // Check if we can fit the tooltip below the element
    if (elementRect.bottom + tooltipHeight + padding < viewportHeight) {
      styles = {
        position: 'fixed',
        top: `${Math.min(elementRect.bottom + padding, viewportHeight - tooltipHeight - padding)}px`,
        left: `${padding}px`,
        right: `${padding}px`,
        transform: 'none',
        margin: '0 auto',
        maxWidth: `${tooltipWidth}px`
      };
    }
    // Check if we can fit above
    else if (elementRect.top - tooltipHeight - padding > 0) {
      styles = {
        position: 'fixed',
        bottom: `${Math.max(viewportHeight - elementRect.top + padding, padding)}px`,
        left: `${padding}px`,
        right: `${padding}px`,
        transform: 'none',
        margin: '0 auto',
        maxWidth: `${tooltipWidth}px`
      };
    }
    // Otherwise center it on screen
    
    return styles;
  };

  const handleNext = () => {
    console.log('handleNext: currentStep =', currentStep, 'steps.length =', steps.length);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (!isDemo && !showPermanentOptOut) {
      setShowPermanentOptOut(true);
    } else {
      handleComplete(false);
    }
  };

  const handlePermanentOptOut = async () => {
    try {
      // Update user preference in database
      await userAPI.updateProfile({ tutorialOptOut: true });
      localStorage.setItem('tutorialPermanentOptOut', 'true');
      handleComplete(true);
    } catch (error) {
      console.error('Failed to save tutorial preference:', error);
      handleComplete(false);
    }
  };

  const handleComplete = (isPermanentOptOut = false) => {
    setIsVisible(false);
    
    // Only save completion for non-demo users
    if (!isDemo) {
      localStorage.setItem('onboardingCompleted', 'true');
      localStorage.setItem('onboardingCompletedTime', Date.now().toString());
      if (isPermanentOptOut) {
        localStorage.setItem('tutorialPermanentOptOut', 'true');
      }
    }
    
    // Clear all navigation flags and in-progress flag from sessionStorage
    sessionStorage.removeItem('onboardingInProgress');
    sessionStorage.removeItem('demoTutorialShown'); // Clear demo flag so it shows again next session
    for (let i = 0; i < steps.length; i++) {
      const key = `onboarding_nav_${i}_${steps[i].page}`;
      sessionStorage.removeItem(key);
    }
    
    if (onComplete) onComplete();
  };

  // Hide tour if user navigates away (but not on initial load)
  useEffect(() => {
    let isInitialLoad = true;
    
    // Give a small delay to distinguish between initial load and actual visibility changes
    const timer = setTimeout(() => {
      isInitialLoad = false;
    }, 2000); // Increased delay
    
    const handleVisibilityChange = () => {
      // Only close if the document is hidden for more than a few seconds
      // This prevents closing during navigation
      if (document.hidden && !isInitialLoad) {
        // Don't immediately close - user might be switching tabs briefly
        console.log('OnboardingTour: Page became hidden, but not closing immediately');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!isVisible) return null;

  const isOverlay = !currentStepData.target;

  return (
    <>
      {/* Single overlay with cutout for highlighted element */}
      {highlightBounds ? (
        <>
          {/* Dark overlay with cutout - 50% opacity everywhere except highlighted area */}
          <div
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              clipPath: `polygon(
                0 0, 
                100% 0, 
                100% 100%, 
                0 100%, 
                0 0,
                ${highlightBounds.left - 4}px ${highlightBounds.top - 4}px,
                ${highlightBounds.left - 4}px ${highlightBounds.top + highlightBounds.height + 4}px,
                ${highlightBounds.left + highlightBounds.width + 4}px ${highlightBounds.top + highlightBounds.height + 4}px,
                ${highlightBounds.left + highlightBounds.width + 4}px ${highlightBounds.top - 4}px,
                ${highlightBounds.left - 4}px ${highlightBounds.top - 4}px
              )`
            }}
          />
          {/* Glowing border */}
          <div
            className="fixed pointer-events-none highlight-border"
            style={{
              top: highlightBounds.top - 4,
              left: highlightBounds.left - 4,
              width: highlightBounds.width + 8,
              height: highlightBounds.height + 8,
              border: '4px solid #3B82F6',
              borderRadius: '12px',
              zIndex: 41
            }}
          />
          {/* Pulsing arrow pointing to highlighted element */}
          {highlightBounds && (
            <div
              className="fixed pointer-events-none"
              style={{
                zIndex: 42,
                top: currentStepData.position === 'top' ? 
                  highlightBounds.bottom + 10 : 
                  currentStepData.position === 'left' ?
                  highlightBounds.top + (highlightBounds.height / 2) - 30 :
                  currentStepData.position === 'center' ?
                  '50%' :
                  highlightBounds.top - 70,
                left: currentStepData.position === 'left' ?
                  highlightBounds.right + 10 :
                  highlightBounds.left + (highlightBounds.width / 2) - 30,
                transform: currentStepData.position === 'bottom' ? 'rotate(180deg)' : currentStepData.position === 'left' ? 'rotate(90deg)' : 'rotate(0deg)'
              }}
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 60 60"
              >
                <defs>
                  <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M30 10 Q30 5 30 5 Q30 5 35 10 L50 30 Q52 33 50 35 Q48 35 45 35 L38 35 L38 45 Q38 50 33 50 L27 50 Q22 50 22 45 L22 35 L15 35 Q12 35 10 35 Q8 33 10 30 L25 10 Q30 5 30 5"
                  fill="url(#arrowGradient)"
                  stroke="#1E40AF"
                  strokeWidth="2"
                  filter="url(#glow)"
                  style={{
                    filter: 'drop-shadow(0 8px 16px rgba(59, 130, 246, 0.5))'
                  }}
                />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; 0 -15; 0 0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </svg>
            </div>
          )}
        </>
      ) : (
        /* Simple backdrop when no element is highlighted */
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleSkip} />
      )}
      
      {/* Tour tooltip */}
      <div 
        className={`fixed bg-white rounded-lg shadow-2xl p-6 ${isMobile ? 'max-w-sm' : 'max-w-md'} pointer-events-auto`}
        style={{
          ...tooltipPosition,
          zIndex: 50,
          maxWidth: isMobile ? '90vw' : '400px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600"
            title="Skip tour"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {currentStepData.title}
        </h3>
        <p className="text-gray-600 mb-6">
          {currentStepData.content}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation or Opt-out Dialog */}
        {showPermanentOptOut ? (
          <div className="border-t pt-4">
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <EyeOff className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Never show this tour again?</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    You can always access the tutorial from the Help menu if you need it later.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setShowPermanentOptOut(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back to tour
              </button>
              <div className="space-x-2">
                <button
                  onClick={() => handleComplete(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Skip this time
                </button>
                <button
                  onClick={handlePermanentOptOut}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Never show again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip tour
            </button>

            <button
              onClick={handleNext}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default OnboardingTour;