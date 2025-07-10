import React, { useState, useEffect } from 'react';
import { X, Trophy, Star, Award } from 'lucide-react';
import { contributorAPI } from '../../services/api';
import confetti from 'canvas-confetti';

const MilestoneFeedbackPopup = () => {
  const [milestone, setMilestone] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [discoverySource, setDiscoverySource] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkForMilestone();
  }, []);

  const checkForMilestone = async () => {
    try {
      const response = await contributorAPI.checkMilestone();
      if (response.milestone) {
        setMilestone(response.milestone);
        setIsOpen(true);
        // Trigger confetti animation
        triggerConfetti();
      }
    } catch (error) {
      console.error('Error checking milestone:', error);
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { 
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      }));
      confetti(Object.assign({}, defaults, { 
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      }));
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await contributorAPI.submitMilestoneFeedback({
        milestone: milestone.points,
        discoverySource,
        suggestions,
        feedbackType: milestone.type
      });

      // Close the popup
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await contributorAPI.acknowledgeMilestone(milestone.points);
      setIsOpen(false);
    } catch (error) {
      console.error('Error acknowledging milestone:', error);
    }
  };

  if (!isOpen || !milestone) return null;

  const getMilestoneContent = () => {
    if (milestone.points === 1) {
      return {
        icon: <Star className="h-16 w-16 text-yellow-500" />,
        title: "Congratulations! You're Now a Contributor!",
        message: "We value your effort in assisting to develop the community and help your fellow investigators.",
        showDiscovery: true
      };
    } else if (milestone.points === 100) {
      return {
        icon: <Trophy className="h-16 w-16 text-yellow-500" />,
        title: "Amazing! You're a Power User!",
        message: "Your dedication to the community is incredible. Thank you for being such an active contributor!",
        showDiscovery: false
      };
    } else {
      return {
        icon: <Award className="h-16 w-16 text-yellow-500" />,
        title: `Incredible! ${milestone.points} Points!`,
        message: "You continue to be one of our most valued contributors. Your efforts make a real difference!",
        showDiscovery: false
      };
    }
  };

  const content = getMilestoneContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl animate-bounce-in">
        <div className="relative p-6">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {content.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {content.title}
            </h2>
            <p className="text-gray-600">
              {content.message}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {content.showDiscovery && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did you discover our site?
                </label>
                <select
                  value={discoverySource}
                  onChange={(e) => setDiscoverySource(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Please select...</option>
                  <option value="colleague">Colleague recommendation</option>
                  <option value="search_engine">Search engine (Google, etc.)</option>
                  <option value="social_media">Social media</option>
                  <option value="law_enforcement_forum">Law enforcement forum</option>
                  <option value="training">Training or conference</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any improvements or suggestions for the site?
                <span className="text-xs text-gray-500 ml-1">(Optional)</span>
              </label>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="We'd love to hear your thoughts..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={submitting || (content.showDiscovery && !discoverySource)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MilestoneFeedbackPopup;