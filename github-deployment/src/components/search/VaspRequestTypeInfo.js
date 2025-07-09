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
        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-t-lg transition-colors flex items-center justify-center gap-2 ${
          isActive 
            ? 'bg-white text-gray-900 border-t border-l border-r border-gray-200' 
            : 'bg-gray-100 text-gray-600 hover:text-gray-900 border-b border-gray-200'
        }`}
      >
        {type === 'records' ? <FileText className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
        {label}
        {effectiveness && (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium
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
      <div className="bg-white p-3 rounded-b-lg border-l border-r border-b border-gray-200 text-xs">
        {/* Compact Info Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {/* Required Document */}
          <div className="flex justify-between">
            <span className="text-gray-600">Required:</span>
            <span className="font-medium text-gray-900">{displayRequiredDoc}</span>
          </div>
          
          {/* Processing Time */}
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-gray-900">{displayProcessingTime.replace('business days', 'days')}</span>
          </div>
          
          {/* US Service */}
          <div className="flex justify-between">
            <span className="text-gray-600">US Service:</span>
            {displayAcceptsUS ? (
              <span className="flex items-center text-green-700 font-medium">
                <Check className="h-3 w-3 mr-0.5" />
                Yes
              </span>
            ) : (
              <span className="flex items-center text-red-700 font-medium">
                <X className="h-3 w-3 mr-0.5" />
                No
              </span>
            )}
          </div>
          
          {/* Success Rate */}
          {effectiveness && (
            <div className="flex justify-between">
              <span className="text-gray-600">Success:</span>
              <span className={`font-medium ${
                effectiveness.rate >= 75 ? 'text-green-700' :
                effectiveness.rate >= 50 ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {effectiveness.rate}%
              </span>
            </div>
          )}
        </div>
        
        {/* Jurisdictions - Only show if limited */}
        {jurisdictions && jurisdictions.length > 0 && jurisdictions.length < 5 && (
          <div className="mt-2 text-gray-600">
            <span>Jurisdictions: </span>
            <span className="text-gray-900">{jurisdictions.join(', ')}</span>
          </div>
        )}
        
        {/* Common Issues - Compact */}
        {effectiveness?.topFailureReasons && effectiveness.topFailureReasons.length > 0 && (
          <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-100">
            <p className="font-medium text-amber-900">Common Issues:</p>
            {effectiveness.topFailureReasons.slice(0, 2).map((reason, index) => (
              <p key={index} className="text-amber-800 mt-0.5">• {reason.label}</p>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="mt-2">
      <div className="flex border-gray-200">
        <RequestTypeTab
          type="records"
          label="Records"
          isActive={activeTab === 'records'}
          onClick={() => setActiveTab('records')}
          effectiveness={recordsEffectiveness}
        />
        <RequestTypeTab
          type="freeze"
          label="Freeze"
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