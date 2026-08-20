
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { api } from '../services/api';
import {
  Modal,
  Form,
  Input,
  Button,
  Avatar,
  Typography,
  Upload,
  App,
  Space,
  Col,
  Row
} from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';

import '../CSS/pages/Profile.css';

const { Title, Text } = Typography;

export default function ProfileModal({ user, visible, onClose }) {
  const [form] = Form.useForm();
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { message } = App.useApp();

  useEffect(() => {
    if (user?.profile_picture) {
      setPreviewUrl(user.profile_picture);
    }
    if (visible) {
      form.resetFields();
    }
  }, [user, visible]);

  // const handleOk = async () => {
  //   try {
  //     const values = await form.validateFields();
  //     if (values.password !== values.confirmPassword) {
  //       return message.error('Passwords do not match');
  //     }

  //     const formData = new FormData();
  //     formData.append('password', values.password);
  //     if (profilePic) {
  //       formData.append('profile_picture', profilePic);
  //     }

  //     const csrfToken = Cookies.get('csrftoken');
  //     await api.put(`employee/profile/`, formData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //         'X-CSRFToken': csrfToken,
  //       },
  //       withCredentials: true,
  //     });

  //     message.success('Profile updated successfully!');
  //     onClose();
  //   } catch (error) {
  //     console.error(error);
  //     message.error('Failed to update profile.');
  //   }
  // };

  const handleOk = async () => {
  try {
    const values = await form.validateFields();
    const formData = new FormData();

    // Append password if provided
    if (values.password) {
      if (values.password !== values.confirmPassword) {
        return message.error('Passwords do not match');
      }
      formData.append('password', values.password);
      formData.append('confirm_password', values.confirmPassword);
    }

    // Append profile picture regardless of password
    if (profilePic) {
      formData.append('profile_picture', profilePic);
    }

    const csrfToken = Cookies.get('csrftoken');
    await api.put(`employee/profile/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-CSRFToken': csrfToken,
      },
      withCredentials: true,
    });

    message.success('Profile updated successfully!');
    onClose();
  } catch (error) {
    console.error(error);
    message.error('Failed to update profile.');
  }
};



  const handleFileChange = (info) => {
  const file = info.file; // single file
  if (file?.originFileObj) {
    setProfilePic(file.originFileObj);
    setPreviewUrl(URL.createObjectURL(file.originFileObj));
  }
};


  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={350}
      className="profile-modal"
      footer={null}
    >
      <div className="profile-container">
        <div className="profile-header">
          <Upload
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleFileChange}
            accept="image/*"
          >
            <div className="avatar-upload">
              <Avatar
                size={80}
                src={previewUrl}
                icon={!previewUrl && <UserOutlined />}
                style={{
                  backgroundColor: '#222',
                  border: '2px solid #444',
                }}
              />
              <div className="camera-icon">
                <CameraOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
          </Upload>
        </div>
        <br />
        <Text strong style={{ fontSize: 20 }}>{`${user?.first_name || ''} ${user?.last_name || ''}`.trim()}</Text>
        <div className="profile-info">
          {/* {user?.employee?.company_id && (
            <div>
              <Title level={5}>Company ID</Title>
              <Text>{user.employee.company_id}</Text>
            </div>
          )}
          {(user?.first_name || user?.last_name) && (
            <div>
              <Title level={5}>Full Name</Title> 
              <Text>{`${user?.first_name || ''} ${user?.last_name || ''}`.trim()}</Text>
            </div>
          )} */}
          {user?.email && (
            <div>
              <Title level={5}>Email</Title>
              <Text>{user.email}</Text>
            </div>
          )}
          <br />
          <Row gutter={[64, 0]}>
            {user?.role && (
              <Col>
                <Title level={5} style={{ marginBottom: 0 }}>
                  Position
                </Title>
                <Text>{user.role}</Text>
              </Col>
            )}

            {user?.department && (
              <Col>
                <Title level={5} style={{ marginBottom: 0 }}>
                  Department
                </Title>
                <Text>{user.department}</Text>
              </Col>
            )}
          </Row>



          <br />
          <div>
          <Title level={5}>Want to Reset Password?</Title>
          <Form layout="vertical" form={form} style={{ marginTop: 20 }} autoComplete="off">
        <Form.Item
          name="password"
          // label="New Password"
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve(); // allow empty
                if (value.length < 6) return Promise.reject("Password too short");
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input.Password placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                // label="Confirm Password"
                dependencies={['password']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value && !getFieldValue('password')) {
                        return Promise.resolve(); // allow empty
                      }
                      if (value !== getFieldValue('password')) {
                        return Promise.reject("Passwords do not match");
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm new password" style={{ color: '#000' }} />
              </Form.Item>
            </Form>
          </div>
        </div>
        
        
        


        <div className="profile-footer">
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" onClick={handleOk}>
            Update
          </Button>
        </div>
      </div>
    </Modal>
  );
}
