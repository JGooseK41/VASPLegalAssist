import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, FileText, MessageSquare, Search, Upload, TrendingUp, Users, ChevronRight, Zap, PlusCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { vaspAPI, documentAPI } from '../../services/api';
import TopContributor from './TopContributor';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVASPs: 0,
    documentsCreated: 0,
    recentDocuments: [],
    loading: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load VASPs
      const vasps = await vaspAPI.getVASPs();
      
      // Load recent documents
      const { documents, total } = await documentAPI.getDocuments(5, 0);
      
      setStats({
        totalVASPs: vasps.length,
        documentsCreated: total,
        recentDocuments: documents,
        loading: false
      });
    } catch (error) {
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const primaryActions = [
    {
      title: "Search VASP",
      description: "Find compliance information and read the latest investigator intel",
      icon: Search,
      color: "blue",
      action: () => navigate('/search'),
      stats: `${stats.totalVASPs} VASPs with live intel`,
      buttonText: "Search VASPs",
      features: ["Compliance contacts", "Service protocols", "Real-time officer comments", "Response experiences"]
    },
    {
      title: "Generate VASP Request",
      description: "Create legal documents for freeze orders and data requests",
      icon: FileText,
      color: "green",
      action: () => navigate('/documents/create'),
      stats: "Quick & custom templates",
      buttonText: "Generate Request",
      features: ["Standard letterheads", "Custom templates", "Batch processing", "Auto-fill from profile"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {user?.agencyName} • Records Service Hub
          </p>
        </div>

        {/* Primary Actions - MAIN FOCUS */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
            What do you need today?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {primaryActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-transparent hover:border-${action.color}-500 cursor-pointer`}
                  onClick={action.action}
                >
                  <div className="p-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-lg bg-${action.color}-100 mb-6`}>
                      <Icon className={`h-8 w-8 text-${action.color}-600`} />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {action.description}
                    </p>
                    <div className="space-y-2 mb-6">
                      {action.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <ChevronRight className="h-4 w-4 mr-2 text-gray-400" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <div className={`bg-${action.color}-50 rounded-lg px-4 py-3 mb-6`}>
                      <p className={`text-base font-medium text-${action.color}-700`}>
                        {action.stats}
                      </p>
                    </div>
                    <button className={`w-full bg-${action.color}-600 hover:bg-${action.color}-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center text-lg`}>
                      {action.buttonText}
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Contributor - Horizontal and Centered */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto">
            <TopContributor />
          </div>
        </div>

        {/* Recent Documents - Full Width */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Documents</h3>
            <Link
              to="/documents/history"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all →
            </Link>
          </div>
          
          {stats.loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : stats.recentDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentDocuments.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <p className="font-medium text-gray-900 truncate">
                    {doc.caseNumber}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {doc.vaspName}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(doc.createdAt).toLocaleDateString()} • {new Date(doc.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No documents created yet</p>
              <p className="text-sm text-gray-400 mt-2">Your recent documents will appear here</p>
            </div>
          )}
        </div>

        {/* Quick Stats and Links Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalVASPs}</p>
                <p className="text-sm text-gray-600">VASPs in Database</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.documentsCreated}</p>
                <p className="text-sm text-gray-600">Documents Created</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">24/7</p>
                <p className="text-sm text-gray-600">Available Support</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/templates"
                className="flex items-center text-sm text-gray-700 hover:text-blue-600 p-2 rounded hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                My Templates
              </Link>
              <Link
                to="/documents/batch"
                className="flex items-center text-sm text-gray-700 hover:text-blue-600 p-2 rounded hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Batch Process
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center text-sm text-gray-700 hover:text-blue-600 p-2 rounded hover:bg-gray-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Leaderboard
              </Link>
              <Link
                to="/submissions/new"
                className="flex items-center text-sm text-gray-700 hover:text-blue-600 p-2 rounded hover:bg-gray-50"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Submit VASP
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice */}
        {user?.role === 'DEMO' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You're using a demo account. Some features may be limited.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;