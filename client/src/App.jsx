
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RecordPage from './pages/RecordPage';
import HistoryPage from './pages/HistoryPage';
import PredictionPage from './pages/PredictionPage';
import { MobileEntryPage, MobileHistoryPage, MobilePredictionPage } from './pages/mobile';
import UserManagementPage from './pages/admin/UserManagementPage';
import PriceManagementPage from './pages/PriceManagementPage';
import MapSettingsPage from './pages/admin/MapSettingsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <RecordPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/predict" element={
            <ProtectedRoute>
              <Layout>
                <PredictionPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <Layout>
                <HistoryPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Mobile Routes */}
          <Route path="/mobile/entry" element={
            <ProtectedRoute>
              <Layout>
                <MobileEntryPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/mobile/history" element={
            <ProtectedRoute>
              <Layout>
                <MobileHistoryPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/mobile/predict" element={
            <ProtectedRoute>
              <Layout>
                <MobilePredictionPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/users" element={
            <AdminRoute>
              <Layout>
                <UserManagementPage />
              </Layout>
            </AdminRoute>
          } />
          <Route path="/admin/prices" element={
            <AdminRoute>
              <Layout>
                <PriceManagementPage />
              </Layout>
            </AdminRoute>
          } />
          <Route path="/admin/maps" element={
            <AdminRoute>
              <Layout>
                <MapSettingsPage />
              </Layout>
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
