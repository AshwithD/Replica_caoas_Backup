// pages/SendOTP.jsx
import React, { useState, useContext } from 'react';
import { Card, Typography, Form, Input, Button, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SpinnerContext } from '../components/SpinnerContext';
import '../CSS/pages/Login.css'; // ✅ Reuse login styles
import { api } from '../services/api';

const { Title, Text } = Typography;

export default function SendOTP({ onSwitch }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showSpinner, hideSpinner } = useContext(SpinnerContext);

  const { message } = App.useApp();

  const onFinish = async ({ email }) => {
    showSpinner();
    try {
      await api.post('/auth/send-reset-otp/', { email });
      message.success('OTP sent to your email');
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      message.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <img src="/caoas-logo.png" alt="CAOAS Logo" className="caoas-logo" />
          <Title level={3}>Reset Password</Title>
          <Text type="secondary">Enter your registered email to get OTP</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Enter your email" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Send OTP
          </Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
            <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => navigate('/login')}

            >
                Already have your password? Log in.
            </Button>
            </div>
      </Card>
    </div>
  );
}
