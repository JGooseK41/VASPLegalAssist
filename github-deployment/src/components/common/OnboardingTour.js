import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({});
  const [highlightBounds, setHighlightBounds] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const steps = [
    {
      title: "Welcome to VASP Records Assistant! 👋",
      content: "Let's take a quick tour to help you get started with creating legal documents for cryptocurrency investigations.",
      target: null,
      position: 'center'
    },
    {
      title: "Search VASPs",
      content: "Start here to find compliance contacts and read real-time intelligence from other investigators.",
      target: '[data-tour="search-vasp"]',
      position: 'bottom'
    },
    {
      title: "Generate Documents",
      content: "Create freeze orders, subpoenas, and data requests. Click 'Generate Request' after selecting a VASP.",
      target: '[data-tour="generate-request"]',
      position: 'bottom'
    },
    {
      title: "Recent Documents",
      content: "Access your previously created documents here. Click to download or delete them.",
      target: '[data-tour="recent-documents"]',
      position: 'top'
    },
    {
      title: "Platform Stats",
      content: "See how many investigators are using the platform and track document creation.",
      target: '[data-tour="platform-stats"]',
      position: 'top'
    },
    {
      title: "Quick Links",
      content: "Access templates, batch processing, and add new VASPs to the database here.",
      target: '[data-tour="quick-links"]',
      position: 'top'
    },
    {
      title: "You're All Set! 🎉",
      content: "Start by searching for a VASP or creating your first document. Need help? Check the FAQ in the navigation bar.",
      target: null,
      position: 'center'
    }
  ];

  const currentStepData = steps[currentStep];

  // Update positions when step changes, window resizes, or user scrolls
  useEffect(() => {
    const updatePositions = () => {
      setIsMobile(window.innerWidth < 768);
      
      if (currentStepData.target) {
        const element = document.querySelector(currentStepData.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          
          // Update highlight bounds
          setHighlightBounds({
            top: rect.top - 5,
            left: rect.left - 5,
            width: rect.width + 10,
            height: rect.height + 10
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
          setTimeout(updatePositions, 500);
        } else {
          updatePositions();
        }
      } else {
        updatePositions();
      }
    } else {
      updatePositions();
    }

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
    if (currentStep === 0 || currentStep === steps.length - 1) {
      const timer = setTimeout(() => {
        if (currentStep === 0) {
          setCurrentStep(1);
        } else {
          handleComplete();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

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
    localStorage.setItem('onboardingCompleted', 'true');
    if (onComplete) onComplete();
  };

  // Hide tour if user navigates away (but not on initial load)
  useEffect(() => {
    let isInitialLoad = true;
    
    // Give a small delay to distinguish between initial load and actual visibility changes
    const timer = setTimeout(() => {
      isInitialLoad = false;
    }, 1000);
    
    const handleVisibilityChange = () => {
      // Don't close on initial page visibility changes (like during page reload)
      if (document.hidden && !isInitialLoad) {
        handleComplete();
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleSkip} />
      
      {/* Highlight element */}
      {highlightBounds && (
        <div
          className="fixed border-2 border-blue-500 rounded-lg pointer-events-none z-45"
          style={{
            top: highlightBounds.top,
            left: highlightBounds.left,
            width: highlightBounds.width,
            height: highlightBounds.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
          }}
        />
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