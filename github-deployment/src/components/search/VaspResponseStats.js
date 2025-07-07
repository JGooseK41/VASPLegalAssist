import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Shield, Info } from 'lucide-react';
import axios from 'axios';

const VaspResponseStats = ({ vaspId, displayMode = 'badge' }) => {
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

  if (loading || !stats || !stats.hasData) {
    return null;
  }

  // Determine compliance color
  const complianceColor = stats.usCompliant.percentage >= 75 ? 'green' : 
                         stats.usCompliant.percentage >= 50 ? 'yellow' : 'red';

  if (displayMode === 'badge') {
    return (
      <div className="flex items-center space-x-2 mt-2">
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