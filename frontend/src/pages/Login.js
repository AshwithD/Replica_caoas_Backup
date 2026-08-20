
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