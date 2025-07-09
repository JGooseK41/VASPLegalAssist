import React, { useState } from 'react';
import { User, Mail, Briefcase, ChevronDown, ChevronUp, Star } from 'lucide-react';

const DirectContactDisplay = ({ contacts }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!contacts || contacts.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center text-xs font-medium text-green-600 hover:text-green-700"
      >
        <Star className="h-3 w-3 mr-1 fill-current" />
        Direct Contacts Available ({contacts.length})
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
          <p className="text-xs text-green-800 font-medium mb-2">
            Verified contacts who have helped other officers:
          </p>
          {contacts.map((contact, index) => (
            <div key={index} className="bg-white rounded p-2 text-xs space-y-1">
              <div className="flex items-center">
                <User className="h-3 w-3 text-gray-400 mr-1" />
                <span className="font-medium text-gray-900">{contact.name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-3 w-3 text-gray-400 mr-1" />
                <a 
                  href={`mailto:${contact.email}`} 
                  className="text-green-600 hover:text-green-700 underline"
                >
                  {contact.email}
                </a>
              </div>
              {contact.title && (
                <div className="flex items-center">
                  <Briefcase className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-gray-600">{contact.title}</span>
                </div>
              )}
            </div>
          ))}
          <p className="text-xs text-gray-500 italic mt-2">
            These contacts have successfully helped with law enforcement requests
          </p>
        </div>
      )}
    </div>
  );
};

export default DirectContactDisplay;