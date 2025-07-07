import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function TopContributor() {
  const { user } = useAuth();
  const [topContributor, setTopContributor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const fetchTopContributor = async () => {
      try {
        const response = await fetch('/api/contributors/top', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTopContributor(data);
        } else {
          setError('Failed to fetch top contributor');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchTopContributor();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchTopContributor, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-3 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !topContributor) {
    return (
      <div className="bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg shadow-lg p-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            <span className="font-medium">Top Contributor</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="mr-4">No contributions yet - be the first!</span>
            <Link
              to="/leaderboard"
              className="inline-flex items-center bg-white text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors text-xs"
            >
              View Leaderboard
              <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentUser = user && user.id === topContributor.userId;

  return (
    <>
      <div className={`bg-gradient-to-r ${isCurrentUser ? 'from-yellow-400 to-orange-500' : 'from-indigo-500 to-purple-600'} rounded-lg shadow-lg p-3 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            <span className="font-medium">Top Contributor</span>
            <button
              onClick={() => setShowInfoModal(true)}
              className="ml-2 text-white/80 hover:text-white"
              title="Learn about the leaderboard"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="font-semibold">{topContributor.firstName} {topContributor.lastName}</div>
              <div className="text-xs opacity-90">{topContributor.agencyName}</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold">{topContributor.score}</div>
              <div className="text-xs opacity-90">points</div>
            </div>
            
            <Link
              to="/leaderboard"
              className="inline-flex items-center bg-white text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors text-xs"
            >
              View Leaderboard
              <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Leaderboard System
            </h3>
            
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                The VASP Legal Assistant leaderboard rewards active contributors who help improve our database and community.
              </p>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">How to Earn Points:</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>+50 points</strong> - Submit a new VASP that gets approved</li>
                  <li><strong>+20 points</strong> - Update existing VASP information</li>
                  <li><strong>+10 points</strong> - Leave helpful comments on VASPs</li>
                  <li><strong>+5 points</strong> - Generate legal documents</li>
                  <li><strong>+2 points</strong> - Upvote helpful comments</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Recognition as a top contributor</li>
                  <li>Build reputation in the law enforcement community</li>
                  <li>Help improve data quality for everyone</li>
                </ul>
              </div>
              
              <p className="text-xs text-gray-500 italic">
                You can opt out of the leaderboard in your profile settings if you prefer to contribute anonymously.
              </p>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Link
                to="/profile"
                className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2"
              >
                Manage Settings
              </Link>
              <button
                onClick={() => setShowInfoModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopContributor;