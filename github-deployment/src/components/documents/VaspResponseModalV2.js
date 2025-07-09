import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, ChevronRight, MessageSquare, Mail, Clock, FileText, DollarSign } from 'lucide-react';
import axios from 'axios';

const VaspResponseModalV2 = ({ isOpen, onClose, document, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Document Effectiveness
    documentWorked: null,
    failureReasons: [],
    requiredDocuments: [],
    additionalRequirements: '',
    
    // Step 2: Contact Verification
    contactEmailUsed: document?.vaspEmail || '',
    contactEmailWorked: null,
    suggestedEmailUpdate: '',
    
    // Direct contact info
    directContactName: '',
    directContactEmail: '',
    directContactTitle: '',
    
    // Step 3: Response Details
    turnaroundTime: '',
    responseQuality: '',
    dataFormat: '',
    fees: '',
    
    // Step 4: Additional Notes
    additionalNotes: '',
    
    // Legacy fields for compatibility
    isUsCompliant: null,
    recordsRequestMethod: null,
    freezeRequestMethod: null
  });

  if (!isOpen || !document) return null;

  const failureReasonOptions = [
    { value: 'missing_case_number', label: 'Missing case number' },
    { value: 'missing_badge_info', label: 'Missing badge/credential info' },
    { value: 'wrong_email_format', label: 'Wrong email domain/format' },
    { value: 'requires_subpoena', label: 'Requires subpoena' },
    { value: 'requires_search_warrant', label: 'Requires search warrant' },
    { value: 'requires_mlat', label: 'Requires MLAT' },
    { value: 'no_us_service', label: 'Does not accept US service' },
    { value: 'incorrect_contact', label: 'Contact info was incorrect' },
    { value: 'no_response', label: 'No response received' },
    { value: 'other', label: 'Other reason' }
  ];

  const requiredDocumentOptions = [
    { value: 'subpoena', label: 'Subpoena' },
    { value: 'search_warrant', label: 'Search Warrant' },
    { value: 'court_order', label: 'Court Order' },
    { value: 'mlat', label: 'MLAT Request' },
    { value: 'badge_photo', label: 'Badge/ID Photo' },
    { value: 'case_summary', label: 'Case Summary' },
    { value: 'legal_authorization', label: 'Legal Authorization' }
  ];

  const responseQualityOptions = [
    { value: 'complete', label: 'Complete - All requested data provided' },
    { value: 'partial', label: 'Partial - Some data missing' },
    { value: 'redacted', label: 'Heavily redacted' },
    { value: 'minimal', label: 'Minimal - Very limited data' }
  ];

  const dataFormatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'csv', label: 'CSV/Excel' },
    { value: 'json', label: 'JSON' },
    { value: 'screenshot', label: 'Screenshots' },
    { value: 'portal', label: 'Online Portal' },
    { value: 'other', label: 'Other' }
  ];

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && formData.documentWorked === null) {
      setError('Please indicate if the document worked');
      return;
    }
    if (currentStep === 1 && formData.documentWorked === false && formData.failureReasons.length === 0) {
      setError('Please select at least one reason why the document didn\'t work');
      return;
    }
    if (currentStep === 3 && !formData.turnaroundTime) {
      setError('Please select the turnaround time');
      return;
    }
    
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine legacy fields based on new data
      const isUsCompliant = formData.documentWorked && !formData.failureReasons.includes('no_us_service');
      
      let recordsRequestMethod = null;
      let freezeRequestMethod = null;
      
      if (document.documentType === 'records_request') {
        if (formData.documentWorked) {
          recordsRequestMethod = 'letterhead';
        } else if (formData.requiredDocuments.includes('subpoena')) {
          recordsRequestMethod = 'subpoena';
        } else if (formData.requiredDocuments.includes('search_warrant')) {
          recordsRequestMethod = 'search_warrant';
        } else if (formData.requiredDocuments.includes('mlat')) {
          recordsRequestMethod = 'mlat';
        }
      }
      
      if (document.documentType === 'freeze_request') {
        if (formData.documentWorked) {
          freezeRequestMethod = 'letterhead';
        } else if (formData.requiredDocuments.includes('search_warrant')) {
          freezeRequestMethod = 'search_warrant';
        } else if (formData.requiredDocuments.includes('mlat')) {
          freezeRequestMethod = 'mlat';
        }
      }
      
      // Submit response
      const response = await axios.post('/api/vasp-responses', {
        documentId: document.id,
        vaspId: document.vaspId,
        documentType: document.documentType,
        
        // New fields
        documentWorked: formData.documentWorked,
        failureReasons: formData.failureReasons,
        requiredDocuments: formData.requiredDocuments,
        contactEmailUsed: formData.contactEmailUsed,
        contactEmailWorked: formData.contactEmailWorked,
        suggestedEmailUpdate: formData.suggestedEmailUpdate,
        directContactName: formData.directContactName,
        directContactEmail: formData.directContactEmail,
        directContactTitle: formData.directContactTitle,
        turnaroundTime: formData.turnaroundTime,
        responseQuality: formData.responseQuality,
        dataFormat: formData.dataFormat,
        fees: formData.fees,
        additionalRequirements: formData.additionalRequirements,
        additionalNotes: formData.additionalNotes,
        
        // Legacy fields
        isUsCompliant,
        recordsRequestMethod,
        freezeRequestMethod
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      // Generate automatic comment if there are notes or important feedback
      if (formData.additionalNotes || formData.additionalRequirements || !formData.documentWorked) {
        await generateAutomaticComment();
      }
      
      if (onSuccess) {
        onSuccess({
          ...response.data,
          message: 'Response logged successfully! Thank you for contributing to the community intelligence.'
        });
      }
      
      onClose();
    } catch (err) {
      console.error('Error submitting VASP response:', err);
      setError(err.response?.data?.error || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const generateAutomaticComment = async () => {
    let commentText = '';
    
    // Add document effectiveness info
    if (!formData.documentWorked) {
      commentText += `⚠️ ${document.documentType.replace(/_/g, ' ')} on letterhead did not work. `;
      
      // Add failure reasons
      const reasons = formData.failureReasons.map(r => 
        failureReasonOptions.find(opt => opt.value === r)?.label
      ).filter(Boolean);
      
      if (reasons.length > 0) {
        commentText += `Issues: ${reasons.join(', ')}. `;
      }
      
      // Add required documents
      if (formData.requiredDocuments.length > 0) {
        const docs = formData.requiredDocuments.map(d => 
          requiredDocumentOptions.find(opt => opt.value === d)?.label
        ).filter(Boolean);
        commentText += `Required: ${docs.join(', ')}. `;
      }
    } else {
      commentText += `✅ ${document.documentType.replace(/_/g, ' ')} on letterhead worked! `;
    }
    
    // Add turnaround time
    if (formData.turnaroundTime) {
      const timeLabel = {
        'less_than_24h': '<24 hours',
        '2_3_days': '2-3 days',
        '1_week_or_less': '≤1 week',
        '1_4_weeks': '1-4 weeks',
        'more_than_4_weeks': '>4 weeks'
      }[formData.turnaroundTime];
      commentText += `Response time: ${timeLabel}. `;
    }
    
    // Add email update suggestion
    if (formData.suggestedEmailUpdate && formData.suggestedEmailUpdate !== formData.contactEmailUsed) {
      commentText += `📧 Suggested email update: ${formData.suggestedEmailUpdate}. `;
    }
    
    // Add additional notes
    if (formData.additionalNotes) {
      commentText += formData.additionalNotes;
    }
    
    // Submit comment
    try {
      await axios.post(`/api/comments/vasp/${document.vaspId}`, {
        content: commentText.trim()
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
    } catch (err) {
      console.error('Failed to post automatic comment:', err);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Document Effectiveness</h3>
            
            {/* Primary Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Did the {document.documentType.replace(/_/g, ' ')} successfully achieve its purpose?
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, documentWorked: true})}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                    formData.documentWorked === true 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <CheckCircle className={`h-5 w-5 mr-3 ${
                      formData.documentWorked === true ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <span className="font-medium">Yes - Document worked as intended</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({...formData, documentWorked: false})}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                    formData.documentWorked === false 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <XCircle className={`h-5 w-5 mr-3 ${
                      formData.documentWorked === false ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    <span className="font-medium">No - Document was rejected or didn't work</span>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Failure Reasons - Only show if document didn't work */}
            {formData.documentWorked === false && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Why didn't the document work? (Select all that apply)
                </label>
                <div className="space-y-2">
                  {failureReasonOptions.map(option => (
                    <label key={option.value} className="flex items-start">
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={formData.failureReasons.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, failureReasons: [...formData.failureReasons, option.value]});
                          } else {
                            setFormData({...formData, failureReasons: formData.failureReasons.filter(r => r !== option.value)});
                          }
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                
                {/* Required Documents */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What documents did they require instead? (Select all that apply)
                  </label>
                  <div className="space-y-2">
                    {requiredDocumentOptions.map(option => (
                      <label key={option.value} className="flex items-start">
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={formData.requiredDocuments.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, requiredDocuments: [...formData.requiredDocuments, option.value]});
                            } else {
                              setFormData({...formData, requiredDocuments: formData.requiredDocuments.filter(d => d !== option.value)});
                            }
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Additional Requirements */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other specific requirements they mentioned (optional)
                  </label>
                  <textarea
                    value={formData.additionalRequirements}
                    onChange={(e) => setFormData({...formData, additionalRequirements: e.target.value})}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Required specific case type, needed prosecutor approval, etc."
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Contact Verification</h3>
            
            {/* Email Used */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which email address did you use?
              </label>
              <input
                type="email"
                value={formData.contactEmailUsed}
                onChange={(e) => setFormData({...formData, contactEmailUsed: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="compliance@vasp.com"
              />
            </div>
            
            {/* Email Worked */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Did this email address work?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, contactEmailWorked: true})}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.contactEmailWorked === true 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className={`h-5 w-5 mx-auto mb-1 ${
                    formData.contactEmailWorked === true ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <span className="text-sm">Yes</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({...formData, contactEmailWorked: false})}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.contactEmailWorked === false 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <XCircle className={`h-5 w-5 mx-auto mb-1 ${
                    formData.contactEmailWorked === false ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <span className="text-sm">No</span>
                </button>
              </div>
            </div>
            
            {/* Suggested Email Update */}
            {formData.contactEmailWorked === false && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you have a working email address to suggest?
                </label>
                <input
                  type="email"
                  value={formData.suggestedEmailUpdate}
                  onChange={(e) => setFormData({...formData, suggestedEmailUpdate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="working-email@vasp.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will help other users and may update the VASP contact info
                </p>
              </div>
            )}
            
            {/* Direct Contact Information - Show if email worked */}
            {formData.contactEmailWorked === true && (
              <div className="animate-fadeIn space-y-4 mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-green-600" />
                  Share Direct Contact (Optional)
                </h4>
                <p className="text-xs text-gray-600">
                  If you worked with a helpful contact, sharing their info can help other officers save time.
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.directContactName}
                      onChange={(e) => setFormData({...formData, directContactName: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="John Smith"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Direct Email
                    </label>
                    <input
                      type="email"
                      value={formData.directContactEmail}
                      onChange={(e) => setFormData({...formData, directContactEmail: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="john.smith@vasp.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Title/Role
                    </label>
                    <input
                      type="text"
                      value={formData.directContactTitle}
                      onChange={(e) => setFormData({...formData, directContactTitle: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Senior Compliance Officer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Response Details</h3>
            
            {/* Turnaround Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How long did it take to receive a response? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[
                  { value: 'less_than_24h', label: 'Less than 24 hours', icon: '⚡' },
                  { value: '2_3_days', label: '2-3 days', icon: '⏱️' },
                  { value: '1_week_or_less', label: '1 week or less', icon: '📅' },
                  { value: '1_4_weeks', label: '1-4 weeks', icon: '📆' },
                  { value: 'more_than_4_weeks', label: 'More than 4 weeks', icon: '🐌' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({...formData, turnaroundTime: option.value})}
                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center ${
                      formData.turnaroundTime === option.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mr-3">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Response Quality - Only if document worked */}
            {formData.documentWorked && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate the quality of data received?
                </label>
                <select
                  value={formData.responseQuality}
                  onChange={(e) => setFormData({...formData, responseQuality: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select quality</option>
                  {responseQualityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Data Format - Only if document worked */}
            {formData.documentWorked && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What format was the data provided in?
                </label>
                <select
                  value={formData.dataFormat}
                  onChange={(e) => setFormData({...formData, dataFormat: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select format</option>
                  {dataFormatOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Fees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Were any fees charged? (optional)
              </label>
              <input
                type="text"
                value={formData.fees}
                onChange={(e) => setFormData({...formData, fees: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., $50 processing fee"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any additional notes that would help other users? (optional)
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., They prefer requests sent before noon EST, very responsive compliance team, etc."
              />
              <p className="mt-2 text-sm text-gray-500">
                <MessageSquare className="inline h-4 w-4 mr-1" />
                Your feedback will be posted as a comment to help other users
              </p>
            </div>
            
            {/* Summary Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Response Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  {formData.documentWorked ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <span>Document {formData.documentWorked ? 'worked' : 'did not work'}</span>
                </div>
                
                {formData.turnaroundTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Response time: {
                      {
                        'less_than_24h': '<24 hours',
                        '2_3_days': '2-3 days',
                        '1_week_or_less': '≤1 week',
                        '1_4_weeks': '1-4 weeks',
                        'more_than_4_weeks': '>4 weeks'
                      }[formData.turnaroundTime]
                    }</span>
                  </div>
                )}
                
                {formData.contactEmailWorked === false && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-red-400 mr-2" />
                    <span>Email needs update</span>
                  </div>
                )}
                
                {formData.fees && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Fees: {formData.fees}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Log VASP Response</h2>
              <p className="text-sm text-gray-500 mt-1">
                Help improve community intelligence about {document.vaspName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}
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
                {step < 4 && (
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
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          {renderStep()}

          {/* Actions */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={currentStep === 1 ? onClose : handleBack}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Response
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

export default VaspResponseModalV2;