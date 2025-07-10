import React, { useState, useEffect } from 'react';
import { X, Trophy, Target, Share2, Search, Zap } from 'lucide-react';
import { contributorAPI } from '../../services/api';
import confetti from 'canvas-confetti';

const LeaderboardAchievementPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLeaderboardAchievement();
  }, []);

  const checkLeaderboardAchievement = async () => {
    try {
      const response = await contributorAPI.checkLeaderboardAchievement();
      if (response.firstTime) {
        setIsOpen(true);
        triggerCelebration();
      }
    } catch (error) {
      console.error('Error checking leaderboard achievement:', error);
    }
  };

  const triggerCelebration = () => {
    // Golden confetti for leaderboard achievement
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ['#FFD700', '#FFA500', '#FF8C00'];

    const randomInRange = (min, max) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 100 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: colors,
        ticks: 200,
        gravity: 0.8
      });
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: colors,
        ticks: 200,
        gravity: 0.8
      });
    }, 250);
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      await contributorAPI.acknowledgeLeaderboardAchievement();
      setIsOpen(false);
    } catch (error) {
      console.error('Error acknowledging achievement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg max-w-md w-full shadow-2xl animate-scale-in border-2 border-yellow-300">
        <div className="relative p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Trophy className="h-20 w-20 text-yellow-500" />
                <div className="absolute -top-2 -right-2">
                  <Zap className="h-8 w-8 text-orange-500 animate-pulse" />
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You Made the Leaderboard!
            </h2>
            <p className="text-lg text-yellow-700 font-semibold mb-4">
              Welcome to the Elite!
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-white/80 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start space-x-3">
                <Target className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">The Challenge</p>
                  <p className="text-sm text-gray-700">
                    You've earned your spot, but remember - you have to defend it every day! 
                    Other hungry crypto investigators are coming for your position.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start space-x-3">
                <Share2 className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Share Your Knowledge</p>
                  <p className="text-sm text-gray-700">
                    Create templates for the community - they'll pay dividends in points as 
                    others use your contributions!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start space-x-3">
                <Search className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Hunt for VASPs</p>
                  <p className="text-sm text-gray-700">
                    Actively seek new VASP information and submit updates to maintain your 
                    competitive edge!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleClose}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : "I'm Ready to Dominate!"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LeaderboardAchievementPopup;