
import React, { useEffect, useContext, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import 'antd/dist/reset.css';

import './index.css';
import './App.css';

import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import { PresenceProvider } from "./contexts/PresenceContext";
import { PrivateRoute, useAuth } from './contexts/AuthContext';
import { SpinnerProvider, SpinnerContext } from './components/SpinnerContext';
import { PuffLoader } from 'react-spinners';

// ─── Lazy Imports ─────────────────────────────────────────────────────────────
const DashboardMenu        = lazy(() => import('./pages/DashboardMenu'));
const Employees            = lazy(() => import('./pages/Employees'));
const STTRecords           = lazy(() => import('./pages/clients/ClientManagement/STT_Records'));
const ClientManagementPage = lazy(() => import('./pages/clients/ClientManagement/ClientManagementPage'));
const ComingSoon           = lazy(() => import('./pages/ComingSoon'));

// new
const PayrollRoutes = lazy(() => import('./pages/payroll/PayrollRoutes'));
const ClientPortal  = lazy(() => import('./pages/payroll/portal/ClientPortal'));

// Auth
const SendOTP     = lazy(() => import('./pages/SendOTP'));
const VerifyOTP   = lazy(() => import('./pages/VerifyOTP'));
const ResetWithOTP = lazy(() => import('./pages/ResetWithOTP'));
const ClientOnboardingForm = lazy(() => import('./pages/clients/ClientManagement/ClientOnboardingForm'));

// ─── Loaders ──────────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
    <PuffLoader color="#001F5B" size={48} />
  </div>
);

const GlobalSpinner = () => {
  const { spinning } = useContext(SpinnerContext);
  if (!spinning) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(255,255,255,0.6)',
      zIndex: 9999, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <PuffLoader color="#001F5B" size={60} />
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#001F5B', fontFamily: 'Roboto, sans-serif' } }}>
      <AntdApp>
        <SpinnerProvider>
          <GlobalSpinner />
          <PresenceProvider>
            <Routes>

              {/* ── Public Routes ── */}
              <Route path="/login"             element={<Login />} />
              <Route path="/reset-otp"         element={<Suspense fallback={<PageLoader />}><SendOTP /></Suspense>} />
              <Route path="/verify-otp"        element={<Suspense fallback={<PageLoader />}><VerifyOTP /></Suspense>} />
              <Route path="/reset-password"    element={<Suspense fallback={<PageLoader />}><ResetWithOTP /></Suspense>} />
              <Route path="/client-onboarding" element={<Suspense fallback={<PageLoader />}><ClientOnboardingForm /></Suspense>} />

              {/* ── Client Portal (public; payroll PortalUser credentials) ── */}
              <Route path="/portal/*" element={
                <Suspense fallback={<PageLoader />}><ClientPortal /></Suspense>
              } />

              {/* ── Protected Routes ── */}
              <Route path="/*" element={
                <AppLayout>
                  <Routes>

                    {/* Dashboard */}
                    <Route path="/dashboard" element={
                      <Suspense fallback={<PageLoader />}>
                        <PrivateRoute allowedRoles={['Admin','Manager','Team Lead','HR','Founder','Employee','Intern']}>
                          <DashboardMenu />
                        </PrivateRoute>
                      </Suspense>
                    } />

                    {/* Employees */}
                    <Route path="/employee" element={
                      <Suspense fallback={<PageLoader />}>
                        <PrivateRoute allowedRoles={['Admin','HR','Founder']}>
                          <Employees />
                        </PrivateRoute>
                      </Suspense>
                    } />

                    {/* STT Records */}
                    <Route path="/stt-records" element={
                      <Suspense fallback={<PageLoader />}>
                        <PrivateRoute allowedRoles={['Admin','Manager','HR','Founder','Team Lead','Employee','Intern']}>
                          <STTRecords />
                        </PrivateRoute>
                      </Suspense>
                    } />

                    {/* Client Management */}
                    <Route path="/client-management" element={
                      <Suspense fallback={<PageLoader />}>
                        <PrivateRoute allowedRoles={['Admin','Founder','Manager','HR']}>
                          <ClientManagementPage />
                        </PrivateRoute>
                      </Suspense>
                    } />

                    {/* Coming Soon / Fallback */}
                    <Route path="/coming-soon" element={<Suspense fallback={<PageLoader />}><ComingSoon /></Suspense>} />
                    <Route path="/"            element={<HomeRedirect />} />
                    <Route path="*"            element={<div style={{padding:40,textAlign:'center'}}>404 - Page Not Found</div>} />

                    {/* Payroll */}
                    <Route path="/payroll/*" element={
                      <Suspense fallback={<PageLoader />}>
                        <PrivateRoute allowedRoles={['Admin','HR','Founder']}>
                          <PayrollRoutes />
                        </PrivateRoute>
                      </Suspense>
                    } />

                  </Routes>
                </AppLayout>
              } />

            </Routes>
          </PresenceProvider>
        </SpinnerProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading) navigate(user ? '/dashboard' : '/login');
  }, [user, loading, navigate]);
  return null;
}

export default App;