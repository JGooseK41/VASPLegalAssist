import React, { useState, useEffect } from 'react';
import { Users, Globe, FileText, AlertCircle, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const StatCard = ({ icon: Icon, title, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalVasps: 0,
    activeVasps: 0,
    pendingSubmissions: 0,
    totalDocuments: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage users, VASPs, and review submissions
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers}
          color="blue"
        />
        <StatCard
          icon={AlertCircle}
          title="Pending Users"
          value={stats.pendingUsers}
          color="yellow"
        />
        <StatCard
          icon={Globe}
          title="Total VASPs"
          value={stats.totalVasps}
          color="green"
        />
        <StatCard
          icon={CheckCircle}
          title="Active VASPs"
          value={stats.activeVasps}
          color="green"
        />
        <StatCard
          icon={FileText}
          title="Pending Submissions"
          value={stats.pendingSubmissions}
          color="yellow"
        />
        <StatCard
          icon={FileText}
          title="Total Documents"
          value={stats.totalDocuments}
          color="blue"
        />
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {stats.pendingUsers > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-900">
                  {stats.pendingUsers} users awaiting approval
                </span>
                <Link to="/admin/users?filter=pending" className="text-sm text-yellow-700 hover:text-yellow-800 font-medium">
                  Review →
                </Link>
              </div>
            )}
            {stats.pendingSubmissions > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-orange-900">
                  {stats.pendingSubmissions} VASP submissions pending
                </span>
                <Link to="/admin/submissions" className="text-sm text-orange-700 hover:text-orange-800 font-medium">
                  Review →
                </Link>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                Add new VASP
              </span>
              <Link to="/admin/vasps/new" className="text-sm text-blue-700 hover:text-blue-800 font-medium">
                Create →
              </Link>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-900">
                View analytics
              </span>
              <Link to="/admin/analytics" className="text-sm text-purple-700 hover:text-purple-800 font-medium">
                View →
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm text-gray-900">2 hours ago</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">Loading recent activities...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;