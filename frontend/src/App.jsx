import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { Toaster } from 'react-hot-toast';

// Layouts & Components
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import AbsensiPage from './pages/AbsensiPage';
import RiwayatPage from './pages/RiwayatPage';
import CutiPage from './pages/CutiPage';
import SlipGajiPage from './pages/SlipGajiPage';
import PersetujuanPage from './pages/PersetujuanPage';
import MonitoringPage from './pages/MonitoringPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageSchedulePage from './pages/ManageSchedulePage';
import ManageShiftPage from './pages/ManageShiftPage';
import ManageOutletsPage from './pages/ManageOutletsPage'; // Added
import ManageAnnouncementsPage from './pages/ManageAnnouncementsPage';
import SettingsPage from './pages/SettingsPage';
import ChangeShiftPage from './pages/ChangeShiftPage';
import ReloadPrompt from './components/ui/ReloadPrompt';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <ReloadPrompt />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="absensi" element={<AbsensiPage />} />
          <Route path="cuti" element={<CutiPage />} />
          <Route path="persetujuan" element={
            <ProtectedRoute roles={['atasan', 'hr', 'hr_cabang', 'supervisor', 'manager', 'area_manager', 'general_manager', 'admin']}>
              <PersetujuanPage />
            </ProtectedRoute>
          } />
          <Route path="monitoring" element={
            <ProtectedRoute roles={['atasan', 'hr', 'hr_cabang', 'supervisor', 'manager', 'area_manager', 'general_manager', 'admin']}>
              <MonitoringPage />
            </ProtectedRoute>
          } />
          <Route path="tukar-shift" element={<ChangeShiftPage />} />
          <Route path="manage-users" element={
            <ProtectedRoute roles={['hr', 'hr_cabang', 'admin']}>
              <ManageUsersPage />
            </ProtectedRoute>
          } />
          <Route path="manage-schedule" element={
            <ProtectedRoute roles={['hr', 'hr_cabang', 'admin']}>
              <ManageSchedulePage />
            </ProtectedRoute>
          } />
          <Route path="manage-shifts" element={
            <ProtectedRoute roles={['hr', 'admin']}>
              <ManageShiftPage />
            </ProtectedRoute>
          } />
          {/* Outlet Management Route */}
          <Route path="manage-outlets" element={
            <ProtectedRoute roles={['hr', 'admin']}>
              <ManageOutletsPage />
            </ProtectedRoute>
          } />
          <Route path="manage-announcements" element={
            <ProtectedRoute roles={['hr', 'hr_cabang', 'admin', 'manager', 'area_manager', 'supervisor', 'accounting', 'finance']}>
              <ManageAnnouncementsPage />
            </ProtectedRoute>
          } />
          <Route path="slip-gaji" element={<SlipGajiPage />} />
          <Route path="riwayat" element={<RiwayatPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Catch all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
