'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Form, 
  Select, 
  Switch, 
  Button, 
  Typography, 
  message, 
  Radio, 
  Space,
  Divider,
  ColorPicker
} from 'antd';
import { 
  UserOutlined, 
  BgColorsOutlined, 
  SettingOutlined, 
  BellOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebase/config';
import { getUserSettings, updateUserSettings } from '../../firebase/userService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useThemeContext } from '../../contexts/ThemeContext';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useThemeContext();
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!auth.currentUser) {
        router.push('/auth/signin');
        return;
      }

      try {
        const settings = await getUserSettings(auth.currentUser.uid);
        setUserSettings(settings);
        
        // Set form initial values
        form.setFieldsValue({
          theme: settings?.theme || theme,
          primaryColor: settings?.primaryColor || '#1890ff',
          darkMode: settings?.darkMode || false,
          compactMode: settings?.compactMode || false,
          notifications: settings?.notifications || {
            email: true,
            pushNotifications: false,
            formSubmissions: true
          }
        });
      } catch (error) {
        console.error('Error fetching user settings:', error);
        message.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [router, form, theme]);

  const handleSaveSettings = async (values) => {
    if (!auth.currentUser) {
      message.error('You must be logged in to save settings');
      return;
    }

    setSaving(true);

    try {
      await updateUserSettings(auth.currentUser.uid, values);
      
      // Update theme context
      setTheme(values.theme);
      
      // Apply theme changes to document body
      document.body.setAttribute('data-theme', values.theme);
      if (values.darkMode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      
      message.success('Settings saved successfully');
      setUserSettings(values);
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner tip="Loading settings..." fullScreen={false} />;
  }

  return (
    <div className="settings-page">
      <Card>
        <Title level={2}>Account Settings</Title>
        <Paragraph>Customize your experience and personalize your account</Paragraph>
        
        <Divider />
        
        <Tabs defaultActiveKey="appearance">
          <TabPane 
            tab={<span><BgColorsOutlined /> Appearance</span>} 
            key="appearance"
          >
            <Form 
              form={form}
              layout="vertical"
              onFinish={handleSaveSettings}
            >
              <Form.Item 
                name="theme" 
                label="Theme"
              >
                <Radio.Group optionType="button" buttonStyle="solid">
                  <Radio.Button value="default">Default</Radio.Button>
                  <Radio.Button value="clean">Clean</Radio.Button>
                  <Radio.Button value="modern">Modern</Radio.Button>
                  <Radio.Button value="vibrant">Vibrant</Radio.Button>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item 
                name="primaryColor" 
                label="Primary Color"
              >
                <ColorPicker allowClear format="hex" />
              </Form.Item>
              
              <Form.Item 
                name="darkMode" 
                label="Dark Mode" 
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item 
                name="compactMode" 
                label="Compact Mode" 
                valuePropName="checked"
                help="Reduce spacing between elements for a denser UI"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={saving}
                >
                  Save Appearance Settings
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane 
            tab={<span><BellOutlined /> Notifications</span>} 
            key="notifications"
          >
            <Form 
              form={form}
              layout="vertical"
              onFinish={handleSaveSettings}
            >
              <Form.Item 
                name={['notifications', 'email']} 
                label="Email Notifications" 
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item 
                name={['notifications', 'pushNotifications']} 
                label="Push Notifications" 
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item 
                name={['notifications', 'formSubmissions']} 
                label="Form Submission Alerts" 
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={saving}
                >
                  Save Notification Settings
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
} 