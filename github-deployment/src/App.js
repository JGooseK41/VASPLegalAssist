import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/common/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/dashboard/Dashboard';
import VASPSearch from './components/search/VASPSearch';
import DocumentBuilder from './components/documents/DocumentBuilder';
import DocumentHistory from './components/documents/DocumentHistory';
import TemplateManager from './components/templates/TemplateManager';
import Profile from './components/auth/Profile';
import AdminPortal from './components/admin/AdminPortal';
import FAQ from './components/help/FAQ';
import VaspSubmissionForm from './components/submissions/VaspSubmissionForm';
import MySubmissions from './components/submissions/MySubmissions';
import Leaderboard from './components/dashboard/Leaderboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/faq" element={<FAQ />} />
          
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/search" element={<VASPSearch />} />
              <Route path="/documents/new" element={<DocumentBuilder />} />
              <Route path="/documents/history" element={<DocumentHistory />} />
              <Route path="/templates" element={<TemplateManager />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/submissions/new" element={<VaspSubmissionForm />} />
              <Route path="/submissions/my" element={<MySubmissions />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Route>
            {/* Admin Portal - outside of main layout */}
            <Route path="/admin/*" element={<AdminPortal />} />
          </Route>
          
          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;