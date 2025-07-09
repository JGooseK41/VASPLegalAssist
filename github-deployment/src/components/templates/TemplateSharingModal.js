import React, { useState } from 'react';
import { X, AlertTriangle, Users, Award, FileText, Shield, Globe, Lock } from 'lucide-react';

const TemplateSharingModal = ({ isOpen, onClose, onConfirm, templateName }) => {
  const [accepted, setAccepted] = useState(false);
  const [sharingData, setSharingData] = useState({
    sharedTitle: '',
    sharedDescription: '',
    domainRestriction: false,
    allowedDomains: []
  });
  const [domainInput, setDomainInput] = useState('');
  
  if (!isOpen) return null;
  
  const handleAddDomain = () => {
    const domain = domainInput.trim().toLowerCase();
    if (domain && !sharingData.allowedDomains.includes(domain)) {
      setSharingData(prev => ({
        ...prev,
        allowedDomains: [...prev.allowedDomains, domain]
      }));
      setDomainInput('');
    }
  };
  
  const handleRemoveDomain = (domain) => {
    setSharingData(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter(d => d !== domain)
    }));
  };
  
  const handleConfirm = () => {
    if (sharingData.sharedTitle && sharingData.sharedDescription && accepted) {
      onConfirm(sharingData);
    }
  };
  
  const isValid = sharingData.sharedTitle.trim() && sharingData.sharedDescription.trim() && accepted;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Share Template with Community
                </h3>
                
                <div className="mt-4 space-y-4">
                  {/* Template Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={sharingData.sharedTitle}
                        onChange={(e) => setSharingData(prev => ({...prev, sharedTitle: e.target.value}))}
                        placeholder="e.g., Federal Subpoena for Cryptocurrency Records"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={100}
                      />
                      <p className="text-xs text-gray-500 mt-1">Clear, descriptive title for other users</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Use Case Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={sharingData.sharedDescription}
                        onChange={(e) => setSharingData(prev => ({...prev, sharedDescription: e.target.value}))}
                        placeholder="Describe when and how this template should be used, what type of cases it's for, and any special requirements..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 mt-1">Help others understand when to use this template</p>
                    </div>
                  </div>
                  
                  {/* Access Restrictions */}
                  <div className="border-t pt-4">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={sharingData.domainRestriction}
                        onChange={(e) => setSharingData(prev => ({...prev, domainRestriction: e.target.checked}))}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-700">Restrict access by email domain</span>
                        <p className="text-xs text-gray-500">Limit who can use this template based on their email domain</p>
                      </div>
                    </label>
                    
                    {sharingData.domainRestriction && (
                      <div className="mt-3 ml-7">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                            placeholder="example.gov"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleAddDomain}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sharingData.allowedDomains.map(domain => (
                            <span key={domain} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {domain}
                              <button
                                type="button"
                                onClick={() => handleRemoveDomain(domain)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        {sharingData.allowedDomains.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">No restrictions - available to all users</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Warnings */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <FileText className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-900">Important Notice</h4>
                        <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside space-y-1">
                          <li>Your template will be shared <strong>exactly as created</strong></li>
                          <li>This includes all headers, logos, and agency information</li>
                          <li>The template will <strong>NOT be encrypted</strong></li>
                          <li>You can edit or remove it from sharing at any time</li>
                          <li>Other users can copy your template for their use</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rewards */}
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <Award className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-900">Rewards</h4>
                        <ul className="mt-1 text-sm text-green-700 space-y-1">
                          <li>• Earn <strong>5 points</strong> for sharing your template</li>
                          <li>• Earn <strong>1 point</strong> each time another user uses it</li>
                          <li>• Help build a collaborative law enforcement community</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Consent */}
                  <div className="border-t pt-4">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        I understand that my template "{templateName}" will be shared with platform users
                        {sharingData.domainRestriction && sharingData.allowedDomains.length > 0 
                          ? ` (restricted to ${sharingData.allowedDomains.join(', ')} domains)` 
                          : ' (no restrictions)'}, 
                        including all content, headers, and identifying information. I consent to this sharing
                        and understand I can revoke access at any time.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Share Template
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSharingModal;