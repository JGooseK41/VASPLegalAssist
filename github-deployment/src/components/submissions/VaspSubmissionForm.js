import React, { useState } from 'react';
import { Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { submissionAPI } from '../../services/api';

const VaspSubmissionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    jurisdiction: '',
    compliance_email: '',
    compliance_contact: '',
    service_address: '',
    phone: '',
    processing_time: '5-10 business days',
    preferred_method: 'email',
    required_document: 'Letterhead',
    info_types: ['KYC', 'Transaction History'],
    accepts_us_service: false,
    has_own_portal: false,
    law_enforcement_url: '',
    notes: ''
  });
  
  const infoTypeOptions = [
    'KYC',
    'Transaction History',
    'Account Balance',
    'Login Records',
    'IP Addresses',
    'Device Information',
    'Wallet Addresses'
  ];
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleInfoTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      info_types: prev.info_types.includes(type)
        ? prev.info_types.filter(t => t !== type)
        : [...prev.info_types, type]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      await submissionAPI.createSubmission(formData);
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        navigate('/submissions/my');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit VASP:', error);
      setError('Failed to submit VASP information. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-green-900 mb-2">
            VASP Submission Successful!
          </h3>
          <p className="text-green-700">
            Your submission has been received and will be reviewed by an administrator.
            You'll be redirected to your submissions page shortly.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Submit New VASP Information</h1>
        <p className="mt-1 text-sm text-gray-600">
          Found a new VASP? Submit their information for review and addition to our database.
        </p>
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                All submissions require admin approval before being added to the database.
                Please ensure all information is accurate and verified.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                VASP Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Binance, Coinbase"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Legal Name *
              </label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full legal entity name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Jurisdiction *
              </label>
              <input
                type="text"
                name="jurisdiction"
                value={formData.jurisdiction}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., United States, Singapore"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Compliance Email *
              </label>
              <input
                type="email"
                name="compliance_email"
                value={formData.compliance_email}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="compliance@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Compliance Contact Name
              </label>
              <input
                type="text"
                name="compliance_contact"
                value={formData.compliance_contact}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe, Compliance Officer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Service Address
            </label>
            <textarea
              name="service_address"
              value={formData.service_address}
              onChange={handleChange}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Full mailing address for legal service"
            />
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Average Processing Time
              </label>
              <input
                type="text"
                name="processing_time"
                value={formData.processing_time}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 5-10 business days"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Service Method *
              </label>
              <select
                name="preferred_method"
                value={formData.preferred_method}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="email">Email</option>
                <option value="portal">Portal</option>
                <option value="kodex">Kodex</option>
                <option value="postal">Postal Mail</option>
                <option value="mlat">MLAT Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Required Document Type
              </label>
              <input
                type="text"
                name="required_document"
                value={formData.required_document}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Letterhead, Court Order"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Law Enforcement Portal URL
              </label>
              <input
                type="url"
                name="law_enforcement_url"
                value={formData.law_enforcement_url}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://le.example.com"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Information Types Available
            </label>
            <div className="space-y-2">
              {infoTypeOptions.map(type => (
                <label key={type} className="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    checked={formData.info_types.includes(type)}
                    onChange={() => handleInfoTypeToggle(type)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="accepts_us_service"
                checked={formData.accepts_us_service}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Accepts service from US law enforcement</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="has_own_portal"
                checked={formData.has_own_portal}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Has dedicated law enforcement portal</span>
            </label>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any special instructions, requirements, or important information..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Submit VASP
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VaspSubmissionForm;