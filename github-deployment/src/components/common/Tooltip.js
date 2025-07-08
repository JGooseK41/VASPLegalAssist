import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

const Tooltip = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-gray-900 border-t-8 border-x-8 border-x-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-gray-900 border-b-8 border-x-8 border-x-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-gray-900 border-l-8 border-y-8 border-y-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-gray-900 border-r-8 border-y-8 border-y-transparent'
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
        <div className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}>
          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 max-w-xs">
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

export default Tooltip;