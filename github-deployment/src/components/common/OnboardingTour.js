import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const OnboardingTour = ({ onComplete, isDemo = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({});
  const [highlightBounds, setHighlightBounds] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
      target: '[data-tour="vasp-card"]',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Service Type Intelligence 🏷️",
      content: "Click any service badge (CEX, DEX, P2P) to see what evidence is available. CEX has full KYC, DEX has limited data, P2P varies. Hover for quick info, click for full guide!",
      target: '[data-tour="vasp-card"]',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Required Documents at a Glance 📋",
      content: "Color coding shows what each VASP requires: Green (Letterhead) = Easy, Yellow (Subpoena) = Medium, Orange (Search Warrant) = Hard, Red (MLAT) = Complex. Know before you submit!",
      target: '[data-tour="vasp-card"]',
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
      content: "After sending requests, log responses here. Did it work? How long did it take? Your feedback improves LEO scores and helps future investigators avoid pitfalls.",
      target: '[data-tour="submit-response"]',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Community Comments 💬",
      content: "Check comments on each VASP for insider tips. 'Use badge number in subject line' or 'Requires notarization' - learn from others' experiences before you submit!",
      target: '[data-tour="vasp-card"]',
      position: 'bottom',
      page: '/search'
    },
    {
      title: "Earn Recognition Points 🏆",
      content: "Contributing helps everyone! Earn 10 points for VASP updates, 5 for response feedback, 1 for helpful comments. Check the leaderboard to see top contributors.",
      target: '[data-tour="leaderboard"]',
      position: 'left',
      page: '/'
    },
    {
      title: "Update VASP Information 🔄",
      content: "Found a new compliance email? Required document changed? Click 'Update Info' to submit changes. Admin-verified updates keep our database accurate for all users.",
      target: '[data-tour="vasp-card"]',
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
        const rect = element.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && 
                           rect.bottom <= window.innerHeight &&
                           rect.left >= 0 &&
                           rect.right <= window.innerWidth;
        
        if (!isInViewport) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Wait for scroll to complete before updating positions
          setTimeout(updatePositions, 800);
        } else {
          updatePositions();
        }
        } else {
          updatePositions();
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
    const tooltipHeight = 300; // Approximate height
    const padding = 20;
    let styles = { position: 'fixed' };
    
    switch (position) {
      case 'bottom':
        styles.top = `${elementRect.bottom + padding}px`;
        styles.left = `${elementRect.left + elementRect.width / 2}px`;
        styles.transform = 'translateX(-50%)';
        break;
      case 'top':
        styles.bottom = `${window.innerHeight - elementRect.top + padding}px`;
        styles.left = `${elementRect.left + elementRect.width / 2}px`;
        styles.transform = 'translateX(-50%)';
        break;
      case 'left':
        styles.top = `${elementRect.top + elementRect.height / 2}px`;
        styles.right = `${window.innerWidth - elementRect.left + padding}px`;
        styles.transform = 'translateY(-50%)';
        break;
      case 'right':
        styles.top = `${elementRect.top + elementRect.height / 2}px`;
        styles.left = `${elementRect.right + padding}px`;
        styles.transform = 'translateY(-50%)';
        break;
      default:
        styles.top = `${elementRect.bottom + padding}px`;
        styles.left = `${elementRect.left + elementRect.width / 2}px`;
        styles.transform = 'translateX(-50%)';
    }
    
    // Ensure tooltip stays within viewport
    if (styles.left) {
      const leftValue = parseInt(styles.left);
      const transformedLeft = leftValue - (tooltipWidth / 2);
      
      if (transformedLeft < padding) {
        styles.left = `${padding}px`;
        styles.transform = 'translateX(0)';
      } else if (transformedLeft + tooltipWidth > window.innerWidth - padding) {
        styles.left = `${window.innerWidth - tooltipWidth - padding}px`;
        styles.transform = 'translateX(0)';
      }
    }
    
    // Ensure tooltip doesn't go off the top or bottom
    if (styles.top) {
      const topValue = parseInt(styles.top);
      if (topValue < padding) {
        styles.top = `${padding}px`;
      } else if (topValue + tooltipHeight > window.innerHeight - padding) {
        // Position above the element instead
        styles.bottom = `${window.innerHeight - elementRect.top + padding}px`;
        delete styles.top;
      }
    }
    
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
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    
    // Only save completion for non-demo users
    if (!isDemo) {
      localStorage.setItem('onboardingCompleted', 'true');
      localStorage.setItem('onboardingCompletedTime', Date.now().toString());
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
      {/* Backdrop - lighter for better visibility */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={handleSkip} />
      
      {/* Highlight element with enhanced visibility */}
      {highlightBounds && (
        <>
          {/* Dark overlay with cutout */}
          <div
            className="fixed inset-0 pointer-events-none z-45"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              clipPath: `polygon(
                0 0, 
                100% 0, 
                100% 100%, 
                0 100%, 
                0 0,
                ${highlightBounds.left}px ${highlightBounds.top}px,
                ${highlightBounds.left}px ${highlightBounds.top + highlightBounds.height}px,
                ${highlightBounds.left + highlightBounds.width}px ${highlightBounds.top + highlightBounds.height}px,
                ${highlightBounds.left + highlightBounds.width}px ${highlightBounds.top}px,
                ${highlightBounds.left}px ${highlightBounds.top}px
              )`
            }}
          />
          {/* Glowing border - no background overlay to keep area bright */}
          <div
            className="fixed pointer-events-none z-46"
            style={{
              top: highlightBounds.top,
              left: highlightBounds.left,
              width: highlightBounds.width,
              height: highlightBounds.height,
              border: '3px solid #3B82F6',
              borderRadius: '12px',
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)'
            }}
          />
        </>
      )}
      
      {/* Tour tooltip */}
      <div 
        className={`bg-white rounded-lg shadow-2xl p-6 ${isMobile ? 'max-w-sm' : 'max-w-md'} mx-4 z-50 pointer-events-auto`}
        style={tooltipPosition}
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

        {/* Navigation */}
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
      </div>
    </>
  );
};

export default OnboardingTour;