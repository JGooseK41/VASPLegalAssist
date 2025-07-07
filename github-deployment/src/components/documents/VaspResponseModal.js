import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const VaspResponseModal = ({ isOpen, onClose, document, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    isUsCompliant: null,
    recordsRequestMethod: null,
    freezeRequestMethod: null,
    turnaroundTime: '',
    additionalNotes: ''
  });

  if (!isOpen || !document) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (formData.isUsCompliant === null) {
      setError('Please indicate if the VASP was US compliant');
      return;
    }
    
    if (!formData.turnaroundTime) {
      setError('Please select the turnaround time');
      return;
    }
    
    // Check if method is required based on document type
    if (document.documentType === 'records_request' && !formData.recordsRequestMethod) {
      setError('Please select the method required for records request');
      return;
    }
    
    if (document.documentType === 'freeze_request' && !formData.freezeRequestMethod) {
      setError('Please select the method required for freeze request');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/vasp-responses', {
        documentId: document.id,
        vaspId: document.vaspId,
        documentType: document.documentType,
        isUsCompliant: formData.isUsCompliant,
        recordsRequestMethod: formData.recordsRequestMethod,
        freezeRequestMethod: formData.freezeRequestMethod,
        turnaroundTime: formData.turnaroundTime,
        additionalNotes: formData.additionalNotes
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (onSuccess) {
        onSuccess({
          ...response.data,
          message: 'Response logged successfully! You earned 5 points for contributing to the community intelligence.'
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Log VASP Response</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Document Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Document Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>VASP:</strong> {document.vaspName}</p>
                <p><strong>Document Type:</strong> {document.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <p><strong>Case Number:</strong> {document.caseNumber}</p>
              </div>
            </div>

            {/* US Compliance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Was the VASP US compliant? <span className="text-red-500">*</span>
              </label>
              <div className="space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="isUsCompliant"
                    value="true"
                    onChange={(e) => setFormData({...formData, isUsCompliant: true})}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="isUsCompliant"
                    value="false"
                    onChange={(e) => setFormData({...formData, isUsCompliant: false})}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>

            {/* Records Request Method */}
            {document.documentType === 'records_request' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What did they require for the records request? <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.recordsRequestMethod || ''}
                  onChange={(e) => setFormData({...formData, recordsRequestMethod: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select method</option>
                  <option value="letterhead">Honored letterhead</option>
                  <option value="subpoena">Required subpoena</option>
                  <option value="search_warrant">Required search warrant</option>
                  <option value="mlat">Required MLAT</option>
                </select>
              </div>
            )}

            {/* Freeze Request Method */}
            {document.documentType === 'freeze_request' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What did they require for the freeze request? <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.freezeRequestMethod || ''}
                  onChange={(e) => setFormData({...formData, freezeRequestMethod: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select method</option>
                  <option value="letterhead">Honored letterhead</option>
                  <option value="search_warrant">Required search warrant</option>
                  <option value="mlat">Required MLAT</option>
                </select>
              </div>
            )}

            {/* Turnaround Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What was the turnaround time for your request? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.turnaroundTime}
                onChange={(e) => setFormData({...formData, turnaroundTime: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select turnaround time</option>
                <option value="less_than_24h">Less than 24 hours</option>
                <option value="2_3_days">2-3 days</option>
                <option value="1_week_or_less">1 week or less</option>
                <option value="1_4_weeks">1-4 weeks</option>
                <option value="more_than_4_weeks">Greater than 4 weeks</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                rows={3}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional feedback about your experience..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VaspResponseModal;