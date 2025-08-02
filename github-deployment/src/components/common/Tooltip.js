import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

const Tooltip = ({ content, children, position = 'top', className = '', large = false }) => {
  const [isVisible, setIsVisible] = useState(false);

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

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]} pointer-events-none animate-fadeIn`}>
          <div className={`bg-gray-900 text-white ${large ? 'text-sm' : 'text-xs'} rounded-lg py-3 px-4 ${large ? 'max-w-sm' : 'max-w-xs'} shadow-xl`}>
            {content}
            <div className={`absolute w-0 h-0 ${arrowClasses[position]}`}></div>
          </div>
        </div>
      )}
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