import React, { useState, useEffect } from 'react';
import { Calendar, Globe, Users, BarChart3, TrendingUp, Eye, Clock, MapPin, Activity } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnalytics();
    loadRealtimeData();
    
    // Set up real-time updates
    const interval = setInterval(loadRealtimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/summary', {
        params: dateRange,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeData = async () => {
    try {
      const response = await axios.get('/api/analytics/realtime', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setRealtimeData(response.data);
    } catch (err) {
      console.error('Error loading real-time data:', err);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  // Chart configurations
  const visitorChartData = {
    labels: analyticsData?.dailyVisitors?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Daily Visitors',
        data: analyticsData?.dailyVisitors?.map(d => d.visitors) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  const pageViewsChartData = {
    labels: analyticsData?.topPages?.map(p => p.path) || [],
    datasets: [
      {
        label: 'Page Views',
        data: analyticsData?.topPages?.map(p => p.views) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ]
      }
    ]
  };

  const countryChartData = {
    labels: analyticsData?.countries?.map(c => c.country) || [],
    datasets: [
      {
        data: analyticsData?.countries?.map(c => c.visitors) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(14, 165, 233, 0.8)'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
          
          {/* Date Range Selector */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
              <div className="flex items-center">
                <Activity className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-blue-100 text-sm">Active Visitors</p>
                  <p className="text-2xl font-bold">{realtimeData?.activeVisitors || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
              <div className="flex items-center">
                <Users className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-green-100 text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold">{analyticsData?.summary?.totalSessions || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
              <div className="flex items-center">
                <Eye className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-yellow-100 text-sm">Page Views</p>
                  <p className="text-2xl font-bold">{analyticsData?.summary?.totalPageViews || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
              <div className="flex items-center">
                <Clock className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-purple-100 text-sm">Avg. Session Duration</p>
                  <p className="text-2xl font-bold">{analyticsData?.summary?.averageSessionDuration || 0}s</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Visitor Trend */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Visitor Trend
              </h3>
              <div className="h-64">
                <Line data={visitorChartData} options={chartOptions} />
              </div>
            </div>

            {/* Top Pages */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Top Pages
              </h3>
              <div className="h-64">
                <Bar data={pageViewsChartData} options={chartOptions} />
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Countries
              </h3>
              <div className="h-64">
                <Pie data={countryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {realtimeData?.recentViews?.map((view, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{view.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-900 font-medium mr-2">{view.path}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(view.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Cities */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cities</h3>
              <div className="space-y-2">
                {analyticsData?.cities?.map((city, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-900">
                      {city.city}, {city.country}
                    </span>
                    <span className="text-gray-500 font-medium">{city.visitors}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Pages Detail */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Performance</h3>
              <div className="space-y-2">
                {analyticsData?.topPages?.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-900 font-mono text-sm">{page.path}</span>
                    <span className="text-gray-500 font-medium">{page.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;