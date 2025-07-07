import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, FileText, Clock, Upload, Search, Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { vaspAPI, documentAPI } from '../../services/api';
import TopContributor from './TopContributor';

const Dashboard = () => {
  const { user } = useAuth();
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
      console.error('Failed to load dashboard data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {user?.agencyName} • Badge #{user?.badgeNumber}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total VASPs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.loading ? '...' : stats.totalVASPs}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Documents Created
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.loading ? '...' : stats.documentsCreated}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Last Activity
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.recentDocuments.length > 0 
                        ? new Date(stats.recentDocuments[0].createdAt).toLocaleDateString()
                        : 'No activity'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Success Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">100%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Contributor Section - Now in grid */}
          <div className="lg:col-span-1">
            <TopContributor />
          </div>
          
          {/* Placeholder for balance - can add more widgets here */}
          <div className="lg:col-span-2">
            {/* Space for future widgets or leave empty for now */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Documents */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Documents</h3>
              <Link
                to="/documents/history"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all →
              </Link>
            </div>
            
            {stats.loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : stats.recentDocuments.length > 0 ? (
              <div className="space-y-3">
                {stats.recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {doc.caseNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {doc.vaspName} • {doc.documentType}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No documents created yet
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/search"
                className="w-full flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Search className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium text-blue-900">Search VASP Database</span>
              </Link>
              
              <Link
                to="/documents/new"
                className="w-full flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
              >
                <Plus className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium text-green-900">Create New Document</span>
              </Link>
              
              <Link
                to="/templates"
                className="w-full flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
              >
                <FileText className="h-5 w-5 text-purple-600 mr-3" />
                <span className="font-medium text-purple-900">Manage Templates</span>
              </Link>
              
              <button
                className="w-full flex items-center p-3 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                onClick={() => document.getElementById('csv-upload').click()}
              >
                <Upload className="h-5 w-5 text-orange-600 mr-3" />
                <span className="font-medium text-orange-900">Import Transaction CSV</span>
              </button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  // Handle CSV upload
                  console.log('CSV upload:', e.target.files[0]);
                }}
              />
            </div>
          </div>
        </div>

        {/* Demo Mode Notice */}
        {user?.role === 'DEMO' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You're using a demo account. Some features may be limited.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;