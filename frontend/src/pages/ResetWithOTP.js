// pages/ResetWithOTP.jsx
import { useState } from 'react';
import { Form, Input, Button, message, Card, Typography } from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../services/api';

const { Title } = Typography;

export default function ResetWithOTP() {
  const [params] = useSearchParams();
  const email = params.get('email');
  const otp = params.get('otp');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!email || !otp) {
    message.warning("Please verify your OTP first.");
    navigate('/reset-otp');
    return null;
  }

  const onFinish = async ({ password }) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password/', { email, otp, password });
      message.success('Password reset successful. Please login.');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.detail || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
        <Card className="login-card">
        <Title level={3}>Set New Password</Title>
        <Form layout="vertical" onFinish={onFinish}>
            <Form.Item name="password" label="New Password" rules={[{ required: true }]}>
            <Input.Password placeholder='Enter new password'/>
            </Form.Item>
            <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
                { required: true },
                ({ getFieldValue }) => ({
                validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                },
                }),
            ]}
            >
            <Input.Password placeholder='Re-enter new password' />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
            Reset Password
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
