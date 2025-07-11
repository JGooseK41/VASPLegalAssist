import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, X, Info } from 'lucide-react';
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
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/contributors/top`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
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
      <>
        <div className="bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg shadow-lg p-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              <span className="font-bold">Top Contributor</span>
              <button
                onClick={() => setShowInfoModal(true)}
                className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
                title="Learn about the leaderboard"
              >
                <Info className="w-4 h-4 text-white" />
              </button>
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
                    <li><strong>+10 points</strong> - Submit a new VASP that gets approved</li>
                    <li><strong>+5 points</strong> - Log VASP response (compliance & turnaround)</li>
                    <li><strong>+5 points</strong> - Each upvote received on your comments</li>
                    <li><strong>+1 point</strong> - Leave helpful comments on VASPs</li>
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

  const isCurrentUser = user && user.id === topContributor.userId;

  return (
    <>
      <div className={`relative overflow-hidden rounded-lg shadow-lg p-3 text-white ${isCurrentUser ? 'bg-gradient-to-r from-yellow-600 to-orange-600' : 'bg-gradient-to-r from-blue-800 to-indigo-900'}`}>
        {/* Background image overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(/images/blockchain_edited.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            <span className="font-bold">Top Contributor</span>
            <button
              onClick={() => setShowInfoModal(true)}
              className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              title="Learn about the leaderboard"
            >
              <Info className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right flex-1">
              <div className="font-bold text-lg">{topContributor.name}</div>
              <div className="font-semibold text-sm">{topContributor.agencyName}</div>
            </div>
            
            <div className="text-center border-l border-white/30 pl-4">
              <div className="text-2xl font-bold">{topContributor.score}</div>
              <div className="text-xs font-semibold">points</div>
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
                  <li><strong>+10 points</strong> - Submit a new VASP that gets approved</li>
                  <li><strong>+5 points</strong> - Log VASP response (compliance & turnaround)</li>
                  <li><strong>+5 points</strong> - Each upvote received on your comments</li>
                  <li><strong>+1 point</strong> - Leave helpful comments on VASPs</li>
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