import React, { useState } from 'react';
import { X, Save, AlertCircle, Upload, FileImage, Trash2 } from 'lucide-react';
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
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create FormData to handle file uploads
      const formDataToSend = new FormData();
      
      // Add the update request data
      const updateRequest = {
        vaspId: vasp.id,
        proposedChanges: formData,
        userComments: formData.user_comments
      };
      
      formDataToSend.append('updateRequest', JSON.stringify(updateRequest));
      
      // Add evidence files
      evidenceFiles.forEach((file, index) => {
        formDataToSend.append('evidence', file.file);
        formDataToSend.append(`description_${index}`, file.description || '');
      });
      
      await vaspAPI.submitUpdateRequest(formDataToSend);
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadError(null);
    
    // Validate files
    const validFiles = files.filter(file => {
      // Check file type (images only)
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed');
        return false;
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return false;
      }
      return true;
    });
    
    // Add valid files to the list
    const newFiles = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      description: ''
    }));
    
    setEvidenceFiles(prev => [...prev, ...newFiles]);
  };
  
  const removeFile = (index) => {
    setEvidenceFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  const updateFileDescription = (index, description) => {
    setEvidenceFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].description = description;
      return newFiles;
    });
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
                  Required Document for Freeze Request
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

          {/* Evidence Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Evidence</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload screenshots or images to support your update request (optional)
            </p>
            
            {uploadError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{uploadError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* File Upload Button */}
              <label className="relative cursor-pointer bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-gray-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload evidence (images only, max 5MB each)
                  </p>
                </div>
              </label>
              
              {/* Uploaded Files List */}
              {evidenceFiles.length > 0 && (
                <div className="space-y-3">
                  {evidenceFiles.map((file, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <img
                          src={file.preview}
                          alt={`Evidence ${index + 1}`}
                          className="h-20 w-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileImage className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {file.file.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={file.description}
                            onChange={(e) => updateFileDescription(index, e.target.value)}
                            placeholder="Add a description for this evidence (optional)"
                            className="mt-2 w-full text-sm border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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