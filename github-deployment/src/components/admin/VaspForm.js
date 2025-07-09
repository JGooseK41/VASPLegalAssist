import React, { useState } from 'react';
import { X } from 'lucide-react';
import { adminAPI } from '../../services/api';

const VaspForm = ({ vasp, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: vasp?.name || '',
    legal_name: vasp?.legal_name || '',
    jurisdiction: vasp?.jurisdiction || '',
    compliance_email: vasp?.compliance_email || '',
    compliance_contact: vasp?.compliance_contact || '',
    service_address: vasp?.service_address || '',
    phone: vasp?.phone || '',
    processing_time: vasp?.processing_time || '5-10 business days',
    preferred_method: vasp?.preferred_method || 'email',
    required_document: vasp?.required_document || 'Letterhead',
    info_types: vasp?.info_types || ['KYC', 'Transaction History'],
    accepts_us_service: vasp?.accepts_us_service || false,
    has_own_portal: vasp?.has_own_portal || false,
    law_enforcement_url: vasp?.law_enforcement_url || '',
    notes: vasp?.notes || '',
    isActive: vasp?.isActive !== undefined ? vasp.isActive : true,
    service_types: vasp?.service_types || [],
    // Request type specific fields
    records_required_document: vasp?.records_required_document || '',
    records_processing_time: vasp?.records_processing_time || '',
    freeze_required_document: vasp?.freeze_required_document || '',
    freeze_processing_time: vasp?.freeze_processing_time || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const infoTypeOptions = [
    'KYC',
    'Transaction History',
    'Account Balance',
    'Login Records',
    'IP Addresses',
    'Device Information',
    'Wallet Addresses'
  ];
  
  const serviceTypeOptions = [
    { value: 'CEX', label: 'Centralized Exchange (CEX)' },
    { value: 'DEX', label: 'Decentralized Exchange (DEX)' },
    { value: 'P2P', label: 'P2P Trading' },
    { value: 'Kiosk', label: 'Crypto Kiosk/ATM' },
    { value: 'Bridge', label: 'Bridging Service' },
    { value: 'Gambling', label: 'Gambling Service' },
    { value: 'Wallet', label: 'Wallet Provider' },
    { value: 'OTC', label: 'OTC Desk' },
    { value: 'Mining', label: 'Mining Pool' },
    { value: 'Payment', label: 'Payment Processor' },
    { value: 'Staking', label: 'Staking Service' },
    { value: 'Lending', label: 'Lending Platform' },
    { value: 'NFT', label: 'NFT Marketplace' },
    { value: 'Stablecoin', label: 'Stablecoin Issuer' },
    { value: 'Mixer', label: 'Mixing Service' }
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
  
  const handleServiceTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      service_types: prev.service_types.includes(type)
        ? prev.service_types.filter(t => t !== type)
        : [...prev.service_types, type]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (vasp) {
        await adminAPI.updateVasp(vasp.id, formData);
      } else {
        await adminAPI.createVasp(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save VASP:', error);
      setError('Failed to save VASP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          {vasp ? 'Edit VASP' : 'Add New VASP'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
                <span className="text-xs text-gray-500 ml-1">(Common/Trading name)</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Binance US, Kraken, Circle"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Legal Name *
                <span className="text-xs text-gray-500 ml-1">(Full legal entity name)</span>
              </label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleChange}
                required
                placeholder="e.g., BAM Trading Services Inc., d/b/a Binance US"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Include "d/b/a" if applicable (e.g., "Payward Ventures Inc d/b/a Kraken")
              </p>
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
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Compliance Contact
              </label>
              <input
                type="text"
                name="compliance_contact"
                value={formData.compliance_contact}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            />
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Processing Time
              </label>
              <input
                type="text"
                name="processing_time"
                value={formData.processing_time}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Method *
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
                <option value="postal">Postal</option>
                <option value="mlat">MLAT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Required Document
              </label>
              <input
                type="text"
                name="required_document"
                value={formData.required_document}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Types
              <span className="text-xs text-gray-500 ml-1">(Select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {serviceTypeOptions.map(({ value, label }) => (
                <label key={value} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.service_types.includes(value)}
                    onChange={() => handleServiceTypeToggle(value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
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
              <span className="ml-2 text-sm text-gray-700">Accepts US Service</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="has_own_portal"
                checked={formData.has_own_portal}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Has Own Portal</span>
            </label>
            
            {vasp && (
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            )}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Request Type Specific Requirements */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Type Requirements</h3>
          <p className="text-sm text-gray-600 mb-4">Specify document requirements for each request type</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Records Request Section */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Records Request</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Required Document
                  </label>
                  <select
                    name="records_required_document"
                    value={formData.records_required_document}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Unknown</option>
                    <option value="Letterhead">Letterhead</option>
                    <option value="Subpoena">Subpoena</option>
                    <option value="Search Warrant">Search Warrant</option>
                    <option value="MLAT">MLAT</option>
                    <option value="No Capability">No Capability by VASP</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Processing Time
                  </label>
                  <input
                    type="text"
                    name="records_processing_time"
                    value={formData.records_processing_time}
                    onChange={handleChange}
                    placeholder="e.g., 5-10 business days"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Freeze Request Section */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Freeze/Seizure Request</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Required Document
                  </label>
                  <select
                    name="freeze_required_document"
                    value={formData.freeze_required_document}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Unknown</option>
                    <option value="Letterhead">Letterhead</option>
                    <option value="Subpoena">Subpoena</option>
                    <option value="Search Warrant">Search Warrant</option>
                    <option value="MLAT">MLAT</option>
                    <option value="No Capability">No Capability by VASP</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Processing Time
                  </label>
                  <input
                    type="text"
                    name="freeze_processing_time"
                    value={formData.freeze_processing_time}
                    onChange={handleChange}
                    placeholder="e.g., 1-2 business days"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (vasp ? 'Update VASP' : 'Create VASP')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VaspForm;