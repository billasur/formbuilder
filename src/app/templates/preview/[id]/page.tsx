'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Spin, 
  Result, 
  message, 
  Typography,
  Divider,
  Space
} from 'antd';
import { useRouter, useParams } from 'next/navigation';
import { getTemplateById, createFormFromTemplate } from '../../../../firebase/templateService';
import { auth } from '../../../../firebase/config';
import FormPreview from '../../../../components/form/FormPreview';

const { Title, Paragraph } = Typography;

export default function TemplatePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id;
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingForm, setCreatingForm] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) {
        setError('Template ID is missing');
        setLoading(false);
        return;
      }

      try {
        const templateData = await getTemplateById(templateId);
        if (!templateData) {
          setError('Template not found');
        } else {
          setTemplate(templateData);
        }
      } catch (err) {
        console.error('Error fetching template:', err);
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  const handleUseTemplate = async () => {
    if (!auth.currentUser) {
      message.error('You must be logged in to create forms');
      router.push('/auth/signin');
      return;
    }

    setCreatingForm(true);

    try {
      const formId = await createFormFromTemplate(
        auth.currentUser.uid,
        templateId
      );
      message.success('Form created from template');
      router.push(`/form/builder/${formId}`);
    } catch (error) {
      console.error('Error creating form from template:', error);
      message.error('Failed to create form from template');
    } finally {
      setCreatingForm(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading template preview..." />
      </div>
    );
  }

  if (error || !template) {
    return (
      <Result
        status="error"
        title="Failed to load template"
        subTitle={error || 'The template could not be found or loaded'}
        extra={[
          <Button key="back" onClick={() => router.push('/templates')}>
            Back to Templates
          </Button>
        ]}
      />
    );
  }

  return (
    <div className="template-preview-page">
      <Card>
        <Title level={2}>{template.name}</Title>
        <Paragraph>{template.description}</Paragraph>
        
        <Space>
          <Button 
            type="primary" 
            onClick={handleUseTemplate}
            loading={creatingForm}
          >
            Use This Template
          </Button>
          <Button onClick={() => router.push('/templates')}>
            Back to Templates
          </Button>
        </Space>

        <Divider />

        <Card title="Form Preview">
          <FormPreview form={template} />
        </Card>
      </Card>
    </div>
  );
} 