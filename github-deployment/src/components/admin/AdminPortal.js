import React, { useState } from 'react';
import { Home, Globe, Users, ChevronLeft, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import VaspManagement from './VaspManagement';
import UserManagement from './UserManagement';
import Analytics from './Analytics';

const AdminPortal = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: AdminDashboard },
    { id: 'vasps', label: 'VASP Management', icon: Globe, component: VaspManagement },
    { id: 'users', label: 'User Management', icon: Users, component: UserManagement },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, component: Analytics }
  ];
  
  const ActiveComponent = menuItems.find(item => item.id === activeSection)?.component || AdminDashboard;
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900">Admin Portal</h2>
          <Link
            to="/"
            className="mt-2 flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Main App
          </Link>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <ActiveComponent onNavigate={setActiveSection} />
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;