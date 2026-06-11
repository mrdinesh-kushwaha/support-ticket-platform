import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import type { Role } from './types';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import TicketDetailPage from './pages/TicketDetailPage';
import CreateTicketPage from './pages/CreateTicketPage';
import NotFoundPage from './pages/NotFoundPage';

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'CUSTOMER' ? '/dashboard' : '/agent'} replace />;
  }

  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'CUSTOMER' ? '/dashboard' : '/agent'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <LoginPage />
            </RedirectIfAuth>
          }
        />

        <Route
          path="/register"
          element={
            <RedirectIfAuth>
              <RegisterPage />
            </RedirectIfAuth>
          }
        />

        {/* Customer routes */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth roles={['CUSTOMER']}>
              <CustomerDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/tickets"
          element={
            <RequireAuth roles={['CUSTOMER']}>
              <CustomerDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth roles={['CUSTOMER']}>
              <CustomerDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/tickets/new"
          element={
            <RequireAuth roles={['CUSTOMER']}>
              <CreateTicketPage />
            </RequireAuth>
          }
        />

        {/* Agent routes: only real working ticket pages */}
        <Route path="/agent" element={<Navigate to="/agent/tickets" replace />} />

        <Route
          path="/agent/tickets"
          element={
            <RequireAuth roles={['AGENT', 'ADMIN']}>
              <AgentDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/agent/my-assigned"
          element={
            <RequireAuth roles={['AGENT', 'ADMIN']}>
              <AgentDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/agent/open"
          element={
            <RequireAuth roles={['AGENT', 'ADMIN']}>
              <AgentDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/agent/in-progress"
          element={
            <RequireAuth roles={['AGENT', 'ADMIN']}>
              <AgentDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/agent/resolved"
          element={
            <RequireAuth roles={['AGENT', 'ADMIN']}>
              <AgentDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/agent/closed"
          element={
            <RequireAuth roles={['AGENT', 'ADMIN']}>
              <AgentDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/tickets/:id"
          element={
            <RequireAuth>
              <TicketDetailPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}