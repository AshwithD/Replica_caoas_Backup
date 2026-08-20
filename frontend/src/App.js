
// import React, { useEffect, useContext, lazy, Suspense } from 'react';
// import { Routes, Route, useNavigate } from 'react-router-dom';
// import { ConfigProvider, App as AntdApp } from 'antd';
// import 'antd/dist/reset.css';
// import { LicenseProvider, useLicense } from './contexts/LicenseContext';

// import './index.css';
// import './App.css';

// import Login from './pages/Login';
// import AppLayout from './components/AppLayout';
// import { PresenceProvider } from "./contexts/PresenceContext";
// import { PrivateRoute, useAuth } from './contexts/AuthContext';
// import { SpinnerProvider, SpinnerContext } from './components/SpinnerContext';

// import { PuffLoader } from 'react-spinners';

// /* ======================================================
//    LAZY IMPORTS (GROUPED CHUNKS)
//    ====================================================== */

// // Dashboard
// const DashboardMenu = lazy(() =>
//   import(/* webpackChunkName: "dashboard" */ './pages/DashboardMenu')
// );

// // Website
// const CAOASLanding = lazy(() =>
//   import(/* webpackChunkName: "website" */ './components/caoas_website')
// );

// // HR
// const Employees = lazy(() =>
//   import(/* webpackChunkName: "hr" */ './pages/Employees')
// );
// const LeaveRequest = lazy(() =>
//   import(/* webpackChunkName: "hr" */ './pages/LeaveRequest')
// );
// const LeaveApproval = lazy(() =>
//   import(/* webpackChunkName: "hr" */ './pages/LeaveApproval')
// );
// const HRMasterTabs = lazy(() =>
//   import(/* webpackChunkName: "hr" */ './pages/HRMasterTabs')
// );

// // Attendance
// const Attendance = lazy(() =>
//   import(/* webpackChunkName: "attendance" */ './pages/Attendance')
// );
// const AdminAttendancePage = lazy(() =>
//   import(/* webpackChunkName: "attendance" */ './pages/AdminAttendancePage')
// );

// // Payroll
// const PayrollList = lazy(() =>
//   import(/* webpackChunkName: "payroll" */ './pages/PayrollList')
// );
// const PayrollTable = lazy(() =>
//   import(/* webpackChunkName: "payroll" */ './pages/PayrollTable')
// );
// const ManualPayrollTrigger = lazy(() =>
//   import(/* webpackChunkName: "payroll" */ './pages/PayrollTriggerButton')
// );

// const ClientRequestsReviewPage = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/ClientManagement/Clientrequestsreviewpage')
// );

// // Reconciliation (Audit)
// const ReconciliationPage = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './pages/ComingSoon')
// );

// // Clients
// const STTRecords = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/ClientManagement/STT_Records')
// );
// const UDINRecords = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/ClientManagement/UDINRecords')
// );
// const DocumentsHub = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/DocumentsHub')
// );
// const SOPManager = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/SOPPage')
// );
// const ClientManagementPage = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/ClientManagement/ClientManagementPage')
// );

// // const ClientDetailsPage = lazy(() =>
// //   import(/* webpackChunkName: "clients" */ './pages/clients/ClientManagement/ClientTaskDetailsPage')
// // );
// const TaskDashboard = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/ClientManagement/TaskDashboard')
// );

// const MyReimbursementView = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/ReimbursementDashboard')
// );

// const MyWorkHistoryView = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/ClientManagement/MyWorkHistory')
// );

// const InvoicePage = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/InvoiceDebitCredit/InvoicePage')
// );

// const ChatPage = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './pages/ComingSoon')
// );

// const ComplianceTracker = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './pages/ComingSoon')
// );

// // Misc
// const HolidayList = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './pages/HolidayList')
// );

// // Payroll Details
// const PayrollProcessPage = lazy(() =>
//   import(/* webpackChunkName: "payroll" */ './pages/PayrollProcessPage')
// );

// // Survey
// const SurveyForm = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './pages/ComingSoon')
// );

// const MailBox = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './pages/Mail_Box')
// );
// const ImportantLinks = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './components/ImportantLinks')
// );
// const CompanyDetailsForm = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './pages/CompanyProfile')
// );
// const ComingSoon = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './pages/ComingSoon')
// );

// // Auth
// const SendOTP = lazy(() =>
//   import(/* webpackChunkName: "auth" */ './pages/SendOTP')
// );
// const VerifyOTP = lazy(() =>
//   import(/* webpackChunkName: "auth" */ './pages/VerifyOTP')
// );
// const ResetWithOTP = lazy(() =>
//   import(/* webpackChunkName: "auth" */ './pages/ResetWithOTP')
// );

// const IncomeTaxPage = lazy(() =>
//   import(/* webpackChunkName: "misc" */ './pages/ComingSoon')
// )
// const ClientOnboardingForm = lazy(() =>
//   import(/* webpackChunkName: "clients" */ './pages/clients/ClientManagement/ClientOnboardingForm')
// );

// /* ======================================================
//    LOADERS
//    ====================================================== */

// const PageLoader = () => (
//   <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
//     <PuffLoader color="#001F5B" size={48} />
//   </div>
// );

// const GlobalSpinner = () => {
//   const { spinning } = useContext(SpinnerContext);
//   if (!spinning) return null;

//   return (
//     <div
//       style={{
//         position: 'fixed',
//         inset: 0,
//         background: 'rgba(255,255,255,0.6)',
//         zIndex: 9999,
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//       }}
//     >
//       <PuffLoader color="#001F5B" size={60} />
//     </div>
//   );
// };

// /* ======================================================
//    APP
//    ====================================================== */

// function App() {
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   useEffect(() => {
//     const onKeyDown = (e) => {
//       if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;
//       if (e.key === 'Escape') navigate(-1);
//     };
//     window.addEventListener('keydown', onKeyDown);
//     return () => window.removeEventListener('keydown', onKeyDown);
//   }, [navigate]);

//   return (
//     <ConfigProvider
//       theme={{
//         token: {
//           colorPrimary: '#001F5B',
//           fontFamily: 'Roboto, sans-serif',
//         },
//       }}
//     >
//       <AntdApp>
//         <SpinnerProvider>
//           <GlobalSpinner />
//           <PresenceProvider>

//           <Routes>
//             {/* AUTH ROUTES */}
//             <Route path="/login" element={<Login />} />
//             <Route path="/reset-otp" element={<SendOTP />} />
//             <Route path="/verify-otp" element={<VerifyOTP />} />
//             <Route path="/reset-password" element={<ResetWithOTP />} />
//             <Route path="/caoas" element={<CAOASLanding />} />
//             <Route path="/client-onboarding" element={<ClientOnboardingForm />} />

//             {/* PROTECTED APP */}
//             <Route
//               path="/*"
//               element={
//                 <AppLayout>
//                   <Routes>

//                     <Route path="/important-links" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','Team Lead','HR','Founder','Employee']}>
//                           <ImportantLinks />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/dashboard" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','Team Lead','HR','Founder','Employee']}>
//                           <DashboardMenu />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/stt-records" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','HR','Founder','Team Lead','Employee']}>
//                           <STTRecords />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/employee" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','HR','Founder']}>
//                           <Employees />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     {/* <Route path="/payrolls" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin', 'HR','Founder']}>
//                           <PayrollList />
//                         </PrivateRoute>
//                       </Suspense>
//                     } /> */}

//                     <Route path="/payroll-process" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin', 'HR', 'Founder']}>
//                           <PayrollProcessPage />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/client-requests-review" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Founder','Manager','HR']}>
//                           <ClientRequestsReviewPage />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/audit-tracker" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin']}>
//                           <ReconciliationPage />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/income-tax" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','HR','Founder','Employee','Team Lead']}>
//                           <IncomeTaxPage />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/leave-tracker" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute>
//                           <LeaveRequest />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/leave-management" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','HR','Founder']}>
//                           <LeaveApproval />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />
                    

//                     <Route path="/attendance-logs" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute>
//                           <Attendance />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/time-tracker" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','HR','Founder','Manager']}>
//                           <AdminAttendancePage />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/chat" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','HR','Founder','Employee','Team Lead']}>
//                           <ChatPage />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/compliance-tracker" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin', 'Founder', 'Manager', 'Team Lead']}>
//                           <ComplianceTracker />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/holiday-list" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','HR','Founder','Employee','Team Lead']}>
//                           <HolidayList />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/appraisal-form" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','HR','Founder','Employee','Team Lead']}>
//                           <SurveyForm />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/payroll-table" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','HR','Founder']}>
//                           <PayrollTable />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/mail-box" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','Founder','Team Lead']}>
//                           <MailBox />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/udin-records" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute
//                           allowedRoles={['Admin','Founder','Manager']}
//                           allowedEmails={['purnesh.rs@gmail.com','mis@ckpsca.com','sreekanth.d.ckpsca@gmail.com']}
//                         >
//                           <UDINRecords />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/my-work-history" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','HR','Founder','Employee', 'Team Lead']}>
//                           <MyWorkHistoryView />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/documents" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Manager','Team Lead','Employee']}>
//                           <DocumentsHub />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     {/* <Route path="/client-management" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Founder', 'Manager']}>
//                           <ClientManagementPage />
//                         </PrivateRoute>
//                       </Suspense>
//                     } /> */}

//                     <Route path="/sop" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute>
//                           <SOPManager />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/invoice" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Founder','Manager']}>
//                           <InvoicePage />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/company-profile" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin', 'Founder']}>
//                           <CompanyDetailsForm />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/hr-solutions" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Founder','Manager','HR','Team Lead','Employee']}>
//                           <HRMasterTabs user={user} />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="client-management" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Founder', 'Manager']}>
//                           <ClientManagementPage />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

//                     <Route path="/task-dashboard" element={
//                       <Suspense fallback={<PageLoader />}>
//                         <PrivateRoute allowedRoles={['Admin','Founder', 'Manager']}>
//                           <TaskDashboard />
//                         </PrivateRoute>
//                       </Suspense>
//                     } />

                    

//                     <Route path="/coming-soon" element={<ComingSoon />} />
//                     <Route path="/" element={<HomeRedirect />} />
//                     <Route path="*" element={<div>404 Not Found</div>} />

//                   </Routes>
//                 </AppLayout>
//               }
//             />
//           </Routes>


//           </PresenceProvider>
//         </SpinnerProvider>
//       </AntdApp>
//     </ConfigProvider>
//   );
// }

// /* ======================================================
//    REDIRECT
//    ====================================================== */

// function HomeRedirect() {
//   const { user, loading } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!loading) navigate(user ? '/' : '/login');
//   }, [user, loading, navigate]);

//   return null;
// }

// export default App;















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