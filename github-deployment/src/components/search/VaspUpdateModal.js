import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { vaspAPI } from '../../services/api';
import { SERVICE_TYPE_DEFINITIONS } from '../../constants/serviceTypeDefinitions';

const VaspUpdateModal = ({ isOpen, onClose, vasp }) => {
  const [formData, setFormData] = useState({
    name: vasp.name || '',
    legal_name: vasp.legal_name || '',
    compliance_email: vasp.compliance_email || '',
    compliance_contact: vasp.compliance_contact || '',
    service_address: vasp.service_address || '',
    jurisdiction: vasp.jurisdiction || '',
    service_types: vasp.service_types || [],
    law_enforcement_url: vasp.law_enforcement_url || '',
    records_required_document: vasp.records_required_document || '',
    freeze_required_document: vasp.freeze_required_document || '',
    notes: '',
    user_comments: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create update request for admin approval
      const updateRequest = {
        vaspId: vasp.id,
        vaspName: vasp.name,
        proposedChanges: formData,
        submittedAt: new Date().toISOString(),
        userComments: formData.user_comments
      };
      
      await vaspAPI.submitUpdateRequest(updateRequest);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit update request:', err);
      setError('Failed to submit update request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceType = (type) => {
    setFormData(prev => ({
      ...prev,
      service_types: prev.service_types.includes(type)
        ? prev.service_types.filter(t => t !== type)
        : [...prev.service_types, type]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Update VASP Information</h2>
              <p className="text-sm text-gray-500 mt-1">
                Submit corrections or updates for {vasp.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                Update request submitted successfully! Admin will review your changes.
              </p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VASP Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Name
                </label>
                <input
                  type="text"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({...formData, legal_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compliance Email
                </label>
                <input
                  type="email"
                  value={formData.compliance_email}
                  onChange={(e) => setFormData({...formData, compliance_email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="compliance@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compliance Contact Name
                </label>
                <input
                  type="text"
                  value={formData.compliance_contact}
                  onChange={(e) => setFormData({...formData, compliance_contact: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Address
                </label>
                <textarea
                  value={formData.service_address}
                  onChange={(e) => setFormData({...formData, service_address: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full service address"
                />
              </div>
            </div>
          </div>

          {/* Service Types */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Service Types</h3>
            <p className="text-sm text-gray-600 mb-3">Select all that apply:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(SERVICE_TYPE_DEFINITIONS).map(([key, def]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.service_types.includes(key)}
                    onChange={() => toggleServiceType(key)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{def.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Document Requirements */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Document for Records Request
                </label>
                <select
                  value={formData.records_required_document}
                  onChange={(e) => setFormData({...formData, records_required_document: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Document for Freeze/Seizure
                </label>
                <select
                  value={formData.freeze_required_document}
                  onChange={(e) => setFormData({...formData, freeze_required_document: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({...formData, jurisdiction: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., United States"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Law Enforcement Portal URL
                </label>
                <input
                  type="url"
                  value={formData.law_enforcement_url}
                  onChange={(e) => setFormData({...formData, law_enforcement_url: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments about this update
                  <span className="text-xs text-gray-500 ml-2">(What changed? Why?)</span>
                </label>
                <textarea
                  value={formData.user_comments}
                  onChange={(e) => setFormData({...formData, user_comments: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please describe what information has changed and why..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Submit Update Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaspUpdateModal;