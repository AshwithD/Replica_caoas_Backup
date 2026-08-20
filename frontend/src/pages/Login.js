// // import React, { useState, useContext } from 'react';
// // import { Card, Typography, Form, Input, Button, Alert, App  } from 'antd';
// // import { useNavigate } from 'react-router-dom';
// // import { useAuth } from '../contexts/AuthContext';
// // import { SpinnerContext } from '../components/SpinnerContext';
// // import { api } from '../services/api';

// // import '../CSS/pages/Login.css'; // Optional custom styles

// // const { Title, Text } = Typography;

// // export default function Login() {
// //   const [error, setError] = useState('');
// //   const [disabled, setDisabled] = useState(false); // Optional button disabling
// //   const navigate = useNavigate();
// //   const { login } = useAuth();
// //   const { showSpinner, hideSpinner } = useContext(SpinnerContext); // Global spinner

// //   const { message } = App.useApp();
  
// //   const onFinish = async (values) => {
// //   setError('');
// //   setDisabled(true);
// //   showSpinner();

// //   try {
// //     await api.get('/auth/csrf/');

// //     const result = await login(values.email, values.password);

// //     // login() successful → result === true (boolean)
// //     if (result === true) return;

// //     // login() failed → result = { success: false, message: "some reason" }
// //     if (result?.success === false) {
// //       setError(result.message);
// //       message.error(result.message);
// //       return;
// //     }

// //   } catch (err) {
// //     const errMsg = err?.message || 'An unexpected error occurred. Please try again.';
// //     setError(errMsg);
// //     console.log('API error:', errMsg);
// //     message.error(errMsg);
// //   } finally {
// //     hideSpinner();
// //     setDisabled(false);
// //   }
// // };



// //   return (
// //     <div className="login-container">
// //       <Card className="login-card">
// //         <div className="login-header">
// //           <img src="/CKPSCA logo.png" alt="Company Logo" className="login-logo" />
// //           <Title level={3} style={{ marginBottom: 0 }}>Welcome Back</Title>
// //           <Text type="secondary">Please login to your account</Text>
// //         </div>

// //         {/* {error && (
// //           <Alert
// //             message="Login Error"
// //             description={error}
// //             type="error"
// //             showIcon
// //             closable
// //             onClose={() => setError('')}
// //             style={{ marginBottom: 16 }}
// //           />
// //         )} */}

// //         <Form
// //           name="login"
// //           layout="vertical"
// //           initialValues={{ email: '', password: '' }}
// //           onFinish={onFinish}
// //         >
// //           <Form.Item
// //             label="Email"
// //             name="email"
// //             rules={[
// //               { required: true, message: 'Please input your email!' },
// //               { type: 'email', message: 'Please enter a valid email!' },
// //             ]}
// //           >
// //             <Input placeholder="Enter your email" />
// //           </Form.Item>

// //           <Form.Item
// //             label="Password"
// //             name="password"
// //             rules={[{ required: true, message: 'Please input your password!' }]}
// //           >
// //             <Input.Password placeholder="Enter your password" />
// //           </Form.Item>

// //           <Form.Item>
// //             <Button
// //               type="primary"
// //               htmlType="submit"
// //               block
// //               disabled={disabled}
// //               style={{ marginTop: '12px' }}
// //             >
// //               Login
// //             </Button>
// //           </Form.Item>

// //           <div style={{ textAlign: 'center', marginTop: -10 }}>
// //             <Button
// //               type="link"
// //               style={{ padding: 0 }}
// //               onClick={() => navigate('/reset-otp')}
// //             >
// //               Forgot Password?
// //             </Button>
// //           </div>
// //         </Form>
// //       </Card>
// //     </div>
// //   );
// // }


// // import React, { useState, useContext, useEffect } from 'react'; // Added useEffect
// // import { Card, Typography, Form, Input, Button, App } from 'antd';
// // import { useNavigate } from 'react-router-dom';
// // import { useAuth } from '../contexts/AuthContext';
// // import { SpinnerContext } from '../components/SpinnerContext';
// // import { api } from '../services/api';
// // import logo from '../assets/CKPSCA_logo.png';
// // import '../CSS/pages/Login.css';

// // const { Title, Text } = Typography;

// // export default function Login() {
// //   const [error, setError] = useState('');
// //   const [disabled, setDisabled] = useState(false);
// //   const navigate = useNavigate();
  
// //   // Assuming your useAuth exposes a logout function or setUser(null)
// //   const { login, logout, user } = useAuth(); 
// //   const { showSpinner, hideSpinner } = useContext(SpinnerContext);
// //   const { message } = App.useApp();

// //   // 1. FORCE LOGOUT ON PAGE LOAD
// //   // This ensures that every time this page is visited, the previous session is killed.
// //   // useEffect(() => {
// //   //   if (logout) {
// //   //       logout(); 
// //   //   }
// //   //   // If you store tokens in localStorage manually, clear them here too:
// //   //   // localStorage.removeItem('token');
// //   //   // localStorage.removeItem('user');
// //   // }, [logout]);

// //   useEffect(() => {
// //     if (user) {
// //       navigate('/', { replace: true });
// //     }
// //   }, [user, navigate]);

// //   const onFinish = async (values) => {
// //     setError('');
// //     setDisabled(true);
// //     showSpinner();

// //     try {
// //       // await api.get('/auth/csrf/');
// //       const result = await login(values.email, values.password);

// //       if (result === true) return;

// //       if (result?.success === false) {
// //         setError(result.message);
// //         // message.error(result.message);
// //         setError(result.message);
// //         return;
// //       }

// //     } catch (err) {
// //       const errMsg = err?.message || 'An unexpected error occurred. Please try again.';
// //       setError(errMsg);
// //       console.log('API error:', errMsg);
// //       message.error(errMsg);
// //     } finally {
// //       hideSpinner();
// //       setDisabled(false);
// //     }
// //   };

// //   return (
// //     <div className="login-container">
// //       <Card className="login-card">
// //         <div className="login-header">
// //           {/* <img src="/CKPSCA logo.png" alt="Company Logo" className="login-logo" /> */}
// //           <img src={logo} alt="Company Logo" className="login-logo" />
// //           <Title level={3} style={{ marginBottom: 0 }}>Welcome Back</Title>
// //           <Text type="secondary">Please login to your account</Text>
// //         </div>

// //         <Form
// //           name="login"
// //           layout="vertical"
// //           initialValues={{ email: '', password: '' }}
// //           onFinish={onFinish}
// //           // 2. DISABLE BROWSER AUTOCOMPLETE 
// //           autoComplete="off" 
// //         >
// //           <Form.Item
// //             label="Email"
// //             name="email"
// //             rules={[
// //               { required: true, message: 'Please input your email!' },
// //               { type: 'email', message: 'Please enter a valid email!' },
// //             ]}
// //           >
// //             {/* 'new-password' or 'off' helps prevent browser suggestions */}
// //             <Input 
// //                 placeholder="Enter your email" 
// //                 // autoComplete="off" 
// //                 autoComplete="email"
// //             />
// //           </Form.Item>

// //           <Form.Item
// //             label="Password"
// //             name="password"
// //             rules={[{ required: true, message: 'Please input your password!' }]}
// //           >
// //             {/* 'new-password' is a trick to stop Chrome from auto-filling saved passwords */}
// //             <Input.Password 
// //                 placeholder="Enter your password" 
// //                 autoComplete="new-password"
// //                 // autoComplete="off"  
// //             />
// //           </Form.Item>

// //           <Form.Item>
// //             <Button
// //               type="primary"
// //               htmlType="submit"
// //               block
// //               disabled={disabled}
// //               style={{ marginTop: '12px' }}
// //             >
// //               Login
// //             </Button>
// //           </Form.Item>

// //           <div style={{ textAlign: 'center', marginTop: -10 }}>
// //             {error && (
// //               <Text
// //                 className="login-error-text"
// //                 style={{
// //                   display: 'block',
// //                   marginTop: 8,
// //                   fontSize: 13,
// //                   fontWeight: '500',
// //                 }}
// //               >
// //                 {error}
// //               </Text>
// //             )}


// //             <Button
// //               type="link"
// //               style={{ padding: 0 }}
// //               onClick={() => navigate('/reset-otp')}
// //             >
// //               Forgot Password?
// //             </Button>
            
// //           </div>
// //         </Form>
// //       </Card>
// //     </div>
// //   );
// // }

// import React, { useState, useContext, useEffect } from 'react';
// import { Card, Typography, Form, Input, Button, App } from 'antd';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { SpinnerContext } from '../components/SpinnerContext';
// import logo from '../assets/CKPSCA_logo.png';
// import caoaslogo from '../assets/caoas-logo.png';
// import '../CSS/pages/Login.css';


// const { Title, Text } = Typography;

// export default function Login() {
//   const [error, setError] = useState('');
//   const [disabled, setDisabled] = useState(false);
//   const navigate = useNavigate();

//   const { login, user } = useAuth(); 
//   const { showSpinner, hideSpinner } = useContext(SpinnerContext);
//   const { message } = App.useApp();

//   // ✅ Prevent logged-in users from visiting Login page
//   useEffect(() => {
//     if (user) {
//       navigate('/', { replace: true });
//     }
//   }, [user, navigate]);

//   // const onFinish = async (values) => {
//   //   setError('');
//   //   setDisabled(true);
//   //   showSpinner();

//   //   try {
//   //     const result = await login(values.email, values.password);

//   //     if (result === true) return;

//   //     if (result?.success === false) {
//   //       setError(result.message);
//   //       return;
//   //     }

//   //   } catch (err) {
//   //     const errMsg = err?.message || 'An unexpected error occurred. Please try again.';
//   //     setError(errMsg);
//   //     message.error(errMsg);
//   //   } finally {
//   //     hideSpinner();
//   //     setDisabled(false);
//   //   }
//   // };

//   const onFinish = async (values) => {
//     setError('');
//     setDisabled(true);
//     showSpinner();

//     try {
//       const result = await login(values.email, values.password);

//       if (result === true) return;

//       if (result?.success === false) {
//         // ── Check if it's a license error ──
//         if (result?.code === 'LICENSE_DISABLED' || result?.error === 'license_invalid') {
//           setError('Your application license has been disabled. Please contact CKPSCA support at support@ckpsca.in');
//           return;
//         }
//         setError(result.message);
//         return;
//       }

//     } catch (err) {
//       // ── Check for license 403 ──
//       if (err?.response?.status === 403) {
//         const code = err?.response?.data?.code;
//         const error = err?.response?.data?.error;
//         if (code === 'LICENSE_DISABLED' || error === 'license_invalid') {
//           setError('Your application license has been disabled. Please contact CKPSCA support at support@ckpsca.in');
//           return;
//         }
//       }
//       const errMsg = err?.message || 'An unexpected error occurred. Please try again.';
//       setError(errMsg);
//       message.error(errMsg);
//     } finally {
//       hideSpinner();
//       setDisabled(false);
//     }
//   };

//   return (
//     <div
//         className="login-container"
//         style={{
//           backgroundImage: "url('/bg/caoas-login-illustration.svg')",
//           backgroundSize: 'cover',
//           backgroundPosition: 'center',
//           backgroundRepeat: 'no-repeat',
//         }}
//       >

//       <Card className="login-card">
//         <div className="login-header">
//   {/* CAOAS – MAIN LOGO */}
//   <img
//     src={caoaslogo}
//     alt="CAOAS Logo"
//     className="caoas-logo"
//   />

//   {/* COMPANY LOGO */}
//   {/* <img
//     src={logo}
//     alt="Company Logo"
//     className="login-logo"
//   /> */}

//   <Title level={3} style={{ marginBottom: 0, color: '#fff' }}>
//     Welcome Back
//   </Title>

//   <Text type="secondary">
//     Please login to your account
//   </Text>
// </div>


//         <Form
//           name="login"
//           layout="vertical"
//           onFinish={onFinish}
//           autoComplete="off"
//         >
//           <Form.Item
//             label="Email"
//             name="email"
//             rules={[
//               { required: true, message: 'Please input your email!' },
//               { type: 'email', message: 'Please enter a valid email!' },
//             ]}
//           >
//             <Input placeholder="Enter your email" autoComplete="email" />
//           </Form.Item>

//           <Form.Item
//             label="Password"
//             name="password"
//             rules={[{ required: true, message: 'Please input your password!' }]}
//           >
//             <Input.Password placeholder="Enter your password" autoComplete="new-password" />
//           </Form.Item>

//           <Form.Item>
//             <Button
//               type="primary"
//               htmlType="submit"
//               block
//               disabled={disabled}
//               style={{ marginTop: '12px' }}
//             >
//               Login
//             </Button>
//           </Form.Item>

//           <div style={{ textAlign: 'center', marginTop: -10 }}>
//             {error && (
//               <Text className="login-error-text">
//                 {error}
//               </Text>
//             )}

//             <Button type="link" onClick={() => navigate('/reset-otp')}>
//               Forgot Password?
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </div>
//   );
// }



import React, { useState, useContext, useEffect } from 'react';
import { Card, Typography, Form, Input, Button, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SpinnerContext } from '../components/SpinnerContext';
import caoaslogo from '../assets/caoas-logo.png';
import '../CSS/pages/Login.css';

const { Title, Text } = Typography;

// const LICENSE_MSG = '🚫 Your application license has been disabled. Please contact CAOAS support at support@ckpsca.in';
const LICENSE_MSG = 'Your account has been disabled. Please contact CAOAS support at support@ckpsca.in';
function isLicenseError(data) {
  return data?.code === 'LICENSE_DISABLED' 
    || data?.error === 'license_invalid'
    || data?.message?.includes('license')
    || data?.detail?.includes('license');
}

export default function Login() {
  const [error, setError]       = useState('');
  const [isLicense, setIsLicense] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const navigate                = useNavigate();
  const { login, user }         = useAuth();
  const { showSpinner, hideSpinner } = useContext(SpinnerContext);
  const { message }             = App.useApp();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const onFinish = async (values) => {
    setError('');
    setIsLicense(false);
    setDisabled(true);
    showSpinner();

    try {
      const result = await login(values.email, values.password);

      if (result === true) return;

      if (result?.success === false) {
        const msg = result.message || '';
        if (msg.includes('license') || msg.includes('License') || msg.includes('disabled')) {
          setIsLicense(true);
          setError(LICENSE_MSG);
        } else {
          setError(msg || 'Login failed. Please check your credentials.');
        }
      }

    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 403 && isLicenseError(data)) {
        setIsLicense(true);
        setError(LICENSE_MSG);
      } else {
        const errMsg = data?.message || data?.detail || err?.message || 'An unexpected error occurred.';
        setError(errMsg);
        message.error(errMsg);
      }
    } finally {
      hideSpinner();
      setDisabled(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: "url('/bg/caoas-login-illustration.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Card className="login-card" style={{ maxHeight: error ? 'none' : undefined }}>
        <div className="login-header">
          <img src={caoaslogo} alt="CAOAS Logo" className="caoas-logo"/>
          <Title level={3} style={{ marginBottom: 0, color: '#fff' }}>
            Welcome Back
          </Title>
          <Text type="secondary">Please login to your account</Text>
        </div>

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input placeholder="Enter your email" autoComplete="email"/>
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Enter your password" autoComplete="new-password"/>
          </Form.Item>

          {/* Error message — shown here between password and button */}
          {error && (
            <div style={{
              background: isLicense ? 'rgba(255,170,0,0.12)' : 'rgba(255,77,79,0.12)',
              border: `1px solid ${isLicense ? '#ffaa00' : '#ff4d4f'}`,
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 14,
              fontSize: 13,
              color: isLicense ? '#ffaa00' : '#ff4d4f',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>
                {isLicense ? '⚠️' : '✕'}
              </span>
              <span>{error}</span>
            </div>
          )}

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              disabled={disabled}
            >
              Login
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => navigate('/reset-otp')}>
              Forgot Password?
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}