import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Shield, Info, X, AlertTriangle, Mail } from 'lucide-react';
import axios from 'axios';

const VaspResponseStats = ({ vaspId, displayMode = 'badge', onStatsLoaded }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchVaspStats();
  }, [vaspId]);

  const fetchVaspStats = async () => {
    try {
      const response = await axios.get(`/api/vasp-responses/vasp/${vaspId}/aggregated`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setStats(response.data);
      if (onStatsLoaded) {
        onStatsLoaded(response.data);
      }
    } catch (error) {
      console.error('Error fetching VASP stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTurnaroundLabel = (key) => {
    const labels = {
      'less_than_24h': '<24 hours',
      '2_3_days': '2-3 days',
      '1_week_or_less': '≤1 week',
      '1_4_weeks': '1-4 weeks',
      'more_than_4_weeks': '>4 weeks'
    };
    return labels[key] || key;
  };

  const getMethodLabel = (method) => {
    const labels = {
      'letterhead': 'Letterhead',
      'subpoena': 'Subpoena',
      'search_warrant': 'Search Warrant',
      'mlat': 'MLAT'
    };
    return labels[method] || method;
  };

  const getFailureReasonLabel = (reason) => {
    const labels = {
      'missing_case_number': 'Missing case number',
      'missing_badge_info': 'Missing badge/credential info',
      'wrong_email_format': 'Wrong email domain/format',
      'requires_subpoena': 'Requires subpoena',
      'requires_search_warrant': 'Requires search warrant',
      'requires_mlat': 'Requires MLAT',
      'no_us_service': 'Does not accept US service',
      'incorrect_contact': 'Contact info was incorrect',
      'no_response': 'No response received',
      'other': 'Other reason'
    };
    return labels[reason] || reason;
  };

  if (loading || !stats || !stats.hasData) {
    return null;
  }

  // Determine compliance color
  const complianceColor = stats.usCompliant.percentage >= 75 ? 'green' : 
                         stats.usCompliant.percentage >= 50 ? 'yellow' : 'red';

  if (displayMode === 'badge') {
    return (
      <div className="flex items-center flex-wrap gap-2 mt-2">
        {/* Effectiveness Badge - NEW */}
        {stats.effectiveness && stats.effectiveness.rate !== null && (
          <div 
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer
              ${stats.effectiveness.rate >= 75 ? 'bg-green-100 text-green-800' : 
                stats.effectiveness.rate >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}
            onClick={() => setShowDetails(true)}
            title={`${stats.effectiveness.worked} worked, ${stats.effectiveness.failed} failed`}
          >
            {stats.effectiveness.rate >= 75 ? <CheckCircle className="h-3 w-3 mr-1" /> : 
             stats.effectiveness.rate >= 50 ? <AlertTriangle className="h-3 w-3 mr-1" /> :
             <XCircle className="h-3 w-3 mr-1" />}
            {stats.effectiveness.rate}% Success
          </div>
        )}

        {/* Top Failure Reasons - NEW */}
        {stats.effectiveness && stats.effectiveness.topFailureReasons && stats.effectiveness.topFailureReasons.length > 0 && (
          <div className="flex items-center space-x-1">
            {stats.effectiveness.topFailureReasons.slice(0, 2).map((item, index) => (
              <div 
                key={item.reason}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 cursor-pointer"
                onClick={() => setShowDetails(true)}
                title={`${item.count} reports`}
              >
                {item.reason === 'requires_mlat' && '🌐 MLAT'}
                {item.reason === 'requires_subpoena' && '📜 Subpoena'}
                {item.reason === 'requires_search_warrant' && '⚖️ Warrant'}
                {item.reason === 'no_us_service' && '🚫 No US'}
                {item.reason === 'missing_case_number' && '📑 Case #'}
                {!['requires_mlat', 'requires_subpoena', 'requires_search_warrant', 'no_us_service', 'missing_case_number'].includes(item.reason) && '⚠️ Issue'}
              </div>
            ))}
          </div>
        )}

        {/* Email Update Alert - NEW */}
        {stats.contactInfo && stats.contactInfo.emailUpdatesSuggested && (
          <div 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 cursor-pointer"
            onClick={() => setShowDetails(true)}
            title="Contact email may need update"
          >
            <Mail className="h-3 w-3 mr-1" />
            Email?
          </div>
        )}

        {/* US Compliance Badge */}
        <div 
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer
            ${complianceColor === 'green' ? 'bg-green-100 text-green-800' : 
              complianceColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'}`}
          onClick={() => setShowDetails(true)}
          title="Click for details"
        >
          {complianceColor === 'green' ? <CheckCircle className="h-3 w-3 mr-1" /> : 
           complianceColor === 'yellow' ? <Clock className="h-3 w-3 mr-1" /> :
           <XCircle className="h-3 w-3 mr-1" />}
          {stats.usCompliant.percentage}% US Compliant
        </div>

        {/* Response Count Badge */}
        <div 
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer"
          onClick={() => setShowDetails(true)}
          title="Click for details"
        >
          <Shield className="h-3 w-3 mr-1" />
          {stats.responseCount} responses
        </div>

        {/* Turnaround Time Badge */}
        {stats.turnaroundTime.mostCommon && (
          <div 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 cursor-pointer"
            onClick={() => setShowDetails(true)}
            title="Click for details"
          >
            <Clock className="h-3 w-3 mr-1" />
            {getTurnaroundLabel(stats.turnaroundTime.mostCommon)}
          </div>
        )}

        {/* Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">VASP Response Statistics</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Document Effectiveness - NEW */}
                {stats.effectiveness && stats.effectiveness.rate !== null && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Document Effectiveness</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {stats.effectiveness.worked} worked, {stats.effectiveness.failed} failed
                      </span>
                      <span className={`text-sm font-medium ${
                        stats.effectiveness.rate >= 75 ? 'text-green-600' : 
                        stats.effectiveness.rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stats.effectiveness.rate}% success rate
                      </span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          stats.effectiveness.rate >= 75 ? 'bg-green-500' : 
                          stats.effectiveness.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${stats.effectiveness.rate}%` }}
                      />
                    </div>
                    
                    {/* Failure Reasons */}
                    {stats.effectiveness.topFailureReasons && stats.effectiveness.topFailureReasons.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-xs font-medium text-gray-600 mb-1">Common Issues:</h5>
                        <div className="space-y-1">
                          {stats.effectiveness.topFailureReasons.map(item => (
                            <div key={item.reason} className="flex justify-between text-xs">
                              <span className="text-gray-600">{getFailureReasonLabel(item.reason)}</span>
                              <span className="text-gray-900 font-medium">{item.count} reports</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Information Updates - NEW */}
                {stats.contactInfo && stats.contactInfo.emailUpdatesSuggested && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-amber-900 mb-2 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Contact Email Updates Suggested
                    </h4>
                    {stats.contactInfo.suggestedEmails && stats.contactInfo.suggestedEmails.length > 0 && (
                      <div className="space-y-1">
                        {stats.contactInfo.suggestedEmails.map((email, index) => (
                          <div key={index} className="text-xs text-amber-800">
                            • {email}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* US Compliance */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">US Compliance</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {stats.usCompliant.count} of {stats.usCompliant.total} requests
                    </span>
                    <span className={`text-sm font-medium ${
                      complianceColor === 'green' ? 'text-green-600' : 
                      complianceColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {stats.usCompliant.percentage}%
                    </span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        complianceColor === 'green' ? 'bg-green-500' : 
                        complianceColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${stats.usCompliant.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Records Request Methods */}
                {stats.recordsRequest.total > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Records Request Methods ({stats.recordsRequest.total} requests)
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(stats.recordsRequest.methods).map(([method, count]) => (
                        <div key={method} className="flex justify-between text-sm">
                          <span className="text-gray-600">{getMethodLabel(method)}</span>
                          <span className="text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Freeze Request Methods */}
                {stats.freezeRequest.total > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Freeze Request Methods ({stats.freezeRequest.total} requests)
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(stats.freezeRequest.methods).map(([method, count]) => (
                        <div key={method} className="flex justify-between text-sm">
                          <span className="text-gray-600">{getMethodLabel(method)}</span>
                          <span className="text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Turnaround Times */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Turnaround Times</h4>
                  <div className="space-y-1">
                    {Object.entries(stats.turnaroundTime.distribution).map(([time, count]) => (
                      <div key={time} className="flex justify-between text-sm">
                        <span className="text-gray-600">{getTurnaroundLabel(time)}</span>
                        <span className="text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-4 border-t">
                  <Info className="h-3 w-3 inline mr-1" />
                  Based on {stats.responseCount} law enforcement responses
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default VaspResponseStats;