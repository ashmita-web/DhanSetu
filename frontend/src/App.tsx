import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout.js';
import Onboarding from './pages/Onboarding.js';
import Concierge from './pages/Concierge.js';
import Dashboard from './pages/Dashboard.js';
import FinancialJourney from './pages/FinancialJourney.js';
import DiscoverET from './pages/DiscoverET.js';
import Marketplace from './pages/Marketplace.js';
import ProfileMemory from './pages/ProfileMemory.js';
import { useAppStore } from './store/useAppStore.js';
import { PageLoader } from './components/shared/LoadingSpinner.js';
import { connectSocket } from './services/socket.js';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, token } = useAppStore();

  // Reconnect socket on refresh if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/concierge" replace /> : <Onboarding />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="concierge" element={<Concierge />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="journey" element={<FinancialJourney />} />
          <Route path="discover" element={<DiscoverET />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="profile" element={<ProfileMemory />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
