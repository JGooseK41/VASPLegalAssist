import React, { useState } from 'react';
import { Shield, Info, TrendingUp, Clock, CheckCircle, Users, Mail, FileCheck, Star } from 'lucide-react';

const LEOFriendlyScore = ({ leoScore, compact = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!leoScore || leoScore.score === undefined) {
    return null;
  }
  
  const { score, grade, factors } = leoScore;
  
  // Color scheme based on grade
  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'F': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Document Success Rate': return <FileCheck className="h-4 w-4" />;
      case 'Response Time': return <Clock className="h-4 w-4" />;
      case 'US Service Acceptance': return <CheckCircle className="h-4 w-4" />;
      case 'Contact Reliability': return <Mail className="h-4 w-4" />;
      case 'Direct Contacts Available': return <Users className="h-4 w-4" />;
      case 'Community Data': return <TrendingUp className="h-4 w-4" />;
      case 'User Experience Rating': return <Star className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };
  
  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getGradeColor(grade)} cursor-help`}
        >
          <Shield className="h-4 w-4 mr-1" />
          LEO Score: {score}
          <span className="ml-1 font-bold">{grade}</span>
        </button>
        
        {showTooltip && (
          <div className="absolute z-50 bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">LEO Friendly Score Breakdown</h4>
              <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {score}/100
              </div>
            </div>
            
            <div className="space-y-2">
              {factors.map((factor, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5 text-gray-400">
                    {getCategoryIcon(factor.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-700 truncate pr-2">
                        {factor.category}
                      </p>
                      <span className="text-xs font-semibold text-gray-900">
                        {factor.points}/{factor.max}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{factor.detail}</p>
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${(factor.points / factor.max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-600">
                This score reflects how easy it is for law enforcement to work with this VASP based on community data.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Full display mode
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">LEO Friendly Score</h3>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className={`px-3 py-1 rounded-full text-lg font-bold border ${getGradeColor(grade)}`}>
            {grade}
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {factors.map((factor, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">{getCategoryIcon(factor.category)}</span>
                <span className="text-sm font-medium text-gray-700">{factor.category}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {factor.points}/{factor.max}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${(factor.points / factor.max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 min-w-[120px]">{factor.detail}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          This score is calculated based on document success rates, response times, service acceptance, 
          contact reliability, and community engagement data.
        </p>
      </div>
    </div>
  );
};

export default LEOFriendlyScore;