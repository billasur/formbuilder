'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  message, 
  Spin, 
  Tabs, 
  Typography, 
  Space,
  Divider,
  Popconfirm
} from 'antd';
import { 
  SaveOutlined,
  EyeOutlined,
  SettingOutlined,
  FormOutlined,
  PlayCircleOutlined,
  ShareAltOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { getFormById, updateForm } from '../../../../firebase/formService';
import { auth } from '../../../../firebase/config';
import { useRouter, useParams } from 'next/navigation';
import FormBuilder from '../../../../components/form/FormBuilder';
import FormSettings from '../../../../components/form/FormSettings';
import FormPreview from '../../../../components/form/FormPreview';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function FormBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;
  
  const [form, setForm] = useState<FormModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');
  
  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      if (!auth.currentUser) {
        router.push('/auth/signin');
        return;
      }
      
      try {
        const formData = await getFormById(formId);
        
        if (!formData) {
          message.error('Form not found');
          router.push('/dashboard');
          return;
        }
        
        // Check if user owns this form
        if (formData.ownerId !== auth.currentUser.uid) {
          message.error('You do not have permission to edit this form');
          router.push('/dashboard');
          return;
        }
        
        setForm(formData);
      } catch (error) {
        console.error('Error fetching form:', error);
        message.error('Failed to load form');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchForm();
  }, [formId, router]);
  
  // Handle form field updates
  const handleFieldsUpdate = (updatedFields) => {
    const updatedForm = form ? {
      ...form,
      fields: updatedFields,
      updatedAt: new Date()
    } : null;
    
    setForm(updatedForm);
  };
  
  // Handle form settings updates
  const handleSettingsUpdate = (updatedSettings) => {
    setForm({
      ...form,
      settings: {
        ...form.settings,
        ...updatedSettings
      },
      updatedAt: new Date()
    });
  };
  
  // Save form changes
  const handleSave = async () => {
    if (!form) return;
    
    setSaving(true);
    try {
      await updateForm(formId, form);
      message.success('Form saved successfully');
    } catch (error) {
      console.error('Error saving form:', error);
      message.error('Failed to save form');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };
  
  // Navigate to form preview
  const handlePreview = () => {
    router.push(`/form/preview/${formId}`);
  };
  
  // Navigate back to dashboard
  const handleBack = () => {
    router.push('/dashboard');
  };
  
  if (loading) {
    return <LoadingSpinner tip="Loading form..." fullScreen={true} />;
  }
  
  return (
    <div className="form-builder-container">
      <Card className="form-builder-card">
        <div className="form-builder-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Back
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              {form?.name || 'Untitled Form'}
            </Title>
          </Space>
          
          <Space>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSave}
              loading={saving}
            >
              Save
            </Button>
            <Button 
              icon={<EyeOutlined />} 
              onClick={handlePreview}
            >
              Preview
            </Button>
            <Button 
              icon={<ShareAltOutlined />} 
              onClick={() => router.push(`/form/share/${formId}`)}
            >
              Share
            </Button>
          </Space>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          style={{ marginTop: 16 }}
        >
          <TabPane 
            tab={<span><FormOutlined /> Form Fields</span>} 
            key="fields"
          >
            {form && form.fields && (
              <FormBuilder 
                fields={form.fields}
                onFieldsUpdate={handleFieldsUpdate}
              />
            )}
          </TabPane>
          
          <TabPane 
            tab={<span><SettingOutlined /> Settings</span>} 
            key="settings"
          >
            <FormSettings 
              settings={form?.settings || {}} 
              onUpdate={handleSettingsUpdate} 
            />
          </TabPane>
          
          <TabPane 
            tab={<span><EyeOutlined /> Preview</span>} 
            key="preview"
          >
            <FormPreview 
              form={form} 
              previewMode={true} 
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
} 