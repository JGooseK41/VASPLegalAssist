import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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

  if (!isVisible) return null;

  const isOverlay = !currentStepData.target;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleSkip} />
      
      {/* Tour content */}
      <div className={`fixed ${isOverlay ? 'inset-0 flex items-center justify-center' : ''} z-50`}>
        <div className={`bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 ${!isOverlay ? 'absolute' : ''}`}
             style={!isOverlay ? getPositionStyles(currentStepData) : {}}>
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
  // This would be more sophisticated in production
  // For now, return some default positioning
  switch (step.position) {
    case 'bottom':
      return { top: '200px', left: '50%', transform: 'translateX(-50%)' };
    case 'top':
      return { bottom: '200px', left: '50%', transform: 'translateX(-50%)' };
    default:
      return {};
  }
};

export default OnboardingTour;