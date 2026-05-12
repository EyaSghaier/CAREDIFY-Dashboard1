import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { SuspendedPage } from './pages/SuspendedPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { MessagesPage } from './pages/MessagesPage';
import { MapPage } from './pages/MapPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuth } from './context/AuthContext';
import { ConversationsProvider } from './context/ConversationsContext';

// ── Full-screen loading skeleton ────────────────────────────────────────────
const LoadingScreen: React.FC = () => {
  // Detect dark/light via CSS variable fallback
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'linear-gradient(145deg, #070d1c 0%, #0a1326 50%, #060c1a 100%)' }}
    >
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(14,165,233,0.4)', borderTopColor: 'transparent' }}
      />
      <p className="text-xs tracking-widest uppercase" style={{ color: '#4B5563' }}>
        Chargement…
      </p>
    </div>
  );
};

// ── Protected layout — redirects based on auth + user status ────────────────
const ProtectedLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // Status-based routing
  if (user.status === 'pending' || user.status === 'verified') {
    return <Navigate to="/pending-approval" replace />;
  }
  if (user.status === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }
  if (user.status === 'rejected') {
    // Rejected users are signed out and redirected to login
    return <Navigate to="/login" replace />;
  }

  // status === 'active' → render protected layout
  return (
    <ConversationsProvider>
      <Layout />
    </ConversationsProvider>
  );
};

// ── Router ───────────────────────────────────────────────────────────────��──
export const router = createBrowserRouter([
  // ── Public routes ──
  { path: '/login',            Component: LoginPage },
  { path: '/signup',           Component: SignUpPage },
  { path: '/forgot-password',  Component: ForgotPasswordPage },

  // ── Semi-protected (logged-in but awaiting/suspended) ──
  { path: '/pending-approval', Component: PendingApprovalPage },
  { path: '/suspended',        Component: SuspendedPage },

  // ── Protected app routes ──
  {
    path: '/',
    Component: ProtectedLayout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',       Component: DashboardPage },
      { path: 'patients',        Component: PatientsPage },
      { path: 'patients/:id',    Component: PatientDetailPage },
      { path: 'alerts',          Component: AlertsPage },
      { path: 'messages',        Component: MessagesPage },
      { path: 'map',             Component: MapPage },
      { path: 'settings',        Component: SettingsPage },
      { path: '*',               element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);