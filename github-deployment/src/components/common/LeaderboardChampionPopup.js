import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, TrendingUp, Award, Swords, Target, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const LeaderboardChampionPopup = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [champion, setChampion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    loadChampion();
  }, []);

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setAnimateIn(true), 100);
  }, []);

  const loadChampion = async () => {
    try {
      const response = await userAPI.getLeaderboard();
      
      // Extract the leaderboard array from the response
      const leaderboardData = response.leaderboard || response;
      
      // Make sure we have an array
      if (!Array.isArray(leaderboardData)) {
        console.error('Leaderboard data is not an array:', leaderboardData);
        setLoading(false);
        onClose();
        return;
      }
      
      // Filter out any admin users that might have slipped through
      // (though they should already be filtered by the API)
      const nonAdminUsers = leaderboardData.filter(
        u => u.role !== 'ADMIN' && u.role !== 'MASTER_ADMIN'
      );
      
      if (nonAdminUsers && nonAdminUsers.length > 0) {
        const topUser = nonAdminUsers[0];
        
        // Calculate days at #1 (use currentStreak from the API response)
        const daysAtTop = topUser.currentStreak || topUser.currentLeaderboardStreak || 0;
        
        setChampion({
          name: topUser.name || 'Mystery Agent',  // API returns concatenated name
          points: topUser.score || 0,  // API returns 'score', not 'totalPoints'
          daysAtTop: daysAtTop,
          agency: topUser.agencyName || 'Unknown Agency',
          isCurrentUser: topUser.userId === user?.id  // API returns 'userId'
        });
      } else {
        // No eligible champion found or all have 0 points
        // Create a placeholder to encourage participation
        console.log('No champion with points found, showing placeholder');
        setChampion({
          name: 'The Crown Awaits',
          points: 0,
          daysAtTop: 0,
          agency: 'Be the first to claim it!',
          isCurrentUser: false,
          isPlaceholder: true
        });
      }
    } catch (error) {
      console.error('Failed to load champion:', error);
      setLoading(false);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      // Update last shown timestamp in database
      await userAPI.updateProfile({ lastChampionPopupShown: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to update popup timestamp:', error);
    }
    onClose();
  };

  const getPlayfulMessage = () => {
    if (champion?.isPlaceholder) {
      return {
        title: "👑 The Throne is Empty!",
        subtitle: "No one has claimed the crown yet!",
        message: "Be the first to earn points and become the inaugural champion! Start by updating VASP info or sharing templates.",
        buttonText: "Learn How to Be First",
        buttonAction: () => navigate('/faq')
      };
    }
    
    if (champion?.isCurrentUser) {
      return {
        title: "👑 You're the Champion!",
        subtitle: "You're currently dominating the leaderboard!",
        message: `You've held the throne for ${champion.daysAtTop} ${champion.daysAtTop === 1 ? 'day' : 'days'}! Keep participating to maintain your reign!`,
        buttonText: "View My Stats",
        buttonAction: () => navigate('/leaderboard')
      };
    }

    const messages = [
      {
        title: "⚔️ There's a New Sheriff in Town",
        subtitle: `Just so you know, ${champion?.name} is better than you because they're #1 on the leaderboard!`,
        taunt: `They've been ruling for ${champion?.daysAtTop} ${champion?.daysAtTop === 1 ? 'day' : 'days'} straight!`
      },
      {
        title: "🎯 Challenge Accepted?",
        subtitle: `${champion?.name} thinks they're hot stuff at #1!`,
        taunt: `${champion?.daysAtTop} days of dominance - think you can end their streak?`
      },
      {
        title: "🏆 Bow to Your Leader",
        subtitle: `${champion?.name} is currently schooling everyone!`,
        taunt: `${champion?.daysAtTop} days at the top - are you going to let that continue?`
      },
      {
        title: "🔥 The Throne Has a Ruler",
        subtitle: `${champion?.name} is making everyone else look bad!`,
        taunt: `They've been #1 for ${champion?.daysAtTop} days - time to dethrone them?`
      }
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return {
      ...randomMessage,
      message: `${randomMessage.taunt} Knock them down by participating!`,
      buttonText: "Show Me How to Win",
      buttonAction: () => navigate('/faq')  // Go to FAQ to learn about points
    };
  };

  if (loading || !champion) {
    return null;
  }

  const content = getPlayfulMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-500 ${
          animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header with animated crown */}
        <div className="relative bg-gradient-to-r from-yellow-400 to-orange-400 rounded-t-xl p-6 text-white">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Crown className="h-12 w-12 animate-bounce" />
              <Zap className="h-6 w-6 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{content.title}</h2>
              <p className="text-sm text-white/90 mt-1">{content.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Champion Info */}
        <div className="p-6">
          {!champion.isCurrentUser && !champion.isPlaceholder && (
            <div className="bg-white rounded-lg p-4 mb-4 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-bold text-lg">{champion.name}</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">#1</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>{champion.agency}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="flex items-center">
                    <Flame className="h-4 w-4 text-orange-500 mr-1" />
                    {champion.points} points
                  </span>
                  <span className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    {champion.daysAtTop} day streak
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {champion.isPlaceholder && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-4 border-2 border-yellow-300">
              <div className="text-center">
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-gray-800">{champion.name}</p>
                <p className="text-sm text-gray-600">{champion.agency}</p>
              </div>
            </div>
          )}

          <p className="text-gray-700 mb-6">{content.message}</p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={content.buttonAction}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
            >
              <Swords className="h-5 w-5" />
              <span className="font-bold">{content.buttonText}</span>
            </button>

            {!champion.isCurrentUser && !champion.isPlaceholder && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/search')}
                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">Update VASPs</span>
                  </button>
                  <button
                    onClick={() => navigate('/templates')}
                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Award className="h-4 w-4" />
                    <span className="text-sm font-medium">Share Templates</span>
                  </button>
                </div>

                <button
                  onClick={() => navigate('/faq')}
                  className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  How do I earn points and climb the leaderboard?
                </button>
              </>
            )}
            
            {champion.isPlaceholder && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/search')}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Update VASPs</span>
                </button>
                <button
                  onClick={() => navigate('/templates')}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-medium">Share Templates</span>
                </button>
              </div>
            )}
          </div>

          {/* Motivational Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              {champion.isCurrentUser 
                ? "Keep up the great work! Your contributions help the entire community."
                : "Every contribution counts! Start climbing the ranks today."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardChampionPopup;