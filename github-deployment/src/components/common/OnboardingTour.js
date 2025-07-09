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
      content: "The world's first crowdsourced legal document platform for cryptocurrency investigations. Let's explore the innovative features that will transform your workflow.",
      target: null,
      position: 'center'
    },
    {
      title: "Real-time VASP Intelligence 🔍",
      content: "Search 300+ VASPs with live feedback from investigators worldwide. See compliance ratings, response times, and service types (CEX, DEX, P2P) at a glance.",
      target: '[data-tour="search-vasp"]',
      position: 'bottom'
    },
    {
      title: "Service Type Indicators 🏷️",
      content: "Instantly identify VASP types: CEX (Centralized Exchange), DEX (Decentralized), P2P, Bridge, etc. Each badge shows investigative value and typical evidence available.",
      target: '[data-tour="vasp-badges"]',
      position: 'bottom'
    },
    {
      title: "One-Click Document Generation ⚡",
      content: "Generate freeze orders and subpoenas in seconds. Just select a VASP and our AI fills in all compliance contacts and jurisdiction data automatically.",
      target: '[data-tour="generate-request"]',
      position: 'bottom'
    },
    {
      title: "Batch Transaction Processing 📊",
      content: "Import CSV files with multiple transactions. The system automatically generates comprehensive legal documents with transaction tables - no manual data entry!",
      target: '[data-tour="batch-process"]',
      position: 'right'
    },
    {
      title: "Smart Templates with AI Tags 🤖",
      content: "Create custom templates with smart tags like {{case_number}} and {{transaction_table}}. Upload your agency's Word docs and we'll detect placeholders automatically.",
      target: '[data-tour="my-templates"]',
      position: 'right'
    },
    {
      title: "Community Template Sharing 🌐",
      content: "Access templates shared by 500+ investigators. Share your own templates to earn points. Set domain restrictions to control who can use them.",
      target: '[data-tour="community-templates"]',
      position: 'top'
    },
    {
      title: "Encrypted Document Storage 🔐",
      content: "Military-grade client-side encryption protects your sensitive case data. Even admins can't see your documents - only you have the key.",
      target: '[data-tour="recent-documents"]',
      position: 'top'
    },
    {
      title: "Investigator Feedback System 💬",
      content: "Submit surveys after each VASP response. Your feedback helps other investigators know response times, data quality, and LEO-friendliness ratings.",
      target: '[data-tour="submit-feedback"]',
      position: 'left'
    },
    {
      title: "Points & Recognition System 🏆",
      content: "Earn points for contributing: 10 pts for VASP feedback, 5 pts for sharing templates, 3 pts for adding new VASPs. Top contributors get special recognition!",
      target: '[data-tour="leaderboard"]',
      position: 'left'
    },
    {
      title: "Global Jurisdiction Database 🌍",
      content: "Access compliance office locations for 30+ countries. Know exactly where to send your legal requests based on VASP jurisdiction.",
      target: '[data-tour="jurisdiction-info"]',
      position: 'bottom'
    },
    {
      title: "Quick Actions Hub 🚀",
      content: "Your command center: Generate documents, manage templates, process batches, add new VASPs, and access all platform features from one place.",
      target: '[data-tour="quick-links"]',
      position: 'top'
    },
    {
      title: "Ready to Transform Your Investigations? 🎯",
      content: "You're all set! Start by searching for a VASP or importing your transaction data. Join 500+ investigators saving hours on every case. Questions? Check the FAQ or contact support.",
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
      }, 7000); // Increased to 7 seconds for longer content
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