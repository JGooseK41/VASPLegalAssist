import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Zap, Info, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../hooks/useEncryption';
import { createEncryptedTemplateAPI } from '../../services/encryptedApiOptimized';

const DocumentCreateChoice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const encryption = useEncryption();
  const [hasCustomTemplates, setHasCustomTemplates] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (encryption.isKeyReady) {
      checkUserTemplates();
    }
  }, [encryption.isKeyReady]);

  const checkUserTemplates = async () => {
    try {
      const encryptedAPI = createEncryptedTemplateAPI(encryption);
      const templates = await encryptedAPI.getTemplates();
      
      // Check if user has any custom templates (not global ones)
      const userTemplates = templates.filter(t => 
        t.userId === user.id && t.templateType === 'custom'
      );
      
      setHasCustomTemplates(userTemplates.length > 0);
    } catch (error) {
      console.error('Error checking templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimpleTemplate = () => {
    navigate('/documents/simple');
  };

  const handleCustomTemplate = () => {
    if (hasCustomTemplates) {
      navigate('/documents/custom');
    } else {
      // Redirect to template creation with info
      navigate('/templates?showInfo=true');
    }
  };

  const handleBatchProcess = () => {
    navigate('/documents/batch');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Generate VASP Request
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Choose how you'd like to create your legal document
          </p>
        </div>

        {/* Option Cards */}
        <div className="space-y-6">
          {/* Simple Template Option */}
          <div 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={handleSimpleTemplate}
          >
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Quick Standard Template
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Use our standard letterhead templates for freeze orders and data requests. 
                    Perfect when you need to generate documents quickly for your own agency letterhead.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <Zap className="h-3 w-3 mr-1" />
                      Quick & Easy
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Auto-fills from profile
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Word format for letterhead
                    </span>
                  </div>
                  <button className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                    Create Standard Document
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Template Option */}
          <div 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={handleCustomTemplate}
          >
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
                    <Upload className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Use Custom Template
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Use your own uploaded templates with smart placeholders for subpoenas, 
                    search warrants, or other legal documents specific to your needs.
                  </p>
                  {!loading && !hasCustomTemplates && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <div className="flex">
                        <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                        <p className="ml-2 text-sm text-amber-800">
                          You haven't created any custom templates yet. Click to learn how to create one.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Your templates
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Smart placeholders
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Multiple formats
                    </span>
                  </div>
                  <button className="inline-flex items-center text-green-600 hover:text-green-700 font-medium">
                    {hasCustomTemplates ? 'Select Custom Template' : 'Create Your First Template'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Processing Link */}
          <div className="mt-8 p-6 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Need to process multiple VASPs?
                </h3>
                <p className="text-gray-600 mt-1">
                  Upload a CSV file to generate documents for multiple VASPs at once
                </p>
              </div>
              <button 
                onClick={handleBatchProcess}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Batch Process
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCreateChoice;