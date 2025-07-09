import React, { useState } from 'react';
import { X, Upload, Plus, Building, Mail, Phone, Globe, FileText, Check, Info } from 'lucide-react';
import axios from 'axios';

const VaspSelfRegistration = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // VASP Info
    name: '',
    legalName: '',
    jurisdiction: '',
    complianceEmail: '',
    complianceContact: '',
    serviceAddress: '',
    phone: '',
    processingTime: '5-10 business days',
    preferredMethod: 'email',
    requiredDocument: '',
    infoTypes: ['KYC', 'Transaction History', 'Account Balance', 'Login Records'],
    acceptsUsService: true,
    hasOwnPortal: false,
    lawEnforcementUrl: '',
    notes: '',
    
    // Submitter Info
    submitterName: '',
    submitterEmail: '',
    submitterTitle: '',
    submitterPhone: '',
    templateUrls: []
  });
  
  const [templateUrl, setTemplateUrl] = useState('');
  
  if (!isOpen) return null;
  
  const handleAddTemplate = () => {
    if (templateUrl.trim()) {
      setFormData({
        ...formData,
        templateUrls: [...formData.templateUrls, templateUrl.trim()]
      });
      setTemplateUrl('');
    }
  };
  
  const handleRemoveTemplate = (index) => {
    setFormData({
      ...formData,
      templateUrls: formData.templateUrls.filter((_, i) => i !== index)
    });
  };
  
  const handleInfoTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      infoTypes: prev.infoTypes.includes(type)
        ? prev.infoTypes.filter(t => t !== type)
        : [...prev.infoTypes, type]
    }));
  };
  
  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.legalName || !formData.jurisdiction || !formData.complianceEmail) {
        setError('Please fill in all required fields');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.submitterName || !formData.submitterEmail) {
        setError('Please provide your contact information');
        return false;
      }
    }
    setError('');
    return true;
  };
  
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/public/vasp-registration', formData);
      
      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Binance"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Entity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Binance Holdings Limited"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jurisdiction <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({...formData, jurisdiction: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., United States, Singapore"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compliance Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.complianceEmail}
                  onChange={(e) => setFormData({...formData, complianceEmail: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="compliance@vasp.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 234 567 8900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Address (optional)
                </label>
                <input
                  type="text"
                  value={formData.serviceAddress}
                  onChange={(e) => setFormData({...formData, serviceAddress: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Main St, City, Country"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.acceptsUsService}
                  onChange={(e) => setFormData({...formData, acceptsUsService: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Accepts US legal service</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasOwnPortal}
                  onChange={(e) => setFormData({...formData, hasOwnPortal: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Has law enforcement portal</span>
              </label>
            </div>
            
            {formData.hasOwnPortal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Law Enforcement Portal URL
                </label>
                <input
                  type="url"
                  value={formData.lawEnforcementUrl}
                  onChange={(e) => setFormData({...formData, lawEnforcementUrl: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://vasp.com/law-enforcement"
                />
              </div>
            )}
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Service Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typical Processing Time
              </label>
              <select
                value={formData.processingTime}
                onChange={(e) => setFormData({...formData, processingTime: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="24 hours">24 hours</option>
                <option value="2-3 business days">2-3 business days</option>
                <option value="5-10 business days">5-10 business days</option>
                <option value="10-15 business days">10-15 business days</option>
                <option value="15+ business days">15+ business days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Method
              </label>
              <select
                value={formData.preferredMethod}
                onChange={(e) => setFormData({...formData, preferredMethod: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="email">Email</option>
                <option value="portal">Web Portal</option>
                <option value="kodex">Kodex</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Document Type
              </label>
              <select
                value={formData.requiredDocument}
                onChange={(e) => setFormData({...formData, requiredDocument: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select document type</option>
                <option value="Letterhead">Agency Letterhead</option>
                <option value="Subpoena">Subpoena</option>
                <option value="Search Warrant">Search Warrant</option>
                <option value="Court Order">Court Order</option>
                <option value="MLAT">MLAT Request</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Information Types Available
              </label>
              <div className="space-y-2">
                {['KYC', 'Transaction History', 'Account Balance', 'Login Records', 'IP Addresses', 'Device Information'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.infoTypes.includes(type)}
                      onChange={() => handleInfoTypeToggle(type)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any special requirements or instructions..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Custom Templates (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Upload templates you want law enforcement to use when submitting requests
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                  placeholder="https://example.com/template.docx"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTemplate}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {formData.templateUrls.map((url, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm mb-1">
                  <span className="truncate flex-1">{url}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTemplate(index)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Your Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.submitterName}
                  onChange={(e) => setFormData({...formData, submitterName: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.submitterEmail}
                  onChange={(e) => setFormData({...formData, submitterEmail: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john@vasp.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title/Role
                </label>
                <input
                  type="text"
                  value={formData.submitterTitle}
                  onChange={(e) => setFormData({...formData, submitterTitle: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Compliance Officer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.submitterPhone}
                  onChange={(e) => setFormData({...formData, submitterPhone: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>You'll receive a verification email</li>
                <li>Our admin team will review your submission</li>
                <li>Once approved, law enforcement can start using your information</li>
                <li>You can request updates anytime via email</li>
              </ol>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Please check your email at <strong>{formData.submitterEmail}</strong> to verify your submission.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">VASP Self-Registration</h2>
              <p className="text-sm text-gray-500 mt-1">
                Help law enforcement submit compliant requests to your organization
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Benefits Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-green-900 mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Benefits of Registration
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Receive properly formatted legal requests with all required information</li>
              <li>• Reduce back-and-forth communications with law enforcement</li>
              <li>• Upload custom templates for officers to use</li>
              <li>• Update your contact information and requirements anytime</li>
            </ul>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {/* Step Content */}
          {renderStep()}
          
          {/* Actions */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={currentStep === 1 ? onClose : () => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Building className="h-4 w-4 mr-2" />
                    Submit Registration
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaspSelfRegistration;