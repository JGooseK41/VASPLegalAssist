import React, { useState } from 'react';
import { Mail, CheckCircle, X } from 'lucide-react';
import axios from 'axios';

const EmailUpdateSuggestion = ({ vaspId, currentEmail, suggestedEmails, onSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const response = await axios.post(
        `/api/vasps/${vaspId}/suggest-email`,
        {
          suggestedEmail: newEmail,
          reason: reason
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (response.data.autoUpdated) {
        alert('Email has been automatically updated based on multiple user confirmations!');
      } else {
        alert('Thank you for your suggestion! It will be reviewed by other users.');
      }

      setShowForm(false);
      setNewEmail('');
      setReason('');
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Error submitting email suggestion:', err);
      setError(err.response?.data?.error || 'Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  if (showForm) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-sm font-medium text-amber-900 flex items-center">
            <Mail className="h-4 w-4 mr-1" />
            Suggest Email Update
          </h4>
          <button
            onClick={() => setShowForm(false)}
            className="text-amber-600 hover:text-amber-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Current Email
            </label>
            <p className="text-sm text-gray-600">{currentEmail || 'Not set'}</p>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Suggested Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              placeholder="compliance@vasp.com"
              disabled={submitting}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              placeholder="e.g., Email bounced, got response from this address"
              disabled={submitting}
            />
          </div>
          
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Submit Suggestion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Show suggested emails if any
  if (suggestedEmails && suggestedEmails.length > 0) {
    return (
      <div className="mt-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-medium text-amber-900 mb-1">
            <Mail className="inline h-3 w-3 mr-1" />
            Email Update Suggested:
          </p>
          {suggestedEmails.map((email, index) => (
            <p key={index} className="text-xs text-amber-800">• {email}</p>
          ))}
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            Suggest different email →
          </button>
        </div>
      </div>
    );
  }

  // Show suggestion button if no suggestions yet
  return (
    <div className="mt-2">
      <button
        onClick={() => setShowForm(true)}
        className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center"
      >
        <Mail className="h-3 w-3 mr-1" />
        Suggest email update
      </button>
    </div>
  );
};

export default EmailUpdateSuggestion;