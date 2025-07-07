import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, MessageSquare, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/contributors/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const data = await response.json();
        setLeaderboard(data.leaderboard);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setError(`Error loading leaderboard: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300';
      default:
        return 'bg-white hover:bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 mb-3">
              <div className="h-6 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading leaderboard: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Trophy className="w-8 h-8 mr-2 text-yellow-500" />
        Contributor Leaderboard
      </h1>

      <div className="space-y-3">
        {leaderboard.map((contributor, index) => {
          const rank = index + 1;
          const isCurrentUser = user && user.id === contributor.userId;

          return (
            <div
              key={contributor.userId}
              className={`rounded-lg border-2 p-4 transition-all ${getRankStyle(rank)} ${
                isCurrentUser ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(rank)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {contributor.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm text-indigo-600 font-normal">(You)</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">{contributor.agencyName}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">{contributor.score}</p>
                  <p className="text-sm text-gray-600">points</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-start space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>{contributor.breakdown.acceptedVasps} VASPs</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  <span>{contributor.breakdown.upvotesReceived} upvotes</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span>{contributor.breakdown.commentsCount} comments</span>
                </div>
                {contributor.breakdown.vaspResponses > 0 && (
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    <span>{contributor.breakdown.vaspResponses} responses</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">How to Earn Points</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
            <span><strong>10 points</strong> for each VASP submission that gets approved</span>
          </li>
          <li className="flex items-start">
            <Star className="w-4 h-4 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" />
            <span><strong>5 points</strong> for each upvote received on your comments</span>
          </li>
          <li className="flex items-start">
            <Shield className="w-4 h-4 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
            <span><strong>5 points</strong> for each VASP response you log (compliance & turnaround time)</span>
          </li>
          <li className="flex items-start">
            <MessageSquare className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
            <span><strong>1 point</strong> for each comment you make</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Leaderboard;