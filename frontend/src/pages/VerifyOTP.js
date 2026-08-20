import { useState, useEffect } from 'react';
import { Form, Input, Button, App, Card, Typography } from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../CSS/pages/Login.css';
import { api } from '../services/api';

const { Title, Text } = Typography;

export default function VerifyOTP() {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [unlockIn, setUnlockIn] = useState(null);

  const [params] = useSearchParams();
  const email = params.get('email');
  const navigate = useNavigate();
  const { message } = App.useApp();

  /* ⏳ Resend cooldown timer */
  // useEffect(() => {
  //   if (cooldown <= 0) return;
  //   const timer = setInterval(() => {
  //     setCooldown((c) => c - 1);
  //   }, 1000);
  //   return () => clearInterval(timer);
  // }, [cooldown]);

  useEffect(() => {
    if (unlockIn === null) return;

    if (unlockIn <= 0) {
      // 🔓 Auto-unlock
      setUnlockIn(null);
      return;
    }

    const timer = setInterval(() => {
      setUnlockIn((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [unlockIn]);


  /* 🔓 OTP unlock countdown */
  useEffect(() => {
    if (unlockIn === null || unlockIn <= 0) return;
    const timer = setInterval(() => {
      setUnlockIn((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [unlockIn]);

  const onFinish = async ({ otp }) => {
    setLoading(true);
    try {
      await api.post('/auth/verify-reset-otp/', { email, otp });

      message.success('OTP verified');
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
    } catch (err) {
      const data = err.response?.data;

      /* 🔒 OTP locked case */
      if (data?.unlock_in !== undefined) {
        setUnlockIn(data.unlock_in);
        message.error('OTP locked. Please wait.');
        return;
      }

      /* ❌ Wrong OTP – attempts left */
      if (data?.attempts_left !== undefined) {
        setAttemptsLeft(data.attempts_left);
      }

      message.error(data?.detail || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      await api.post('/auth/send-reset-otp/', { email });
      message.success('OTP resent');
      setCooldown(60);
      setAttemptsLeft(null);
      setUnlockIn(null);
    } catch (err) {
      const data = err.response?.data;
      if (data?.cooldown) setCooldown(data.cooldown);
      message.error(data?.detail || 'Please wait');
    }
  };

  const isLocked = unlockIn !== null && unlockIn > 0;

  return (
    <div className="login-container">
      <Card className="login-card">
        <Title level={3}>Enter OTP</Title>

        <Form layout="vertical" onFinish={onFinish}>
          {!isLocked ? (
            <Form.Item
              name="otp"
              label="OTP"
              rules={[{ required: true }]}
              normalize={(value) => value?.replace(/\D/g, '')}
            >

              <Input
                placeholder="Enter OTP"
                maxLength={6}
                inputMode="numeric"   // mobile numeric keypad
                pattern="[0-9]*"
              />
            </Form.Item>
          ) : (
            <Text
              style={{
                display: 'block',
                marginTop: 12,
                color: '#ff4d4f',
                fontWeight: 500,
              }}
            >
              {/* OTP is locked. Try again in{' '} */}
              {/* {Math.floor(unlockIn / 60)}:
              {(unlockIn % 60).toString().padStart(2, '0')} */}
            </Text>
          )}


          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            disabled={isLocked}
          >
            Verify OTP
          </Button>

          
        </Form>

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          {!isLocked && (
            <Button
              type="link"
              disabled={cooldown > 0}
              onClick={resendOTP}
            >
              {cooldown > 0
                ? `Resend OTP in ${cooldown}s`
                : 'Resend OTP'}
            </Button>
          )}


          {/* ❌ Attempts left */}
          {attemptsLeft !== null && !isLocked && (
            <Text
              style={{
                display: 'block',
                color: '#ff4d4f',   // 🔴 AntD danger red
                fontWeight: 500,
                marginTop: 6,
              }}
            >
              Attempts left: {attemptsLeft}
            </Text>
          )}


          {/* 🔒 Locked countdown */}
          {isLocked && (
            <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
              OTP locked. Try again in{' '}
              {Math.floor(unlockIn / 60)}:
              {(unlockIn % 60).toString().padStart(2, '0')}
            </Text>
          )}
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
