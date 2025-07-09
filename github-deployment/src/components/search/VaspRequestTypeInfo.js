import React, { useState } from 'react';
import { FileText, Shield, Clock, Globe, Check, X, AlertCircle } from 'lucide-react';

const VaspRequestTypeInfo = ({ vasp, stats }) => {
  const [activeTab, setActiveTab] = useState('records');
  
  // Extract effectiveness data by document type from stats
  const recordsEffectiveness = stats?.effectiveness?.byType?.records_request;
  const freezeEffectiveness = stats?.effectiveness?.byType?.freeze_request;
  
  const getEffectivenessColor = (rate) => {
    if (!rate && rate !== 0) return 'gray';
    if (rate >= 75) return 'green';
    if (rate >= 50) return 'yellow';
    return 'red';
  };
  
  const getEffectivenessIcon = (rate) => {
    if (!rate && rate !== 0) return <AlertCircle className="h-4 w-4" />;
    if (rate >= 75) return <Check className="h-4 w-4" />;
    if (rate >= 50) return <AlertCircle className="h-4 w-4" />;
    return <X className="h-4 w-4" />;
  };
  
  const RequestTypeTab = ({ type, label, isActive, onClick, effectiveness }) => {
    const color = getEffectivenessColor(effectiveness?.rate);
    
    return (
      <button
        onClick={onClick}
        className={`flex-1 py-2 px-3 text-sm font-medium rounded-t-lg transition-colors flex items-center justify-center gap-2 ${
          isActive 
            ? 'bg-white text-gray-900 border-t border-l border-r border-gray-200' 
            : 'bg-gray-100 text-gray-600 hover:text-gray-900 border-b border-gray-200'
        }`}
      >
        <FileText className="h-4 w-4" />
        {label}
        {effectiveness && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
            ${color === 'green' ? 'bg-green-100 text-green-800' :
              color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              color === 'red' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'}`}
          >
            {effectiveness.rate}%
          </span>
        )}
      </button>
    );
  };
  
  const RequirementInfo = ({ type }) => {
    const isRecords = type === 'records';
    const processingTime = isRecords ? vasp.records_processing_time : vasp.freeze_processing_time;
    const requiredDoc = isRecords ? vasp.records_required_document : vasp.freeze_required_document;
    const acceptsUS = isRecords ? vasp.records_accepts_us : vasp.freeze_accepts_us;
    const jurisdictions = isRecords ? vasp.records_jurisdictions : vasp.freeze_jurisdictions;
    const effectiveness = isRecords ? recordsEffectiveness : freezeEffectiveness;
    
    // Fallback to legacy fields if new fields don't exist
    const displayProcessingTime = processingTime || vasp.processing_time || "5-10 business days";
    const displayRequiredDoc = requiredDoc || vasp.required_document || "Not specified";
    const displayAcceptsUS = acceptsUS !== undefined ? acceptsUS : vasp.accepts_us_service;
    
    return (
      <div className="bg-white p-4 rounded-b-lg border-l border-r border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Processing Time */}
          <div>
            <div className="flex items-center text-gray-600 mb-1">
              <Clock className="h-4 w-4 mr-1" />
              <span className="font-medium">Processing Time</span>
            </div>
            <p className="text-gray-900">{displayProcessingTime}</p>
          </div>
          
          {/* Required Document */}
          <div>
            <div className="flex items-center text-gray-600 mb-1">
              <Shield className="h-4 w-4 mr-1" />
              <span className="font-medium">Required Document</span>
            </div>
            <p className="text-gray-900">{displayRequiredDoc}</p>
          </div>
          
          {/* Accepts US Service */}
          <div>
            <div className="flex items-center text-gray-600 mb-1">
              <Globe className="h-4 w-4 mr-1" />
              <span className="font-medium">Accepts US Service</span>
            </div>
            <div className="flex items-center">
              {displayAcceptsUS ? (
                <span className="flex items-center text-green-600">
                  <Check className="h-4 w-4 mr-1" />
                  Yes
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <X className="h-4 w-4 mr-1" />
                  No
                </span>
              )}
            </div>
          </div>
          
          {/* Effectiveness (if data available) */}
          {effectiveness && (
            <div>
              <div className="flex items-center text-gray-600 mb-1">
                {getEffectivenessIcon(effectiveness.rate)}
                <span className="font-medium ml-1">Success Rate</span>
              </div>
              <p className="text-gray-900">
                {effectiveness.rate}% ({effectiveness.worked}/{effectiveness.total})
              </p>
            </div>
          )}
        </div>
        
        {/* Jurisdictions */}
        {jurisdictions && jurisdictions.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center text-gray-600 mb-1">
              <Globe className="h-4 w-4 mr-1" />
              <span className="font-medium text-sm">Accepted Jurisdictions</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {jurisdictions.map((jurisdiction, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {jurisdiction}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Common Failure Reasons (if data available) */}
        {effectiveness?.topFailureReasons && effectiveness.topFailureReasons.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-xs font-medium text-amber-900 mb-1">Common Issues:</p>
            <ul className="text-xs text-amber-800 space-y-1">
              {effectiveness.topFailureReasons.map((reason, index) => (
                <li key={index}>• {reason.label} ({reason.count} reports)</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="mt-4">
      <div className="flex border-gray-200">
        <RequestTypeTab
          type="records"
          label="Records Request"
          isActive={activeTab === 'records'}
          onClick={() => setActiveTab('records')}
          effectiveness={recordsEffectiveness}
        />
        <RequestTypeTab
          type="freeze"
          label="Freeze Request"
          isActive={activeTab === 'freeze'}
          onClick={() => setActiveTab('freeze')}
          effectiveness={freezeEffectiveness}
        />
      </div>
      
      <RequirementInfo type={activeTab} />
    </div>
  );
};

export default VaspRequestTypeInfo;