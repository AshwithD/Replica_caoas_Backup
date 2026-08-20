import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, theme } from 'antd'; // Import App as AntdApp
import 'antd/dist/reset.css'; // For Ant Design v5

import { message } from 'antd';


// Pages
import Login from './pages/Login';
import DashboardMenu from './pages/DashboardMenu';
import UploadPage from './pages/UploadPage';
import Employees from './pages/Employees';
import LeaveBalance from './pages/LeaveBalance';
import PayrollList from './pages/PayrollList';
import LeaveRequest from './pages/LeaveRequest';
import ManualPayrollTrigger from './pages/PayrollTriggerButton';
import LeaveApproval from './pages/LeaveApproval';
import Attendance from './pages/Attendance';
import HolidayList from './pages/HolidayList';
import PayrollTable from './pages/PayrollTable';
import MailBox from './pages/Mail_Box';
import ComingSoon from './pages/ComingSoon';
// import ResetPassword from './pages/ResetPassword';
// import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
import SendOTP from './pages/SendOTP';
import VerifyOTP from './pages/VerifyOTP';
import ResetWithOTP from './pages/ResetWithOTP';


import ImportantLinks from './components/ImportantLinks';

// import ReminderMailPage from './pages/ReminderMailPage_TDS';
import UDINRecords from './pages/clients/UDINRecords';
import DocumentsHub from './pages/clients/DocumentsHub';
import STTRecords from './pages/clients/STT_Records';
import ClientManagementPage from './pages/clients/ClientManagementPage';

// Layout & Auth
import AppLayout from './components/AppLayout';
import { AuthProvider, PrivateRoute, useAuth } from './contexts/AuthContext';

import React, { useEffect, useContext } from 'react'; // Added useContext
import './index.css';
import { SpinnerProvider, SpinnerContext } from './components/SpinnerContext'; // Import SpinnerContext

import { PuffLoader } from 'react-spinners';

import Quill from 'quill';
import QuillBetterTable from 'quill-better-table';
import 'quill-better-table/dist/quill-better-table.css';

// FIX for "reading 'pop'" error
const Block = Quill.import('blots/block');
Block.tagName = 'DIV';
Quill.register(Block, true);

// Register better-table
Quill.register({
  'modules/better-table': QuillBetterTable,
}, true);



// A new component for the global spinner using spinners-react
const NewGlobalSpinner = () => {
  const { spinning } = useContext(SpinnerContext);
  return spinning ? (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(255,255,255,0.7)', // Slightly more opaque background
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      
      <PuffLoader
        visible={true}
        height="80"
        width="80"
        ariaLabel="spinner-loading"
        speedMultiplier="1"
        color="#001F5B" // Example color, customize as needed
        secondaryColor="rgba(0, 31, 91, 0.4)" // Example secondary color
      />
    </div>
  ) : null;
};


function App() {

  const { token: { colorBgLayout } } = theme.useToken();
 
  // useEffect(() => {

  //   const handleBeforeUnload = () => {

  //     sessionStorage.clear();

  //     // Optional: Call logout API if needed

  //   };
 
  //   window.addEventListener('beforeunload', handleBeforeUnload);
 
  //   return () => {

  //     window.removeEventListener('beforeunload', handleBeforeUnload);

  //   };

  // }, []);

 

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#001F5B', // Navy Blue
          colorInfo: '#001F5B',   // Primary color for info states
          colorSuccess: '#52c41a', // Green
          colorWarning: '#faad14', // Orange
          colorError: '#ff4d4f',   // Red
          colorTextBase: '#333333',
          fontFamily: 'Roboto, sans-serif',
        },
        components: {
          Layout: {
            headerBg: '#001F5B',
            footerBg: '#001F5B',
          },
          Menu: {
            darkItemSelectedBg: '#001F5B',
          }
        }
      }}
    >
      <AntdApp>
        <Router>
          <AuthProvider>
            <SpinnerProvider>
              {/* Place your new global spinner here */}
              <NewGlobalSpinner />

              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-otp" element={<SendOTP />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/reset-password" element={<ResetWithOTP />} />
                {/* <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} /> */}
                <Route path="/upload" element={<UploadPage />} />
                <Route
                  path="/*"
                  element={
                    <AppLayout>
                      <Routes>
                        <Route path="/important-links" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'Team_lead', 'HR', 'Founder', 'Employee']}><ImportantLinks /></PrivateRoute>} />
                        <Route path="/dashboard" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'Team_lead', 'HR', 'Founder', 'Employee']}><DashboardMenu /></PrivateRoute>} />
                        <Route path="/stt-records" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'HR', 'Founder', 'Team_lead']}><STTRecords /></PrivateRoute>} />
                        <Route path="/employee" element={<PrivateRoute allowedRoles={['Admin', 'HR', 'Founder']}><Employees /></PrivateRoute>} />
                        <Route path="/leave-balance" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'Employee', 'HR', 'Founder', 'Team_lead']}><LeaveBalance /></PrivateRoute>} />
                        <Route path="/payrolls" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'HR', 'Founder', 'Team_lead']}><PayrollList /></PrivateRoute>} />
                        <Route path="/leave-requests" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'Employee', 'HR', 'Founder', 'Team_lead']}><LeaveRequest /></PrivateRoute>} />
                        <Route path="/payroll-trigger" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'HR', 'Founder', 'Team_lead']}><ManualPayrollTrigger /></PrivateRoute>} />
                        <Route path="/leave-approvals" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'HR', 'Founder', 'Team_lead']}><LeaveApproval /></PrivateRoute>} />
                        <Route path="/attendance-records" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'HR', 'Founder', 'Employee', 'Team_lead']}><Attendance /></PrivateRoute>} />
                        <Route path="/holiday-list" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'HR', 'Founder', 'Employee', 'Team_lead']}><HolidayList /></PrivateRoute>} />
                        <Route path="/payroll-table" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'HR', 'Founder', 'Team_lead']}><PayrollTable /></PrivateRoute>} />
                        <Route path="/coming-soon" element={<ComingSoon />} />
                        <Route path="/mail-box" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'Founder', 'Team_lead']}><MailBox /></PrivateRoute>} />
                        <Route path="/udin-records" element={<PrivateRoute allowedRoles={['Admin', 'Founder', 'Manager']} allowedEmails={['purnesh.rs@gmail.com', 'mis@ckpsca.com']}><UDINRecords /></PrivateRoute>} />
                        <Route path="/documents" element={<PrivateRoute allowedRoles={['Admin', 'Manager', 'Team_lead']}><DocumentsHub /></PrivateRoute>} />
                        <Route path="/client-management" element={<PrivateRoute allowedRoles={['Admin', 'Founder']}><ClientManagementPage /></PrivateRoute>} />

                        {/* Redirects */}
                        <Route path="/" element={<HomeRedirect />} />
                        <Route path="/access-denied" element={<div>Access Denied</div>} />
                        <Route path="*" element={<div>404 Not Found</div>} />
                      </Routes>
                    </AppLayout>
                  }
                />
              </Routes>
            </SpinnerProvider>
          </AuthProvider>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'Admin' || user.role === 'HR') {
          navigate('');
        } else if (user.role === 'employee') {
          navigate('');
        } else {
          navigate('');
        }
      } else {
        navigate('/login');
      }
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading authentication...</div>;
  return null;
}


export default App;