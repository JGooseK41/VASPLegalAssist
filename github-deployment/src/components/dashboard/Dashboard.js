import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, FileText, MessageSquare, Search, Upload, TrendingUp, Users, ChevronRight, Zap, PlusCircle, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { vaspAPI, documentAPI, authAPI } from '../../services/api';
import TopContributor from './TopContributor';
import { downloadFile } from '../../utils/urlHelpers';
import OnboardingTour from '../common/OnboardingTour';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVASPs: 0,
    documentsCreated: 0,
    totalMembers: 0,
    recentDocuments: [],
    loading: true
  });
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Check if tutorial restart was requested
    const restartRequested = localStorage.getItem('restartTutorial');
    if (restartRequested) {
      localStorage.removeItem('restartTutorial');
      // Add a small delay to ensure page is fully loaded
      setTimeout(() => setShowOnboarding(true), 500);
      return;
    }
    
    // Check if user needs onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    const onboardingInProgress = sessionStorage.getItem('onboardingInProgress');
    
    // Only show onboarding if not completed, not in progress, and user is not demo
    if (!hasCompletedOnboarding && !onboardingInProgress && user?.role !== 'DEMO') {
      sessionStorage.setItem('onboardingInProgress', 'true');
      // Add a small delay to ensure page is fully loaded
      setTimeout(() => setShowOnboarding(true), 500);
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load VASPs
      const vasps = await vaspAPI.getVASPs();
      
      // Load recent documents for current user
      const { documents } = await documentAPI.getDocuments(5, 0);
      
      // Load total document count across all users
      let totalDocumentCount = 0;
      try {
        const response = await documentAPI.getTotalDocumentCount();
        console.log('Total document count response:', response);
        console.log('API URL used:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
        totalDocumentCount = response.count || 0;
      } catch (error) {
        console.error('Failed to load total document count:', error);
        console.error('Error details:', error.response?.data || error.message);
        console.error('Request URL:', error.config?.url);
        console.error('Base URL:', error.config?.baseURL);
        console.error('Full URL:', error.config?.baseURL + error.config?.url);
        console.error('Request method:', error.config?.method);
      }
      
      // Load member count
      let memberCount = 0;
      try {
        const response = await authAPI.getMemberCount();
        console.log('Member count response:', response);
        console.log('API URL used:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
        memberCount = response.count || 0;
      } catch (error) {
        console.error('Failed to load member count:', error);
        console.error('Error details:', error.response?.data || error.message);
        console.error('Request URL:', error.config?.url);
        console.error('Base URL:', error.config?.baseURL);
        console.error('Full URL:', error.config?.baseURL + error.config?.url);
        console.error('Request method:', error.config?.method);
      }
      
      setStats({
        totalVASPs: vasps.length,
        documentsCreated: totalDocumentCount,
        totalMembers: memberCount,
        recentDocuments: documents,
        loading: false
      });
    } catch (error) {
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      setDeletingDocId(docId);
      await documentAPI.deleteDocument(docId);
      
      // Reload the dashboard data to update the stats and documents list
      await loadDashboardData();
      
      // Clear the confirmation
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeletingDocId(null);
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
      {showOnboarding && (
        <OnboardingTour onComplete={() => {
          setShowOnboarding(false);
          sessionStorage.removeItem('onboardingInProgress');
        }} />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with Top Contributor */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              {user?.agencyName} • Records Service Hub
            </p>
          </div>
          <div className="lg:flex lg:justify-end">
            <TopContributor />
          </div>
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
                  data-tour={index === 0 ? 'search-vasp' : 'generate-request'}
                  className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-transparent hover:border-${action.color}-500 cursor-pointer h-full flex flex-col`}
                  onClick={action.action}
                >
                  <div className="p-8 flex flex-col h-full">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-lg bg-${action.color}-100 mb-6`}>
                      <Icon className={`h-8 w-8 text-${action.color}-600`} />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {action.description}
                    </p>
                    <div className="space-y-2 mb-6 flex-grow">
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


        {/* Recent Documents - Full Width */}
        <div data-tour="recent-documents" className="bg-blue-50 rounded-lg shadow-sm p-6 mb-8 border border-blue-100">
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
                <div 
                  key={doc.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        const url = doc.pdfUrl || doc.filePath || (doc.outputFormat === 'docx' ? `/docs/${doc.id}.docx` : `/pdfs/${doc.id}.pdf`);
                        const filename = `${doc.documentType}_${doc.vaspName}_${doc.caseNumber}.${doc.outputFormat || 'pdf'}`;
                        downloadFile(url, filename);
                      }}
                    >
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
                    <div className="flex items-center space-x-2 ml-2">
                      <Download 
                        className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors cursor-pointer" 
                        onClick={() => {
                          const url = doc.pdfUrl || doc.filePath || (doc.outputFormat === 'docx' ? `/docs/${doc.id}.docx` : `/pdfs/${doc.id}.pdf`);
                          const filename = `${doc.documentType}_${doc.vaspName}_${doc.caseNumber}.${doc.outputFormat || 'pdf'}`;
                          downloadFile(url, filename);
                        }}
                      />
                      {deleteConfirmId === doc.id ? (
                        <>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            disabled={deletingDocId === doc.id}
                            className="text-red-600 hover:text-red-700 p-1 rounded disabled:opacity-50"
                            title="Confirm delete"
                          >
                            {deletingDocId === doc.id ? (
                              <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-gray-500 hover:text-gray-600 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(doc.id);
                          }}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
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
          <div data-tour="platform-stats" className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 border border-blue-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center border border-blue-300 rounded-lg p-4 bg-white/50">
                <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
                <p className="text-sm text-gray-600">Active Members</p>
              </div>
              <div className="text-center border border-blue-300 rounded-lg p-4 bg-white/50">
                <p className="text-3xl font-bold text-gray-900">{stats.documentsCreated}</p>
                <p className="text-sm text-gray-600">Documents Created</p>
              </div>
              <div className="text-center border border-blue-300 rounded-lg p-4 bg-white/50">
                <p className="text-3xl font-bold text-gray-900">{stats.totalVASPs}</p>
                <p className="text-sm text-gray-600">VASPs Supported</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div data-tour="quick-links" className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-6 border border-green-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/templates"
                className="flex items-center text-sm text-gray-700 hover:text-green-700 p-2 rounded hover:bg-green-50 transition-colors"
              >
                <FileText className="h-4 w-4 mr-2" />
                My Templates
              </Link>
              <Link
                to="/documents/batch"
                className="flex items-center text-sm text-gray-700 hover:text-green-700 p-2 rounded hover:bg-green-50 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Batch Process
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center text-sm text-gray-700 hover:text-green-700 p-2 rounded hover:bg-green-50 transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                Leaderboard
              </Link>
              <Link
                to="/submissions/new"
                className="flex items-center text-sm text-gray-700 hover:text-green-700 p-2 rounded hover:bg-green-50 transition-colors"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add VASP
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