import React, { useState } from 'react';
import { X, Shield, Database, Clock, Building, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { SERVICE_TYPE_DEFINITIONS, getServiceTypeColorClasses } from '../../constants/serviceTypeDefinitions';

const ServiceTypeModal = ({ isOpen, onClose, selectedTypes = [], initialType = null }) => {
  const [activeType, setActiveType] = useState(initialType || selectedTypes[0] || 'CEX');
  
  if (!isOpen) return null;
  
  const activeDefinition = SERVICE_TYPE_DEFINITIONS[activeType];
  if (!activeDefinition) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Service Type Information
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Service Type Grid - No scrolling needed */}
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {Object.entries(SERVICE_TYPE_DEFINITIONS).map(([type, def]) => (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      activeType === type
                        ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getServiceTypeColorClasses(def.color)} mb-1`}>
                      {def.label}
                    </span>
                    <p className="text-xs text-gray-700 font-medium">{def.fullName}</p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Active Service Type Details */}
            <div className="space-y-6">
              {/* Overview */}
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-2">Overview</h4>
                <p className="text-sm text-gray-700">{activeDefinition.overview}</p>
                {activeDefinition.specialNote && (
                  <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <p className="ml-2 text-sm text-yellow-800">{activeDefinition.specialNote}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Key Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custody Type */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Shield className="h-5 w-5 text-gray-600 mr-2" />
                    <h5 className="font-medium text-gray-900">Custody Type</h5>
                  </div>
                  <p className="text-sm text-gray-700">{activeDefinition.custodyType}</p>
                </div>
                
                {/* Data Location */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Database className="h-5 w-5 text-gray-600 mr-2" />
                    <h5 className="font-medium text-gray-900">Data Location</h5>
                  </div>
                  <p className="text-sm text-gray-700">{activeDefinition.investigativeValue.dataLocation}</p>
                </div>
              </div>
              
              {/* Capabilities */}
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-3">Capabilities</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(activeDefinition.capabilities).map(([capability, available]) => (
                    <div key={capability} className="flex items-center">
                      {available ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className="text-sm text-gray-700">
                        {capability.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Services Offered */}
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-3">Services Offered</h4>
                <div className="flex flex-wrap gap-2">
                  {activeDefinition.services.map((service, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Investigative Value */}
              <div className="border-t pt-6">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Investigative Value</h4>
                
                {/* Available Records */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Available Records & Data Types:</h5>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {activeDefinition.investigativeValue.recordTypes.map((record, index) => (
                      <li key={index}>{record}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Response Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 text-gray-500 mr-2" />
                      <h5 className="text-sm font-medium text-gray-700">Response Time</h5>
                    </div>
                    <p className="text-sm text-gray-600">{activeDefinition.investigativeValue.responseTime}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-1">
                      <Building className="h-4 w-4 text-gray-500 mr-2" />
                      <h5 className="text-sm font-medium text-gray-700">Legal Requirements</h5>
                    </div>
                    <p className="text-sm text-gray-600">{activeDefinition.legalRequirements}</p>
                  </div>
                </div>
                
                {/* Limitations */}
                {activeDefinition.investigativeValue.limitations && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <h5 className="text-sm font-medium text-red-900 mb-1">Limitations</h5>
                    <p className="text-sm text-red-700">{activeDefinition.investigativeValue.limitations}</p>
                  </div>
                )}
              </div>
              
              {/* Examples */}
              {activeDefinition.examples && (
                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Examples</h5>
                  <p className="text-sm text-gray-600">{activeDefinition.examples}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTypeModal;