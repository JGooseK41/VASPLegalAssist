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
  
  const RequestTypeTab = ({ type, label, isActive, onClick }) => {
    return (
      <button
        onClick={onClick}
        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-t-lg transition-all duration-200 flex items-center justify-center gap-2 relative ${
          isActive 
            ? 'bg-blue-600 text-white shadow-lg transform -translate-y-0.5' 
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800'
        }`}
        style={isActive ? {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        } : {}}
      >
        {type === 'records' ? <FileText className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
        {label}
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-700 rounded-t-full"></div>
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
    
    // Only show turnaround time if we have actual user data
    const hasUserData = stats?.turnaroundTime?.mostCommon && stats?.turnaroundTime?.distribution && 
                       Object.keys(stats.turnaroundTime.distribution).length > 0;
    const displayProcessingTime = hasUserData ? stats.turnaroundTime.mostCommon : "Need more data";
    
    // Don't fallback to legacy fields for freeze - keep them separate
    const displayRequiredDoc = requiredDoc || (isRecords ? vasp.required_document : null) || "Unknown";
    const displayAcceptsUS = acceptsUS !== undefined ? acceptsUS : (isRecords ? vasp.accepts_us_service : false);
    
    return (
      <div className="bg-white rounded-b-lg border border-gray-200 shadow-sm -mt-1 text-xs overflow-hidden">
        {/* Required Document Banner */}
        <div className={`py-2 px-4 text-center ${
          !displayRequiredDoc || displayRequiredDoc === 'Unknown' || displayRequiredDoc === 'Not specified' ? 'bg-gray-100 text-gray-600' :
          displayRequiredDoc.toLowerCase().includes('letterhead') ? 'bg-green-100 text-green-800' :
          displayRequiredDoc.toLowerCase().includes('subpoena') ? 'bg-yellow-100 text-yellow-800' :
          displayRequiredDoc.toLowerCase().includes('warrant') ? 'bg-orange-100 text-orange-800' :
          displayRequiredDoc.toLowerCase().includes('mlat') ? 'bg-red-100 text-red-800' :
          displayRequiredDoc.toLowerCase().includes('no capability') ? 'bg-gray-100 text-gray-700' :
          displayRequiredDoc.toLowerCase().includes('non-compliant') ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-700'
        }`}>
          <span className="text-xs font-medium uppercase tracking-wider opacity-75">Required: </span>
          <span className="text-sm font-semibold">{displayRequiredDoc || 'Unknown'}</span>
        </div>
        
        <div className="p-4">
        
        {/* Additional Info Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {/* Processing Time */}
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className={`font-medium ${hasUserData ? 'text-gray-900' : 'text-gray-500'}`}>
              {displayProcessingTime === "Need more data" 
                ? displayProcessingTime 
                : displayProcessingTime.replace('business days', 'days')}
            </span>
          </div>
          
          {/* Success Rate */}
          {effectiveness ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Success:</span>
              <span className={`font-medium ${
                effectiveness.rate >= 75 ? 'text-green-700' :
                effectiveness.rate >= 50 ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {effectiveness.rate}%
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-600">Success:</span>
              <span className="font-medium text-gray-500">Need more data</span>
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
      </div>
    );
  };
  
  return (
    <div className="mt-3">
      <div className="flex gap-1 mb-0">
        <RequestTypeTab
          type="records"
          label="Records Request"
          isActive={activeTab === 'records'}
          onClick={() => setActiveTab('records')}
        />
        <RequestTypeTab
          type="freeze"
          label="Freeze/Seizure"
          isActive={activeTab === 'freeze'}
          onClick={() => setActiveTab('freeze')}
        />
      </div>
      
      <RequirementInfo type={activeTab} />
    </div>
  );
};

export default VaspRequestTypeInfo;