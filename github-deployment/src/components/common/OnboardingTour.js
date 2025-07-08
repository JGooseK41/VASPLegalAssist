import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState({});
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
      content: "Create freeze orders, subpoenas, and data requests using our smart templates or your custom templates.",
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
      content: "Access templates, batch processing, and submit new VASP information here.",
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

  // Calculate position when step changes or window resizes
  useEffect(() => {
    const calculatePosition = () => {
      setIsMobile(window.innerWidth < 768);
      
      // On mobile, always center the tooltip
      if (window.innerWidth < 768) {
        setTooltipPosition({
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        });
      } else if (currentStepData.target) {
        const position = getPositionStyles(currentStepData);
        setTooltipPosition(position);
      } else {
        setTooltipPosition({});
      }
    };

    calculatePosition();

    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(calculatePosition, 100);

    // Recalculate on window resize
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [currentStep, currentStepData]);

  useEffect(() => {
    // Auto-advance for welcome and completion steps
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

  // Hide tour if user navigates away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleComplete();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!isVisible) return null;

  const isOverlay = !currentStepData.target;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleSkip} />
      
      {/* Tour content */}
      <div className={`fixed ${isOverlay || isMobile ? 'inset-0 flex items-center justify-center' : ''} z-50 pointer-events-none`}>
        <div className={`bg-white rounded-lg shadow-2xl p-6 ${isMobile ? 'max-w-sm' : 'max-w-md'} mx-4 ${!isOverlay && !isMobile ? 'absolute' : ''} pointer-events-auto`}
             style={!isOverlay && !isMobile ? tooltipPosition : {}}>
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
      </div>

      {/* Highlight element */}
      {currentStepData.target && <HighlightElement target={currentStepData.target} />}
    </>
  );
};

const HighlightElement = ({ target }) => {
  const [bounds, setBounds] = useState(null);

  useEffect(() => {
    const element = document.querySelector(target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setBounds({
        top: rect.top - 5,
        left: rect.left - 5,
        width: rect.width + 10,
        height: rect.height + 10
      });
    }
  }, [target]);

  if (!bounds) return null;

  return (
    <div
      className="fixed border-2 border-blue-500 rounded-lg pointer-events-none z-45"
      style={{
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
      }}
    />
  );
};

const getPositionStyles = (step) => {
  if (!step.target) return {};
  
  const element = document.querySelector(step.target);
  if (!element) {
    // Fallback to center if element not found
    return { 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)' 
    };
  }
  
  const rect = element.getBoundingClientRect();
  const tourWidth = 400; // Approximate width of tour tooltip
  const padding = 20;
  
  let styles = {};
  
  switch (step.position) {
    case 'bottom':
      styles = {
        top: `${rect.bottom + padding}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)'
      };
      break;
    case 'top':
      styles = {
        bottom: `${window.innerHeight - rect.top + padding}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)'
      };
      break;
    case 'left':
      styles = {
        top: `${rect.top + rect.height / 2}px`,
        right: `${window.innerWidth - rect.left + padding}px`,
        transform: 'translateY(-50%)'
      };
      break;
    case 'right':
      styles = {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.right + padding}px`,
        transform: 'translateY(-50%)'
      };
      break;
    default:
      styles = {
        top: `${rect.bottom + padding}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)'
      };
  }
  
  // Ensure tooltip stays within viewport
  const maxLeft = window.innerWidth - tourWidth - padding;
  const minLeft = padding;
  
  if (styles.left) {
    const leftValue = parseInt(styles.left);
    if (leftValue > maxLeft) {
      styles.left = `${maxLeft}px`;
      styles.transform = 'translateX(0)';
    } else if (leftValue < minLeft + tourWidth / 2) {
      styles.left = `${minLeft}px`;
      styles.transform = 'translateX(0)';
    }
  }
  
  // Ensure tooltip doesn't go off the top or bottom
  if (styles.top) {
    const topValue = parseInt(styles.top);
    if (topValue < padding) {
      styles.top = `${padding}px`;
    } else if (topValue > window.innerHeight - 200) {
      // Position above instead
      styles.bottom = `${window.innerHeight - rect.top + padding}px`;
      delete styles.top;
    }
  }
  
  return styles;
};

export default OnboardingTour;