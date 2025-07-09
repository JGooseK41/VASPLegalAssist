import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const SurveyReminderPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we should show the reminder based on the data from login
    const surveyReminder = sessionStorage.getItem('surveyReminder');
    if (surveyReminder) {
      const reminderData = JSON.parse(surveyReminder);
      if (reminderData.shouldShow) {
        setDocumentsCount(reminderData.documentsWithoutResponses);
        setIsVisible(true);
        
        // Clear the session storage flag
        sessionStorage.removeItem('surveyReminder');
        
        // Update the server to record that we've shown the reminder
        api.put('/profile/survey-reminder')
          .catch(err => console.error('Failed to update survey reminder:', err));
      }
    }
  }, []);

  const handleGoToHistory = () => {
    setIsVisible(false);
    navigate('/history');
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg className="h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Help Build Our Community Database
            </h3>
            
            <p className="text-gray-600 mb-4">
              You have <span className="font-semibold text-blue-600">{documentsCount}</span> 
              {documentsCount === 1 ? ' document' : ' documents'} from the past month without response feedback.
            </p>
            
            <p className="text-gray-600 text-sm mb-6">
              Your feedback helps other law enforcement officers know which VASPs are responsive 
              and how to successfully request data. Please take a moment to share your experience.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleGoToHistory}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 
                         transition-colors font-medium"
              >
                Go to Document History
              </button>
              
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 
                         transition-colors font-medium"
              >
                Maybe Later
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              We'll remind you again in 30 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyReminderPopup;