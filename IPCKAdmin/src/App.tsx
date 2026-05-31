import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Care from './pages/Care';
import Giving from './pages/Giving';
import ContentPage from './pages/Content';
import People from './pages/People';
import ActivityPage from './pages/Activity';
import Devotions from './pages/Devotions';
import Community from './pages/Community';
import Communications from './pages/Communications';

function Protected({ children }: { children: JSX.Element }) {
  const { isStaff } = useAuth();
  const hasToken = !!localStorage.getItem('ipck_admin_token');
  if (!hasToken && !isStaff) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Overview /></Protected>} />
      <Route path="/care" element={<Protected><Care /></Protected>} />
      <Route path="/people" element={<Protected><People /></Protected>} />
      <Route path="/community" element={<Protected><Community /></Protected>} />
      <Route path="/giving" element={<Protected><Giving /></Protected>} />
      <Route path="/content" element={<Protected><ContentPage /></Protected>} />
      <Route path="/devotions" element={<Protected><Devotions /></Protected>} />
      <Route path="/communications" element={<Protected><Communications /></Protected>} />
      <Route path="/activity" element={<Protected><ActivityPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
