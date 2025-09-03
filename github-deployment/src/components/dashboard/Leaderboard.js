import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, MessageSquare, CheckCircle, Shield, ArrowLeft, Flame, Calendar, Eye, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContributor, setSelectedContributor] = useState(null);
  const [contributionDetails, setContributionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  const fetchContributionDetails = async (userId, name) => {
    setSelectedContributor({ userId, name });
    setDetailsLoading(true);
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/contributors/${userId}/details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contribution details');
      }

      const data = await response.json();
      setContributionDetails(data);
    } catch (err) {
      console.error('Error loading contribution details:', err);
      setContributionDetails({ error: 'Failed to load details' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedContributor(null);
    setContributionDetails(null);
  };

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
    <div className="max-w-4xl mx-auto p-6" data-tour="leaderboard">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </button>
      </div>
      
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
                    <h3 className="text-lg font-semibold flex items-center">
                      {contributor.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm text-indigo-600 font-normal">(You)</span>
                      )}
                      {contributor.currentStreak >= 7 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Flame className="w-3 h-3 mr-1" />
                          {contributor.currentStreak} day streak!
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      {contributor.agencyName}
                      {contributor.currentStreak > 0 && contributor.currentStreak < 7 && (
                        <span className="ml-2 inline-flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {contributor.currentStreak} day{contributor.currentStreak !== 1 ? 's' : ''} on board
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">{contributor.score}</p>
                    <p className="text-sm text-gray-600">points</p>
                  </div>
                  <button
                    onClick={() => fetchContributionDetails(contributor.userId, contributor.name)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View contribution details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
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
            <Shield className="w-4 h-4 mr-2 mt-0.5 text-indigo-600 flex-shrink-0" />
            <span><strong>5 points</strong> for sharing a template with the community</span>
          </li>
          <li className="flex items-start">
            <MessageSquare className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
            <span><strong>1 point</strong> for each comment you make</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-teal-600 flex-shrink-0" />
            <span><strong>1 point</strong> each time another user uses your shared template</span>
          </li>
        </ul>
        
        <div className="mt-4 p-3 bg-orange-100 rounded-md">
          <p className="text-sm font-semibold text-orange-900 flex items-center">
            <Flame className="w-4 h-4 mr-2" />
            Maintain Your Streak!
          </p>
          <p className="text-xs text-orange-800 mt-1">
            Stay on the leaderboard for consecutive days to build your streak. 
            Contributors with 7+ day streaks get the fire badge! Your position is updated daily,
            so keep contributing to maintain your spot.
          </p>
        </div>
      </div>

      {/* Contribution Details Modal */}
      {selectedContributor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Contributions by {selectedContributor.name}
              </h2>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : contributionDetails?.error ? (
                <div className="text-red-600 text-center py-8">
                  {contributionDetails.error}
                </div>
              ) : contributionDetails ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <Trophy className="w-8 h-8 text-blue-600" />
                        <div className="text-right">
                          <p className="text-2xl font-bold">{contributionDetails.totalScore || 0}</p>
                          <p className="text-sm text-gray-600">Total Points</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div className="text-right">
                          <p className="text-2xl font-bold">{contributionDetails.acceptedVasps || 0}</p>
                          <p className="text-sm text-gray-600">VASPs</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <MessageSquare className="w-8 h-8 text-purple-600" />
                        <div className="text-right">
                          <p className="text-2xl font-bold">{contributionDetails.comments || 0}</p>
                          <p className="text-sm text-gray-600">Comments</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <Star className="w-8 h-8 text-yellow-600" />
                        <div className="text-right">
                          <p className="text-2xl font-bold">{contributionDetails.upvotes || 0}</p>
                          <p className="text-sm text-gray-600">Upvotes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accepted VASPs */}
                  {contributionDetails.acceptedVaspsList && contributionDetails.acceptedVaspsList.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        Accepted VASP Submissions
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {contributionDetails.acceptedVaspsList.map((vasp, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <div>
                              <p className="font-medium">{vasp.vaspName}</p>
                              <p className="text-sm text-gray-600">{vasp.jurisdiction}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(vasp.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Comments */}
                  {contributionDetails.recentComments && contributionDetails.recentComments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                        Recent Comments
                      </h3>
                      <div className="space-y-3">
                        {contributionDetails.recentComments.map((comment, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm text-gray-800">{comment.content}</p>
                                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                  <span>On: {comment.vaspName}</span>
                                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                  <span className="flex items-center">
                                    <Star className="w-3 h-3 mr-1" />
                                    {comment.voteScore} upvotes
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VASP Responses */}
                  {contributionDetails.vaspResponses && contributionDetails.vaspResponses.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-purple-600" />
                        VASP Response Logs
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {contributionDetails.vaspResponses.map((response, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <div>
                              <p className="font-medium">{response.vaspName}</p>
                              <p className="text-sm text-gray-600">
                                {response.responseType} - {response.turnaroundDays || 'N/A'} days
                              </p>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(response.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;