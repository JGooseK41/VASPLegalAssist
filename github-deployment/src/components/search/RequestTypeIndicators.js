import React from 'react';
import { FileText, Shield, Check, X } from 'lucide-react';

const RequestTypeIndicators = ({ vasp }) => {
  const recordsAccepts = vasp.records_accepts_us !== undefined ? vasp.records_accepts_us : vasp.accepts_us_service;
  const freezeAccepts = vasp.freeze_accepts_us !== undefined ? vasp.freeze_accepts_us : vasp.accepts_us_service;
  
  return (
    <div className="flex items-center gap-3 mt-2">
      {/* Records Request Indicator */}
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        recordsAccepts ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <FileText className="h-3 w-3 mr-1" />
        Records
        {recordsAccepts ? (
          <Check className="h-3 w-3 ml-1" />
        ) : (
          <X className="h-3 w-3 ml-1" />
        )}
      </div>
      
      {/* Freeze Request Indicator */}
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        freezeAccepts ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <Shield className="h-3 w-3 mr-1" />
        Freeze
        {freezeAccepts ? (
          <Check className="h-3 w-3 ml-1" />
        ) : (
          <X className="h-3 w-3 ml-1" />
        )}
      </div>
    </div>
  );
};

export default RequestTypeIndicators;