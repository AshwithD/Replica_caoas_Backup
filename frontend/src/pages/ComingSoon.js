// src/pages/ComingSoonPage.js
import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { RocketOutlined } from '@ant-design/icons'; // For the rocket icon

const { Title, Text } = Typography;

const ComingSoon = () => {
  return (
    <Layout
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // Center content vertically
        alignItems: 'center',     // Center content horizontally
        minHeight: '100vh',       // Take full viewport height
        backgroundColor: '#f0f2f5', // Light background color
        textAlign: 'center',
        overflow: 'hidden',       // --- Key to prevent scrolling ---
      }}
    >
      <Space direction="vertical" size="large">
        <RocketOutlined style={{ fontSize: '100px', color: '#1890ff' }} />
        <Title level={1}>Coming Soon!</Title>
        <Text style={{ fontSize: '18px', color: '#595959' }}>
          We're working hard to bring you something amazing. Stay tuned!
        </Text>
        {/* You can add more elements here, like a countdown, a newsletter signup, etc. */}
      </Space>
    </Layout>
  );
};

export default ComingSoon;