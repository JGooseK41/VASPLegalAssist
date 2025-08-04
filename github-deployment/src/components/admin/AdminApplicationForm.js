import React, { useState } from 'react';
import { Shield, AlertCircle, Check, Loader } from 'lucide-react';
import { authAPI } from '../../services/api';

const AdminApplicationForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    lawEnforcementRole: '',
    yearsExperience: '',
    reasonForVolunteering: '',
    availableHours: '',
    experience: '',
    references: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authAPI.submitAdminApplication({
        ...formData,
        yearsExperience: parseInt(formData.yearsExperience)
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess && onSuccess();
        onClose && onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Application Submitted!</h3>
            <p className="text-gray-600">
              Thank you for volunteering. We'll review your application and get back to you soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Apply to be an Admin Volunteer</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              What We're Looking For
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              We're seeking law enforcement professionals who can volunteer to help maintain the quality and integrity of our platform by:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
              <li>• Approving new member registrations</li>
              <li>• Reviewing and vetting VASP data update requests</li>
              <li>• Ensuring content accuracy and reliability</li>
              <li>• Maintaining community standards</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Law Enforcement Role *
              </label>
              <input
                type="text"
                name="lawEnforcementRole"
                value={formData.lawEnforcementRole}
                onChange={handleChange}
                placeholder="e.g., Detective, Special Agent, Intelligence Analyst"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Law Enforcement Experience *
              </label>
              <input
                type="number"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Why do you want to volunteer as an admin? *
              </label>
              <textarea
                name="reasonForVolunteering"
                value={formData.reasonForVolunteering}
                onChange={handleChange}
                rows="3"
                placeholder="Tell us about your motivation to help maintain this platform..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How many hours per week can you volunteer? *
              </label>
              <select
                name="availableHours"
                value={formData.availableHours}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select availability</option>
                <option value="1-5 hours">1-5 hours per week</option>
                <option value="5-10 hours">5-10 hours per week</option>
                <option value="10-15 hours">10-15 hours per week</option>
                <option value="15+ hours">15+ hours per week</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relevant Experience *
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows="4"
                placeholder="Describe any experience with data verification, investigations, or similar administrative duties..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional References (Optional)
              </label>
              <textarea
                name="references"
                value={formData.references}
                onChange={handleChange}
                rows="2"
                placeholder="Provide contact information for professional references if available..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminApplicationForm;