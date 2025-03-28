'use client'

import React, { useState, useEffect } from 'react';
import { 
  Avatar, 
  Typography, 
  Button, 
  Menu, 
  Dropdown, 
  Space, 
  Card, 
  Divider,
  Form,
  Input,
  message,
  Modal,
  Upload
} from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined, 
  DownOutlined,
  UploadOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { auth, storage } from '../../firebase/config';
import { updateUserProfile } from '../../firebase/authService';

const { Text, Title } = Typography;

const UserProfile = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser?.photoURL) {
        setAvatarUrl(currentUser.photoURL);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error logging out:', error);
      message.error('Failed to log out');
    }
  };

  const handleProfileSettings = () => {
    setIsModalVisible(true);
    form.setFieldsValue({
      displayName: user?.displayName || '',
      email: user?.email || '',
    });
  };

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      await updateUserProfile({
        displayName: values.displayName,
        photoURL: avatarUrl || user?.photoURL,
      });
      message.success('Profile updated successfully');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (info) => {
    if (info.file.status === 'uploading') {
      setUploadLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      try {
        // Get the file
        const file = info.file.originFileObj;
        
        // Create a reference to the storage location
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`profile-images/${user.uid}/${file.name}`);
        
        // Upload the file
        await fileRef.put(file);
        
        // Get the download URL
        const downloadURL = await fileRef.getDownloadURL();
        
        // Set the avatar URL
        setAvatarUrl(downloadURL);
        
        message.success('Avatar uploaded successfully');
        
      } catch (error) {
        console.error('Error uploading avatar:', error);
        message.error('Failed to upload avatar');
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="profile" icon={<SettingOutlined />} onClick={handleProfileSettings}>
        Profile Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={menu} trigger={['click']}>
        <a onClick={(e) => e.preventDefault()} className="user-profile-dropdown">
          <Space>
            <Avatar 
              src={user?.photoURL} 
              icon={!user?.photoURL && <UserOutlined />} 
              size="small" 
            />
            <Text ellipsis style={{ maxWidth: 120 }}>
              {user?.displayName || user?.email || 'User'}
            </Text>
            <DownOutlined />
          </Space>
        </a>
      </Dropdown>

      <Modal
        title="Profile Settings"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar 
            size={80}
            src={avatarUrl || user?.photoURL}
            icon={!(avatarUrl || user?.photoURL) && <UserOutlined />}
          />
          <div style={{ marginTop: 16 }}>
            <Upload
              name="avatar"
              listType="picture"
              showUploadList={false}
              customRequest={({ onSuccess }) => setTimeout(() => onSuccess('ok'), 0)}
              onChange={handleAvatarUpload}
            >
              <Button icon={<UploadOutlined />} loading={uploadLoading}>
                Change Avatar
              </Button>
            </Upload>
          </div>
        </div>
        
        <Divider />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            name="displayName"
            label="Display Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Your Name" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
          >
            <Input disabled />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserProfile; 