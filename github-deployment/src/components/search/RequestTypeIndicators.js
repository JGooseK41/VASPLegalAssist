import React from 'react';
import { FileText, Shield, HelpCircle } from 'lucide-react';

const RequestTypeIndicators = ({ vasp }) => {
  // Helper function to get badge color and text based on required document
  const getDocumentBadge = (requiredDoc) => {
    if (!requiredDoc) {
      return { color: 'gray', text: 'Unknown' };
    }
    
    const docLower = requiredDoc.toLowerCase();
    
    if (docLower.includes('letterhead')) {
      return { color: 'green', text: 'Letterhead' };
    } else if (docLower.includes('subpoena')) {
      return { color: 'yellow', text: 'Subpoena' };
    } else if (docLower.includes('search warrant') || docLower.includes('warrant')) {
      return { color: 'orange', text: 'Search Warrant' };
    } else if (docLower.includes('mlat')) {
      return { color: 'red', text: 'MLAT' };
    } else if (docLower.includes('non-compliant') || docLower.includes('not accepted')) {
      return { color: 'red', text: 'Non-Compliant' };
    } else {
      return { color: 'gray', text: requiredDoc };
    }
  };
  
  const recordsDoc = getDocumentBadge(vasp.records_required_document);
  const freezeDoc = getDocumentBadge(vasp.freeze_required_document);
  
  const getBadgeClasses = (color) => {
    switch(color) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'orange': return 'bg-orange-100 text-orange-800';
      case 'red': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };
  
  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Records Request Indicator */}
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeClasses(recordsDoc.color)}`}>
        <FileText className="h-3 w-3 mr-1" />
        <span className="text-xs">Records:</span>
        <span className="ml-1 font-semibold">{recordsDoc.text}</span>
      </div>
      
      {/* Freeze Request Indicator */}
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeClasses(freezeDoc.color)}`}>
        <Shield className="h-3 w-3 mr-1" />
        <span className="text-xs">Freeze:</span>
        <span className="ml-1 font-semibold">{freezeDoc.text}</span>
      </div>
    </div>
  );
};

export default RequestTypeIndicators;