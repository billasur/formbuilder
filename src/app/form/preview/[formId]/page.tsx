'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  message, 
  Result, 
  Typography, 
  Divider,
  Space 
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { getFormById } from '../../../../firebase/formService';
import { auth } from '../../../../firebase/config';
import FormPreview from '../../../../components/form/FormPreview';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

const { Title, Paragraph } = Typography;

export default function FormPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;
  
  const [form, setForm] = useState<FormModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const formData = await getFormById(formId);
        
        if (!formData) {
          setError('Form not found');
          return;
        }
        
        // Check if user owns this form or if it's published
        if (auth.currentUser && formData.ownerId !== auth.currentUser.uid && !formData.isPublished) {
          setError('You do not have permission to view this form');
          return;
        }
        
        setForm(formData);
      } catch (err) {
        console.error('Error fetching form:', err);
        setError('Failed to load form');
      } finally {
        setLoading(false);
      }
    };
    
    fetchForm();
  }, [formId]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleEdit = () => {
    router.push(`/form/builder/${formId}`);
  };
  
  if (loading) {
    return <LoadingSpinner tip="Loading form preview..." fullScreen={true} />;
  }
  
  if (error) {
    return (
      <Result
        status="error"
        title="Failed to load form"
        subTitle={error}
        extra={
          <Button type="primary" onClick={handleBack}>
            Back
          </Button>
        }
      />
    );
  }
  
  return (
    <div className="form-preview-container">
      <Card className="form-preview-card">
        <div className="form-preview-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Back
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              Form Preview
            </Title>
          </Space>
          
          {auth.currentUser && form?.ownerId === auth.currentUser.uid && (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={handleEdit}
            >
              Edit Form
            </Button>
          )}
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <FormPreview 
          form={form} 
          previewMode={true} 
        />
      </Card>
    </div>
  );
} 