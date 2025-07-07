import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DemoBanner = () => {
  const { user } = useAuth();
  
  // Only show banner for demo users
  if (!user || user.role !== 'DEMO') {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border-b border-yellow-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Demo Account:</span> You can generate documents but they won't be saved. Templates cannot be created or modified.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;