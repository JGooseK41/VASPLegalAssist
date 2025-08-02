import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, Info } from 'lucide-react';

const Tooltip = ({ content, children, position = 'top', className = '', large = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    topLeft: 'bottom-full left-0 mb-2',
    topRight: 'bottom-full right-0 mb-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-gray-900 border-t-8 border-x-8 border-x-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-gray-900 border-b-8 border-x-8 border-x-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-gray-900 border-l-8 border-y-8 border-y-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-gray-900 border-r-8 border-y-8 border-y-transparent',
    topLeft: 'top-full left-4 border-gray-900 border-t-8 border-x-8 border-x-transparent',
    topRight: 'top-full right-4 border-gray-900 border-t-8 border-x-8 border-x-transparent'
  };

  useEffect(() => {
    const updatePosition = () => {
      if (isVisible && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        let style = {};
        
        switch (position) {
          case 'top':
            style = {
              position: 'absolute',
              left: rect.left + scrollLeft + rect.width / 2,
              top: rect.top + scrollTop - 8,
              transform: 'translate(-50%, -100%)',
              zIndex: 9999
            };
            break;
          case 'bottom':
            style = {
              position: 'absolute',
              left: rect.left + scrollLeft + rect.width / 2,
              top: rect.top + scrollTop + rect.height + 8,
              transform: 'translateX(-50%)',
              zIndex: 9999
            };
            break;
          case 'left':
            style = {
              position: 'absolute',
              left: rect.left + scrollLeft - 8,
              top: rect.top + scrollTop + rect.height / 2,
              transform: 'translate(-100%, -50%)',
              zIndex: 9999
            };
            break;
          case 'right':
            style = {
              position: 'absolute',
              left: rect.left + scrollLeft + rect.width + 8,
              top: rect.top + scrollTop + rect.height / 2,
              transform: 'translateY(-50%)',
              zIndex: 9999
            };
            break;
          case 'topLeft':
            style = {
              position: 'absolute',
              left: rect.left + scrollLeft,
              top: rect.top + scrollTop - 8,
              transform: 'translateY(-100%)',
              zIndex: 9999
            };
            break;
          case 'topRight':
            style = {
              position: 'absolute',
              left: rect.left + scrollLeft + rect.width,
              top: rect.top + scrollTop - 8,
              transform: 'translate(-100%, -100%)',
              zIndex: 9999
            };
            break;
          default:
            style = {
              position: 'absolute',
              left: rect.left + scrollLeft + rect.width / 2,
              top: rect.top + scrollTop - 8,
              transform: 'translate(-50%, -100%)',
              zIndex: 9999
            };
        }
        
        setTooltipStyle(style);
      }
    };

    updatePosition();

    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);
  const handleClick = () => setIsVisible(!isVisible);

  // Clean up tooltip when component unmounts
  useEffect(() => {
    return () => {
      setIsVisible(false);
    };
  }, []);

  const tooltipElement = isVisible ? (
    <div 
      ref={tooltipRef}
      style={tooltipStyle}
      className="pointer-events-none animate-fadeIn"
    >
      <div className={`bg-gray-900 text-white ${large ? 'text-sm' : 'text-xs'} rounded-lg py-3 px-4 ${large ? 'max-w-sm' : 'max-w-xs'} shadow-xl`}>
        {content}
        <div className={`absolute w-0 h-0 ${arrowClasses[position]}`}></div>
      </div>
    </div>
  ) : null;

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </div>
      {tooltipElement && createPortal(tooltipElement, document.body)}
    </div>
  );
};

// Specialized tooltip for form fields
export const FormFieldTooltip = ({ content }) => {
  return (
    <Tooltip content={content} position="right">
      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
    </Tooltip>
  );
};

// Info tooltip variant
export const InfoTooltip = ({ content, className = '' }) => {
  return (
    <Tooltip content={content} position="top">
      <Info className={`h-4 w-4 text-blue-500 hover:text-blue-700 cursor-help ${className}`} />
    </Tooltip>
  );
};

// Educational tooltip with pulse animation to draw attention
export const HelpTooltip = ({ content, children, position = 'top', pulse = true }) => {
  return (
    <Tooltip content={content} position={position} large>
      <div className="relative inline-block">
        {children}
        {pulse && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        )}
      </div>
    </Tooltip>
  );
};

export default Tooltip;