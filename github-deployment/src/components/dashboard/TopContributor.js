import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Star, MessageSquare, CheckCircle, ThumbsUp, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function TopContributor() {
  const { user } = useAuth();
  const [topContributor, setTopContributor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTopContributor = async () => {
    try {
      const response = await fetch('/api/contributors/top', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch top contributor');
      }

      const data = await response.json();
      setTopContributor(data.topContributor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopContributor();
    
    // Refresh every 5 minutes for real-time updates
    const interval = setInterval(fetchTopContributor, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !topContributor) {
    return (
      <div className="bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            <Trophy className="w-8 h-8 mr-2" />
            Top Contributor
          </h2>
        </div>
        
        <div className="text-center py-4">
          <p className="text-lg mb-2">No contributions yet!</p>
          <p className="text-sm opacity-90 mb-4">
            Be the first to earn points by:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Submitting VASPs (10 points each)</span>
            </div>
            <div className="flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 mr-2" />
              <span>Getting upvotes (5 points each)</span>
            </div>
            <div className="flex items-center justify-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span>Adding comments (1 point each)</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Link
            to="/leaderboard"
            className="inline-flex items-center bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            View Full Leaderboard
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentUser = user && user.id === topContributor.userId;

  return (
    <div className={`bg-gradient-to-r ${isCurrentUser ? 'from-yellow-400 to-orange-500' : 'from-indigo-500 to-purple-600'} rounded-lg shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center">
          <Trophy className="w-8 h-8 mr-2" />
          Top Contributor
        </h2>
        <div className="flex items-center">
          <Star className="w-6 h-6 fill-current" />
          <span className="text-3xl font-bold ml-2">{topContributor.score}</span>
          <span className="text-sm ml-1">points</span>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-xl font-semibold">
          {topContributor.name}
          {isCurrentUser && <span className="ml-2 text-sm">(That's you!)</span>}
        </p>
        <p className="text-sm opacity-90">{topContributor.agencyName}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          <CheckCircle className="w-6 h-6 mx-auto mb-1" />
          <p className="text-2xl font-bold">{topContributor.breakdown.acceptedVasps}</p>
          <p className="text-xs">VASPs Added</p>
          <p className="text-xs opacity-75">{topContributor.breakdown.vaspPoints} pts</p>
        </div>
        
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          <Star className="w-6 h-6 mx-auto mb-1" />
          <p className="text-2xl font-bold">{topContributor.breakdown.upvotesReceived}</p>
          <p className="text-xs">Upvotes</p>
          <p className="text-xs opacity-75">{topContributor.breakdown.upvotePoints} pts</p>
        </div>
        
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          <MessageSquare className="w-6 h-6 mx-auto mb-1" />
          <p className="text-2xl font-bold">{topContributor.breakdown.commentsCount}</p>
          <p className="text-xs">Comments</p>
          <p className="text-xs opacity-75">{topContributor.breakdown.commentPoints} pts</p>
        </div>
      </div>

      {!isCurrentUser && (
        <div className="mt-4 text-sm text-center opacity-90">
          <p>Can you beat {topContributor.name.split(' ')[0]}? Add VASPs, comment, and get upvotes!</p>
        </div>
      )}
      
      <div className="mt-4 text-center">
        <Link 
          to="/leaderboard" 
          className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-all"
        >
          View Full Leaderboard →
        </Link>
      </div>
    </div>
  );
}

export default TopContributor;